import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionProgress, readingProgress } from '../scripts/motion.mjs';

test('section progress follows the entire viewport crossing and clamps its ends', () => {
  assert.equal(sectionProgress(800, 400, 800), 0);
  assert.equal(sectionProgress(200, 400, 800), 0.5);
  assert.equal(sectionProgress(-400, 400, 800), 1);
  assert.equal(sectionProgress(1200, 400, 800), 0);
  assert.equal(sectionProgress(-800, 400, 800), 1);
  assert.equal(sectionProgress(0, 0, 800), 1);
});

test('reading progress clamps to the readable scroll distance', () => {
  assert.equal(readingProgress(0, 2400, 800), 0);
  assert.equal(readingProgress(800, 2400, 800), 0.5);
  assert.equal(readingProgress(1600, 2400, 800), 1);
  assert.equal(readingProgress(-50, 2400, 800), 0);
  assert.equal(readingProgress(2000, 2400, 800), 1);
  assert.equal(readingProgress(0, 800, 800), 0);
  assert.equal(readingProgress(20, 0, 800), 0);
});

test('invalid geometry always returns a finite, bounded fallback', () => {
  for (const invalid of [NaN, Infinity, -Infinity, undefined]) {
    assert.equal(sectionProgress(invalid, 400, 800), 0);
    assert.equal(sectionProgress(0, invalid, 800), 0);
    assert.equal(sectionProgress(0, 400, invalid), 0);
    assert.equal(readingProgress(invalid, 2400, 800), 0);
    assert.equal(readingProgress(0, invalid, 800), 0);
    assert.equal(readingProgress(0, 2400, invalid), 0);
  }
  assert.equal(sectionProgress(0, 400, 0), 0);
  assert.equal(sectionProgress(0, -1, 800), 0);
  assert.equal(readingProgress(0, 2400, 0), 0);
});

test('motion batches events, stays idle, honors reduced motion and cleans up', async () => {
  const { mountMotion } = await import('../scripts/motion.mjs');
  const original = { window: globalThis.window, document: globalThis.document, IntersectionObserver: globalThis.IntersectionObserver };
  const frames = new Map();
  const classes = new Set();
  const classList = {
    contains: key => classes.has(key),
    add: key => classes.add(key),
    remove: key => classes.delete(key),
    toggle: (key, on) => on ? classes.add(key) : classes.delete(key),
  };
  const attributes = new Map();
  const progress = { style: {}, setAttribute: (key, value) => attributes.set(key, value), hasAttribute: key => attributes.has(key) };
  const preference = Object.assign(new EventTarget(), { matches: false });
  const window = Object.assign(new EventTarget(), {
    innerHeight: 800, scrollY: 0,
    matchMedia: () => preference,
    requestAnimationFrame: callback => { const id = nextFrame++; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  let nextFrame = 1;
  let top = 800;
  let cancellations = 0;
  let revealCallback;
  let disconnected = false;
  const target = {
    tagName: 'H2', closest: () => null, parentElement: null,
    animate: () => ({ finished: new Promise(() => {}), cancel: () => cancellations++ }),
  };
  const document = Object.assign(new EventTarget(), {
    body: { classList }, hidden: false,
    documentElement: { scrollHeight: 2400 },
    getElementById: () => null,
    querySelectorAll: () => [target],
  });
  globalThis.window = window;
  globalThis.document = document;
  globalThis.IntersectionObserver = class {
    constructor(callback) { revealCallback = callback; }
    observe() {}
    unobserve() {}
    disconnect() { disconnected = true; }
  };
  const calls = [];
  const updates = [];
  const element = { getBoundingClientRect: () => ({ top, height: 400 }) };
  let motion;
  const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); };
  try {
    motion = mountMotion({ scenes: [{ element, owner: { setProgress: value => calls.push(value) } }], progress, onUpdate: value => updates.push(value) });
    assert.equal(frames.size, 1);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    assert.equal(frames.size, 1, 'scroll and resize share a pending frame');
    flush();
    assert.deepEqual(calls, [0]);
    assert.equal(frames.size, 0, 'no frame remains while idle');
    assert.equal(attributes.get('aria-valuenow'), '0');
    top = 799;
    window.dispatchEvent(new Event('scroll'));
    flush();
    assert.equal(calls.length, 1, 'sub-epsilon geometry changes are suppressed');
    top = 200;
    window.scrollY = 800;
    window.dispatchEvent(new Event('scroll'));
    flush();
    assert.deepEqual(calls, [0, 0.5]);
    assert.equal(progress.style.transform, 'scaleX(0.5)');
    assert.equal(attributes.get('aria-valuenow'), '50');
    assert.equal(revealCallback, undefined, 'generic section reveals are removed');
    preference.matches = true;
    preference.dispatchEvent(new Event('change'));
    assert.equal(cancellations, 0, 'reading the page never creates an entrance animation');
    assert.equal(disconnected, false);
    top = -400;
    flush();
    assert.equal(calls.length, 2, 'reduced motion does not move scene cameras');
    assert.deepEqual(updates.at(-1), { reduced: true }, 'information callback runs before the reduced-motion camera return');
    assert.equal(updates.length, 4, 'one information update per batched frame');
    window.dispatchEvent(new Event('scroll'));
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(frames.size, 0, 'hiding the document cancels pending frames');
    window.dispatchEvent(new Event('scroll'));
    assert.equal(frames.size, 0);
    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(frames.size, 1);
    motion.destroy();
    assert.equal(frames.size, 0);
    window.dispatchEvent(new Event('scroll'));
    preference.dispatchEvent(new Event('change'));
    assert.equal(frames.size, 0, 'destroy removes event subscriptions');
    assert.equal(classes.has('motion-ready'), false);
  } finally {
    motion?.destroy();
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
