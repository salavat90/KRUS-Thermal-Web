# KRUS-Thermal Universal 3D — experimental 3D FEM pipeline

Branch: `feat/universal-3d-piping`. The production `main` remains untouched.

## Running the pipeline

1. Open `universal-3d/index.html` via a local HTTP server (e.g. `python -m http.server 8000` from repository root) and export `KRUS-piping-CAD-input.json`.
2. Install Python 3.11+ dependencies: `pip install -r universal-3d/requirements.txt`.
3. Generate conforming 3D tetrahedral mesh: `python universal-3d/mesh3d.py KRUS-piping-CAD-input.json mesh.json 0.12`.
4. Edit `universal-3d/conditions.example.json` and calculate: `python universal-3d/solve3d.py mesh.json universal-3d/conditions.example.json result.json`.
5. In editor click **Открыть результат 3D FEM** and select `result.json`.

All lengths in metres, conductivities W/(m K), heat W, temperature °C.

## Implemented
- OCC cylinder unions and Boolean difference to create steel, insulation and fluid domains, with common contact faces via fragments; Gmsh tetra mesh.
- Sparse P1 FEM on steel and insulation with fixed fluid temperature, exterior Robin convection and uniform steel volumetric heater source.
- Nodal temperature solution and conservation report, import of FEM numerical results into the editor.

## Limitations — important
- **Not yet a validated production engineering model.** Gmsh generation and browser integration have not been executed in this environment (gmsh module unavailable); only Python syntax and a tiny synthetic FEM case were checked locally.
- Geometry uses intersections of straight circular cylinders, not standard elbow radii, reducers, valves, flanges or detailed support geometry. The model can therefore miss important local thermal bridges.
- The heater source is uniformly spread through steel; actual heating-cable position and contact thermal resistance are not modeled.
- Fluid is a prescribed isothermal Dirichlet domain, not flow or conjugate convection. Pipe ends are exposed to ambient in the current exterior boundary classification unless they contact fluid. Insulation end faces are likewise exposed.
- No mesh convergence study, analytical benchmarks, or visualization of 3D temperature field in the editor. `validated` flag means **energy conservation only**, not physical validation.
- The editor's 3D preview remains schematic; it does not display OCC BREP geometry. Import shows numeric results only.
- Do not merge into main or use for engineering decisions until mesh, boundary, material and physics tests are completed.

## Next checks
Run Gmsh on a straight pipe, elbow and tee with bypass; inspect material volumes, surface contacts, mesh nonmanifold defects and end conditions. Test zero-heater and heater-on energy balance, mesh refinement and comparison to a cylindrical analytical solution. Then implement actual cable solid, accurate fittings, 3D field rendering and an integrated backend.

## Handoff
Continue from this branch and read `universal-3d/HANDOFF.md`. Do not alter main 2D or vessel FEM.
