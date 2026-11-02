// Server pratinjau lokal untuk ./dist. Menerapkan header dari dist/_headers (termasuk CSP) agar perilakunya mirip produksi.
// Pakai: node scripts/serve.mjs [port]
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";

const dist = join(import.meta.dirname, "..", "dist");
const port = +(process.argv[2] || process.env.PORT || 4173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8", ".wasm": "application/wasm", ".bcmap": "application/octet-stream", ".pfb": "application/octet-stream", ".ttf": "font/ttf", ".woff2": "font/woff2" };

const globalHeaders = {};
try {
  const lines = readFileSync(join(dist, "_headers"), "utf8").split("\n");
  let inGlobal = false;
  for (const l of lines) {
    if (/^\S/.test(l)) inGlobal = l.trim() === "/*";
    else if (inGlobal && l.includes(":")) { const i = l.indexOf(":"); globalHeaders[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
  }
} catch {}

createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = normalize(join(dist, p));
  if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  const ok = existsSync(file) && statSync(file).isFile();
  if (!ok) file = join(dist, "404.html");
  res.writeHead(ok ? 200 : 404, { ...globalHeaders, "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Pratinjau: http://localhost:${port}`));
