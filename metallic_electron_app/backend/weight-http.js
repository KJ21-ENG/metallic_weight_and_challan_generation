const http = require('http');
const path = require('path');

let weightScaleService = null;
try {
  weightScaleService = require(path.join(__dirname, 'services', 'weightScaleService.js'));
} catch (e) {
  console.error('weightScaleService not found:', e && e.message ? e.message : e);
}

const port = process.env.WEIGHT_HTTP_PORT ? Number(process.env.WEIGHT_HTTP_PORT) : 5001;

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/capture') {
    try {
      if (!weightScaleService) throw new Error('weightScaleService not available');
      if (!weightScaleService.isConnected) {
        try { await weightScaleService.autoDetectAndConnect(); } catch (e) { /* ignore */ }
      }
      if (!weightScaleService.isConnected) throw new Error('weight scale not connected');
      const w = await weightScaleService.captureWeight();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, weight: w }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    try {
      const status = { available: !!weightScaleService, connected: !!(weightScaleService && weightScaleService.isConnected) };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, status }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Not found' }));
});

server.listen(port, () => {
  console.log('Weight HTTP wrapper listening on port', port);
});

process.on('SIGINT', () => { server.close(() => process.exit(0)); });


