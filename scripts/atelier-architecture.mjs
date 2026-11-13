import * as THREE from '../vendor/three.module.js';
import { RoundedBoxGeometry } from '../vendor/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/addons/environments/RoomEnvironment.js';

/** A locally generated studio: one PMREM bake, with no HDR download or render loop. */
export function lightAtelier(renderer, world, resources) {
  const previous = world.userData.atelierEnvironment;
  if (previous) { resources.delete(previous); previous.dispose(); }
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  try {
    const target = pmrem.fromScene(room, .035, .1, 30, { size: 256 });
    resources.add(target);
    world.userData.atelierEnvironment = target;
    world.environment = target.texture;
    world.environmentIntensity = .58;
    world.environmentRotation.set(0, .48, 0);
  } finally {
    room.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
    room.dispose();
    pmrem.dispose();
  }
}

/** Original conceptual architecture; no dimension is inferred from listing data. */
export function createAtelierModels({ world, resources, buildings, colorFrame, document }) {
  const own = value => { resources.add(value); return value; };
  const material = (color, extra = {}) => own(new THREE.MeshStandardMaterial({ color, roughness: .72, ...extra }));
  const limestone = material('#e8e7de');
  const porcelain = material('#f5f3eb', { roughness: .54 });
  const plaster = material('#d1d9ce');
  const interior = material('#5f7068', { roughness: .86 });
  const bronze = material('#867963', { roughness: .33, metalness: .72 });
  const timber = material('#aa9272', { roughness: .84 });
  const foliage = material('#496b50', { roughness: .92 });
  const foliageLight = material('#76906b', { roughness: .94 });
  const soil = material('#576451', { roughness: 1 });
  const glass = own(new THREE.MeshPhysicalMaterial({
    color: '#447064', roughness: .18, metalness: 0, clearcoat: .9,
    clearcoatRoughness: .12, ior: 1.45, transparent: true, opacity: .76,
    depthWrite: false, envMapIntensity: 1.15,
  }));
  const unit = own(new THREE.BoxGeometry(1, 1, 1));
  const leaf = own(new THREE.IcosahedronGeometry(1, 1));
  const rounded = new Map();
  const objects = [];
  const geometry = (w, h, d, radius) => {
    const key = [w, h, d, radius].join(':');
    if (!rounded.has(key)) rounded.set(key, own(new RoundedBoxGeometry(w, h, d, 2, radius)));
    return rounded.get(key);
  };
  const markerMaterial = (letter, color) => {
    const label = document.createElement('canvas'); label.width = label.height = 128;
    const ctx = label.getContext('2d');
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(64, 64, 54, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '500 60px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, 64, 67);
    const texture = own(new THREE.CanvasTexture(label)); texture.colorSpace = THREE.SRGBColorSpace;
    return own(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, transparent: true, toneMapped: false }));
  };

  for (const [index, id] of ['a', 'b', 'c', 'k', 'v', 'x'].entries()) {
    const building = buildings.find(item => item.id === id); if (!building) continue;
    const initial = colorFrame(building), facade = material(initial.color, { roughness: .62 });
    const group = new THREE.Group(); group.name = 'courtyard-residence'; world.add(group);
    const batches = new Map();
    const box = (x, y, z, w, h, d, mat, radius = 0) => {
      if (radius) {
        const mesh = new THREE.Mesh(geometry(w, h, d, radius), mat);
        mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
        return mesh;
      }
      if (!batches.has(mat)) batches.set(mat, []);
      batches.get(mat).push([x, y, z, w, h, d]);
    };
    const plant = (x, y, z, w, h, d, mat = foliage) => {
      const mesh = new THREE.Mesh(leaf, mat); mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
      mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
    };

    // A single thin ground plane supports the architecture; no analysis plates.
    box(0, .026, 0, 1.66, .052, 1.40, limestone, .015);
    box(-.12, .060, .16, .39, .014, .91, plaster);
    for (const z of [-.16, .02, .20, .38, .56]) box(-.12, .071, z, .32, .012, .15, porcelain);

    // Low west wing, a shaded entrance, and a bridge leave an actual open courtyard.
    box(-.59, .35, -.04, .28, .57, .98, limestone, .013);
    box(-.52, .092, -.03, .44, .060, 1.04, porcelain, .010);
    box(-.52, .66, -.03, .45, .055, 1.04, porcelain, .010);
    box(-.52, .36, .458, .28, .47, .018, glass);
    box(-.438, .35, -.03, .018, .44, .84, glass);
    for (const x of [-.665, -.53, -.395]) box(x, .36, .483, .018, .49, .035, bronze);
    for (const z of [-.36, -.11, .14, .39]) box(-.423, .35, z, .031, .49, .016, bronze);
    box(-.22, .73, -.43, .64, .26, .30, limestone, .010);
    box(-.22, .865, -.43, .67, .035, .34, porcelain, .008);
    box(-.22, .737, -.269, .47, .135, .016, glass);
    for (const x of [-.40, -.22, -.04]) box(x, .737, -.255, .014, .15, .025, bronze);

    // Two open loggias set deep glazing behind the load-bearing facade rhythm.
    const body = box(.38, .445, -.40, .56, .74, .27, facade, .012);
    body.userData.buildingId = id;
    box(.38, .098, -.02, .68, .065, 1.05, porcelain, .012);
    box(.38, .445, .01, .71, .045, 1.13, porcelain, .010);
    box(.38, .800, -.01, .72, .050, 1.11, porcelain, .010);
    box(.38, .265, .287, .51, .285, .018, glass);
    box(.38, .623, .263, .51, .285, .018, glass);
    box(.668, .438, -.04, .018, .66, .68, glass);
    for (const y of [.267, .624]) {
      box(.38, y, .205, .49, .28, .045, interior);
      for (const x of index % 3 === 1 ? [.10, .66] : [.10, .38, .66]) box(x, y, .45, .030, .31, .041, facade);
      for (const x of [.21, .47]) box(x, y, .305, .012, .29, .018, bronze);
      for (const z of [-.29, -.03, .23]) box(.689, y, z, .025, .31, .014, bronze);
      box(.38, y + .148, .32, .56, .018, .27, timber);
    }
    // Fine continuous balcony rails, inset from the stone slab's outer edge.
    box(.39, .639, .548, .64, .014, .014, bronze);
    box(.708, .639, .12, .014, .014, .86, bronze);
    for (const x of [.075, .285, .495, .705]) box(x, .568, .548, .010, .15, .010, bronze);
    for (const z of [-.30, -.02, .26]) box(.708, .568, z, .010, .15, .010, bronze);

    // Set-back pavilion makes the roofline legible without another stacked block.
    const pavilionX = .30 + (index % 3 - 1) * .035;
    box(pavilionX, 1.001, -.353, .58, .34, .36, facade, .012);
    box(pavilionX, .835, -.27, .70, .045, .72, porcelain, .010);
    box(pavilionX, 1.177, -.27, .74, .045, .75, porcelain, .010);
    box(pavilionX, 1.008, -.163, .49, .27, .018, glass);
    box(pavilionX + .299, 1.008, -.31, .018, .27, .33, glass);
    for (const x of [-.23, 0, .23]) box(pavilionX + x, 1.008, -.143, .012, .28, .023, bronze);
    for (const z of [-.45, -.30, -.15]) box(pavilionX + .317, 1.008, z, .025, .28, .012, bronze);
    box(pavilionX, 1.207, -.27, .61, .015, .61, plaster);
    box(pavilionX, .968, .065, .64, .012, .012, bronze);
    for (const x of [-.315, 0, .315]) box(pavilionX + x, .911, .065, .010, .12, .010, bronze);

    // Planters are part of the roof and courtyard rather than floating ornaments.
    box(-.53, .715, -.20, .29, .060, .49, plaster, .009);
    box(-.53, .748, -.20, .25, .010, .45, soil);
    for (const [z, i] of [-.36, -.22, -.07].map((z, i) => [z, i])) {
      plant(-.53, .786, z, .095, .059, .080, i % 2 ? foliageLight : foliage);
    }
    const planterX = index % 2 ? .15 : .51;
    box(planterX, .871, .34, .29, .055, .19, plaster, .008);
    plant(planterX, .922, .34, .122, .062, .072, foliageLight);
    box(-.20, .103, -.33, .18, .09, .19, limestone, .012);
    box(-.20, .201, -.33, .018, .17, .018, timber);
    plant(-.20, .302, -.33, .114, .135, .104);
    // Recessed entry and a short bench give the model an intelligible human scale.
    box(-.17, .076, .641, .36, .035, .13, porcelain, .006);
    box(-.17, .052, .704, .42, .023, .05, limestone, .006);
    box(-.30, .137, .23, .068, .022, .28, timber);
    for (const z of [.13, .33]) box(-.30, .099, z, .036, .065, .025, bronze);

    // Repeated mullions/rails share one draw call per material in each subject.
    const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
    for (const [mat, parts] of batches) {
      const mesh = own(new THREE.InstancedMesh(unit, mat, parts.length));
      parts.forEach(([x, y, z, w, h, d], i) => {
        matrix.compose(new THREE.Vector3(x, y, z), quaternion, new THREE.Vector3(w, h, d)); mesh.setMatrixAt(i, matrix);
      });
      mesh.castShadow = mat !== glass; mesh.receiveShadow = true; group.add(mesh);
    }
    const missingGeometry = own(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 6 }, (_, i) => [new THREE.Vector3(.035 + i * .085, 1.219, -.51), new THREE.Vector3(.13 + i * .085, 1.219, -.05)]).flat()));
    const missingMark = new THREE.LineSegments(missingGeometry, own(new THREE.LineBasicMaterial({ color: '#52675b', transparent: true, opacity: initial.missing * .8 })));
    missingMark.visible = initial.missing > 0; group.add(missingMark);
    const outline = new THREE.Group(); group.add(outline);
    const defaultMarker = markerMaterial(id.toUpperCase(), '#315b4d');
    const savedMarker = markerMaterial(id.toUpperCase(), '#72548e');
    const selectedMarker = markerMaterial(id.toUpperCase(), '#194b3e');
    const marker = new THREE.Sprite(defaultMarker); marker.position.set(.1, 1.42, -.12); marker.scale.set(.3, .3, 1); marker.renderOrder = 3; marker.userData.buildingId = id; group.add(marker);
    objects.push({ id, group, body, material: facade, targetColor: new THREE.Color(initial.color), outline, missingMark, marker, defaultMarker, savedMarker, selectedMarker, atelier: true });
  }
  const shadow = new THREE.Mesh(own(new THREE.PlaneGeometry(24, 24)), own(new THREE.ShadowMaterial({ color: '#284437', opacity: .11 })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.006; shadow.receiveShadow = true; world.add(shadow);
  return objects;
}
