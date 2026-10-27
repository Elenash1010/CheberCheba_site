import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const css = read('styles.css');
const errors = [];
const pending = [];
const documents = new Set([
  'assets/documents/privacy-policy.pdf',
  'assets/documents/user-agreement.pdf',
]);
const references = new Set(['index.html', 'styles.css', 'script.js']);

for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url = match[1];
  if (!/^(?:https?:|mailto:|tel:|#)/.test(url)) references.add(url);
}
for (const match of css.matchAll(/url\(['"]?([^'"\s)]+)['"]?\)/g)) {
  if (!/^https?:/.test(match[1])) references.add(match[1]);
}
for (const reference of references) {
  if (!fs.existsSync(path.join(root, reference))) {
    (documents.has(reference) ? pending : errors).push(`Missing: ${reference}`);
  }
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
if (new Set(ids).size !== ids.length) errors.push('Duplicate HTML ids');
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) errors.push(`Missing anchor: ${match[1]}`);
}
for (const match of html.matchAll(/data-open-program="([^"]+)"/g)) {
  if (!ids.includes(`program-${match[1]}`)) errors.push(`Missing dialog: ${match[1]}`);
}
for (const match of html.matchAll(/<img\b[^>]*>/g)) {
  if (!/\balt="[^"]*"/.test(match[0])) errors.push('Image without alt');
  if (!/\bwidth="\d+"/.test(match[0]) || !/\bheight="\d+"/.test(match[0])) {
    errors.push('Image without intrinsic dimensions');
  }
}
if (/<style\b|<script>/i.test(html)) errors.push('Embedded stylesheet or script remains');

const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const images = walk(path.join(root, 'assets')).filter((file) => /\.(svg|png|jpe?g|webp)$/i.test(file));
for (const image of images) {
  const relative = path.relative(root, image).split(path.sep).join('/');
  if (!references.has(relative)) errors.push(`Unused image: ${relative}`);
}

// Verify that the publishable files can be served over HTTP.
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(request.url.split('?')[0]).replace(/^\//, '') || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200);
  fs.createReadStream(file).pipe(response);
});
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}/`;
  for (const reference of references) {
    if (!fs.existsSync(path.join(root, reference))) continue;
    const response = await fetch(new URL(reference, base));
    await response.arrayBuffer();
    if (!response.ok) errors.push(`HTTP ${response.status}: ${reference}`);
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log(`Checked ${references.size} local references and ${images.length} images.`);
for (const item of pending) console.warn(`PENDING DOCUMENT: ${item}`);
for (const error of errors) console.error(error);
if (errors.length || (pending.length && process.argv.includes('--strict'))) process.exitCode = 1;
else console.log('Site checks passed.');
