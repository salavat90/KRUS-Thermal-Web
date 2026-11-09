# KRUS-Thermal Universal 3D — development handoff

Branch: `feat/universal-3d-piping`. Base: `main`. **Do not modify the frozen 2D version or existing 3D FEM Lab in main.**

## Entry point
`universal-3d/index.html`: standalone browser editor, Three.js 0.170 via importmap. Use a local HTTP server or GitHub Pages deployment; a branch alone is not published at the normal main Pages URL.

## Implemented in branch
- 3D graph of nodes and edges with snapping and construction plane XZ/XY/YZ.
- Mouse click to add centerline nodes/edges; re-use nearby nodes; branch and closed bypass topology can be represented as graph cycles.
- Straight volumetric tube/insulation previews, line representation of a heater, picking, properties, show/hide layers, orbit/pan/zoom.
- JSON save/open, demo network with bypass, segment list, length and **analytical straight-pipe heat loss estimates only**.

## Critical limits (do not misrepresent)
- Preview uses open-ended cylinders. There is **no exact solid CAD BREP**, no swept smooth elbows, no watertight Boolean tee/bypass intersections, no wall-thickness shell in preview, no valves or tanks.
- `bend` property is stored but not used in the geometry. Heater is an illustrative line, not embedded volumetric heater.
- No Gmsh generation from editor yet; no FEM coupling, no validated heat balance or temperature distribution. Thermal output is a radial analytical estimate for straight insulated pipes, not 3D FEM and ignores branches and fittings.
- No automated test or browser verification performed yet. Use caution with user-generated JSON.
- Drawing mode creates graph edges in the chosen plane; the branch mode currently shares the same interaction. Improve snapping to edges, true branch splitting, 3D dimensions and coordinate entry.

## Next integration milestones
1. Add topology validation (no zero-length, duplicates, self-intersections, disconnected floating components) and automated graph tests.
2. Build a canonical graph-to-CAD conversion contract: nodes, pipe segments, bends, tees, reducers, insulation, heater path, material IDs and physical BCs.
3. Add backend OpenCASCADE construction of watertight solids with filleted elbows and Boolean tees; resolve overlaps and contacts.
4. Generate conformal tetra mesh via Gmsh and return mesh metadata; reuse existing full-vessel FEM solver only after extending its material and BC model to pipes.
5. Extend FEM to include actual pipe fluid BCs, insulation, heaters, supports, boundary flux integration, validation and convergence.
6. Run browser tests, mesh QA, physical reference cases; then publish a preview deployment for the feature branch.

## Continuation prompt
«Открой `salavat90/KRUS-Thermal-Web` ветку `feat/universal-3d-piping`, прочитай `universal-3d/HANDOFF.md` и продолжи реализацию полноценного редактора трубопроводов с Gmsh/FEM, не затрагивая main 2D/3D.»

## 2026-11-09 — topology editor improvements
- Added split-selected-segment at midpoint; original edge retains properties and second edge copies them. Enables explicit tee junction placement by splitting before drawing a branch.
- Added topology diagnostics: connected components, isolated nodes, branch nodes (degree>=3), graph cycle count. Bypasses are recognized as cycles, not treated as invalid.
- Added export `KRUS-piping-CAD-input.json` with schema `KRUS.Thermal.Piping.v1`, units meters, nodes/segments and graph topology. This is centerline data only, **not** an OCC BREP or FEM mesh.
- Commit `c107b1c`. Browser execution and automated tests NOT verified. Remaining: snap click to split position, actual bend/tee solids, OCC/Gmsh service and solver. Do not claim full FEM.

## 2026-11-09 — OCC/Gmsh and sparse 3D FEM experimental backend
- Added `mesh3d.py`: straight centerline cylinders, Boolean union/cut/fragment of steel, insulation and fluid, Gmsh tetra JSON.
- Added `solve3d.py`: tetrahedral P1 sparse stationary conduction, steel volumetric heating, fixed fluid temperature and exterior convection, energy-balance report and nodal temperature output.
- Added `requirements.txt`, `conditions.example.json`, `README-3DFEM.md`. The editor can import the numerical FEM summary JSON, not the 3D field rendering.
- WARNING: This is not a complete or validated universal thermal engineering application. No actual Gmsh execution in this environment; geometry and BC need testing on straight pipe, tee, bypass and elbow. It does not model standard elbow radii, local valves/flanges/supports, cable contact, fluid flow or coupled CFD. Energy balance does not imply physical accuracy.
- Continue by validating OCC material contacts, tetra quality, end-face conditions, benchmark and convergence, then integrate backend into a one-click UI. Do not claim finished production status.
