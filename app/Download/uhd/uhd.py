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
# STRICTLY 4K and higher resolutions.
RESOLUTIONS_4K = ['4320p', '2160p']


class YouTube4KDownloader:
    """
    A dedicated class to download YouTube videos in 4K or higher resolutions.

    This class exclusively targets 2160p (4K) and 4320p (8K) streams. It will fail
    if the video does not have at least a 4K version available. It uses the same
    robust, high-performance architecture as the standard video downloader.
    """

    def __init__(self, socketio=None, output_path='./downloads'):
        """Initializes the YouTube4KDownloader."""
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

    def _format_size(self, b):
        if b is None or b < 0: return "0 B"; power = 1024; n = 0; labels = {0: '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
        while b >= power and n < len(labels): b /= power; n += 1
        return f"{b:.2f} {labels[n]}B"

    def _format_time(self, s):
        if s is None or s <= 0: return "0s"; m, s = divmod(int(s), 60); h, m = divmod(m, 60)
        if h > 0: return f"{h}h {m}m {s}s"
        if m > 0: return f"{m}m {s}s"
        return f"{s}s"

    def _sync_file_to_disk(self, filepath):
        """Ensures the file is fully written to disk to prevent corruption."""
        try:
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f: os.fsync(f.fileno())
        except (IOError, OSError) as e:
            logger.warning(f"Could not sync file to disk: {e}")

    # ---------- Progress Callbacks (Identical to other downloaders) ----------

    def _progress_function(self, stream, chunk, bytes_remaining):
        try:
            download_id = stream.itag
            if download_id not in self.active_downloads: return
            self.active_downloads[download_id]['downloaded'] = stream.filesize - bytes_remaining
            self.active_downloads[download_id]['pbar'].n = self.active_downloads[download_id]['downloaded']
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
        except Exception:
            pass

    def _complete_function(self, stream, file_path):
        try:
            download_id = stream.itag
            if download_id in self.active_downloads and 'pbar' in self.active_downloads[download_id]:
                self.active_downloads[download_id]['pbar'].close()
        except Exception:
            pass

    # ---------- Stream Selection (4K Specific) ----------

    def _get_4k_streams(self, yt):
        """Finds the best 4K+ video stream and the best audio stream."""
        audio_stream = yt.streams.filter(only_audio=True, mime_type="audio/mp4").order_by('abr').desc().first()
        if not audio_stream:
            audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()

        video_stream = None
        adaptive_streams = yt.streams.filter(adaptive=True, only_video=True, file_extension='mp4')
        for res in RESOLUTIONS_4K:
            if video_stream := adaptive_streams.filter(res=res).first():
                logger.info(f"Found 4K+ adaptive stream at '{res}'.")
                break

        return video_stream, audio_stream

    # ---------- Public API ----------

    def download_4k_video(self, url, output_path='./downloads'):
        """Main method to download and process a 4K YouTube video."""
        try:
            os.makedirs(self.output_path, exist_ok=True)
            self.active_downloads.clear()
            self._last_emit_time = 0

            yt = YouTube(url, on_progress_callback=self._progress_function,
                         on_complete_callback=self._complete_function)
            self.current_filename = self._safe_filename(f"{yt.title} [4K]", 'mp4')

            video_stream, audio_stream = self._get_4k_streams(yt)

            # Strict check for 4K video stream
            if not video_stream:
                raise ValueError("No 4K or higher resolution stream found for this URL.")
            if not audio_stream:
                raise ValueError("Could not find a suitable audio stream to accompany the 4K video.")

            start_time = time.time()
            for s in [video_stream, audio_stream]:
                self.active_downloads[s.itag] = {
                    'pbar': tqdm(total=s.filesize, unit='B', unit_scale=True,
                                 desc=f"{s.type.capitalize()} ({getattr(s, 'resolution', '') or s.abr})"),
                    'downloaded': 0, 'total': s.filesize or 0, 'start_time': start_time,
                }

            total_size = video_stream.filesize + audio_stream.filesize
            if self.socketio:
                self.socketio.emit('download_progress', {
                    'progress': 0, 'filename': self.current_filename, 'status': 'starting',
                    'total_size': self._format_size(total_size), 'downloaded_size': '0 B',
                    'download_speed': '0 B/s', 'estimated_time': 'calculating...', 'percentage': '0%', 'active': True
                })

            final_path = self._download_and_merge(video_stream, audio_stream, output_path)

            total_time = time.time() - start_time
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
            logger.error(f"4K Video download failed: {e}", exc_info=True)
            if self.socketio: self.socketio.emit('download_error',
                                                 {'error': str(e), 'filename': self.current_filename or "4K Video",
                                                  'active': False})
            return {'status': 'error', 'message': str(e)}
        finally:
            self.active_downloads.clear()

    # ---------- Internal Processing ----------

    def _download_and_merge(self, video_stream, audio_stream, output_path):
        """Downloads 4K video/audio in parallel and merges them robustly."""
        video_path, audio_path = None, None
        with ThreadPoolExecutor(max_workers=2) as executor:
            video_future = executor.submit(video_stream.download, output_path=output_path,
                                           filename_prefix="temp_4k_video_")
            audio_future = executor.submit(audio_stream.download, output_path=output_path,
                                           filename_prefix="temp_4k_audio_")
            video_path, audio_path = video_future.result(), audio_future.result()

        if not (video_path and audio_path and os.path.exists(video_path) and os.path.exists(audio_path)):
            raise FileNotFoundError("A component file for 4K download failed.")

        if self.socketio:
            self.socketio.emit('download_progress',
                               {'status': 'merging files...', 'filename': self.current_filename, 'active': True})

        final_path = os.path.join(output_path, self.current_filename)
        audio_codec = 'aac' if audio_path.lower().endswith(('.webm', '.weba')) else 'copy'
        cmd = [
            self._get_ffmpeg(), '-y', '-hide_banner', '-loglevel', 'error',
            '-i', video_path, '-i', audio_path,
            '-c:v', 'copy', '-c:a', audio_codec, '-b:a', '192k',
            '-movflags', '+faststart', '-shortest', final_path
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            self._sync_file_to_disk(final_path)
        except subprocess.CalledProcessError as e:
            raise Exception(f"Failed to merge 4K video. FFmpeg error: {e.stderr.decode() if e.stderr else 'No stderr'}")
        finally:
            if os.path.exists(video_path): os.remove(video_path)
            if os.path.exists(audio_path): os.remove(audio_path)

        return final_path