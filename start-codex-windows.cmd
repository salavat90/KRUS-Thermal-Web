@echo off
setlocal
cd /d "%~dp0"
where codex >nul 2>&1
if errorlevel 1 (
 echo Codex CLI not found. Install Node.js LTS, then run:
 echo npm install -g @openai/codex
 exit /b 1
)
echo Current branch:
git branch --show-current
echo Review AGENTS.md and universal-3d\HANDOFF.md.
codex
