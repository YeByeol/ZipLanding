import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const script = fileURLToPath(new URL('../scripts/version-styles.mjs', import.meta.url));
const styles = ['styles.css', 'styles/film.css', 'styles/demo-polish.css'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 16);
const markup = `<link rel="canonical" href="https://example.com/ZipLanding/">
${styles.map(path => `<link rel="stylesheet" href="./${path}">`).join('\n')}
<script type="module" src="./scripts/main.mjs"></script>
<link rel="modulepreload" href="./vendor/engine.mjs">
<link rel="preload" as="font" href="./assets/font.woff2">
<img src="./assets/hero.webp" srcset="./assets/hero.webp 1x, ./assets/hero@2x.webp 2x">
<meta property="og:image" content="https://example.com/ZipLanding/assets/hero.webp">
<img src="https://other.example/assets/hero.webp"><a href="#experience">Try</a>`;

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'zip-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (path, text) => {
    mkdirSync(dirname(join(root, 'dist', path)), { recursive: true });
    writeFileSync(join(root, 'dist', path), text);
  };
  for (const path of styles) write(path, 'body{color:green}');
  write('styles.css', "@font-face{src:url('./assets/font.woff2')}body{color:green}");
  write('styles/film.css', ".film{background:url('../assets/hero.webp')}");
  write('scripts/main.mjs', `export {answer} from './nested/helper.mjs';
export const image = new URL('../assets/hero.webp', import.meta.url);
export const lazy = () => import('../vendor/engine.mjs');`);
  write('scripts/nested/helper.mjs', 'export const answer = 42;');
  write('vendor/engine.mjs', "export {engine} from './engine-core.mjs';");
  write('vendor/engine-core.mjs', 'export const engine = "local";');
  for (const path of ['assets/font.woff2', 'assets/hero.webp', 'assets/hero@2x.webp']) write(path, path);
  const build = (input = markup) => {
    write('index.html', input);
    execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' });
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
    return {
      html,
      entry: html.match(/<script type="module" src="([^"]+)"/)[1],
      styles: [...html.matchAll(/rel="stylesheet" href="([^"]+)"/g)].map(match => match[1]),
    };
  };
  return {root,write,build};
}

test('CSS-only releases retain runtime URLs and independently version all three stylesheets', t => {
  const {root,write,build} = fixture(t);
  const before = build();
  assert.deepEqual(build(), before, 'unchanged inputs produce identical published URLs');
  write('styles/film.css', '.story-copy{background:transparent}');
  const after = build();
  assert.equal(after.entry, before.entry);
  assert.notEqual(after.styles[1], before.styles[1]);
  assert.equal(after.styles[0], before.styles[0]);
  assert.equal(after.styles[2], before.styles[2]);
  for (let i=0;i<styles.length;i++) {
    assert.equal(after.styles[i], `./${styles[i]}?v=${digest(readFileSync(join(root,'dist',styles[i])))}`);
  }
});

test('a changed transitive module gets a fresh complete runtime, including dynamic imports and module assets', async t => {
  const {root,write,build} = fixture(t);
  const before = build();
  assert.match(before.entry, /^\.\/runtime\/[a-f0-9]{16}\/scripts\/main\.mjs$/);
  const first = await import(pathToFileURL(join(root,'dist',before.entry)).href);
  assert.equal(first.answer,42);
  assert.equal((await first.lazy()).engine,'local');
  assert.equal(readFileSync(first.image,'utf8'),'assets/hero.webp');
  write('scripts/nested/helper.mjs','export const answer = 43;');
  const after = build();
  assert.notEqual(after.entry,before.entry);
  assert.equal((await import(pathToFileURL(join(root,'dist',after.entry)).href)).answer,43);
  const runtime = after.entry.replace('/scripts/main.mjs','');
  assert.ok(after.html.includes(`href="${runtime}/vendor/engine.mjs"`));
  assert.deepEqual(after.styles,before.styles,'JS changes do not invalidate unchanged styles');
  write('vendor/engine-core.mjs','export const engine = "updated";');
  const vendorRelease = build();
  assert.notEqual(vendorRelease.entry,after.entry);
  const updated = await import(pathToFileURL(join(root,'dist',vendorRelease.entry)).href);
  assert.equal((await updated.lazy()).engine,'updated');
});

test('images/fonts are versioned in HTML, srcset, Open Graph and nested CSS; external URLs stay intact', t => {
  const {root,write,build} = fixture(t);
  const before = build();
  const heroHash = digest(Buffer.from('assets/hero.webp'));
  const fontHash = digest(Buffer.from('assets/font.woff2'));
  assert.ok(before.html.includes(`src="./assets/hero.webp?v=${heroHash}"`));
  assert.ok(before.html.includes(`srcset="./assets/hero.webp?v=${heroHash} 1x, ./assets/hero@2x.webp?v=`));
  assert.ok(before.html.includes(`content="https://example.com/ZipLanding/assets/hero.webp?v=${heroHash}"`));
  assert.ok(before.html.includes('src="https://other.example/assets/hero.webp"'));
  assert.ok(before.html.includes('href="#experience"'));
  assert.ok(readFileSync(join(root,'dist/styles.css'),'utf8').includes(`./assets/font.woff2?v=${fontHash}`));
  assert.ok(readFileSync(join(root,'dist/styles/film.css'),'utf8').includes(`../assets/hero.webp?v=${heroHash}`));
  write('assets/hero.webp','new hero');
  const after = build();
  assert.notEqual(after.entry,before.entry,'module-relative asset URLs get a new runtime too');
  assert.notEqual(after.styles[1],before.styles[1]);
  assert.equal(after.styles[0],before.styles[0]);
  assert.ok(after.html.includes(`src="./assets/hero.webp?v=${digest(Buffer.from('new hero'))}"`));
  const query = build(markup+'<img src="./assets/hero.webp?fit=crop#preview">');
  assert.ok(query.html.includes(`src="./assets/hero.webp?fit=crop&v=${digest(Buffer.from('new hero'))}#preview"`));
});

test('missing CSS or module entry references fail before rewriting HTML', t => {
  const {root,build} = fixture(t);
  for (const reference of ['href="./styles/film.css"','src="./scripts/main.mjs"']) {
    const input = markup.replace(reference,'');
    assert.throws(()=>build(input));
    assert.equal(readFileSync(join(root,'dist/index.html'),'utf8'),input);
  }
});

test('a missing local image fails instead of publishing a broken versioned URL', t => {
  const {build} = fixture(t);
  assert.throws(()=>build(markup+'<img src="./assets/missing.webp">'));
});
