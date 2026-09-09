import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { build, root } from './build.mjs';
import { releaseLabel } from '../src/data/site.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' };
const compress = promisify(gzip);

function acceptsGzip(header = '') {
  const encodings = new Map(header.split(',').map(item => {
    const [name, ...parameters] = item.trim().toLowerCase().split(';');
    const quality = parameters.map(value => value.trim()).find(value => value.startsWith('q='));
    return [name, quality ? Number(quality.slice(2)) : 1];
  }));
  return (encodings.get('gzip') ?? encodings.get('*') ?? 0) > 0;
}

export function createSiteServer({ basePath = '/', directory = path.join(root, 'dist') } = {}) {
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      return response.end();
    }
    try {
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (!pathname.startsWith(basePath)) throw new Error('Outside site base');
      const relative = pathname.slice(basePath.length).replaceAll('\\', '/');
      let filename = path.resolve(directory, relative);
      if (!filename.startsWith(directory + path.sep) && filename !== directory) throw new Error('Outside site root');
      if ((await stat(filename)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          response.writeHead(308, { Location: url.pathname + '/' + url.search });
          return response.end();
        }
        filename = path.join(filename, 'index.html');
      }
      let bytes = await readFile(filename);
      const type = types[path.extname(filename)] || 'application/octet-stream';
      response.setHeader('Vary', 'Accept-Encoding');
      if (bytes.length > 1024 && /text\/|json|svg/.test(type) && acceptsGzip(request.headers['accept-encoding'])) {
        bytes = await compress(bytes);
        response.setHeader('Content-Encoding', 'gzip');
      }
      const etag = `"${createHash('sha256').update(bytes).digest('hex')}"`;
      response.setHeader('ETag', etag);
      response.setHeader('Cache-Control', 'no-cache');
      if ((request.headers['if-none-match'] || '').split(',').some(value => value.trim().replace(/^W\//, '') === etag || value.trim() === '*')) {
        response.writeHead(304);
        return response.end();
      }
      response.writeHead(200, { 'Content-Type': type, 'Content-Length': bytes.length });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch {
      try {
        const html = (await readFile(path.join(directory, '404.html'), 'utf8'))
          .replace(/<base href="[^"]*">/, `<base href="${basePath}">`)
          .replaceAll('href="./', `href="${basePath}`).replaceAll('src="./', `src="${basePath}`);
        response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(request.method === 'HEAD' ? undefined : html);
      } catch {
        response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '3', 'Cache-Control': 'no-store' });
        response.end(request.method === 'HEAD' ? undefined : 'Site temporarily unavailable. Please retry.');
      }
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
  let port = Number(process.env.PORT || 4173);
  const server = createSiteServer();
  server.on('error', error => {
    if (error.code === 'EADDRINUSE' && port < 4200) server.listen(++port, '127.0.0.1');
    else { console.error(error.message); process.exit(1); }
  });
  server.listen(port, '127.0.0.1', () => console.log(`Portfolio ${releaseLabel}: http://127.0.0.1:${port}/`));
}
