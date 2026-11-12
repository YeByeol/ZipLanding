# ZIP reading flow and navigation layout

The latest user screenshot shows the comparison panel covering its introductory paragraph. Bottom navigation is awkwardly placed and overlaps a second progress line. Preserve the approved large moving city, eight-chapter story, shared smooth clock, dark information panels and all demonstration facts. This is an Impeccable layout/adapt correction within that direction.

## Reproduced cause

The copy and graphic had independent absolute top/bottom anchors. A compact override at850px hid the problem below that height but left the interval immediately above it broken: comparison copy/HUD gap was−10.25px at1440×900 and−46.64px at1440×860. A second bottom progress line shared the chapter navigation's vertical range. More offsets or another narrow breakpoint would retain the cause.

## Layout contract

- Keep the city canvas absolute and full-stage, with its current camera poses and shared animation clock.
- Give the sticky stage two grid rows: a minmax(0,1fr) reading area and an auto-sized bottom dock. The dock's actual height and safe-area padding reserve space before text is laid out.
- Overlay the eight chapters in one grid cell for the existing crossfade. Within each chapter, copy and information graphic use normal column flow, a24px minimum gap and flexible remaining space. Neither uses an independent vertical anchor.
- If content exceeds the reading row, provide native vertical scrolling. Only enhanced active chapters are keyboard-focusable; inactive chapters remain inert. Returning to an entering chapter resets its previous reading position before the first visible frame.
- Single-place connector endpoints follow inner scrolling and disappear outside the reading viewport. Unsubscribe the passive capture listener on destroy. Never attach an endpoint to a fake edge coordinate.
- Group previous / native chapter selector / next at the dock's center. Keep all targets at least44px. The disclosure and color legend occupy their own row on narrow screens. One header progress bar remains; remove the second progress line and old eight-link bottom row.
- Previous/next reuse the existing scroll-to-chapter path, actual logical phase and reduced-motion behavior. At boundaries disable the unavailable action and transfer its focus to the selector. Keep optional-demo state/query independent.
- Preserve ordinary eight-section document flow for noJS/low-height conditions, including full values and static graphics. Hide the film-only controls there. Keep comparison table semantics; permit horizontal table scrolling if enlarged text requires it.

## Bounded verification

Use actual browser rectangles and full-size screenshots for the reported1440×900/860 height band, additional desktop/phone widths, every chapter, dock separation and target sizes. Check keyboard/native navigation, boundary focus, long-content inner scrolling, endpoint clipping and returning scroll position. Run relevant Node regressions, syntax/export and diff checks. Recheck deployed assets and the reported layout on the public site. These checks establish the tested browser states; they do not establish physical-device FPS or every possible viewport.
