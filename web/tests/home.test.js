import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const rootURL = new URL('../../index.html', import.meta.url);
const rootPath = fileURLToPath(rootURL);
const rootDir = dirname(rootPath);
const html = await readFile(rootURL, 'utf8');

test('Pages root renders an actual tool dashboard, not the README fallback', () => {
  assert.match(html, /<title>Game Dev Toolkit — Tool Hub<\/title>/);
  assert.match(html, /id="main"/);
  assert.match(html, /id="tool-search"/);
  assert.match(html, /id="results-count"/);
  assert.match(html, /href="#build"/);
  assert.match(html, /href="#integrate"/);
  assert.match(html, /href="#explore"/);
  assert.match(html, /aria-live="polite"/);
});

test('all twelve tool cards resolve to existing repository pages', async () => {
  const cards = [...html.matchAll(/<a\s+class="tool-card[^"]*"\s+href="([^"]+)"\s+data-tool-card\b/g)].map(match => match[1]);
  assert.equal(cards.length, 12);
  assert.equal(new Set(cards).size, cards.length);
  for (const target of cards) {
    const path = target.split('?')[0];
    assert.ok(path.startsWith('web/') && path.endsWith('.html'), 'Tool must link to a local HTML page: ' + target);
    await access(resolve(rootDir, path));
  }
  assert.ok(cards.includes('web/map-builder/index.html'));
  assert.ok(cards.includes('web/builder/index.html'));
  assert.ok(cards.includes('web/catalog/index.html'));
  assert.ok(cards.includes('web/package/index.html'));
  assert.ok(cards.includes('web/validator/index.html'));
  assert.ok(cards.includes('web/builder/legacy-studio.html'));
});

test('all local homepage links and local scripts/stylesheets resolve', async () => {
  const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]);
  const srcs = [...html.matchAll(/\bsrc="([^"]+)"/g)].map(match => match[1]);
  for (const target of [...hrefs,...srcs]) {
    if (/^(https?:|#)/.test(target)) continue;
    if (target === './') continue;
    assert.ok(!target.startsWith('/'), 'Project Pages must use project-relative links');
    const file = resolve(rootDir, target.split(/[?#]/,1)[0]);
    assert.ok(file.startsWith(rootDir + '/'), 'Unsafe homepage reference ' + target);
    await access(file);
  }
  const source = await readFile(new URL('../home/home.js', import.meta.url), 'utf8');
  assert.match(source, /addEventListener\('input', update\)/);
  assert.match(source, /group.hidden/);
  const styles = await readFile(new URL('../home/home.css', import.meta.url), 'utf8');
  assert.match(styles, /@media\(max-width:480px\)/);
  assert.match(styles, /\[hidden\]\{display:none!important\}/);
});
