@echo off
setlocal
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (echo ERROR: Run setup-windows.cmd first & exit /b 1)
if not exist universal-3d\out mkdir universal-3d\out
.venv\Scripts\python.exe universal-3d\mesh3d.py universal-3d\example-pipe.json universal-3d\out\mesh.json 0.12 || exit /b 1
.venv\Scripts\python.exe universal-3d\solve3d.py universal-3d\out\mesh.json universal-3d\conditions.example.json universal-3d\out\result.json || exit /b 1
.venv\Scripts\python.exe -c "import json; x=json.load(open('universal-3d/out/result.json')); print(x['summary'])" || exit /b 1
echo FEM smoke completed; NOT proof of engineering accuracy.
endlocal
