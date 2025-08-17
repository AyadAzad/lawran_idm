from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
from pathlib import Path # <-- ADD THIS IMPORT

# --- Import all downloader classes ---
from app.Download.video.video import YouTubeVideoDownloader
from app.Download.uhd.uhd import YouTube4KDownloader
from app.Download.playlist.playlist import PlaylistDownloader
from app.Download.downloads import DownloadManager
from app.Download.audio.audio import YouTubeAudioDownloader
app = Flask(__name__)
# This configuration explicitly tells the browser that any origin ('*') is allowed
# to make requests to any of our API routes or download routes. This is essential
# for the browser extension to be able to communicate with the server.
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/downloads/*": {"origins": "*"}
})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ==============================================================================
# --- Define the system-wide "Lawran IDM" downloads folder ---
# ==============================================================================
# 1. Get the user's home directory in a cross-platform way.
home_dir = Path.home()
# 2. Create the full path to C:\Users\YourName\Downloads\Lawran IDM (or equivalent).
DOWNLOADS_DIR = home_dir / "Downloads" / "Lawran IDM"

# 3. Ensure this directory exists. If not, create it.
os.makedirs(DOWNLOADS_DIR, exist_ok=True)
print(f"--- Downloads will be saved to: {DOWNLOADS_DIR} ---")


# --- Instantiate all managers, PASSING THE NEW SYSTEM PATH to them ---
video_downloader = YouTubeVideoDownloader(socketio, output_path=DOWNLOADS_DIR)
audio_downloader = YouTubeAudioDownloader(socketio, output_path=DOWNLOADS_DIR)
downloader_4k = YouTube4KDownloader(socketio, output_path=DOWNLOADS_DIR)
playlist_downloader = PlaylistDownloader(socketio, video_downloader, audio_downloader)
download_manager = DownloadManager(download_folder=DOWNLOADS_DIR)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


# --- API Endpoints (No changes needed here) ---
@app.route('/api/download/video', methods=['POST'])
def download_video_route():
    data = request.json
    url = data.get('url')
    quality = data.get('quality', '1080p')

    # --- THIS IS THE CRITICAL CHANGE ---
    # Instead of waiting for a result, we start a background task.
    # This keeps the server responsive.
    socketio.start_background_task(
        target=video_downloader.download_video,
        url=url,
        quality=quality
    )
    # Return an immediate response to the client.
    return jsonify({'status': 'success', 'message': 'Download has started.'})


@app.route('/api/download/audio', methods=['POST'])
def download_audio_route():
    data = request.json
    url = data.get('url')
    audio_format = data.get('format', 'mp3')

    socketio.start_background_task(
        target=audio_downloader.download_audio,
        url=url,
        format=audio_format
    )
    # Return an immediate success response
    return jsonify({'status': 'success', 'message': 'Audio extraction has started.'})

@app.route('/api/download/4k', methods=['POST'])
def download_4k_route():
    data = request.json
    url = data.get('url')


    # Start the 4K download as a background task
    socketio.start_background_task(
        target=downloader_4k.download_4k_video,
        url=url
    )
    # Return an immediate success response
    return jsonify({'status': 'success', 'message': 'UHD download has started.'})

@app.route('/api/playlist/info', methods=['POST'])
def playlist_info_route():
    data = request.json
    result = playlist_downloader.get_playlist_info(data.get('url'))
    return jsonify(result)


@app.route('/api/playlist/download', methods=['POST'])
def playlist_download_route():
    data = request.json

    # --- THIS IS THE CRITICAL CHANGE ---
    # Start the playlist download as a background task.
    # The frontend will get progress updates via Socket.IO.
    socketio.start_background_task(
        target=playlist_downloader.download_playlist,
        url=data.get('url'),
        num_videos=int(data.get('num_videos')),
        quality=data.get('quality', '1080p'),
        format=data.get('format', 'mp4')
    )
    # Return an immediate success response.
    return jsonify({'status': 'success', 'message': 'Playlist download has started.'})

@app.route('/api/downloads/list', methods=['GET'])
def list_downloads_route():
    files = download_manager.list_files()
    return jsonify(files)


# --- SocketIO Events (No changes needed here) ---
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


@app.route('/downloads/<path:filename>')
def download_file(filename):
    """
    Serves a file from the centrally defined DOWNLOADS_DIR.
    This now correctly points to the absolute system path.
    """
    as_attachment = 'download' in request.args
    return send_from_directory(
        directory=DOWNLOADS_DIR,
        path=filename,
        as_attachment=as_attachment
    )


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)