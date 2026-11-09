@echo off
setlocal
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (echo ERROR: Run setup-windows.cmd first & exit /b 1)
echo Open http://localhost:8000/universal-3d/
.venv\Scripts\python.exe -m http.server 8000 --bind 127.0.0.1
endlocal
