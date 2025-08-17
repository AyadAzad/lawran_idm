# app/Download/uhd/uhd.py

import os
import shutil
import logging
import yt_dlp
from typing import Dict, Any

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class YouTube4KDownloader:
    """
    A dedicated class to download 4K+ YouTube videos using the yt-dlp Python library.
    It strictly targets resolutions of 2160p or higher.
    """

    def __init__(self, socketio=None, output_path='./downloads'):
        """Initializes the YouTube4KDownloader."""
        self.socketio = socketio
        self.output_path = output_path
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

    def download_4k_video(self, url: str):
        """
        Main method to download a 4K+ video. Designed to be run in a background task.
        """

        # --- Custom Logger for Terminal Output ---
        class SocketIOLogger:
            def __init__(self, socketio_instance):
                self.socketio = socketio_instance

            def debug(self, msg):
                if not msg.startswith('[debug]'):
                    self.socketio.emit('terminal_output', {'line': msg})

            def warning(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[93m{msg}\033[0m'})

            def error(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[91m{msg}\033[0m'})

        # --- Progress Hook for Structured Data ---
        def progress_hook(d: Dict[str, Any]):
            if d['status'] == 'downloading':
                progress_line = (
                    f"\r\033[K"  # Clear line
                    f"\033[36mDownloading UHD...\033[0m "
                    f"{d.get('_percent_str', ''):>8} of {d.get('_total_bytes_str', ''):<10} "
                    f"at {d.get('_speed_str', ''):<12} ETA {d.get('_eta_str', '')}"
                )
                self.socketio.emit('terminal_output', {'line': progress_line})
            elif d['status'] == 'finished':
                self.socketio.emit('terminal_output', {'line': f"\n\033[32mDownload finished. Merging files...\033[0m"})

        # --- yt-dlp Options ---
        # The format selector is key: '[height>=2160]' ensures we only get 4K or higher.
        # yt-dlp will fail with an error if no such format exists.
        format_selector = "bestvideo[height>=2160]+bestaudio/best[height>=2160]"

        ydl_opts = {
            'format': format_selector,
            'outtmpl': os.path.join(self.output_path, '%(title)s [%(height)sp].%(ext)s'),
            'merge_output_format': 'mp4',
            'progress_hooks': [progress_hook],
            'logger': SocketIOLogger(self.socketio),
            'ffmpeg_location': self._get_ffmpeg_location(),
            'noplaylist': True,
        }

        # --- Run the Download ---
        try:
            self.socketio.emit('terminal_output', {'line': f"\n\033[1mStarting UHD download for:\033[0m {url}"})
            self.socketio.emit('terminal_output',
                               {'line': f"\033[1mSearching for 4K (2160p) or higher streams...\033[0m\n"})

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                final_filename = ydl.prepare_filename(info)

            self.socketio.emit('terminal_output', {
                'line': f"\n\033[32;1mSuccess! File saved as:\033[0m {os.path.basename(final_filename)}"})
            self.socketio.emit('download_complete', {'filename': os.path.basename(final_filename)})

        except Exception as e:
            logger.error(f"yt-dlp UHD download failed for {url}: {e}", exc_info=False)
            error_message = str(e)
            if "requested format not available" in error_message.lower():
                error_message = "No 4K or higher resolution stream was found for this URL."
            self.socketio.emit('terminal_output', {'line': f"\n\033[31;1mFATAL ERROR:\033[0m {error_message}"})
            self.socketio.emit('download_error', {'error': error_message})