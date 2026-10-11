// Static file server + WebSocket relay. Run: npm install && node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const THREE_DIR = path.join(__dirname, 'node_modules', 'three');
const TICK_MS = 50; // snapshot rate: 20 Hz
const ARENA = 60;
const ANIMS = new Set(['Idle', 'Walk', 'Sprint', 'Sprint Enter', 'Sprint Exit', 'Jump Start', 'Jump', 'Jump Land',
  'Overhand Throw', 'Hit Shoulder Left', 'Hit Shoulder Right']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.css': 'text/css', '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (url === '/') url = '/index.html';
  let base = PUBLIC, rel = url;
  if (url.startsWith('/three/')) { base = THREE_DIR; rel = url.slice('/three'.length); }
  const file = path.normalize(path.join(base, rel));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
});

const wss = new WebSocketServer({ server, maxPayload: 4096 });
let nextId = 1;
const players = new Map(); // id -> player (with .ws)

const num = (v, lim) => (Number.isFinite(v) ? Math.max(-lim, Math.min(lim, v)) : 0);
const r3 = (v) => Math.round(v * 1000) / 1000;
const pub = (p) => ({ id: p.id, name: p.name });
const vec3 = (a) => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite) ? a.map((v) => r3(num(v, 500))) : null;
const send = (ws, msg) => { if (ws.readyState === 1) ws.send(JSON.stringify(msg)); };
const broadcast = (msg, except) => {
  const data = JSON.stringify(msg);
  for (const p of players.values()) if (p.joined && p.ws !== except && p.ws.readyState === 1) p.ws.send(data);
};

wss.on('connection', (ws) => {
  const id = nextId++;
  const p = { id, ws, name: 'Player ' + id, joined: false, x: 0, y: 0, z: 0, ry: 0, a: 'Idle', w: 0, h: 100, ap: 0, lastShot: 0, lastGren: 0 };
  players.set(id, p);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;

    if (m.t === 'join') {
      if (p.joined) return;
      const name = String(m.name || '').replace(/[<>&"']/g, '').trim().slice(0, 16);
      if (name) p.name = name;
      p.joined = true;
      send(ws, { t: 'welcome', id, players: [...players.values()].filter((q) => q.joined && q.id !== id).map(pub) });
      broadcast({ t: 'join', player: pub(p) }, ws);
      return;
    }
    if (!p.joined) return;

    if (m.t === 'state') {
      p.x = num(m.x, ARENA + 5); p.y = num(m.y, 50); p.z = num(m.z, ARENA + 5); p.ry = num(m.ry, 20);
      if (ANIMS.has(m.a)) p.a = m.a;
      p.w = m.w === 1 || m.w === 2 ? m.w : 0;
      p.ap = num(m.ap, 1.6);
      p.h = Number.isFinite(m.h) ? Math.max(0, Math.min(100, Math.round(m.h))) : 100;
    } else if (m.t === 'grenade') {
      const now = Date.now();
      if (now - p.lastGren < 600) return;
      p.lastGren = now;
      const pos = vec3(m.p), vel = vec3(m.v);
      if (pos && vel && vel.every((c) => Math.abs(c) <= 60)) broadcast({ t: 'grenade', id, p: pos, v: vel }, ws);
    } else if (m.t === 'shoot') {
      const now = Date.now();
      if (now - p.lastShot < 80) return;
      p.lastShot = now;
      const from = vec3(m.from), to = vec3(m.to);
      if (from && to) broadcast({ t: 'shoot', id, from, to, w: p.w }, ws);
    }
  });

  ws.on('close', () => {
    players.delete(id);
    if (p.joined) broadcast({ t: 'leave', id });
  });
});

// 20 Hz world snapshots
setInterval(() => {
  const list = [...players.values()].filter((p) => p.joined);
  if (list.length < 2) return;
  const snap = JSON.stringify({ t: 'snap', p: list.map((p) => [p.id, r3(p.x), r3(p.y), r3(p.z), r3(p.ry), p.a, p.w, p.h, r3(p.ap)]) });
  for (const p of list) if (p.ws.readyState === 1) p.ws.send(snap);
}, TICK_MS);

// drop dead sockets
setInterval(() => {
  for (const p of players.values()) {
    if (!p.ws.isAlive) { p.ws.terminate(); continue; }
    p.ws.isAlive = false;
    p.ws.ping();
  }
}, 15000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\nGame running:\n  http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || []) if (i.family === 'IPv4' && !i.internal) console.log(`  http://${i.address}:${PORT}   (same Wi-Fi/LAN)`);
  console.log('');
});
