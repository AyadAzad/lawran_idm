import os
import time
import shutil
import subprocess
import logging
from concurrent.futures import ThreadPoolExecutor
from pytubefix import YouTube
from tqdm import tqdm

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Constants ---
# HARD CAPPED: Resolutions are now capped at 1080p as requested.
RESOLUTIONS = ['1080p', '720p', '480p', '360p', '240p', '144p']


class YouTubeVideoDownloader:
    """
    A dedicated class to download YouTube videos (with audio) up to 1080p.
    This class is optimized for speed and reliability, using parallel downloads
    for video/audio streams and robust FFmpeg merging.
    """

    def __init__(self, socketio=None, output_path='/downloads'):
        """Initializes the YouTubeVideoDownloader."""
        self.socketio = socketio
        self.current_filename = ""
        self.active_downloads = {}
        self._last_emit_time = 0
        self._emit_interval = 0.25
        self.output_path = output_path

    # ---------- Utilities (Copied for modularity) ----------

    def _safe_filename(self, title, ext):
        """Sanitizes a string to be a valid filename."""
        invalid_chars = r'\/:*?"<>|'
        sanitized = "".join(c for c in title if c not in invalid_chars).strip().rstrip('.')
        return f"{sanitized}.{ext}"

    def _get_ffmpeg(self):
        """
        Finds the FFmpeg executable in a robust, multi-step way.
        """
        # 1. The best way: Check if ffmpeg is in the system's PATH
        if ff_path := shutil.which('ffmpeg'):
            return ff_path

        # 2. The self-contained way: Check for a dedicated 'ffmpeg' folder in the project root.
        # This code reliably finds the project root from any script within the 'app' directory.
        try:
            # Get the directory of the current file (e.g., .../app/Download/audio)
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Go up three levels to find the project root from any downloader script
            project_root = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
            # Construct the expected path to ffmpeg.exe
            local_ffmpeg_path = os.path.join(project_root, 'ffmpeg', 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg')

            if os.path.isfile(local_ffmpeg_path):
                return local_ffmpeg_path
        except Exception:
            pass  # Ignore errors if path calculation fails, and fall through to the error.

        # 3. If neither method works, raise a clear error.
        raise FileNotFoundError(
            "FFmpeg not found. Please place ffmpeg.exe in a 'ffmpeg' folder in your project root, or add it to your system's PATH."
        )

    def _format_size(self, bytes_value):
        """Formats bytes into a human-readable string."""
        if bytes_value is None or bytes_value < 0: return "0 B"
        power = 1024;
        n = 0
        power_labels = {0: '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
        while bytes_value >= power and n < len(power_labels):
            bytes_value /= power;
            n += 1
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

    # ---------- Progress Callbacks ----------

    def _progress_function(self, stream, chunk, bytes_remaining):
        """Pytube on_progress callback for combined, real-time updates."""
        try:
            download_id = stream.itag
            if download_id not in self.active_downloads: return

            downloaded_bytes = stream.filesize - bytes_remaining
            self.active_downloads[download_id]['downloaded'] = downloaded_bytes
            self.active_downloads[download_id]['pbar'].n = downloaded_bytes
            self.active_downloads[download_id]['pbar'].refresh()

            current_time = time.time()
            if self.socketio and (current_time - self._last_emit_time > self._emit_interval):
                self._last_emit_time = current_time
                total_size = sum(d.get('total', 0) for d in self.active_downloads.values())
                total_downloaded = sum(d.get('downloaded', 0) for d in self.active_downloads.values())
                start_time = min(d['start_time'] for d in self.active_downloads.values())

                elapsed = current_time - start_time
                speed = total_downloaded / elapsed if elapsed > 0 else 0
                eta = (total_size - total_downloaded) / speed if speed > 0 and total_size > 0 else 0
                progress_percent = (total_downloaded / total_size * 100) if total_size > 0 else 0

                self.socketio.emit('download_progress', {
                    'progress': progress_percent, 'filename': self.current_filename, 'status': 'downloading',
                    'total_size': self._format_size(total_size), 'downloaded_size': self._format_size(total_downloaded),
                    'download_speed': f"{self._format_size(speed)}/s", 'estimated_time': self._format_time(eta),
                    'percentage': f"{progress_percent:.1f}%", 'active': True
                })
        except Exception as e:
            logger.debug(f"Progress update error (ignoring): {e}")

    def _complete_function(self, stream, file_path):
        """Pytube on_complete callback to finalize a stream's progress bar."""
        try:
            download_id = stream.itag
            if download_id in self.active_downloads and 'pbar' in self.active_downloads[download_id]:
                entry = self.active_downloads[download_id]
                if entry['pbar'].n < entry['pbar'].total:
                    entry['pbar'].n = entry['pbar'].total
                    entry['pbar'].refresh()
                entry['pbar'].close()
                logger.info(f"Finished downloading component: {os.path.basename(file_path)}")
        except Exception as e:
            logger.debug(f"Completion callback error (ignoring): {e}")

    # ---------- Stream Selection ----------

    def _get_streams(self, yt, quality):
        """Finds the best video/audio streams, capped at 1080p, with robust fallback."""
        audio_stream = yt.streams.filter(only_audio=True, mime_type="audio/mp4").order_by('abr').desc().first()
        if not audio_stream:
            audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()

        adaptive_streams = yt.streams.filter(adaptive=True, only_video=True, file_extension='mp4')
        video_stream = None
        try:
            req_index = RESOLUTIONS.index(quality)
            resolution_order = RESOLUTIONS[req_index:]
            for res in resolution_order:
                if video_stream := adaptive_streams.filter(res=res).first():
                    logger.info(f"Found suitable adaptive stream at '{res}'.")
                    break
        except ValueError:
            for res in RESOLUTIONS:
                if video_stream := adaptive_streams.filter(res=res).first():
                    logger.warning(f"Invalid quality requested. Using best available: '{res}'.")
                    break

        if not video_stream:
            logger.warning("No suitable adaptive stream found. Falling back to progressive streams.")
            progressive_streams = yt.streams.filter(progressive=True, file_extension='mp4').order_by(
                'resolution').desc()
            for res in RESOLUTIONS:
                if video_stream := progressive_streams.filter(res=res).first():
                    logger.info(f"Found progressive stream at {video_stream.resolution}")
                    audio_stream = None
                    break

        if video_stream: logger.info(f"Selected video stream: {video_stream.resolution} ({video_stream.itag})")
        if audio_stream: logger.info(f"Selected audio stream: {audio_stream.abr} ({audio_stream.itag})")

        return video_stream, audio_stream

    # ---------- Public API ----------

    def download_video(self, url, output_path='./downloads', quality='1080p'):
        """Main method to download and process a YouTube video."""
        try:
            os.makedirs(self.output_path, exist_ok=True)
            self.active_downloads.clear()
            self._last_emit_time = 0

            yt = YouTube(url, on_progress_callback=self._progress_function,
                         on_complete_callback=self._complete_function)
            self.current_filename = self._safe_filename(yt.title, 'mp4')  # Always MP4

            video_stream, audio_stream = self._get_streams(yt, quality)

            if not video_stream:
                raise ValueError(f"Could not find any suitable video stream for '{quality}' or lower.")

            start_time = time.time()
            streams_to_download = [s for s in (video_stream, audio_stream) if s]
            for s in streams_to_download:
                self.active_downloads[s.itag] = {
                    'pbar': tqdm(total=s.filesize, unit='B', unit_scale=True,
                                 desc=f"{s.type.capitalize()} ({getattr(s, 'resolution', '') or s.abr})"),
                    'downloaded': 0, 'total': s.filesize or 0, 'start_time': start_time,
                }

            total_size = sum(d.get('total', 0) for d in self.active_downloads.values())
            if self.socketio:
                self.socketio.emit('download_progress', {
                    'progress': 0, 'filename': self.current_filename, 'status': 'starting',
                    'total_size': self._format_size(total_size), 'downloaded_size': '0 B',
                    'download_speed': '0 B/s', 'estimated_time': 'calculating...', 'percentage': '0%', 'active': True
                })

            if video_stream and video_stream.is_progressive:
                temp_path = video_stream.download(output_path=output_path)
                final_path = os.path.join(output_path, self.current_filename)
                if os.path.abspath(temp_path) != os.path.abspath(final_path): shutil.move(temp_path, final_path)
                self._sync_file_to_disk(final_path)
            elif video_stream and audio_stream:
                final_path = self._download_and_merge(video_stream, audio_stream, output_path)
            else:
                raise ValueError("Could not find suitable streams to create a video.")

            total_time = time.time() - start_time
            final_size = os.path.getsize(final_path)
            if self.socketio:
                self.socketio.emit('download_progress', {
                    'progress': 100, 'filename': os.path.basename(final_path), 'status': 'complete',
                    'total_size': self._format_size(final_size), 'downloaded_size': self._format_size(final_size),
                    'download_speed': f"{self._format_size(final_size / total_time if total_time > 0 else 0)}/s",
                    'estimated_time': '0s', 'percentage': '100%', 'filepath': final_path,
                    'time_elapsed': self._format_time(total_time), 'active': False
                })
            return {'status': 'success', 'filename': os.path.basename(final_path), 'filepath': final_path}
        except Exception as e:
            logger.error(f"Video download failed: {e}", exc_info=True)
            if self.socketio: self.socketio.emit('download_error',
                                                 {'error': str(e), 'filename': self.current_filename, 'active': False})
            return {'status': 'error', 'message': str(e)}
        finally:
            for d in self.active_downloads.values():
                if 'pbar' in d and not d['pbar'].disable: d['pbar'].close()
            self.active_downloads.clear()

    # ---------- Internal Processing ----------

    def _download_and_merge(self, video_stream, audio_stream, output_path):
        """Downloads video/audio in parallel, validates, and merges them robustly."""
        video_path, audio_path = None, None
        with ThreadPoolExecutor(max_workers=2) as executor:
            video_future = executor.submit(video_stream.download, output_path=output_path,
                                           filename_prefix="temp_video_")
            audio_future = executor.submit(audio_stream.download, output_path=output_path,
                                           filename_prefix="temp_audio_")
            video_path = video_future.result()
            audio_path = audio_future.result()

        if not (video_path and audio_path and os.path.exists(video_path) and os.path.exists(audio_path)):
            raise FileNotFoundError("A component file failed to download.")

        if self.socketio:
            total_size = (video_stream.filesize or 0) + (audio_stream.filesize or 0)
            self.socketio.emit('download_progress', {
                'progress': 100, 'filename': self.current_filename, 'status': 'merging files...',
                'percentage': '100%', 'active': True, 'total_size': self._format_size(total_size),
                'downloaded_size': self._format_size(total_size),
            })

        final_path = os.path.join(output_path, self.current_filename)
        audio_codec = 'aac' if audio_path.lower().endswith(('.webm', '.weba')) else 'copy'
        cmd = [
            self._get_ffmpeg(), '-y', '-hide_banner', '-loglevel', 'error',
            '-i', video_path, '-i', audio_path,
            '-c:v', 'copy', '-c:a', audio_codec, '-b:a', '192k',
            '-movflags', '+faststart', '-shortest',
            final_path
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            self._sync_file_to_disk(final_path)
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg failed to merge files. Error: {e.stderr.decode() if e.stderr else 'No stderr'}")
            raise Exception("Failed to merge video and audio.")
        finally:
            if os.path.exists(video_path): os.remove(video_path)
            if os.path.exists(audio_path): os.remove(audio_path)

        logger.info(f"Successfully merged. Final file: {final_path}")
        return final_path