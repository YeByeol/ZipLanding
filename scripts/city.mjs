import { BUILDINGS, scoreBuilding, monthlyUnit, comparisonFor } from './demo.mjs';

const INK = '#132d29';
export const PALETTES = {
  price: ['#dff1ec', '#a3d6cb', '#5cb3a4', '#1f877a', '#0a554d'],
  score: ['#efe9f5', '#cbb9e2', '#a084c9', '#6f4ea8', '#432374'],
  value: ['#2166ac', '#8fc0de', '#ececec', '#f4b183', '#c55a11'],
  terrain: ['#eeebe4', '#e9e1cd', '#e0d0a9', '#d2b781', '#bb955a'],
};
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const point = (x, y, z = 0) => [416 + (x - y) * 62, 89 + (x + y) * 31 - z];
const xy = coordinates => coordinates.map(value => Number(value.toFixed(2))).join(',');
const polygon = (points, attrs = '') => `<polygon points="${points.map(xy).join(' ')}" ${attrs}/>`;
const plane = (x, y, w, d, z = 0, attrs = '') => polygon([point(x, y, z), point(x + w, y, z), point(x + w, y + d, z), point(x, y + d, z)], attrs);
const line = (a, b, attrs = '') => `<path d="M${xy(a)}L${xy(b)}" fill="none" ${attrs}/>`;
const shade = (hex, amount) => `#${hex.slice(1).match(/../g).map(part => Math.max(0, Math.min(255, Math.round(parseInt(part, 16) * amount))).toString(16).padStart(2, '0')).join('')}`;
const score = (building, weights) => {
  const result = scoreBuilding(building, weights);
  return typeof result === 'number' ? result : result.score;
};
function colorFor(building, buildings, mode, weights) {
  if (mode === 'terrain') return Number.isFinite(building.slope) ? PALETTES.terrain[Math.min(4, Math.floor(building.slope / 2))] : '#d9d6cf';
  if (mode === 'score') {
    const value = score(building, weights);
    return Number.isFinite(value) ? PALETTES.score[Math.min(4, Math.floor(value / 20))] : '#d9d6cf';
  }
  if (mode === 'value') {
    const comparison = comparisonFor(building, weights);
    if (!Number.isFinite(comparison.percent)) return '#d9d6cf';
    const value = comparison.percent;
    return PALETTES.value[value < -20 ? 0 : value < -5 ? 1 : value <= 5 ? 2 : value <= 20 ? 3 : 4];
  }
  const sorted = buildings.map(monthlyUnit).sort((a, b) => a - b);
  const position = sorted.findIndex(value => value >= monthlyUnit(building));
  return PALETTES.price[Math.min(4, Math.floor(position / sorted.length * 5))];
}

function tree(x, y, size = 1) {
  const [cx, cy] = point(x, y);
  return `<g><ellipse cx="${cx}" cy="${cy + 1}" rx="${10 * size}" ry="${5 * size}" fill="#c2d8c8"/>${line([cx, cy], [cx, cy - 15 * size], 'stroke="#64816d" stroke-width="2"')}<path d="M${cx},${cy - 38 * size} C${cx - 17 * size},${cy - 28 * size} ${cx - 15 * size},${cy - 11 * size} ${cx},${cy - 10 * size} C${cx + 16 * size},${cy - 9 * size} ${cx + 17 * size},${cy - 28 * size} ${cx},${cy - 38 * size}Z" fill="#89ae93"/><path d="M${cx},${cy - 33 * size}L${cx},${cy - 13 * size}" stroke="#b6cfb6" stroke-width="1"/></g>`;
}
function landscape(mode) {
  const terrain = mode === 'terrain';
  const corners = [[-.65, -.65], [7.75, -.65], [7.75, 5.5], [-.65, 5.5]];
  const top = corners.map(([x, y]) => point(x, y));
  const bottom = corners.map(([x, y]) => point(x, y, -19));
  let svg = `<g class="city-ground">${polygon([top[1], top[2], bottom[2], bottom[1]], 'fill="#c2d2c9"')}${polygon([top[2], top[3], bottom[3], bottom[2]], 'fill="#d3dfd7"')}${polygon(top, `fill="${terrain ? '#e9e1cd' : '#e7efeb'}"`)}${plane(-.44, -.44, 7.99, 5.72, 1, 'fill="none" stroke="#c4d4cb" stroke-width=".8"')}`;
  // The model uses invented streets and plots, never real cadastral geometry.
  for (const y of [1.03, 2.28, 3.53, 4.72]) svg += plane(-.55, y, 7.5, .23, 1, 'fill="#f6f7f4"');
  for (const x of [1.03, 2.18, 3.33, 4.48, 5.63]) svg += plane(x, -.55, .22, 5.75, 1, 'fill="#f6f7f4"');
  svg += plane(-.52, -.5, .23, 5.7, 1, 'fill="#f6f7f4"');
  svg += plane(-.52, -.5, 7.45, .23, 1, 'fill="#f6f7f4"');
  // Short crossing stripes help the streets read at small display sizes.
  for (const x of [1.06, 3.36, 5.66]) for (let i = 0; i < 4; i++) svg += plane(x + i * .041, 2.2, .022, .35, 2, 'fill="#c8d7ce"');
  for (const y of [.4, 1.85, 3.15, 4.5]) svg += line(point(-.405, y, 2), point(-.405, y + .28, 2), 'stroke="#cbd8d1" stroke-width="1.2"');
  // Terraced hillside is built from solid geometry, with no lighting filters.
  svg += '<g transform="translate(43.4 21.7)">';
  svg += plane(6.0, -.22, .88, 4.82, 2, `fill="${terrain ? '#d2b781' : '#d2dfcb'}"`);
  const terraces = [
    [[6.22, -.1], [6.72, .12], [6.84, 1.5], [6.73, 3.1], [6.18, 4.37], [6.08, 2.9]],
    [[6.34, .18], [6.69, .58], [6.72, 1.7], [6.52, 3.48], [6.28, 3.96], [6.26, 1.4]],
    [[6.47, .65], [6.64, 1.0], [6.57, 2.55], [6.42, 3.16], [6.36, 2.13]],
  ];
  terraces.forEach((terrace, index) => { svg += polygon(terrace.map(([x, y]) => point(x, y, 7 + index * 6)), `fill="${terrain ? ['#e0d0a9', '#d2b781', '#bb955a'][index] : ['#c4d6bc', '#b7cdae', '#a6bf9f'][index]}" stroke="${terrain ? '#c2a36b' : '#aec4a6'}" stroke-width=".7"`); });
  svg += `<path d="M${xy(point(6.09, 4.3, 5))} Q${xy(point(6.95, 2.95, 11))} ${xy(point(6.29, 1.65, 13))}T${xy(point(6.44, .1, 5))}" fill="none" stroke="#f6f7f4" stroke-width="4"/>`;
  svg += '</g>';
  svg += plane(.02, 5.01, 5.65, .28, 2, 'fill="#d2dfcb"');
  svg += line(point(.06, 5.14, 3), point(5.6, 5.14, 3), 'stroke="#f6f7f4" stroke-width="4"');
  for (const [x, y, size] of [[.22, 5.25, .85], [1.14, 5.22, .7], [2.45, 5.28, .8], [3.52, 5.19, .7], [4.68, 5.25, .9], [7.1, .42, .75], [7.33, 1.7, .8], [7.13, 3.08, .85], [6.85, 4.3, .65], [-.12, .12, .7], [-.12, 3.16, .8]]) svg += tree(x, y, size);
  for (const x of [1.7, 3.02, 4.12]) svg += plane(x, 5.02, .22, .08, 6, 'fill="#8c9c80"');
  return `${svg}</g>`;
}

function buildingSVG(building, index, color, options = {}) {
  const x = options.x ?? building.x * 1.15;
  const y = options.y ?? building.y * 1.25;
  const w = building.w, d = building.d, h = building.height;
  const p = (a, b, z) => point(x + a, y + b, z);
  const top = [p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)];
  const bottom = [p(0, 0, 2), p(w, 0, 2), p(w, d, 2), p(0, d, 2)];
  const id = esc(building.id);
  let svg = `<g data-building-id="${id}" class="city-building" style="cursor:${options.interactive ? 'pointer' : 'default'}">${plane(x - .055, y - .055, w + .11, d + .11, 2, 'fill="#d2ded6" stroke="#c6d5cb" stroke-width=".6"')}${polygon([top[1], top[2], bottom[2], bottom[1]], `class="building-side" fill="${shade(color, .7)}"`)}${polygon([top[2], top[3], bottom[3], bottom[2]], `class="building-front" fill="${shade(color, .87)}"`)}${polygon(top, `class="building-roof" fill="${color}" stroke="${shade(color, .76)}" stroke-width=".7"`)}`;
  const floors = Math.max(2, Math.floor(h / 10));
  const cols = Math.max(2, Math.floor(w * 5));
  const rows = Math.max(2, Math.floor(d * 5));
  for (let row = 0; row < floors; row++) {
    const z = 8 + row * (h - 11) / floors;
    for (let col = 0; col < cols; col++) {
      const a = .08 + col * (w - .14) / cols;
      svg += polygon([p(a, d + .002, z), p(a + .072, d + .002, z), p(a + .072, d + .002, z + 3.8), p(a, d + .002, z + 3.8)], 'fill="#f3f6ef" fill-opacity=".7"');
    }
    for (let col = 0; col < rows; col++) {
      const b = .08 + col * (d - .14) / rows;
      svg += polygon([p(w + .002, b, z), p(w + .002, b + .064, z), p(w + .002, b + .064, z + 3.8), p(w + .002, b, z + 3.8)], 'fill="#dfebe5" fill-opacity=".55"');
    }
  }
  // Roof parapets, a service core and a skylight distinguish the buildings.
  svg += polygon([p(.045, .045, h + 1), p(w - .045, .045, h + 1), p(w - .045, d - .045, h + 1), p(.045, d - .045, h + 1)], 'fill="none" stroke="#f5f8f2" stroke-opacity=".65" stroke-width=".8"');
  const coreW = w * .28, coreD = d * .28;
  svg += plane(x + .09, y + .09, coreW, coreD, h + 4, `class="building-core-roof" fill="${shade(color, 1.08)}" stroke="${shade(color, .78)}" stroke-width=".6"`);
  svg += polygon([p(.09 + coreW, .09, h + 4), p(.09 + coreW, .09 + coreD, h + 4), p(.09 + coreW, .09 + coreD, h), p(.09 + coreW, .09, h)], `class="building-core-side" fill="${shade(color, .64)}"`);
  if (index % 3 !== 1) svg += plane(x + w * .57, y + d * .48, w * .23, d * .26, h + 1, 'fill="#55776f" stroke="#d9e8e1" stroke-width=".8"');
  if (index % 4 === 0) svg += line(p(.16, d * .68, h + 2), p(w * .42, d * .68, h + 2), 'stroke="#e7f0e9" stroke-width="2"');
  svg += `<g class="building-missing" style="display:${color === '#d9d6cf' ? '' : 'none'}">${[.3,.55,.8].map(t => line(p(w*t, 0, h+2), p(0,d*t,h+2), 'stroke="#8c928b" stroke-width="1"')).join('')}</g>`;
  svg += polygon([p(0, 0, h + .8), p(w, 0, h + .8), p(w, d, h + .8), p(0, d, h + .8)], `class="building-outline" fill="none" stroke="${INK}" stroke-width="2" style="display:none"`);
  const anchor = p(w / 2, d / 2, h + 24);
  svg += `<g class="building-marker" style="display:none" transform="translate(${anchor[0]} ${anchor[1]})"><path d="M0 12V23" stroke="${INK}" stroke-width="1.5"/><circle r="12" fill="${INK}"/><text text-anchor="middle" y="4" fill="#f6f7f4" font-family="Arial,sans-serif" font-weight="700" font-size="12">${esc(building.id.toUpperCase())}</text></g></g>`;
  return svg;
}

/** A static and browser renderer share this one invented neighborhood. */
export function citySVG({ buildings = BUILDINGS, mode = 'price', weights, selected = 'a', saved = ['a', 'b', 'c'], scene, interactive = false } = {}) {
  const compare = scene === 'compare';
  let content;
  if (compare) {
    const chosen = saved.map(id => buildings.find(building => building.id === id)).filter(Boolean).slice(0, 3);
    content = plane(.2, 1.1, 6.9, 1.8, -6, 'fill="#e7efeb"');
    content += chosen.map((building, index) => buildingSVG(building, index, colorFor(building, buildings, mode, weights), { x: .7 + index * 2.1, y: 1.6, interactive })).join('');
  } else {
    content = landscape(mode);
    content += [...buildings].sort((a, b) => (a.x * 1.15 + a.y * 1.25) - (b.x * 1.15 + b.y * 1.25)).map((building, index) => buildingSVG(building, index, colorFor(building, buildings, mode, weights), { interactive })).join('');
  }
  // Markers also survive no-JS: static exports carry the same selected places.
  content = content.replace(/<g data-building-id="([^"]+)"[\s\S]*?(?=<g data-building-id=|$)/g, (group, id) => {
    const savedIndex = saved.indexOf(id);
    if (id === selected) group = group.replace('class="building-outline" fill="none" stroke="#132d29" stroke-width="2" style="display:none"', 'class="building-outline" fill="none" stroke="#132d29" stroke-width="2"');
    if (savedIndex !== -1 || id === selected) {
      group = group.replace('class="building-marker" style="display:none"', 'class="building-marker"');
    }
    return group;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${compare ? '280 90 510 390' : scene === 'detail' ? '240 40 680 425' : '0 0 960 550'}" aria-hidden="true" focusable="false" class="city-svg" data-city-mode="${esc(mode)}"><title>ZIP 설명용 가상 도시 모형</title>${content}</svg>`;
}

export function mountCity(container, { buildings = BUILDINGS, onSelect, interactive = false } = {}) {
  if (!container || typeof container.querySelector !== 'function') throw new TypeError('A city container is required.');
  let state = { mode: 'price', weights: undefined, selected: 'a', saved: ['a', 'b', 'c'] };
  container.innerHTML = citySVG({ buildings, interactive, ...state });
  const svg = container.querySelector('svg');
  const nodes = [...svg.querySelectorAll('[data-building-id]')].map(node => ({ node, building: buildings.find(item => item.id === node.dataset.buildingId) }));
  const select = event => {
    const node = event.target.closest?.('[data-building-id]');
    if (node && svg.contains(node)) onSelect?.(node.dataset.buildingId);
  };
  if (interactive) svg.addEventListener('click', select);
  return {
    update(next = {}) {
      state = { ...state, ...next };
      svg.dataset.cityMode = state.mode;
      for (const { node, building } of nodes) {
        const color = colorFor(building, buildings, state.mode, state.weights);
        node.querySelector('.building-roof').setAttribute('fill', color);
        node.querySelector('.building-roof').setAttribute('stroke', shade(color, .76));
        node.querySelector('.building-front').setAttribute('fill', shade(color, .87));
        node.querySelector('.building-side').setAttribute('fill', shade(color, .7));
        node.querySelector('.building-core-roof').setAttribute('fill', shade(color, 1.08));
        node.querySelector('.building-core-roof').setAttribute('stroke', shade(color, .78));
        node.querySelector('.building-core-side').setAttribute('fill', shade(color, .64));
        node.querySelector('.building-missing').style.display = color === '#d9d6cf' ? '' : 'none';
        const selected = building.id === state.selected;
        const index = state.saved.indexOf(building.id);
        node.classList.toggle('is-selected', selected);
        node.classList.toggle('is-saved', index !== -1);
        node.querySelector('.building-outline').style.display = selected ? '' : 'none';
        const marker = node.querySelector('.building-marker');
        marker.style.display = index !== -1 || selected ? '' : 'none';
        marker.querySelector('text').textContent = building.id.toUpperCase();
      }
    },
    destroy() {
      if (interactive) svg.removeEventListener('click', select);
      svg.remove();
    },
  };
}
