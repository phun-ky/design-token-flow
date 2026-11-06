// Serves dist/ the way GitHub Pages serves the site, for the end-to-end
// checks: under /site-design-token-flow/, `page` as `page.html`, a folder as
// its index.html, 404.html with status 404 for anything missing, and text
// gzipped when the browser accepts it, so transfer sizes match production.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGzip } from 'node:zlib';

export const BASE = '/site-design-token-flow/';

const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};
const isFile = async (path) => {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
};
// The file for a URL path inside the site, or null; never outside dist/
const resolve = async (pathname) => {
  if (!pathname.startsWith(BASE)) return null;

  const relative = decodeURIComponent(pathname.slice(BASE.length));
  const file = normalize(join(ROOT, relative));

  if (!file.startsWith(ROOT) && `${file}${sep}` !== ROOT) return null;

  for (const candidate of [file, `${file}.html`, join(file, 'index.html')])
    if (await isFile(candidate)) return candidate;

  return null;
};
// Fonts and images are compressed already
const COMPRESSIBLE = new Set([
  '.html',
  '.css',
  '.js',
  '.json',
  '.map',
  '.svg',
  '.txt'
]);
const send = (request, response, status, file) => {
  const gzip =
    COMPRESSIBLE.has(extname(file)) &&
    /\bgzip\b/.test(request.headers['accept-encoding'] ?? '');

  response.writeHead(status, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    ...(gzip && { 'content-encoding': 'gzip', vary: 'accept-encoding' })
  });
  (gzip
    ? createReadStream(file).pipe(createGzip())
    : createReadStream(file)
  ).pipe(response);
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const file = await resolve(pathname).catch(() => null);

  if (file) return send(request, response, 200, file);

  send(request, response, 404, join(ROOT, '404.html'));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serving dist/ at http://127.0.0.1:${PORT}${BASE}`);
});
