const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => value * value * value * (value * (value * 6 - 15) + 10);

export function tourFrame(position, count, reduced = false) {
  const value = Math.max(0, Math.min(count - 1, Number.isFinite(position) ? position : 0));
  const index = Math.min(count - 1, Math.floor(value + .22));
  return {
    index,
    baseOpacity: 1, scale: reduced ? 1 : 1 + .012 * Math.sin(value * Math.PI),
  };
}

export function mountProductTour(root, reveals = []) {
  if (!root) return { update() {}, destroy() {} };
  const steps = [...root.querySelectorAll('[data-tour-step]')];
  const frames = [...root.querySelectorAll('[data-tour-frame]')];
  const links = [...root.querySelectorAll('[data-tour-link]')];
  const viewport = root.ownerDocument.defaultView;
  root.dataset.tourEnhanced = 'true';
  let destroyed = false;
  let active = -1, previous = -1;
  return {
    update({ reduced = false } = {}) {
      if (destroyed) return;
      // Read geometry together, then paint. The landing's existing scheduler owns this update.
      const rects = steps.map(step => step.getBoundingClientRect());
      const revealRects = reveals.map(element => element.getBoundingClientRect());
      const line = viewport.innerHeight * .43;
      let position = 0;
      rects.forEach((rect, index) => {
        if (rect.top <= line) position = index + clamp((line - rect.top) / Math.max(1, rect.height));
      });
      const state = tourFrame(position, frames.length, reduced);
      if (state.index !== active) { previous = active; active = state.index; }
      root.style.setProperty('--tour-scale', state.scale);
      root.dataset.tourActive = steps[active]?.dataset.tourStep ?? '';
      frames.forEach((frame, index) => {
        // Finish the short entrance in time, even if scrolling stops. Keep an opaque
        // previous frame underneath so UI never remains double-exposed or flashes white.
        frame.style.opacity = '1';
        frame.style.zIndex = index === active ? '3' : index === previous ? '2' : '1';
        frame.classList.toggle('is-tour-entering', index === active && previous >= 0 && !reduced);
        frame.inert = index !== active;
        frame.setAttribute('aria-hidden', String(index !== active));
      });
      links.forEach((link, index) => {
        if (index === active) link.setAttribute('aria-current', 'step');
        else link.removeAttribute('aria-current');
      });
      reveals.forEach((element, index) => {
        const amount = reduced ? 1 : ease(clamp((viewport.innerHeight * .94 - revealRects[index].top) / (viewport.innerHeight * .3)));
        element.style.setProperty('--reveal', amount);
      });
    },
    destroy() {
      destroyed = true;
      delete root.dataset.tourEnhanced;
      delete root.dataset.tourActive;
      root.style.removeProperty('--tour-scale');
      frames.forEach(frame => { frame.style.removeProperty('opacity'); frame.style.removeProperty('z-index'); frame.classList.remove('is-tour-entering'); frame.inert = false; frame.removeAttribute('aria-hidden'); });
      links.forEach(link => link.removeAttribute('aria-current'));
      reveals.forEach(element => element.style.removeProperty('--reveal'));
    },
  };
}
