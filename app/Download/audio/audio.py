import os
import shutil
import logging
import yt_dlp
from typing import Dict, Any

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class YouTubeAudioDownloader:
    """
    A dedicated class to download and extract audio from YouTube videos using the yt-dlp library.
    """

    def __init__(self, socketio=None, output_path='./downloads'):
        """Initializes the YouTubeAudioDownloader."""
        self.socketio = socketio
        self.output_path = output_path
        os.makedirs(self.output_path, exist_ok=True)

    def _get_ffmpeg_location(self) -> str | None:
        """Finds the FFmpeg executable, which is essential for audio extraction."""
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
        logger.error("CRITICAL: FFmpeg not found. Audio extraction will fail.")
        return None

    def download_audio(self, url: str, format: str = 'mp3'):
        """
        Main method to download and extract audio. Designed to be run in a background task.
        """

        # --- Custom Logger for Terminal Output ---
        class SocketIOLogger:
            def __init__(self, socketio_instance):
                self.socketio = socketio_instance

            def debug(self, msg):
                if not msg.startswith('[debug]'):
                    self.socketio.emit('terminal_output', {'line': msg})

            def warning(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[93m{msg}\033[0m'})  # Yellow

            def error(self, msg):
                self.socketio.emit('terminal_output', {'line': f'\033[91m{msg}\033[0m'})  # Red

        # --- Progress Hook for Structured Data ---
        def progress_hook(d: Dict[str, Any]):
            if d['status'] == 'downloading':
                progress_line = (
                    f"\r\033[K"  # Clear line
                    f"\033[36mDownloading Audio...\033[0m "
                    f"{d.get('_percent_str', ''):>8} of {d.get('_total_bytes_str', ''):<10} "
                    f"at {d.get('_speed_str', ''):<12} ETA {d.get('_eta_str', '')}"
                )
                self.socketio.emit('terminal_output', {'line': progress_line})
            elif d['status'] == 'finished':
                # This hook is also called for post-processing steps
                if d.get('postprocessor') == 'FFmpegExtractAudio':
                    self.socketio.emit('terminal_output',
                                       {'line': f"\n\033[35mConverting to {format.upper()}...\033[0m"})

        # --- yt-dlp Options ---
        # 1. 'bestaudio/best': Download only the best quality audio stream.
        # 2. postprocessors: After downloading, run FFmpeg to extract and convert the audio.
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(self.output_path, '%(title)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': format,  # 'mp3' or 'm4a'
                'preferredquality': '192',  # For MP3, bitrate in kbits/s
            }],
            'progress_hooks': [progress_hook],
            'logger': SocketIOLogger(self.socketio),
            'ffmpeg_location': self._get_ffmpeg_location(),
            'noplaylist': True,
        }

        # --- Run the Download & Extraction ---
        try:
            self.socketio.emit('terminal_output', {'line': f"\n\033[1mStarting audio extraction for:\033[0m {url}"})
            self.socketio.emit('terminal_output', {'line': f"\033[1mDesired Format:\033[0m {format.upper()}\n"})

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                # The final filename will have the correct audio extension
                final_filename = ydl.prepare_filename(info).replace(info['ext'], format)

            self.socketio.emit('terminal_output', {
                'line': f"\n\033[32;1mSuccess! File saved as:\033[0m {os.path.basename(final_filename)}"})
            self.socketio.emit('download_complete', {'filename': os.path.basename(final_filename)})

        except Exception as e:
            logger.error(f"yt-dlp audio extraction failed for {url}: {e}", exc_info=False)
            error_message = str(e)
            if "ffmpeg" in error_message.lower():
                error_message = "FFmpeg error. Ensure FFmpeg is installed and accessible."
            self.socketio.emit('terminal_output', {'line': f"\n\033[31;1mFATAL ERROR:\033[0m {error_message}"})
            self.socketio.emit('download_error', {'error': error_message})