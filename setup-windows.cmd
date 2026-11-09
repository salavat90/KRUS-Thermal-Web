@echo off
setlocal
cd /d "%~dp0"
where git >nul 2>nul || (echo ERROR: Git is missing & exit /b 1)
py -3 --version >nul 2>nul || (echo ERROR: Python Launcher is missing & exit /b 1)
if not exist .venv (py -3 -m venv .venv || exit /b 1)
.venv\Scripts\python.exe -m pip install --upgrade pip || exit /b 1
.venv\Scripts\python.exe -m pip install -r universal-3d\requirements.txt || exit /b 1
.venv\Scripts\python.exe -c "import gmsh,numpy,scipy; print('Dependencies OK')" || exit /b 1
echo Setup complete
endlocal
