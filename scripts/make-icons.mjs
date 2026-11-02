// Membuat ikon PNG dan gambar OG (1200x630) dari desain logo. Butuh `sharp` (npm install).
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require("sharp"); } catch {
  const g = execSync("npm root -g").toString().trim();
  sharp = createRequire(join(g, "x.js"))("sharp");
}
const A = join(import.meta.dirname, "..", "src/assets");
const mark = readFileSync(join(A, "favicon.svg"));

for (const [name, size] of [["favicon-32.png", 32], ["apple-touch-icon.png", 180], ["icon-512.png", 512]]) {
  await sharp(mark, { density: 384 }).resize(size, size).png().toFile(join(A, name));
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#3730A3"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(90 120) scale(2.2)">
    <rect width="64" height="64" rx="16" fill="#fff"/>
    <path d="M20 18V34a12 12 0 0 0 24 0V22" fill="none" stroke="#4F46E5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M37 28l7-7 7 7" fill="none" stroke="#4F46E5" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="20" cy="17" r="4" fill="#F59E0B"/>
  </g>
  <text x="260" y="225" font-family="Inter, sans-serif" font-size="96" font-weight="800" fill="#fff">ubahin</text>
  <text x="90" y="420" font-family="Inter, sans-serif" font-size="60" font-weight="700" fill="#fff">Konverter File Online Gratis</text>
  <text x="90" y="490" font-family="Inter, sans-serif" font-size="34" fill="#E0E7FF">Ubah gambar &amp; PDF di browser. File tidak diunggah.</text>
  <rect x="90" y="540" width="180" height="8" rx="4" fill="#F59E0B"/>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(join(A, "og.png"));
writeFileSync(join(A, ".icons-generated"), new Date().toISOString());
console.log("Ikon dan og.png dibuat di", A);
