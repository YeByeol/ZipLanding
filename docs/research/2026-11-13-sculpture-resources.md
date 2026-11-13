# ZIP architectural sculpture: free resource review

Reviewed on 2026-11-13. This document distinguishes verified source facts from the design recommendation. The building remains an illustrative, fictional place; adopting a material or a rendering library does not establish any real property information.

## Decision

Rebuild the six film subjects as one coherent family of contemporary residential architectural sculptures, using the existing local Three.js r187 renderer plus the official **RoundedBoxGeometry** and **RoomEnvironment** addons. Use PMREM once during initialization to give glass and metal useful studio reflections. Preserve the site's forest/paper palette and the shared scroll clock.

The external resources should improve the authored building's silhouette, edge highlights and light response. A generic city asset pack would not by itself solve the earlier model's broad plinth, slab stacking or toy-like proportions. Remove the colored analysis plates and curved decorative connectors. Use recessed bays, slender frames, believable slab thickness, terrace cutouts and a small grounded base, with shared geometry/materials where possible.

This is an authored model built with free external rendering tools, **not an imported stock building model**. Do not describe it as a downloaded GLTF or as a reconstruction of a real property.

## Three.js resources selected

| Resource | Verified version | Download size | License | Role |
| --- | --- | ---: | --- | --- |
| [RoundedBoxGeometry source](https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/jsm/geometries/RoundedBoxGeometry.js) | r187 | 6,470 bytes | MIT | Small edge bevels on principal architectural surfaces; avoid inflated, pillowy corners |
| [RoomEnvironment source](https://raw.githubusercontent.com/mrdoob/three.js/r187/examples/jsm/environments/RoomEnvironment.js) | r187 | 4,960 bytes | MIT | Synthetic studio environment, converted once with PMREM |
| [Three.js license](https://raw.githubusercontent.com/mrdoob/three.js/r187/LICENSE) | r187 | 1,081 bytes | MIT | Retain this notice with vendored code |

Both addon sources were downloaded unmodified to `qa/sculpture-research/`; exact source URLs, byte counts and SHA-256 hashes are recorded in `source-receipt.json`. Their combined uncompressed source size is 11,430 bytes, excluding the already present Three core and license. Their bare `three` imports must resolve to the existing local r187 module; no second Three copy or CDN runtime is required.

Official documentation:

- [RoundedBoxGeometry](https://threejs.org/docs/pages/RoundedBoxGeometry.html) describes the radius and segment controls. Low segment counts are sufficient for small architectural bevels; actual framing determines the useful detail level.
- [RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html) explicitly documents PMREM-generated image-based lighting through `scene.environment`.
- [PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html) documents `fromScene`, ownership of returned targets and cleanup of generator internals. Keep the output render target until the scene is disposed; generator disposal does not dispose it.
- [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) documents higher per-pixel cost and recommends an environment map. Use physical shading selectively for glass. Start with opaque/restrained reflective glazing; add transmission only where the view benefits enough to justify its extra rendering work.

### Rendering and performance recommendations

1. Generate the environment during scene setup, then dispose of the temporary RoomEnvironment and PMREM generator. Dispose of the resulting environment target when the renderer is torn down.
2. Make geometry changes earn their cost through silhouette, recessed shadow or a readable edge highlight. Small details that are invisible at the actual landing viewport should not multiply draw calls.
3. Share repeated window-frame, rail and louver geometry/materials. Use instancing for large repeated sets. Per-subject color animation can retain separate subject material instances where the narrative needs independent control.
4. Retain one animation time/state writer for camera, subject and UI. Load/compile once before removing the existing fallback. Do not fetch textures during scroll transitions.
5. Verify each scene and both sides of every transition, including reverse scrolling, mobile viewport bounds and reduced-motion mode. A clean still frame does not establish transition continuity.

## Other free choices reviewed

| Candidate | Verified source facts | Suitability for this landing |
| --- | --- | --- |
| [Kenney City Kit (Suburban)](https://kenney.nl/assets/city-kit-suburban) | Official page identifies 40 assets and Creative Commons CC0. Author's [itch.io page](https://kenney-assets.itch.io/city-kit-suburban) lists `kenney_cityKitSuburban.zip` at 1.9 MB. | Lightweight and consistent for a stylized city overview, but the game-kit aesthetic is poorly matched to a close, architectural hero sculpture. Not selected. Individual geometry counts were not inspected. |
| [Quaternius Downtown City MegaKit](https://quaternius.com/packs/downtowncitymegakit.html) | Official page lists 315 models, glTF/FBX formats, CC0, seven example buildings, and a free Standard subset containing 60–70% of the pack. The [author's download page](https://quaternius.itch.io/downtown-city-megakit) lists Standard at 223 MB; the 918 MB Source tier costs money and was excluded. | More architectural facade detail, but intended for Boston/NYC blocks rather than the desired contemporary residential subject. Would require subset extraction, material rebuilding and web optimization. Not selected; archive not downloaded and final web payload is unknown. |
| [Poly Haven Studio Small 03](https://polyhaven.com/a/studio_small_03) plus [Plastered Wall 04](https://polyhaven.com/a/plastered_wall_04) | Official pages identify CC0 assets. [Poly Haven license](https://polyhaven.com/license) allows commercial use and redistribution of the asset files; credit is appreciated but not mandatory. Exact 1K variants were checked through its public asset API. | Good optional lighting/material assets. RoomEnvironment delivers useful studio IBL without an additional HDR request. The plaster texture introduces weathering that may not help a clean product-like sculpture. Keep both optional; do not ship them solely to claim external assets were used. |

### Exact Poly Haven candidates

The byte counts below came from the official `/files/<asset>` API. The plaster files were also downloaded and their byte counts and SHA-256 hashes confirmed locally. The HDR was not downloaded, so its count remains API metadata, not a local-file measurement.

| Asset variant | Direct file | Bytes | Status |
| --- | --- | ---: | --- |
| Studio Small 03, 1K HDR | [HDR download](https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr) | 1,686,299 | API metadata verified; not downloaded |
| Studio Small 03, 1K EXR | [EXR download](https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/studio_small_03_1k.exr) | 1,469,189 | API metadata verified; not downloaded |
| Plastered Wall 04, 1K diffuse JPG | [Diffuse download](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/plastered_wall_04/plastered_wall_04_diff_1k.jpg) | 299,230 | Downloaded and visually inspected; not selected |
| Plastered Wall 04, 1K OpenGL normal JPG | [Normal download](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/plastered_wall_04/plastered_wall_04_nor_gl_1k.jpg) | 427,268 | Downloaded; optional |
| Plastered Wall 04, 1K roughness JPG | [Roughness download](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/plastered_wall_04/plastered_wall_04_rough_1k.jpg) | 243,061 | Downloaded; optional |

The normal and roughness pair alone adds 670,329 bytes before any web optimization. If adopted, use low normal strength and material-scale UVs; leave normal/roughness maps in a non-color space. Preserve asset provenance. Do not copy Poly Haven site preview renders into the product: its asset license explicitly distinguishes downloadable CC0 assets from protected site imagery and copy.

## Skills reviewed and applicable principles

No additional third-party skill was installed. The installed design/motion guidance already covers the relevant constraints; official Three documentation remains the source of truth for version-specific APIs.

- `~/.agents/skills/find-skills/SKILL.md`: examined the public skill directory and the existing local catalog before considering additional installs. No unverified Three/Blender package is necessary for this change.
- `~/.agents/skills/ui-ux-pro-max/SKILL.md` and `data/stacks/threejs.csv`: queried `environment material performance` with the installed search script. Applicable results cover shared materials, instancing, resource disposal and GLTF material/shadow traversal. The local entries describe 0.185.1, so these are guidance, not evidence that every example is r187-compatible.
- `~/.codex/skills/hyperframes-animation/adapters/three.md`: useful principles are pinned matching core/addon versions, deterministic scene state, assets ready before render-critical transitions, lighting fill to prevent black silhouettes, and inspecting frames on both sides of every camera transition. This is a web landing page: do **not** copy the HyperFrames runtime, seek event contract or video-only pixel-ratio setting into it.
- `~/.codex/skills/hyperframes-animation/rules/3d-camera-flight.md`: apply one camera state/writer, purposeful sequential camera moves and held reading moments. Avoid springy camera wobble. The reference's CSS perspective parameters are not Three.js camera parameters and are not transferred literally.

The parent workflow owns the art direction and UI polish. These targeted references supplement that workflow; they do not introduce another palette, font family or parallel design system.
