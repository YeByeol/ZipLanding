# Three.js architectural addons

Pinned to **Three.js r187**, matching the local core. Both are MIT licensed
under [../THREE-LICENSE.txt](../THREE-LICENSE.txt).

- [RoundedBoxGeometry.js](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/geometries/RoundedBoxGeometry.js)
- [RoomEnvironment.js](https://github.com/mrdoob/three.js/blob/r187/examples/jsm/environments/RoomEnvironment.js)

Upstream changes are normalization of leading indentation and replacing the bare `three` import with
`../../three.module.js` so the existing static GitHub Pages deployment needs
neither a package resolver nor an external CDN. RoomEnvironment supplies the
studio illumination; the building geometry is an original ZIP concept model.
