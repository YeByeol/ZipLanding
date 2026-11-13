# Architectural sculpture refinement implementation plan

> **For agentic workers:** Use bounded implementation and independent review. The user has already authorized redesign, implementation and Pages deployment; this is the concrete execution record for that scope.

**Goal:** Replace the simplified building with a carefully detailed residential sculpture and remove competing decoration across the landing.

**Architecture:** Keep the established paper/forest atelier, eight scenes and shared scroll clock. Build a separate architecture module with local official Three.js addons, then integrate through the existing renderer/fallback owners. Preserve fictional data, calculations, navigation and the independent manual demo.

**Tech Stack:** Native HTML/CSS/ESM; Three.js r187; official MIT RoundedBoxGeometry and RoomEnvironment/PMREM.

**Spec:** `docs/superpowers/specs/2026-11-13-zip-atelier-rebuild.md`, amended by the user's request to remove colored plates and connectors and redesign the architecture with free external tools.

## Constraints and review focus

- Keep existing semantic data and missing values. Architecture is illustrative, not a measured building.
- No colored analysis plates or decorative connector lines; one thin base and a contact shadow support the object.
- New recessed glazing, frame thickness, balconies, railings, entry, rooftop greenery and stepped volumes must remain legible in the actual viewport.
- Keep all eight scenes and reverse scroll coherent; no independent animation clock or abrupt camera reset.
- Preserve mobile reading space, 44px controls, no clipped model foot, ordinary-flow fallback and WebGL failure recovery.
- Keep materials and geometry shared, dispose all resources, and measure actual browser behavior separately from unit test results.

## Work

- [x] Renderer owner: vendor version-matched official addons with license; implement the architectural module, studio environment, lifecycle and matching SVG fallback. Run geometry/lifecycle tests against real module output.
- [x] Root: remove connector runtime, DOM hooks and obsolete tests. Apply independent whole-page critique in one coherent HTML/CSS batch; adjust closing composition and semantic legend/copy where needed.
- [x] Research owner: record primary-source resource/license/size evidence and relevant local 3D skill guidance. Do not add large assets unless they improve the selected visual world.
- [x] Root: regenerate static exports; run `npm test` and `npm run check`. Inspect desktop/mobile together, fix observed issues in a batch, then one confirmation pass. Include no-WebGL/reduced-motion/manual demo and transition checks.
- [ ] Root: commit, publish through the existing GitHub Pages workflow, and verify public asset equality and live rendering. Record evidence and limits in `docs/verification.md`.

## Additional user direction: a 3D map sample

The user proposed a designed 3D map sample during implementation. Add a fictional neighborhood context for opening and closing: streets, pedestrian space, a pocket park and restrained surrounding buildings. The existing high-quality A model is the same place approached from that map. The shared camera moves from neighborhood to place and returns at the end; context opacity uses the same formation clock. Keep it explicitly fictional, with no invented real place names, observed route or measurements.
