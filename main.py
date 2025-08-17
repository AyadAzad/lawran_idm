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
        'Lawran IDM',
        'http://localhost:5000',
        width=1500,
        height=1000,
        resizable=True,
        text_select=True
    )
    webview.start()