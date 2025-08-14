import os
import logging
from datetime import datetime

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class DownloadManager:
    """
    Manages the listing of completed downloads from the designated directory.
    """

    def __init__(self, download_folder='./downloads'):
        """
        Initializes the DownloadManager.

        Args:
            download_folder (str): The path to the folder containing downloads.
        """
        self.download_folder = download_folder
        if not os.path.exists(self.download_folder):
            os.makedirs(self.download_folder)

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

    def list_files(self):
        """
        Scans the download directory and returns a list of files with metadata.

        Returns:
            list: A list of dictionaries, where each dictionary represents a file.
        """
        try:
            files_with_details = []
            for filename in os.listdir(self.download_folder):
                filepath = os.path.join(self.download_folder, filename)
                if os.path.isfile(filepath):
                    # Get file stats
                    stats = os.stat(filepath)

                    # Determine file type based on extension
                    file_ext = os.path.splitext(filename)[1].lower()
                    file_type = 'video' if file_ext == '.mp4' else 'audio'

                    files_with_details.append({
                        'id': filename + str(stats.st_ctime),  # A more unique ID
                        'filename': filename,
                        'size': self._format_size(stats.st_size),
                        'created_at': datetime.fromtimestamp(stats.st_ctime).strftime('%B %d, %Y'),
                        'type': file_type,
                    })

            # Sort files by creation date, newest first
            files_with_details.sort(key=lambda x: os.path.getctime(os.path.join(self.download_folder, x['filename'])),
                                    reverse=True)

            return files_with_details
        except FileNotFoundError:
            logger.warning("Download directory not found. Returning empty list.")
            return []
        except Exception as e:
            logger.error(f"Failed to list downloaded files: {e}", exc_info=True)
            return []  # Return empty on any other error for frontend stability