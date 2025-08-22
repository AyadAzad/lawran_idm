# app/Download/documents/documents.py

import os
import requests
import logging
from urllib.parse import unquote, urlparse
from typing import Dict, Any

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DocumentDownloader:
    """
    A general-purpose downloader for any file type (documents, applications, etc.).
    It streams downloads to handle large files and reports progress via Socket.IO.
    """

    def __init__(self, socketio=None, output_path='./downloads'):
        self.socketio = socketio
        self.output_path = output_path
        os.makedirs(self.output_path, exist_ok=True)

    def _get_filename_from_url(self, url):
        """Extracts a filename from a URL, falling back if necessary."""
        try:
            # Decode URL-encoded characters (e.g., %20 -> space)
            path = unquote(urlparse(url).path)
            filename = os.path.basename(path)
            if filename:
                return filename
        except Exception:
            pass
        return "downloaded_file"  # Generic fallback

    def download_document(self, url: str):
        """
        Main method to download a generic file. Designed to be run in a background task.
        """
        try:
            self.socketio.emit('terminal_output', {'line': f"\n\033[1mIntercepted download request for:\033[0m {url}"})

            with requests.get(url, stream=True, allow_redirects=True) as r:
                r.raise_for_status()  # Will raise an exception for bad status codes (4xx or 5xx)

                # Try to get filename from headers, fallback to URL
                content_disposition = r.headers.get('content-disposition')
                if content_disposition:
                    import re
                    fname = re.findall('filename="?(.+)"?', content_disposition)
                    filename = fname[0] if fname else self._get_filename_from_url(url)
                else:
                    filename = self._get_filename_from_url(url)

                total_size = int(r.headers.get('content-length', 0))
                final_path = os.path.join(self.output_path, filename)

                self.socketio.emit('terminal_output', {'line': f"\033[1mFile:\033[0m {filename}"})
                self.socketio.emit('terminal_output',
                                   {'line': f"\033[1mSize:\033[0m {total_size / (1024 * 1024):.2f} MB\n"})

                downloaded = 0
                chunk_size = 8192
                with open(final_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=chunk_size):
                        f.write(chunk)
                        downloaded += len(chunk)

                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            progress_line = (
                                f"\r\033[K"
                                f"\033[36mDownloading...\033[0m "
                                f"{percent:>7.2f}% of {total_size / (1024 * 1024):.2f} MB"
                            )
                            self.socketio.emit('terminal_output', {'line': progress_line})

            self.socketio.emit('terminal_output', {'line': f"\n\033[32;1mSuccess! File saved as:\033[0m {filename}"})
            self.socketio.emit('download_complete', {'filename': filename})

        except Exception as e:
            logger.error(f"Generic download failed for {url}: {e}", exc_info=False)
            error_message = str(e)
            self.socketio.emit('terminal_output', {'line': f"\n\033[31;1mFATAL ERROR:\033[0m {error_message}"})
            self.socketio.emit('download_error', {'error': error_message})