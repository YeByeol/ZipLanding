import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/version-styles.mjs', import.meta.url));
const styles = ['styles.css', 'styles/film.css', 'styles/demo-polish.css'];
const markup = styles.map(path => `<link rel="stylesheet" href="./${path}">`).join('\n');

test('a CSS-only release bypasses a cached old URL without changing unchanged assets', t => {
  const root = mkdtempSync(join(tmpdir(), 'zip-styles-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'dist/styles'), { recursive: true });
  for (const path of styles) writeFileSync(join(root, 'dist', path), 'body{color:green}');
  const build = () => {
    writeFileSync(join(root, 'dist/index.html'), markup);
    execFileSync(process.execPath, [script], { cwd: root });
    return [...readFileSync(join(root, 'dist/index.html'), 'utf8').matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  };
  const before = build();
  assert.deepEqual(build(), before);
  writeFileSync(join(root, 'dist/styles/film.css'), '.story-copy{background:transparent}');
  const after = build();
  assert.notEqual(after[1], before[1]);
  assert.equal(after[0], before[0]);
  assert.equal(after[2], before[2]);
  for (let index = 0; index < styles.length; index++) {
    const bytes = readFileSync(join(root, 'dist', styles[index]));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    assert.equal(after[index], `./${styles[index]}?v=${hash}`);
  }
});

test('a missing stylesheet reference fails the deployment instead of publishing a partial fix', t => {
  const root = mkdtempSync(join(tmpdir(), 'zip-styles-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'dist/styles'), { recursive: true });
  for (const path of styles) writeFileSync(join(root, 'dist', path), '');
  writeFileSync(join(root, 'dist/index.html'), markup.replace('href="./styles/film.css"', ''));
  assert.throws(() => execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' }));
});
