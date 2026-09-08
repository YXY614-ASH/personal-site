import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build, root } from './build.mjs';
import { releaseLabel } from '../src/data/site.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf' };

export function createSiteServer({ basePath = '/' } = {}) {
  const directory = path.join(root, 'dist');
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      return response.end();
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(basePath)) throw new Error('Outside site base');
      const relative = pathname.slice(basePath.length).replaceAll('\\', '/');
      let filename = path.resolve(directory, relative);
      if (!filename.startsWith(directory + path.sep) && filename !== directory) throw new Error('Outside site root');
      if ((await stat(filename)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          response.writeHead(308, { Location: pathname + '/' });
          return response.end();
        }
        filename = path.join(filename, 'index.html');
      }
      const bytes = await readFile(filename);
      response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch {
      const html = (await readFile(path.join(directory, '404.html'), 'utf8')).replaceAll('href="./', `href="${basePath}`).replaceAll('src="./', `src="${basePath}`);
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : html);
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
