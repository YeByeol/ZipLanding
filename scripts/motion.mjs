const clamp = value => Math.max(0, Math.min(1, value));
const finite = (...values) => values.every(Number.isFinite);

export function sectionProgress(top, height, viewport) {
  if (!finite(top, height, viewport) || height < 0 || viewport <= 0) return 0;
  return clamp((viewport - top) / (viewport + height));
}

export function readingProgress(scrollY, scrollHeight, viewport) {
  if (!finite(scrollY, scrollHeight, viewport) || viewport <= 0 || scrollHeight <= viewport) return 0;
  return clamp(scrollY / (scrollHeight - viewport));
}

export function mountMotion({ scenes = [], header, progress, onUpdate }) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const previous = new Map();
  const navigation = [...(header?.querySelectorAll('nav a[href^="#"]') ?? [])]
    .map(link => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
    .filter(item => item.section);
  const hadReadyClass = document.body.classList.contains('motion-ready');
  let destroyed = false;
  let frame = null;
  let reduced = preference.matches;

  document.body.classList.add('motion-ready');
  progress?.setAttribute('role', 'progressbar');
  progress?.setAttribute('aria-valuemin', '0');
  progress?.setAttribute('aria-valuemax', '100');
  if (progress && !progress.hasAttribute('aria-label')) progress.setAttribute('aria-label', '페이지 읽기 진행률');

  function update() {
    frame = null;
    if (destroyed || document.hidden) return;
    const viewport = window.innerHeight;
    header?.classList.toggle('is-scrolled', window.scrollY > 16);
    let active = navigation[0];
    for (const item of navigation) if (item.section.getBoundingClientRect().top <= viewport * 0.35) active = item;
    for (const item of navigation) {
      if (item === active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    }
    const amount = readingProgress(window.scrollY, document.documentElement.scrollHeight, viewport);
    if (progress) {
      progress.style.transform = `scaleX(${amount})`;
      progress.setAttribute('aria-valuenow', String(Math.round(amount * 100)));
    }
    onUpdate?.({ reduced });
    if (reduced) return;
    for (const { element, owner } of scenes) {
      const rect = element.getBoundingClientRect();
      const value = sectionProgress(rect.top, rect.height, viewport);
      const last = previous.get(element);
      if (last === undefined || Math.abs(last - value) >= 0.002) {
        previous.set(element, value);
        owner.setProgress(value);
      }
    }
  }

  function schedule() {
    if (!destroyed && !document.hidden && frame === null) frame = window.requestAnimationFrame(update);
  }

  function preferenceChanged() {
    reduced = preference.matches;
    previous.clear();
    schedule();
  }

  function visibilityChanged() {
    if (document.hidden) {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
    } else schedule();
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', visibilityChanged);
  preference.addEventListener('change', preferenceChanged);
  document.fonts?.addEventListener('loadingdone', schedule);
  document.fonts?.ready.then(schedule);
  schedule();

  return {
    destroy() {
      destroyed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pageshow', schedule);
      document.removeEventListener('visibilitychange', visibilityChanged);
      preference.removeEventListener('change', preferenceChanged);
      document.fonts?.removeEventListener('loadingdone', schedule);
      if (!hadReadyClass) document.body.classList.remove('motion-ready');
    },
  };
}
