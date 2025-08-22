# app/Download/info_fetcher.py
import yt_dlp
import logging

logger = logging.getLogger(__name__)


def get_video_info(url: str):
    """
    Quickly fetches available video formats for a given URL.
    """
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    resolutions = set()  # Using a set to avoid duplicate resolutions
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            for f in info.get('formats', []):
                # We are only interested in video streams that have a height
                if f.get('vcodec') != 'none' and f.get('height'):
                    resolutions.add(f['height'])

        # Sort resolutions from highest to lowest
        sorted_resolutions = sorted(list(resolutions), reverse=True)
        # Format them as strings (e.g., 1080p)
        formatted_resolutions = [f"{res}p" for res in sorted_resolutions]

        return {
            'status': 'success',
            'title': info.get('title', 'Unknown Title'),
            'resolutions': formatted_resolutions
        }
    except Exception as e:
        logger.error(f"Failed to fetch info for {url}: {e}")
        return {'status': 'error', 'message': str(e)}