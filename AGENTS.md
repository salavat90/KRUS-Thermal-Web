# KRUS-Thermal — Codex project instructions

## Mission
Develop KRUS-Thermal Universal 3D as a Windows-friendly engineering thermal CAD/FEM application. Work in `feat/universal-3d-piping`, not `main`. Preserve the existing 2D pipe FEM and vessel FEM Lab. Target: 3D centerlines → precise solids → conforming mesh → stationary 3D thermal FEM → validated results and visualization.

## Start every session
1. Read `universal-3d/HANDOFF.md`, `universal-3d/README-3DFEM.md`, and `universal-3d/README-CODEX-WINDOWS.md`.
2. Run `git status`, confirm feature branch and inspect uncommitted changes. Never overwrite them.
3. Inspect `universal-3d/index.html`, `mesh3d.py`, `solve3d.py` and existing tests before changing.
4. Reproduce failures and run tests before claiming a fix.

## Engineering requirements
- SI units internally. Editor diameters/wall/insulation are mm; centerline coordinates are metres.
- Do not use arbitrary correction factors or hide FEM errors. Separate analytical approximations from 3D FEM.
- Validate geometry material interfaces, mesh quality, physical boundary classification, energy balance, convergence and analytical reference cases.
- Test straight pipe, tee, elbow, bypass, heater on/off and insulation on/off.
- Model real heating cable/contact rather than assuming steel volumetric heating when claiming cable accuracy.
- Keep the UI simple: draw axes, edit selected pipe, calculate, inspect results. Advanced settings collapsible.
- Windows 11 setup through CMD, Python virtualenv; do not require PowerShell for routine workflows.
- Update `universal-3d/HANDOFF.md` and add tests for meaningful changes. Never modify `main` without explicit approval.

## Current state and warnings
- GitHub editor is schematic and uses a Three.js CDN; it is NOT the previously shared offline v0.6 ZIP.
- Gmsh currently uses unions of straight cylinders, not exact standard bends/valves/supports.
- FEM is experimental, fixed fluid temperature, convection and uniformly heated steel; no actual cable solid, fluid dynamics or verified convergence.
- Browser only imports FEM summary; no 3D FEM field rendering or one-click integrated calculation.
- Full Gmsh and browser verification has not been confirmed.
- Previous offline v0.4–v0.6 archives were not committed. If their features matter, request the latest ZIP and port them selectively.
- Never claim engineering-ready without documented benchmark and convergence evidence.

## Codex Windows turnkey migration
The separate Windows bootstrap distribution (created 2026-11-09) installs Git, Python 3.11, Node.js LTS, VS Code, OpenAI Codex CLI/IDE extension, VC++ runtime, and Python Gmsh/NumPy/SciPy. It automatically clones `feat/universal-3d-piping` and places the original offline v0.6 archive and extracted code in `migration-input/legacy-v0.6/`. It also creates a ZIP snapshot of the Git branch and a setup report inside `migration-input/` (gitignored). Read `universal-3d/CODEX_WINDOWS_MIGRATION.md` and `migration-input/CODEX_FIRST_TASK.txt`. Compare and integrate, do not overwrite. Installer/mesh/physics not fully validated on a real Windows host.

## Integrating 2D pipe + 3D vessel + universal piping
For the user's integration project, first read `universal-3d/CODEX_INTEGRATION_BRIEF.md`. It audits actual `main` 2D pipe and vessel FEM sources, incompatible mesh schemas, integration architecture, explicit source limitations and acceptance tests T01–T10. Read-only access to main reference files; all modifications remain on `feat/universal-3d-piping`. Do not treat a green energy balance as physical verification.
