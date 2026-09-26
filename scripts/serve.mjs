// Serves the static export in out/ (for previews and the end-to-end tests).
// Usage: node scripts/serve.mjs [port]. Honours BASE_PATH like the build does.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../out');
const port = Number(process.argv[2] ?? process.env.PORT ?? 3000);
const base = process.env.BASE_PATH ?? '';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

http
  .createServer((req, res) => {
    let url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (base && url.startsWith(base)) url = url.slice(base.length) || '/';
    let file = path.join(root, url);
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.endsWith('/')) {
        res.writeHead(308, { Location: `${base}${url}/` }).end();
        return;
      }
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      fs.createReadStream(path.join(root, '404.html')).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`Serving out/ at http://localhost:${port}${base}/`));
