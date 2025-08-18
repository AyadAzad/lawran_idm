import os
import shutil
import logging
import yt_dlp
from typing import Dict, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class OtherPlatformsDownloader:
    """
    A universal downloader for various platforms using the yt-dlp Python library.
    It automatically selects the best quality, handles authentication for supported sites,
    and streams a detailed log to the frontend via Socket.IO.
    """

    def __init__(self, socketio=None, output_path='./downloads'):
        """Initializes the downloader."""
        self.socketio = socketio
        self.output_path = output_path
        # Load credentials from environment variables for security
        self.insta_user = os.getenv("INSTAGRAM_USER")
        self.insta_pass = os.getenv("INSTAGRAM_PASS")
        os.makedirs(self.output_path, exist_ok=True)

    def _get_ffmpeg_location(self) -> str | None:
        """Finds the FFmpeg executable."""
        if ff_path := shutil.which('ffmpeg'):
            return ff_path
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
            local_ffmpeg_path = os.path.join(project_root, 'ffmpeg', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')
            if os.path.isfile(local_ffmpeg_path):
                return local_ffmpeg_path
        except Exception:
            pass
        logger.warning("FFmpeg not found. Merging may fail for some sites.")
        return None

    def download_media(self, url: str):
        """Main method to download media, designed to be run in a background task."""

        class SocketIOLogger:
            """A logger that forwards yt-dlp's messages to the frontend terminal."""

            def __init__(self, socketio_instance):
                self.socketio = socketio_instance

            def debug(self, msg):
                # We want to see all logs for a universal downloader
                self.socketio.emit('terminal_output', {'line': msg + '\r\n'})

            def warning(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[93m{msg}\033[0m\r\n'})

            def error(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[91m{msg}\033[0m\r\n'})

        def progress_hook(d: Dict[str, Any]):
            """A hook that receives progress updates and formats them for the terminal."""
            if d['status'] == 'downloading':
                progress_line = (
                    f"\r\033[K"  # Clear line and carriage return
                    f"\033[36mDownloading...\033[0m "
                    f"{d.get('_percent_str', ''):>8} of {d.get('_total_bytes_str', ''):<10} "
                    f"at {d.get('_speed_str', ''):<12} ETA {d.get('_eta_str', '')}"
                )
                self.socketio.emit('terminal_output', {'line': progress_line})
            elif d['status'] == 'finished':
                self.socketio.emit('terminal_output',
                                   {'line': f"\n\033[32mDownload finished. Processing...\033[0m\r\n"})

        # --- yt-dlp Options: Simple and Universal ---
        ydl_opts = {
            # Let yt-dlp choose the best video and audio automatically. This is the most robust option.
            'format': 'bestvideo+bestaudio/best',
            'outtmpl': os.path.join(self.output_path, '%(title)s - [%(id)s].%(ext)s'),
            'merge_output_format': 'mp4',
            'progress_hooks': [progress_hook],
            'logger': SocketIOLogger(self.socketio),
            'ffmpeg_location': self._get_ffmpeg_location(),
            'noplaylist': True,  # Important for single video links from sites like TikTok
        }

        # Automatically add login credentials for supported sites if available
        if "instagram.com" in url.lower() and self.insta_user and self.insta_pass:
            self.socketio.emit('terminal_output',
                               {'line': "\033[35mInstagram URL detected. Using server credentials...\033[0m\r\n"})
            ydl_opts['username'] = self.insta_user
            ydl_opts['password'] = self.insta_pass

        # --- Run the Download ---
        try:
            self.socketio.emit('terminal_output', {'line': f"\n\033[1mStarting download for URL:\033[0m {url}\n\r\n"})

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                final_filename = ydl.prepare_filename(info)

            self.socketio.emit('terminal_output', {
                'line': f"\n\r\n\033[32;1mSuccess! File saved as:\033[0m {os.path.basename(final_filename)}\r\n"})
            self.socketio.emit('download_complete', {'filename': os.path.basename(final_filename)})

        except Exception as e:
            logger.error(f"yt-dlp universal download failed for {url}: {e}", exc_info=False)
            error_message = str(e).split('ERROR:')[-1].strip()  # Get a cleaner error message
            self.socketio.emit('terminal_output', {'line': f"\n\r\n\033[31;1mFATAL ERROR:\033[0m {error_message}\r\n"})
            self.socketio.emit('download_error', {'error': error_message})