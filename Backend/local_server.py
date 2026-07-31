#!/usr/bin/env python3
"""
Server locale minimale per servire i file del simulatore Log Pose.

Serve perche' i browser bloccano fetch() quando apri un file
direttamente con file:// (per motivi di sicurezza, CORS/same-origin).
Con un piccolo server locale il problema sparisce.

Uso:
    1. Metti questo script nella STESSA cartella di:
       - grandline_map.html
       - viaggio.json  (generato dal tuo ./simulatore in C++)
    2. Esegui:  python3 server.py
    3. Apri nel browser:  http://127.0.0.1:8080/grandline_map.html

Ogni volta che rilanci ./simulatore (che riscrive viaggio.json),
basta ricaricare la pagina nel browser: non serve riavviare il server.
"""
import http.server
import socketserver
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8080
PATH = "Frontend/grandline_map.html"
PROJECT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_DIR / "Frontend"


def create_server():
    for port in (8080, 8081, 8082, 8083, 9000):
        try:
            return socketserver.TCPServer((HOST, port), Handler), port
        except OSError:
            continue
    raise OSError("Nessuna porta libera trovata")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT_DIR), **kwargs)

    def translate_path(self, path):
        if path in ("/", "/grandline_map.html"):
            path = "/Frontend/grandline_map.html"
        elif path == "/style.css":
            path = "/Frontend/style.css"
        elif path == "/script.js":
            path = "/Frontend/script.js"
        return super().translate_path(path)

    def end_headers(self):
        # disabilita la cache: senza questo, il browser potrebbe continuare
        # a mostrarti un vecchio viaggio.json anche dopo averlo rigenerato
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    try:
        httpd, port = create_server()
    except OSError as e:
        print(e)
        raise SystemExit(1)

    with httpd as server:
        print(f"Server in ascolto su http://{HOST}:{port}")
        print(f"Apri:  http://{HOST}:{port}/{PATH}")
        print("Premi Ctrl+C per fermarlo.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer fermato.")