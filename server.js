/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const apiHandler = require('./api/index');
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // 1. Route API Requests to Supabase Handler
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      req.query = parsedUrl.query;
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = body;
      }

      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data, null, 2));
      };

      try {
        await apiHandler(req, res);
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      }
    });
    return;
  }

  // 2. Clean URL Routing to HTML files in public/
  let filePath = '';
  if (pathname === '/' || pathname === '/home' || pathname === '/index.html') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  } else if (pathname === '/login' || pathname === '/login.html') {
    filePath = path.join(PUBLIC_DIR, 'login.html');
  } else if (pathname === '/request-demo' || pathname === '/request-demo.html') {
    filePath = path.join(PUBLIC_DIR, 'request-demo.html');
  } else if (pathname === '/app' || pathname === '/app.html') {
    filePath = path.join(PUBLIC_DIR, 'app.html');
  } else {
    filePath = path.join(PUBLIC_DIR, pathname);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Fallback to index.html
    const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(fallbackPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallbackPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🎓 EduGit Multi-School ERP Server Live on http://localhost:${PORT}`);
  console.log(`👉 Landing Page:      http://localhost:${PORT}`);
  console.log(`👉 School Sign In:    http://localhost:${PORT}/login`);
  console.log(`👉 Onboard School:    http://localhost:${PORT}/request-demo`);
  console.log(`👉 ERP App Workspace: http://localhost:${PORT}/app`);
  console.log(`📡 Database Engine:   Supabase Cloud PostgreSQL 17`);
  console.log(`======================================================\n`);
});
