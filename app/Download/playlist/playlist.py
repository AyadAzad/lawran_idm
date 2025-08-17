# app/Download/playlist/playlist.py

import logging
import yt_dlp
from typing import Dict, Any

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class PlaylistDownloader:
    """
    Orchestrates playlist downloads using yt-dlp's native playlist handling
    for maximum efficiency. Supports all playlist types, including mixes.
    """

    def __init__(self, socketio=None, video_downloader=None, audio_downloader=None):
        """
        Initializes the PlaylistDownloader.
        """
        self.socketio = socketio
        self.output_path = video_downloader.output_path if video_downloader else './downloads'

    def get_playlist_info(self, url: str) -> Dict[str, Any]:
        """
        Fetches metadata for any playlist or mix URL robustly.
        """
        logger.info(f"Fetching info for playlist/mix: {url}")
        ydl_opts = {
            # --- THIS IS THE FIX ---
            # The 'extract_flat' optimization is removed. This makes the process slightly
            # slower but significantly more reliable for URLs that contain both a
            # video ID and a playlist ID (e.g., watch?v=...&list=...).
            'quiet': True,
            'yes_playlist': True,  # This flag remains essential.
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                if info.get('_type') != 'playlist':
                    raise ValueError("The provided URL is not a valid playlist or mix.")

                is_mix = not info.get('playlist_count')

                if not info.get('entries'):
                    raise ValueError("Playlist appears to be empty, private, or the URL is incorrect.")

                if is_mix:
                    playlist_title = f"Mix: {info.get('title', 'Unknown Mix')}"
                    # For mixes, the number of entries is the number yt-dlp could find
                    video_count = len(info.get('entries', []))
                    if video_count == 0: video_count = 50  # Fallback
                    self.socketio.emit('terminal_output', {
                        'line': f'\033[93mDetected a YouTube Mix. Setting a limit of {video_count} items.\033[0m'})
                else:
                    playlist_title = info.get('title')
                    video_count = info.get('playlist_count')

                return {
                    'status': 'success',
                    'title': playlist_title,
                    'video_count': video_count,
                }
        except Exception as e:
            logger.error(f"Failed to get playlist info: {e}", exc_info=False)
            error_msg = str(e)
            if "The provided URL is not a valid playlist or mix." in error_msg:
                error_msg = "Please provide a valid YouTube Playlist or Mix URL."
            else:
                error_msg = "Could not fetch playlist info. It may be private or invalid."

            return {'status': 'error', 'message': error_msg}

    def download_playlist(self, url: str, num_videos: int, quality: str = '1080p', format: str = 'mp4'):
        # This function does not need any changes.

        class SocketIOLogger:
            def __init__(self, socketio_instance): self.socketio = socketio_instance

            def debug(self, msg):
                if not msg.startswith('[debug]'): self.socketio.emit('terminal_output', {'line': msg})

            def warning(self, msg): self.socketio.emit('terminal_output', {'line': f'\033[93m{msg}\033[0m'})

            def error(self, msg): self.socketio.emit('terminal_output', {'line': f'\033[91m{msg}\033[0m'})

        def progress_hook(d: Dict[str, Any]):
            if d['status'] == 'downloading':
                progress_line = (
                    f"\r\033[K"
                    f"\033[36mDownloading item...\033[0m "
                    f"{d.get('_percent_str', ''):>8} of {d.get('_total_bytes_str', ''):<10} "
                    f"at {d.get('_speed_str', ''):<12} ETA {d.get('_eta_str', '')}"
                )
                self.socketio.emit('terminal_output', {'line': progress_line})

        playlist_folder_path = f"{self.output_path}/%(playlist_title)s"
        ydl_opts = {
            'outtmpl': f"{playlist_folder_path}/%(playlist_index)s - %(title)s.%(ext)s",
            'playlistend': num_videos,
            'progress_hooks': [progress_hook],
            'logger': SocketIOLogger(self.socketio),
            'ignoreerrors': True,
            'yes_playlist': True,
        }

        if format == 'mp4':
            numeric_quality = quality.replace('p', '')
            ydl_opts[
                'format'] = f"bestvideo[height<={numeric_quality}][ext=mp4]+bestaudio[ext=m4a]/best[height<={numeric_quality}]"
            ydl_opts['merge_output_format'] = 'mp4'
        elif format in ['mp3', 'm4a']:
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': format,
                'preferredquality': '192',
            }]
        else:
            self.socketio.emit('download_error', {'error': f"Unsupported format '{format}'"})
            return

        try:
            self.socketio.emit('terminal_output', {'line': f"\n\03_3[1mStarting playlist download...\033[0m"})
            self.socketio.emit('terminal_output', {
                'line': f"\033[1mFormat: {format.upper()}, Quality: {quality}, Items: {num_videos}\033[0m\n"})

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            self.socketio.emit('terminal_output', {'line': f"\n\033[32;1mPlaylist download process finished!\033[0m"})
            self.socketio.emit('download_complete', {})
        except Exception as e:
            logger.error(f"A critical error occurred during playlist download: {e}", exc_info=True)
            self.socketio.emit('terminal_output', {'line': f"\n\033[31mFATAL ERROR:\033[0m {str(e)}"})
            self.socketio.emit('download_error', {'error': str(e)})