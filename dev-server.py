#!/usr/bin/env python3
"""Local preview server that reloads the browser whenever a file in this folder changes.

Run from the portfolio folder:  python3 dev-server.py   (then open http://localhost:8000)
Uses only Python's standard library, so there's nothing to install.
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
SKIP = {".git", "node_modules", ".netlify", ".vercel"}

# Injected into every HTML page: asks the server for the newest file time and reloads when it changes.
RELOAD_SCRIPT = b"""<script>
(() => {
  let seen = null;
  const check = () => fetch('/__changed', { cache: 'no-store' })
    .then((r) => r.text())
    .then((t) => { if (seen && t !== seen) location.reload(); seen = t; })
    .catch(() => {})
    .finally(() => setTimeout(check, 600));
  check();
})();
</script>
"""


def newest_change():
    latest = 0.0
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for name in files:
            try:
                latest = max(latest, os.stat(os.path.join(folder, name)).st_mtime)
            except OSError:
                pass
    return str(latest).encode()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__changed":
            return self.reply(newest_change(), "text/plain")
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if path.endswith(".html") and os.path.isfile(path):
            with open(path, "rb") as f:
                html = f.read()
            if b"</body>" in html:
                html = html.replace(b"</body>", RELOAD_SCRIPT + b"</body>", 1)
            else:
                html += RELOAD_SCRIPT
            return self.reply(html, "text/html; charset=utf-8")
        super().do_GET()

    def reply(self, body, content_type):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # keep the terminal quiet; the reload check runs every 600ms


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Previewing at http://localhost:{PORT}  (auto-reloads on save, Control+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
