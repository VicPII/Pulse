"""Serves docs/ at / and this folder at /__test/ so the harness pages can drive the app in an iframe.
Usage: python tests/serve.py   then open http://127.0.0.1:8123/__test/e2e.html"""
import functools, http.server, os

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, '..', 'docs')

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        if path.startswith('/__test/'):
            return os.path.join(HERE, path[len('/__test/'):].split('?')[0])
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass

http.server.ThreadingHTTPServer(('127.0.0.1', 8123), functools.partial(Handler, directory=DOCS)).serve_forever()
