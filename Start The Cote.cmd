@echo off
rem Optional launcher. You can normally just double-click index.html instead.
rem This serves the folder over http://localhost:8765/ , which some browsers
rem prefer for saving your loft between sessions.
start "" http://localhost:8765/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
