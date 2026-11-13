import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const styles = ['styles.css', 'styles/film.css', 'styles/demo-polish.css'];
const runtimeDirectories = ['scripts', 'vendor', 'assets'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 16);
let html = readFileSync('dist/index.html', 'utf8');

// Validate the entrypoints before changing any artifact.
assert.equal(html.split('src="./scripts/main.mjs"').length, 2, 'Expected one local module entrypoint');
for (const path of styles) {
  const reference = `href="./${path}"`;
  assert.equal(html.split(reference).length, 2, `Expected one stylesheet reference: ${path}`);
}

function filesIn(path) {
  return readdirSync(`dist/${path}`, {withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0).flatMap(entry => {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory()) return filesIn(child);
    assert.ok(entry.isFile(), `Unsupported runtime entry: ${child}`);
    return [child];
  });
}
const files = new Map(runtimeDirectories.flatMap(filesIn).map(path=>[path,readFileSync(`dist/${path}`)]));
const runtimeDigest = createHash('sha256');
for (const [path,bytes] of files) runtimeDigest.update(`${path}\0${bytes.length}\0`).update(bytes);
const runtime = `runtime/${runtimeDigest.digest('hex').slice(0,16)}`;
const assets = new Map([...files].filter(([path])=>path.startsWith('assets/')).map(([path,bytes])=>[path,hash(bytes)]));
const canonical = (html.match(/<link\b[^>]*>/g) ?? []).find(tag=>/\brel=["']canonical["']/.test(tag));
const site = new URL(canonical?.match(/\bhref=["']([^"']+)["']/)?.[1] ?? 'https://zip-build.invalid/');

function versionReference(reference, from='index.html') {
  if (!/(?:assets|scripts|vendor)\//.test(reference)) return reference;
  const url = new URL(reference, new URL(from,site));
  if (url.origin!==site.origin || !url.pathname.startsWith(site.pathname)) return reference;
  const path = decodeURIComponent(url.pathname.slice(site.pathname.length));
  if (path.startsWith('assets/')) {
    assert.ok(assets.has(path), `Missing local asset: ${path}`);
    url.searchParams.set('v',assets.get(path));
    return reference.split(/[?#]/)[0]+url.search+url.hash;
  }
  if (from==='index.html' && /^(scripts|vendor)\//.test(path)) {
    assert.ok(files.has(path), `Missing runtime entry: ${path}`);
    return `./${runtime}/${path}${url.search}${url.hash}`;
  }
  return reference;
}
function versionCSS(css, from) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match,quote,reference) => {
    const versioned = versionReference(reference.trim(),from);
    return versioned===reference.trim()?match:`url(${quote}${versioned}${quote})`;
  });
}

html = html.replace(/\b(src|href|poster|content)=(["'])([^"']*)\2/g,
  (match,attribute,quote,reference)=>`${attribute}=${quote}${versionReference(reference)}${quote}`);
html = html.replace(/\bsrcset=(["'])([^"']*)\1/g, (match,quote,value) => {
  if (value.includes('data:')) return match;
  const sources = value.split(',').map(source=>source.trim().replace(/^\S+/,url=>versionReference(url)));
  return `srcset=${quote}${sources.join(', ')}${quote}`;
});
html = versionCSS(html,'index.html');
const cssFiles = styles.map(path=>[path,versionCSS(readFileSync(`dist/${path}`,'utf8'),path)]);
for (const [path,css] of cssFiles) {
  html = html.replace(`href="./${path}"`,`href="./${path}?v=${hash(css)}"`);
}

// One immutable directory preserves every relative static/dynamic import and import.meta asset URL.
// Browser modules must resolve their own assets with new URL(..., import.meta.url).
mkdirSync(`dist/${runtime}`,{recursive:true});
for (const directory of runtimeDirectories) cpSync(`dist/${directory}`,`dist/${runtime}/${directory}`,{recursive:true});
for (const [path,css] of cssFiles) writeFileSync(`dist/${path}`,css);
writeFileSync('dist/index.html', html);
console.log(`Versioned three stylesheets and local assets; immutable module runtime: ${runtime}`);
