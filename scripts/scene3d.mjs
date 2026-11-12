import { BUILDINGS } from './demo.mjs';
import { colorFor, mountCity } from './city.mjs';
import { DEFAULT_VIEW, clampView, clampProgress, clampZoom, viewForProgress, dragIntent, isClick } from './scene-model.mjs';

let threePromise;
const loadThree = () => threePromise ||= import('../vendor/three.module.js');

export function mountScene3D(container, { buildings = BUILDINGS, onSelect, interactive = false, scene = 'hero', onStatus = () => {} } = {}) {
  const fallback = mountCity(container, { buildings, onSelect, interactive });
  const originalPosition = container.style.position;
  const svg = container.querySelector('svg');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let state = { mode: 'price', weights: undefined, selected: 'a', saved: ['a', 'b', 'c'] };
  let view = { ...DEFAULT_VIEW }, targetView = { ...view }, manual = false, progress = .5;
  let zoom = 1;
  let reduced = motion.matches, destroyed = false, initialized = false, visible = true, lost = false;
  let renderer, world, camera, canvas, THREE, frame = 0, previousTime = 0, hovered = null, pointer = null;
  let resizeObserver, visibilityObserver, entryObserver;
  const objects = [], resources = new Set(), listeners = [];
  const listen = (node, event, handler, options) => {
    node.addEventListener(event, handler, options);
    listeners.push(() => node.removeEventListener(event, handler, options));
  };
  container.dataset.renderer = 'pending';
  const publishView = () => {
    container.dataset.viewYaw = view.yaw.toFixed(4);
    container.dataset.viewPitch = view.pitch.toFixed(4);
    container.dataset.manualView = String(manual);
    container.dataset.viewZoom = String(zoom);
  };
  publishView();
  onStatus('svg');

  function fallbackMode() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    svg.style.visibility = '';
    if (canvas) canvas.style.visibility = 'hidden';
    container.dataset.renderer = 'svg';
    onStatus('svg');
  }

  function requestRender() {
    if (!frame && renderer && !destroyed && !lost && visible && !document.hidden) frame = requestAnimationFrame(render);
  }

  function positionCamera() {
    const distance = 14;
    camera.position.set(Math.sin(view.yaw) * Math.cos(view.pitch) * distance, Math.sin(view.pitch) * distance, Math.cos(view.yaw) * Math.cos(view.pitch) * distance);
    camera.lookAt(0, .28, 0);
    if (camera.zoom !== zoom) { camera.zoom = zoom; camera.updateProjectionMatrix(); }
    publishView();
  }

  function render(time) {
    frame = 0;
    if (destroyed || lost || !visible || document.hidden) return;
    const amount = reduced ? 1 : Math.min(32, time - (previousTime || time - 16)) / 105;
    previousTime = time;
    let unsettled = false;
    for (const key of ['yaw', 'pitch']) {
      const difference = targetView[key] - view[key];
      view[key] = Math.abs(difference) < .0003 ? targetView[key] : view[key] + difference * amount;
      if (Math.abs(targetView[key] - view[key]) > .0003) unsettled = true;
    }
    for (const item of objects) {
      const selected = item.id === state.selected;
      const targetY = selected ? .08 : 0;
      item.group.position.y += (targetY - item.group.position.y) * amount;
      if (Math.abs(targetY - item.group.position.y) > .0005) unsettled = true;
      else item.group.position.y = targetY;
      const colorDifference = Math.max(Math.abs(item.material.color.r - item.targetColor.r), Math.abs(item.material.color.g - item.targetColor.g), Math.abs(item.material.color.b - item.targetColor.b));
      if (colorDifference > .001) {
        item.material.color.lerp(item.targetColor, amount);
        unsettled = true;
      } else item.material.color.copy(item.targetColor);
      item.material.emissive.set(item.id === hovered ? '#113a32' : '#000000');
      item.outline.visible = selected;
      item.marker.material = selected ? item.selectedMarker : state.saved.includes(item.id) ? item.savedMarker : item.defaultMarker;
    }
    positionCamera();
    try {
      renderer.render(world, camera);
      if (container.dataset.renderer !== 'webgl') {
        svg.style.visibility = 'hidden';
        canvas.style.visibility = '';
        container.dataset.renderer = 'webgl';
        onStatus('webgl');
      }
    } catch {
      lost = true;
      fallbackMode();
      return;
    }
    if (unsettled) requestRender();
  }

  function resize() {
    if (!renderer || destroyed) return;
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const halfWidth = Math.max(5.6, 3.65 * aspect);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfWidth / aspect;
    camera.bottom = -halfWidth / aspect;
    camera.updateProjectionMatrix();
    requestRender();
  }

  async function initialize() {
    if (initialized || destroyed) return;
    initialized = true;
    try {
      THREE = await loadThree();
      if (destroyed) return;
      // Supplying a checked context avoids Three's error log on unsupported devices.
      canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
      if (!context) { fallbackMode(); return; }
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.32;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.tabIndex = -1;
      canvas.dataset.scene = scene;
      Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', visibility: 'hidden', touchAction: 'pan-y pinch-zoom', cursor: interactive ? 'grab' : 'default' });
      if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
      container.append(canvas);
      world = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-6, 6, 4, -4, .1, 60);
      world.add(new THREE.HemisphereLight('#fafff3', '#82948a', 2.8));
      const sun = new THREE.DirectionalLight('#fff4dc', 4.2);
      sun.position.set(-4, 10, 7);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 1, far: 25 });
      sun.shadow.bias = -.0007;
      sun.shadow.normalBias = .035;
      sun.shadow.radius = 3;
      resources.add(sun.shadow);
      world.add(sun);
      const fill = new THREE.DirectionalLight('#cbd9ff', 1.1);
      fill.position.set(5, 4, -5);
      world.add(fill);
      buildDiorama();
      bindPointers();
      listen(canvas, 'webglcontextlost', event => { event.preventDefault(); lost = true; fallbackMode(); });
      listen(canvas, 'webglcontextrestored', () => { lost = false; resize(); requestRender(); });
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      if ('IntersectionObserver' in window) {
        visibilityObserver = new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting;
          if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
          else { previousTime = 0; requestRender(); }
        }, { rootMargin: '100px' });
        visibilityObserver.observe(container);
      }
      resize();
    } catch {
      // A partially created scene must never replace the usable fallback later.
      lost = true;
      fallbackMode();
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      resources.forEach(resource => resource.dispose());
      resources.clear();
      renderer?.dispose();
      canvas?.remove();
      renderer = null;
      world = null;
      camera = null;
      objects.length = 0;
    }
  }

  function buildDiorama() {
    const own = value => { resources.add(value); return value; };
    const material = (color, extra = {}) => own(new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .04, ...extra }));
    const concrete = material('#e5e9dd'), slab = material('#c3d0c2'), pavement = material('#c8d4c8');
    const road = material('#94afa5'), paint = material('#f5f1df'), park = material('#a9c5a2');
    const wood = material('#a88c60'), dark = material('#244b46'), trim = material('#e7eddf');
    const boxGeometry = own(new THREE.BoxGeometry(1, 1, 1));
    const box = (parent, x, y, z, w, h, d, mat, shadow = true) => {
      const mesh = new THREE.Mesh(boxGeometry, mat);
      mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
      mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    box(world, 0, -.29, 0, 8.7, .46, 6.4, slab);
    box(world, 0, -.045, 0, 8.76, .075, 6.46, concrete);
    box(world, 0, .004, 0, .48, .018, 5.85, road, false);
    box(world, 0, .006, 0, 7.95, .018, .46, road, false);
    box(world, 0, .007, -2.62, 7.95, .02, .2, pavement, false);
    box(world, 0, .007, 2.62, 7.95, .02, .2, pavement, false);
    for (let i = -3; i <= 3; i++) {
      if (i) box(world, i, .018, 0, .22, .008, .024, paint, false);
    }
    for (let i = -2; i <= 2; i++) {
      if (i) box(world, 0, .018, i, .024, .008, .22, paint, false);
    }
    // A green promenade, small benches and crossings give the model a human scale.
    box(world, -3.86, .016, 0, .5, .035, 5.65, park, false);
    for (const z of [-.36, .36]) for (let x = -.18; x <= .19; x += .09) box(world, x, .02, z, .045, .008, .16, paint, false);
    const trunkGeometry = own(new THREE.CylinderGeometry(.025, .034, .22, 5));
    const crownGeometry = own(new THREE.IcosahedronGeometry(.18, 1));
    const foliage = [material('#6d9b79'), material('#80a989'), material('#a1bb87')];
    function tree(x, z, index) {
      const trunk = new THREE.Mesh(trunkGeometry, wood); trunk.position.set(x, .13, z); trunk.castShadow = true; world.add(trunk);
      const crown = new THREE.Mesh(crownGeometry, foliage[Math.abs(index) % 3]); crown.position.set(x, .36, z); crown.scale.set(.9, 1.4, .9); crown.castShadow = true; world.add(crown);
    }
    [-2.3, -1.4, -.5, .5, 1.4, 2.3].forEach((z, i) => { tree(-3.87, z, i); if (i % 2 === 0) box(world, -3.62, .085, z + .2, .12, .09, .28, wood); });
    for (let x = -2.8; x < 3.4; x += 1.25) { tree(x, -2.88, Math.round(x * 10)); tree(x + .35, 2.88, Math.round((x + 4) * 10)); }
    const labelTexture = (letter, background, foreground) => {
      const label = document.createElement('canvas'); label.width = 96; label.height = 96;
      const context = label.getContext('2d');
      context.fillStyle = background; context.beginPath(); context.arc(48, 48, 39, 0, Math.PI * 2); context.fill();
      context.lineWidth = 3; context.strokeStyle = '#ffffff'; context.stroke();
      context.fillStyle = foreground; context.font = '600 43px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(letter, 48, 50);
      const texture = own(new THREE.CanvasTexture(label)); texture.colorSpace = THREE.SRGBColorSpace;
      return own(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true, toneMapped: false }));
    };
    const windowGeometry = own(new THREE.PlaneGeometry(.055, .09));
    const windowMaterial = material('#ffffff', { roughness: .45, metalness: .12 });
    const hatchMaterial = own(new THREE.LineBasicMaterial({ color: '#5b6b61', transparent: true, opacity: .8 }));
    const windowTransform = new THREE.Object3D();
    const windowColor = new THREE.Color();
    for (const [index, building] of buildings.entries()) {
      const group = new THREE.Group();
      group.position.set((building.x - 2.5) * 1.13 + (building.x > 2 ? .15 : -.15), 0, (building.y - 1.5) * 1.17 + (building.y > 1 ? .16 : -.16));
      world.add(group);
      const h = building.height / 39, w = building.w * .93, d = building.d * .93;
      box(group, 0, .028, 0, w + .16, .055, d + .16, pavement);
      const facade = material(colorFor(building, buildings, state.mode, state.weights));
      const body = box(group, 0, h / 2 + .06, 0, w, h, d, facade);
      body.userData.buildingId = building.id;
      box(group, 0, .105, 0, w + .025, .085, d + .025, trim);
      box(group, 0, h + .065, 0, w + .035, .045, d + .035, facade);
      box(group, -.06, h + .14, -.04, w * .44, .12, d * .38, trim);
      box(group, w * .23, h + .105, d * .18, w * .22, .035, d * .28, dark);
      const hatchPoints = [];
      for (let diagonal = -.8; diagonal < .81; diagonal += .18) {
        const start = Math.max(-.48, diagonal - .48), end = Math.min(.48, diagonal + .48);
        hatchPoints.push(start * w, h + .092, (diagonal - start) * d, end * w, h + .092, (diagonal - end) * d);
      }
      const hatchGeometry = own(new THREE.BufferGeometry());
      hatchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hatchPoints, 3));
      const missingMark = new THREE.LineSegments(hatchGeometry, hatchMaterial);
      missingMark.visible = colorFor(building, buildings, state.mode, state.weights) === '#d9d6cf';
      group.add(missingMark);
      const floors = Math.max(2, Math.floor(h / .19));
      const windows = new THREE.InstancedMesh(windowGeometry, windowMaterial, floors * 12);
      let windowIndex = 0;
      for (let floor = 0; floor < floors; floor++) for (let column = 0; column < 3; column++) {
        const y = .19 + floor * (h - .16) / floors;
        for (let side = 0; side < 4; side++) {
          const offset = (column - 1) * (side % 2 ? d : w) * .25;
          windowTransform.rotation.y = side === 3 ? -Math.PI / 2 : side * Math.PI / 2;
          if (side === 0) windowTransform.position.set(offset, y, d / 2 + .003);
          if (side === 1) windowTransform.position.set(w / 2 + .003, y, offset);
          if (side === 2) windowTransform.position.set(offset, y, -d / 2 - .003);
          if (side === 3) windowTransform.position.set(-w / 2 - .003, y, offset);
          windowTransform.updateMatrix();
          windows.setMatrixAt(windowIndex, windowTransform.matrix);
          windows.setColorAt(windowIndex++, windowColor.set((floor + column + index) % 5 === 0 ? '#eeeacb' : '#234e48'));
        }
      }
      group.add(windows);
      own(windows);
      const outlineBox = new THREE.BoxGeometry(w + .045, h + .04, d + .045);
      const outlineGeometry = own(new THREE.EdgesGeometry(outlineBox));
      outlineBox.dispose();
      const outline = new THREE.LineSegments(outlineGeometry, own(new THREE.LineBasicMaterial({ color: '#f3be61', transparent: true, opacity: .95 })));
      outline.position.y = h / 2 + .06; outline.visible = false; group.add(outline);
      const letter = building.id.toUpperCase();
      const defaultMarker = labelTexture(letter, '#edf2e7', '#244b42');
      const savedMarker = labelTexture(letter, '#72548e', '#ffffff');
      const selectedMarker = labelTexture(letter, '#174f43', '#ffffff');
      const marker = new THREE.Sprite(defaultMarker); marker.position.set(0, h + .38, 0); marker.scale.set(.32, .32, 1); marker.renderOrder = 3; group.add(marker);
      objects.push({ id: building.id, group, body, material: facade, targetColor: new THREE.Color(colorFor(building, buildings, state.mode, state.weights)), outline, missingMark, marker, defaultMarker, savedMarker, selectedMarker });
    }
  }

  function bindPointers() {
    const raycaster = new THREE.Raycaster();
    const point = new THREE.Vector2();
    const hit = event => {
      const rect = canvas.getBoundingClientRect();
      point.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(point, camera);
      return raycaster.intersectObjects(objects.map(item => item.body), false)[0]?.object.userData.buildingId || null;
    };
    if (!interactive) return;
    listen(canvas, 'pointerdown', event => {
      if (event.button !== 0 || pointer) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, view: { ...targetView }, type: event.pointerType, intent: 'pending', moved: false };
    });
    listen(window, 'pointermove', event => {
      if (!pointer || pointer.id !== event.pointerId) {
        if (event.target === canvas && event.pointerType !== 'touch') {
          const next = hit(event);
          if (hovered !== next) { hovered = next; canvas.style.cursor = hovered ? 'pointer' : 'grab'; requestRender(); }
        }
        return;
      }
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (!isClick(dx, dy)) pointer.moved = true;
      if (pointer.intent === 'pending') pointer.intent = dragIntent(dx, dy, pointer.type);
      if (pointer.intent !== 'rotate') return;
      if (!canvas.hasPointerCapture(event.pointerId)) canvas.setPointerCapture(event.pointerId);
      if (event.cancelable) event.preventDefault();
      manual = true;
      targetView = clampView({ yaw: pointer.view.yaw - dx * .006, pitch: pointer.view.pitch + dy * .004 });
      if (reduced) view = { ...targetView };
      canvas.style.cursor = 'grabbing'; publishView(); requestRender();
    }, { passive: false });
    const end = event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const clicked = event.type === 'pointerup' && !pointer.moved && isClick(event.clientX - pointer.x, event.clientY - pointer.y);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      pointer = null; canvas.style.cursor = 'grab';
      if (clicked) { const id = hit(event); if (id) onSelect?.(id); }
    };
    listen(window, 'pointerup', end);
    listen(window, 'pointercancel', end);
    listen(canvas, 'pointerleave', () => { if (!pointer && hovered) { hovered = null; requestRender(); } });
  }

  listen(document, 'visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else { previousTime = 0; requestRender(); }
  });
  listen(motion, 'change', event => {
    reduced = event.matches;
    if (reduced) { targetView = { ...view }; previousTime = 0; }
    requestRender();
  });
  if ('IntersectionObserver' in window) {
    entryObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { entryObserver.disconnect(); initialize(); }
    }, { rootMargin: '350px' });
    entryObserver.observe(container);
  } else initialize();

  return {
    update(next = {}) {
      state = { ...state, ...next };
      fallback.update(state);
      for (const item of objects) {
        const color = colorFor(buildings.find(building => building.id === item.id), buildings, state.mode, state.weights);
        item.targetColor.set(color);
        item.missingMark.visible = color === '#d9d6cf';
      }
      requestRender();
    },
    setProgress(value) {
      progress = clampProgress(value);
      targetView = viewForProgress(progress, targetView, { manual, reducedMotion: reduced });
      requestRender();
    },
    rotate(deltaRadians) {
      if (!Number.isFinite(deltaRadians)) return;
      manual = true;
      targetView = clampView({ ...targetView, yaw: targetView.yaw + deltaRadians });
      if (reduced) view = { ...targetView };
      publishView(); requestRender();
    },
    zoom(delta) {
      if (!Number.isFinite(delta)) return;
      manual = true;
      zoom = clampZoom(zoom + delta);
      publishView(); requestRender();
    },
    resetView() {
      manual = false;
      zoom = 1;
      targetView = { ...DEFAULT_VIEW };
      if (reduced) view = { ...targetView };
      publishView(); requestRender();
    },
    destroy() {
      destroyed = true;
      if (frame) cancelAnimationFrame(frame);
      entryObserver?.disconnect(); visibilityObserver?.disconnect(); resizeObserver?.disconnect();
      listeners.forEach(remove => remove());
      resources.forEach(resource => resource.dispose());
      renderer?.dispose(); canvas?.remove(); fallback.destroy();
      container.style.position = originalPosition;
    },
  };
}
