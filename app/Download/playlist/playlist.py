import os
import logging
from urllib.parse import urlparse, parse_qs
from pytubefix import Playlist
from app.Download.video.video import YouTubeVideoDownloader
from app.Download.audio.audio import YouTubeAudioDownloader

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class PlaylistDownloader:
    """
    Orchestrates the download of multiple items from a YouTube playlist,
    either as video+audio (MP4) or as audio-only (MP3/M4A).
    """

    def __init__(self, socketio=None, video_downloader=None, audio_downloader=None):
        """
        Initializes the PlaylistDownloader with its required downloader engines.

        Args:
            socketio: An optional Flask-SocketIO instance for real-time updates.
            video_downloader: A pre-configured instance of YouTubeVideoDownloader.
            audio_downloader: A pre-configured instance of YouTubeAudioDownloader.
        """
        self.socketio = socketio
        # Use dependency injection for both downloaders for maximum flexibility and code re-use.
        self.video_downloader = video_downloader or YouTubeVideoDownloader(socketio)
        self.audio_downloader = audio_downloader or YouTubeAudioDownloader(socketio)

    def _is_youtube_mix(self, url):
        """Checks if the provided URL is for a non-downloadable YouTube Mix/Radio."""
        try:
            query_params = parse_qs(urlparse(url).query)
            if 'list' in query_params and query_params['list'][0].startswith('RD'):
                return True
        except Exception:
            return False
        return False

    def get_playlist_info(self, url):
        """
        Fetches metadata for a given YouTube playlist URL. This is optimized for speed.
        """
        try:
            if self._is_youtube_mix(url):
                raise ValueError("YouTube Mixes/Radios are not supported. Please use a standard playlist URL.")

            logger.info(f"Fetching info for playlist: {url}")
            p = Playlist(url)

            if not p.video_urls:
                raise ValueError(
                    "Could not find any videos. The playlist may be private, empty, or the URL is incorrect.")

            return {
                'status': 'success',
                'title': p.title,
                'video_count': len(p.video_urls),
            }
        except Exception as e:
            logger.error(f"Failed to get playlist info: {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}

    def download_playlist(self, url, num_videos, quality='1080p', format='mp4'):
        """
        Downloads a specified number of items from a playlist in the desired format.

        Args:
            url (str): The URL of the YouTube playlist.
            num_videos (int): The number of items to download.
            quality (str): The desired video quality (e.g., '1080p'). Ignored for audio formats.
            format (str): The desired output format ('mp4', 'mp3', or 'm4a').
        """
        try:
            if self._is_youtube_mix(url):
                raise ValueError("YouTube Mixes/Radios are not supported and cannot be downloaded.")

            p = Playlist(url)
            if not p.video_urls:
                raise ValueError("Playlist is empty or invalid.")

            videos_to_download = p.video_urls[:num_videos]
            total_videos = len(videos_to_download)
            logger.info(f"Starting playlist download for '{p.title}'. Format: {format}. Queue: {total_videos} items.")

            for i, video_url in enumerate(videos_to_download, 1):
                if self.socketio:
                    self.socketio.emit('playlist_status', {
                        'message': f"Starting download {i} of {total_videos}...",
                        'current': i, 'total': total_videos
                    })

                logger.info(f"Processing item {i}/{total_videos}: {video_url}")

                # --- Core Logic: Choose the correct downloader based on format ---
                if format == 'mp4':
                    result = self.video_downloader.download_video(video_url, quality=quality)
                elif format in ['mp3', 'm4a']:
                    # The `quality` parameter is ignored by the audio downloader.
                    result = self.audio_downloader.download_audio(video_url, format=format)
                else:
                    # Handle unsupported format gracefully
                    error_msg = f"Unsupported format '{format}' for playlist download. Skipping item."
                    logger.error(error_msg)
                    if self.socketio:
                        self.socketio.emit('download_error', {'error': error_msg})
                    continue  # Move to the next item in the playlist

                if result.get('status') == 'error':
                    logger.error(f"Failed to download item {i} ({video_url}). Skipping. Error: {result.get('message')}")
                    if self.socketio:
                        self.socketio.emit('download_error', {'error': f"Skipped item {i}: {result.get('message')}"})

            if self.socketio:
                self.socketio.emit('playlist_status',
                                   {'message': "Playlist download complete!", 'current': total_videos,
                                    'total': total_videos})

        except Exception as e:
            logger.error(f"A critical error occurred during playlist download: {e}", exc_info=True)
            if self.socketio:
                self.socketio.emit('download_error', {'error': f"Playlist download failed: {str(e)}"})