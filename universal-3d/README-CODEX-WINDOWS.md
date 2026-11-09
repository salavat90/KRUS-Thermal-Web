# Migration to Codex on Windows 11

Repository: https://github.com/salavat90/KRUS-Thermal-Web
Branch: `feat/universal-3d-piping`

## Prerequisites
Windows 11 x64, Git for Windows, Python 3.11/3.12 x64 with Python Launcher `py`, and (for Codex CLI) Node.js LTS. Codex can be used via its VS Code extension or CLI. Install CLI with `npm install -g @openai/codex` and sign in when prompted. Do not commit credentials.

## CMD commands
```bat
cd /d C:\
git clone https://github.com/salavat90/KRUS-Thermal-Web.git C:\KRUS-Thermal-Web
cd /d C:\KRUS-Thermal-Web
git switch feat/universal-3d-piping
setup-windows.cmd
run-editor-windows.cmd
```
Open http://localhost:8000/universal-3d/ . Use a local HTTP server, not double-clicked HTML. The current UI needs internet for Three.js CDN.

Open repository folder in VS Code + Codex extension, or run `codex` from CMD in the repository root. Codex should read `AGENTS.md` and `universal-3d/HANDOFF.md` before edits.

## Experimental FEM
Run `smoke-fem-windows.cmd`. It generates a straight-pipe Gmsh mesh and FEM result in `universal-3d/out/`. This is a smoke test only, not an engineering validation. On failure keep the logs for Codex to debug.

## Earlier offline archives
The previous v0.4–v0.6 ZIP builds are NOT present in GitHub. If preserving node deletion, UI and thermal-network behavior is required, place the latest ZIP in `migration-input/` and ask Codex to compare and selectively integrate. Never overwrite current source blindly.

## Portability
For a new Windows computer: clone the repository, switch to the branch, run setup script. Python `.venv` must be recreated on each machine. Port 8000 can be changed in `run-editor-windows.cmd`.

## Security
No tokens or secrets in Git. Do not merge into main until validated.

## 2026-11-09 — fixed install location
The turnkey Windows 11 installer stores the repository at **`C:\KRUS-Thermal-Web`** (`KRUS_PROJECT` in bootstrap/common.cmd). The Python virtual environment is `C:\KRUS-Thermal-Web\.venv` and `migration-input` is inside the same folder. Codex CLI and temporary setup logs are stored separately under `%LOCALAPPDATA%\KRUS-Thermal-Tools`, so the repository directory does not need to exist before git clone. Do not use the old `%USERPROFILE%\KRUS\KRUS-Thermal-Web` path.
