// Menyalin library pihak ketiga ke ./vendor agar disajikan dari domain sendiri (tanpa CDN).
// Jalankan: npm install && npm run vendor
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const globalRoot = (() => { try { return execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; } })();

const root = resolve(import.meta.dirname, "..");
const out = join(root, "vendor");
const roots = [join(root, "node_modules"), process.env.NODE_MODULES_DIR, globalRoot, join(homedir(), ".npm-global/lib/node_modules"), "/usr/lib/node_modules", "/usr/local/lib/node_modules"].filter(Boolean);
const find = (name) => roots.map((r) => join(r, name)).find((p) => existsSync(p));

const pdfLib = find("pdf-lib"), pdfjs = find("pdfjs-dist");
if (!pdfLib || !pdfjs) { console.error("pdf-lib / pdfjs-dist tidak ditemukan. Jalankan `npm install` dulu."); process.exit(1); }

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "pdfjs"), { recursive: true });
cpSync(join(pdfLib, "dist/pdf-lib.min.js"), join(out, "pdf-lib.min.js"));
cpSync(join(pdfLib, "LICENSE.md"), join(out, "LICENSE-pdf-lib.md"));
// build "legacy" pdf.js: kompatibel dengan browser lama (Android/iOS lama)
cpSync(join(pdfjs, "legacy/build/pdf.min.mjs"), join(out, "pdfjs/pdf.min.mjs"));
cpSync(join(pdfjs, "legacy/build/pdf.worker.min.mjs"), join(out, "pdfjs/pdf.worker.min.mjs"));
for (const d of ["wasm", "standard_fonts", "cmaps", "iccs"]) if (existsSync(join(pdfjs, d))) cpSync(join(pdfjs, d), join(out, "pdfjs", d), { recursive: true });
cpSync(join(pdfjs, "LICENSE"), join(out, "LICENSE-pdfjs.txt"));
console.log("Vendor selesai ->", out);
