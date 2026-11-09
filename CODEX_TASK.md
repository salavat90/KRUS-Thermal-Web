# Codex task: KRUS-Thermal Universal 3D on Windows

Read `AGENTS.md`, `universal-3d/HANDOFF.md`, `universal-3d/README-3DFEM.md`, and `universal-3d/README-CODEX-WINDOWS.md` first.

## Scope
Work only on branch `feat/universal-3d-piping`. Do not modify frozen 2D or existing 3D vessel FEM.

## First task: verify baseline, do not assume it works
1. Inspect `git status`, repository history and all existing scripts.
2. Run `smoke-fem-windows.cmd` on Windows 11. Fix real failures, especially Gmsh Boolean contacts and boundary face classification.
3. Serve editor with `run-editor-windows.cmd` and test in a browser: build straight line, tee, bypass, delete edge/node, edit dimensions, export JSON.
4. Compare GitHub branch with any separately supplied offline v0.6 archive. **That archive was never committed to GitHub.** Do not claim those improvements exist in this branch.
5. Add automated tests and a repeatable Windows test runner.

## Delivery target
A single Windows-friendly program that creates accurate pipe/fitting/insulation/heater solids, generates a conformal mesh, solves stationary 3D FEM, and displays 3D temperature fields and sections. Include reference-case verification, mesh convergence, heat balance and explicit unsupported-case warnings. Do not substitute arbitrary thermal correction factors.

## Acceptance
- Straight pipe with insulation and known boundary conditions matches an analytical cylindrical reference within documented tolerance.
- Tee and bypass mesh are watertight/conforming with no overlapping material volumes.
- Material interface and exterior face classification are verified.
- Zero and nonzero heating cases conserve energy to a documented residual.
- Browser workflow runs end-to-end without manual command execution.
- All tests run on Windows 11; documented deployment and reproducible environment.
- Update `universal-3d/HANDOFF.md` after each substantive change; provide actual test outputs and commit IDs.

## Current known limitations
Only straight-cylinder OCC intersections, isothermal fluid, uniformly distributed steel heating and numerical FEM summary import are implemented. Accurate elbows, valves, supports, real cable solids/contact, temperature field visualization and one-click integration remain outstanding.
