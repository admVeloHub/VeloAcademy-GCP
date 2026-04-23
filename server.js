// VERSION: v1.0.6 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
const { loadFrom: loadFonteEnv } = require('./lib/load-fonte-env.cjs');
loadFonteEnv(__dirname);
const { getGoogleClientIdInjectScript } = require('./lib/google-client-inject.cjs');
const http = require('http');
const fs = require('fs');
const path = require('path');
// Default 3000: alinha com Origens JavaScript autorizadas no OAuth (GCP); use PORT=8080 se precisar.
const port = parseInt(process.env.PORT, 10) || 3000;
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']);

const server = http.createServer((req, res) => {
  let rawPath = (req.url || '/').split('?')[0].split('#')[0];
  if (!rawPath.startsWith('/') || rawPath.startsWith('//')) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch (e) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (pathname === '/api/config/google-client.js') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(getGoogleClientIdInjectScript(), 'utf-8');
    return;
  }

  if (pathname === '/') pathname = '/index.html';

  const safePath = pathname.replace(/^\/+/, '');
  let filePath = path.join(__dirname, safePath);

  const rootDir = path.resolve(__dirname);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(rootDir + path.sep) && resolved !== rootDir) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  const isBinary = BINARY_EXT.has(extname);

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Arquivo não encontrado</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Erro do servidor: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      if (isBinary) {
        res.end(content);
      } else {
        res.end(content, 'utf-8');
      }
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Front estático: http://localhost:${port} (PORT no env altera a porta; padrão 3000)`);
  console.log(`Dev: em outro terminal, execute "npm run api" — API em http://localhost:3001`);
});
