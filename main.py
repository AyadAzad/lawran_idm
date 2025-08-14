import webview
import threading
from app.app import app, socketio


def run_server():
    socketio.run(app, host='0.0.0.0', port=5000)


if __name__ == '__main__':
    t = threading.Thread(target=run_server)
    t.daemon = True
    t.start()

    # create pywebview window
    window = webview.create_window(
        'Lawran Downloader',
        'http://localhost:5000',
        width=1200,
        height=600,
        resizable=True,
        text_select=True
    )
    webview.start()