export const DEFAULT_VIEW = Object.freeze({ yaw: .72, pitch: .68 });
export const clampProgress = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
export const clampZoom = value => Number.isFinite(value) ? Math.max(.75, Math.min(1.6, value)) : 1;

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
