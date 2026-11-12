export const DEFAULT_VIEW = Object.freeze({ yaw: .72, pitch: .68 });
export const clampProgress = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
export const clampZoom = value => Number.isFinite(value) ? Math.max(.75, Math.min(1.6, value)) : 1;

export const buildingPosition = building => ({
  x: (building.x - 2.5) * 1.13 + (building.x > 2 ? .15 : -.15),
  z: (building.y - 1.5) * 1.17 + (building.y > 1 ? .16 : -.16),
});

export function cameraPreset(name, building) {
  const target = { x: 0, y: .28, z: 0 };
  if (name === 'overview') return { view: { ...DEFAULT_VIEW }, zoom: 1, target };
  if (name === 'plan') return { view: { yaw: .12, pitch: 1.08 }, zoom: 1, target };
  if (name === 'focus' && building) return {
    view: { yaw: DEFAULT_VIEW.yaw, pitch: .78 }, zoom: 1.5,
    target: { ...buildingPosition(building), y: building.height / 78 + .1 },
  };
  return null;
}

export function clampView({ yaw = DEFAULT_VIEW.yaw, pitch = DEFAULT_VIEW.pitch } = {}) {
  return {
    yaw: Number.isFinite(yaw) ? yaw : DEFAULT_VIEW.yaw,
    pitch: Number.isFinite(pitch) ? Math.max(.38, Math.min(1.12, pitch)) : DEFAULT_VIEW.pitch,
  };
}

export function viewForProgress(progress, current = DEFAULT_VIEW, { manual = false, reducedMotion = false } = {}) {
  if (manual || reducedMotion) return { ...current };
  const p = clampProgress(progress);
  return { yaw: DEFAULT_VIEW.yaw + (p - .5) * .28, pitch: DEFAULT_VIEW.pitch + (p - .5) * .12 };
}

export const isClick = (dx, dy) => Math.hypot(dx, dy) < 6;

export function dragIntent(dx, dy, pointerType = 'mouse') {
  if (isClick(dx, dy)) return 'pending';
  if (pointerType !== 'touch') return 'rotate';
  if (Math.abs(dy) > Math.abs(dx) * 1.25) return 'scroll';
  if (Math.abs(dx) > Math.abs(dy) * 1.25) return 'rotate';
  return 'pending';
}
