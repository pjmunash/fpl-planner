const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (!req.url.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  // Extract the FPL API path
  const fplPath = req.url.substring(4); // Remove '/api' prefix
  const fplUrl = `https://fantasy.premierleague.com/api${fplPath}`;

  console.log(`Proxying: ${fplUrl}`);

  https.get(fplUrl, { headers: { 'User-Agent': 'FPL-Planner' } }, (fplRes) => {
    res.writeHead(fplRes.statusCode, {
      'Content-Type': fplRes.headers['content-type'],
      'Access-Control-Allow-Origin': '*',
    });
    fplRes.pipe(res);
  }).on('error', (err) => {
    console.error(`Proxy error: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Proxy error: ${err.message}`);
  });
});

server.listen(PORT, () => {
  console.log(`FPL Proxy server running on port ${PORT}`);
});
