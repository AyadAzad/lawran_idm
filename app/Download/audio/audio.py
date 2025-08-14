import os
import time
import shutil
import subprocess
import logging
from pytubefix import YouTube
from tqdm import tqdm

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class YouTubeAudioDownloader:
    """
    A dedicated class to download audio from YouTube videos.
    """

    def __init__(self, socketio=None, output_path='./downloads'):
        """Initializes the YouTubeAudioDownloader."""
        self.socketio = socketio
        self.current_filename = ""
        self._last_emit_time = 0
        self._emit_interval = 0.25
        self.output_path = output_path

    # ---------- Utilities (No Changes Needed Here) ----------

    def _safe_filename(self, title, ext):
        """Sanitizes a string to be a valid filename."""
        invalid_chars = r'\/:*?"<>|'
        sanitized = "".join(c for c in title if c not in invalid_chars).strip().rstrip('.')
        return f"{sanitized}.{ext}"

    def _get_ffmpeg(self):
        """Finds the FFmpeg executable in a robust, multi-step way."""
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
        raise FileNotFoundError(
            "FFmpeg not found. Please place ffmpeg.exe in a 'ffmpeg' folder in your project root, or add it to your system's PATH."
        )

    def _format_size(self, bytes_value):
        """Formats bytes into a human-readable string."""
        if bytes_value is None or bytes_value < 0: return "0 B"
        power = 1024; n = 0
        power_labels = {0: '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
        while bytes_value >= power and n < len(power_labels):
            bytes_value /= power; n += 1
        return f"{bytes_value:.2f} {power_labels[n]}B"

    def _format_time(self, seconds):
        """Formats seconds into a human-readable string."""
        if seconds is None or seconds <= 0: return "0s"
        minutes, sec = divmod(int(seconds), 60)
        hours, minutes = divmod(minutes, 60)
        if hours > 0: return f"{hours}h {minutes}m {sec}s"
        if minutes > 0: return f"{minutes}m {sec}s"
        return f"{sec}s"

    def _sync_file_to_disk(self, filepath):
        """Ensures the file is fully written to disk to prevent corruption."""
        try:
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    os.fsync(f.fileno())
        except (IOError, OSError) as e:
            logger.warning(f"Could not sync file to disk: {e}")

    # ---------- Progress Callbacks (No Changes Needed Here) ----------

    def _progress_function(self, stream, chunk, bytes_remaining):
        """Pytube on_progress callback to emit real-time updates."""
        try:
            total_size = stream.filesize
            downloaded = total_size - bytes_remaining
            progress_percent = (downloaded / total_size * 100) if total_size > 0 else 0
            current_time = time.time()
            if self.socketio and (current_time - self._last_emit_time > self._emit_interval):
                self._last_emit_time = current_time
                elapsed = current_time - self.start_time
                speed = downloaded / elapsed if elapsed > 0 else 0
                eta = (total_size - downloaded) / speed if speed > 0 else 0
                self.socketio.emit('download_progress', {
                    'progress': progress_percent, 'filename': self.current_filename, 'status': 'downloading',
                    'total_size': self._format_size(total_size), 'downloaded_size': self._format_size(downloaded),
                    'download_speed': f"{self._format_size(speed)}/s", 'estimated_time': self._format_time(eta),
                    'percentage': f"{progress_percent:.1f}%", 'active': True
                })
        except Exception as e:
            logger.debug(f"Progress update error (ignoring): {e}")

    # ---------- Main Public Method (CORRECTED) ----------

    def download_audio(self, url, format='mp3'):
        """
        Main method to download audio from a YouTube URL.

        Args:
            url (str): The URL of the YouTube video.
            format (str): The desired output format ("mp3" or "m4a").

        Returns:
            dict: A dictionary indicating the status and file details or error.
        """
        try:
            # --- FIX: The `os.makedirs` call now uses the correct path from the class instance ---
            os.makedirs(self.output_path, exist_ok=True)
            self._last_emit_time = 0
            self.start_time = time.time()

            yt = YouTube(url, on_progress_callback=self._progress_function)
            audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
            if not audio_stream:
                raise ValueError("No audio stream found for this URL.")

            file_extension = 'mp3' if format == 'mp3' else 'm4a'
            self.current_filename = self._safe_filename(yt.title, file_extension)

            if self.socketio:
                self.socketio.emit('download_progress', {
                    'progress': 0, 'filename': self.current_filename, 'status': 'starting',
                    'total_size': self._format_size(audio_stream.filesize), 'downloaded_size': '0 B',
                    'download_speed': '0 B/s', 'estimated_time': 'calculating...', 'percentage': '0%', 'active': True
                })

            # --- FIX: The .download() call now uses the correct path from the class instance ---
            temp_path = audio_stream.download(output_path=self.output_path, filename_prefix="temp_audio_")

            if format == 'mp3':
                # --- FIX: The conversion helper now receives the correct path ---
                final_path = self._convert_to_mp3(temp_path, self.output_path)
            else:
                # --- FIX: The final file path is constructed with the correct path ---
                final_path = os.path.join(self.output_path, self.current_filename)
                shutil.move(temp_path, final_path)
                self._sync_file_to_disk(final_path)

            total_time = time.time() - self.start_time
            final_size = os.path.getsize(final_path)
            if self.socketio:
                self.socketio.emit('download_progress', {
                    'progress': 100, 'filename': os.path.basename(final_path), 'status': 'complete',
                    'total_size': self._format_size(final_size), 'downloaded_size': self._format_size(final_size),
                    'download_speed': 'N/A', 'estimated_time': '0s', 'percentage': '100%',
                    'filepath': final_path, 'time_elapsed': self._format_time(total_time), 'active': False
                })
            return {'status': 'success', 'filename': os.path.basename(final_path), 'filepath': final_path}

        except Exception as e:
            logger.error(f"Audio download failed: {e}", exc_info=True)
            if self.socketio:
                self.socketio.emit('download_error', {'error': str(e), 'filename': self.current_filename or 'Unknown File', 'active': False})
            return {'status': 'error', 'message': str(e)}

    # --- No Changes Needed Below This Line ---

    def _convert_to_mp3(self, input_file, output_path):
        """Converts the downloaded audio file to MP3."""
        output_file = os.path.join(output_path, self.current_filename)
        if self.socketio:
            self.socketio.emit('download_progress', {'status': 'converting...', 'filename': self.current_filename, 'active': True})

        cmd = [
            self._get_ffmpeg(), '-y', '-hide_banner', '-loglevel', 'error',
            '-i', input_file, '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', '-threads', '0',
            output_file
        ]
        subprocess.run(cmd, check=True)
        self._sync_file_to_disk(output_file)
        os.remove(input_file)
        return output_file