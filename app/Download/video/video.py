# app/Download/video/video.py

import os
import shutil
import logging
import yt_dlp
from typing import Dict, Any

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class YouTubeVideoDownloader:
    """
    A dedicated class to download YouTube videos using the yt-dlp Python library.
    It runs downloads in a background thread and reports progress via Socket.IO.
    """

    def __init__(self, socketio=None, output_path='/downloads'):
        """Initializes the YouTubeVideoDownloader."""
        self.socketio = socketio
        self.output_path = output_path
        # Ensure the output directory exists
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
        logger.warning("FFmpeg not found. Merging will likely fail.")
        return None

    def download_video(self, url: str, quality: str = '1080p'):
        """
        Main method to download a video. This method is designed to be run
        in a background task by Flask-SocketIO.
        """
        # A simple unique ID for this download task, based on the URL and quality
        task_id = f"video:{url}:{quality}"

        # --- Custom Logger for Terminal Output ---
        class SocketIOLogger:
            def debug(self, msg):
                # Send raw yt-dlp log lines to the frontend terminal
                if msg.startswith('[debug]'):
                    pass  # Optional: ignore debug messages
                else:
                    self.socketio.emit('terminal_output', {'line': msg})

            def warning(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[93m{msg}\033[0m'})  # Yellow text

            def error(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[91m{msg}\033[0m'})  # Red text

            # Link the logger to our downloader's socketio instance
            def __init__(self, socketio_instance):
                self.socketio = socketio_instance

        # --- Progress Hook for Structured Data ---
        def progress_hook(d: Dict[str, Any]):
            status = d.get('status')
            if status == 'downloading':
                # This is the structured data for potential future UI elements
                # For now, we just log it to the terminal as well
                progress_line = (
                    f"\r\033[K"  # Clear line
                    f"\033[36mDownloading...\033[0m "  # Cyan text
                    f"{d.get('_percent_str', ''):>8} of {d.get('_total_bytes_str', ''):<10} "
                    f"at {d.get('_speed_str', ''):<12} ETA {d.get('_eta_str', '')}"
                )
                self.socketio.emit('terminal_output', {'line': progress_line})

            elif status == 'finished':
                self.socketio.emit('terminal_output',
                                   {'line': f"\n\033[32mDownload finished. Now processing...\033[0m"})

            elif status == 'error':
                self.socketio.emit('terminal_output', {'line': f"\n\033[31mAn error occurred during download.\033[0m"})

        # --- yt-dlp Options ---
        numeric_quality = quality.replace('p', '')
        format_selector = f"bestvideo[height<={numeric_quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<={numeric_quality}][ext=mp4]/best[height<={numeric_quality}]"

        ydl_opts = {
            'format': format_selector,
            'outtmpl': os.path.join(self.output_path, '%(title)s.%(ext)s'),
            'merge_output_format': 'mp4',
            'progress_hooks': [progress_hook],
            'logger': SocketIOLogger(self.socketio),
            'ffmpeg_location': self._get_ffmpeg_location(),
            'noplaylist': True,
            'postprocessors': [{
                'key': 'FFmpegVideoRemuxer',
                'preferedformat': 'mp4',
            }],
        }

        # --- Run the Download ---
        try:
            self.socketio.emit('terminal_output', {'line': f"\n\033[1mStarting download for URL:\033[0m {url}"})
            self.socketio.emit('terminal_output', {'line': f"\033[1mSelected Quality:\033[0m {quality}\n"})

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                final_filename = ydl.prepare_filename(info)

            self.socketio.emit('terminal_output', {
                'line': f"\n\033[32;1mSuccess! File saved as:\033[0m {os.path.basename(final_filename)}"})
            # Let the frontend know the process is complete
            self.socketio.emit('download_complete', {'filename': os.path.basename(final_filename)})

        except Exception as e:
            logger.error(f"yt-dlp download failed for {url}: {e}", exc_info=False)
            self.socketio.emit('terminal_output', {'line': f"\n\033[31;1mFATAL ERROR:\033[0m {str(e)}"})
            # Let the frontend know there was an error
            self.socketio.emit('download_error', {'error': str(e)})