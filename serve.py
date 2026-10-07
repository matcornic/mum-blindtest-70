#!/usr/bin/env python3
"""Lance le blind test sur http://localhost:8080 (Python 3, sans dépendance)."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import os,webbrowser
os.chdir(Path(__file__).resolve().parent)
class Handler(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Cache-Control','no-cache')
  super().end_headers()
if __name__=='__main__':
 server=ThreadingHTTPServer(('127.0.0.1',8080),Handler)
 print('À l’oreille : http://localhost:8080 — Ctrl+C pour arrêter',flush=True)
 webbrowser.open('http://localhost:8080')
 try:server.serve_forever()
 except KeyboardInterrupt:server.server_close()
