const http = require('http');

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 5173,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:5173'
    }
  };

  const proxy = http.request(options, (targetRes) => {
    res.writeHead(targetRes.statusCode, targetRes.headers);
    targetRes.pipe(res, { end: true });
  });

  req.pipe(proxy, { end: true });

  proxy.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy to 5173: ' + err.message);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Dual-port proxy active: http://localhost:3000 -> http://localhost:5173');
});
