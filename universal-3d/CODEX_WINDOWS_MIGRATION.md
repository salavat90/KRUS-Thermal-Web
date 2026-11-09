# KRUS-Thermal — Codex migration on Windows 11

**Branch:** `feat/universal-3d-piping`; never merge into `main` without approval.

## Turnkey installer distribution
The assistant provides a Windows 11 bootstrap ZIP containing `01-INSTALL-EVERYTHING.cmd`, Codex launchers, diagnostics and a **verbatim preserved** `KRUS-Thermal-Universal3D-offline-v0.6.zip` legacy baseline.

The bootstrap uses WinGet to install Git for Windows, Python 3.11, Node.js LTS, Visual Studio Code and Visual C++ runtime when missing; npm installs OpenAI Codex CLI in a user-owned folder; VS Code receives the OpenAI Codex extension; pip creates `.venv` with Gmsh, NumPy and SciPy.

It clones/updates this exact GitHub branch into `C:\KRUS-Thermal-Web`, archives the branch source **after clone**, copies/extracts legacy v0.6 to `migration-input\` and writes migration reports. **No PowerShell** is required for routine installation. Administrator approval may be required for some WinGet packages. Network is required for first setup.

## Critical: two different code baselines
1. **Offline v0.6** is a no-install, browser-based 1D thermal-network editor with enhanced node deletion, simplified UI, 0.25 m axial discretization and heat balance. Its original ZIP is held in `migration-input` by the installer, not committed to Git.
2. **GitHub feature branch** contains a separate Three.js browser editor, OCC/Gmsh 3D mesh generator and experimental P1 3D FEM solver. It does *not* automatically include all v0.6 improvements and still lacks verified single-click end-to-end operation.

Codex must inspect both and integrate missing UI/interaction features *into the feature branch*, preserving its 3D solver evolution. Do not overwrite working code with the legacy editor. Do not mislabel the current 3D FEM as validated.

## What Codex should do first
- Read root `AGENTS.md`, `CODEX_TASK.md`, `universal-3d/HANDOFF.md`, and `universal-3d/README-3DFEM.md`.
- Run `git status` and verify branch before edits.
- Review `migration-input\legacy-v0.6\index.html` and `migration-input\legacy-v0.6\test_thermal.js` alongside `universal-3d\index.html`, `mesh3d.py`, `solve3d.py`.
- Diagnose from `migration-input\setup-report.txt` and `universal-3d\out\` results if present.
- Add reproducible unit tests, physics benchmarks, robust UI and 3D mesh verification. Leave existing 2D and vessel FEM unchanged.

## Remaining manual authorization
The user must confirm any Windows User Account Control (UAC) requests from trusted installers and sign in interactively to Codex/ChatGPT. This cannot be automated safely. If GitHub requires credentials, finish the Git Credential Manager browser sign-in.

## Safeguards
Do not commit passwords, OpenAI auth files, API keys, tokens, `.venv`, `migration-input` or results data. Prefer branch-specific commits with tests and append to `universal-3d/HANDOFF.md`.

## Fixed Windows project directory
All project checkout, `.venv`, legacy archive, branch snapshots and FEM outputs are under `C:\KRUS-Thermal-Web`. The turnkey installer's `bootstrap/common.cmd` defines `KRUS_PROJECT=C:\KRUS-Thermal-Web`. Codex CLI installation and installer logs are outside the repository at `%LOCALAPPDATA%\KRUS-Thermal-Tools`, to avoid creating a non-Git target directory before the clone. Previous project paths under `%USERPROFILE%\KRUS` are obsolete.
