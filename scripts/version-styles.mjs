import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const styles = ['styles.css', 'styles/film.css', 'styles/demo-polish.css'];
let html = readFileSync('dist/index.html', 'utf8');

// Pages caches CSS for ten minutes; a changed stylesheet needs a new request URL.
for (const path of styles) {
  const hash = createHash('sha256').update(readFileSync(`dist/${path}`)).digest('hex').slice(0, 16);
  const reference = `href="./${path}"`;
  assert.equal(html.split(reference).length, 2, `Expected one stylesheet reference: ${path}`);
  html = html.replace(reference, `href="./${path}?v=${hash}"`);
}

writeFileSync('dist/index.html', html);
console.log('Versioned all three stylesheet URLs from their deployed contents.');
