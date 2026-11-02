// Ubahin — mesin konversi. Semua proses berjalan di browser; file tidak diunggah ke server.
// Library berat (pdf-lib, pdf.js) dimuat lazy hanya saat dibutuhkan.

export const MAX_PIXELS = 16_000_000; // batas aman canvas (iOS ~16.7 juta piksel)

/* ---------- util ---------- */
export function fmtBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB";
  return (n / 1048576).toFixed(2) + " MB";
}
export function baseName(name) {
  const i = name.lastIndexOf(".");
  return (i > 0 ? name.slice(0, i) : name).replace(/[\\/:*?"<>|]+/g, "_");
}
export function extOf(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}
export function isHeic(file) {
  return /^(heic|heif)$/.test(extOf(file.name)) || /image\/hei[cf]/i.test(file.type);
}
export function isPdf(file) {
  return extOf(file.name) === "pdf" || file.type === "application/pdf";
}
export function isImage(file) {
  return /^image\//.test(file.type) || /^(jpe?g|png|webp|gif|bmp|avif|heic|heif|jfif)$/.test(extOf(file.name));
}
export class UbahinError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const scriptCache = new Map();
function loadScript(src) {
  if (!scriptCache.has(src)) {
    scriptCache.set(src, new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = () => res();
      s.onerror = () => { scriptCache.delete(src); rej(new Error("Gagal memuat " + src)); };
      document.head.appendChild(s);
    }));
  }
  return scriptCache.get(src);
}
async function getPdfLib() {
  if (!self.PDFLib) await loadScript("/vendor/pdf-lib.min.js");
  return self.PDFLib;
}
let pdfjsPromise;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("/vendor/pdfjs/pdf.min.mjs").then((m) => {
      m.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
      return m;
    });
  }
  return pdfjsPromise;
}

const tick = () => new Promise((r) => setTimeout(r, 0)); // beri napas ke UI

/* ---------- gambar ---------- */
function srcSize(src) {
  return { w: src.naturalWidth || src.width, h: src.naturalHeight || src.height };
}

export async function decodeImage(file) {
  // 1) decoder bawaan browser (Safari dapat HEIC secara native)
  const tryBitmap = async (opts) => (opts ? createImageBitmap(file, opts) : createImageBitmap(file));
  if (self.createImageBitmap) {
    for (const opts of [{ imageOrientation: "from-image" }, null]) {
      try { return await tryBitmap(opts); } catch (_) { /* coba berikutnya */ }
    }
  }
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } catch (_) { /* lanjut */ }
  // 2) HEIC: pakai heic2any bila tersedia di /vendor
  if (isHeic(file)) {
    try {
      if (!self.heic2any) await loadScript("/vendor/heic2any.min.js");
      let out = await self.heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
      if (Array.isArray(out)) out = out[0];
      return await createImageBitmap(out);
    } catch (_) {
      throw new UbahinError("HEIC", "Browser ini belum bisa membaca HEIC. Coba buka di Safari (iPhone/Mac) atau ubah dulu lewat galeri ponsel.");
    }
  }
  throw new UbahinError("DECODE", "File gambar tidak bisa dibaca. Mungkin rusak atau formatnya tidak didukung browser.");
}

function makeCanvas(src, scale = 1, bg = null) {
  const { w, h } = srcSize(src);
  let s = scale;
  if (w * h * s * s > MAX_PIXELS) s = Math.sqrt(MAX_PIXELS / (w * h));
  const cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
  const c = document.createElement("canvas");
  c.width = cw; c.height = ch;
  const ctx = c.getContext("2d");
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch); }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, cw, ch);
  return c;
}
function toBlob(canvas, mime, quality) {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new UbahinError("ENCODE", "Gagal membuat file hasil."))), mime, quality));
}
function release(src) { if (src && src.close) try { src.close(); } catch (_) {} }

const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function convertImage(file, { format = "jpg", quality = 0.92 } = {}) {
  const src = await decodeImage(file);
  const mime = MIME[format];
  const canvas = makeCanvas(src, 1, format === "jpg" ? "#ffffff" : null);
  const blob = await toBlob(canvas, mime, format === "png" ? undefined : quality);
  release(src);
  if (blob.type !== mime) throw new UbahinError("ENCODE", `Browser ini tidak bisa menyimpan ${format.toUpperCase()}. Pilih format lain.`);
  return { blob, name: `${baseName(file.name)}.${format}` };
}

// Kompres gambar: kualitas tetap, atau cari kualitas/ukuran terbaik agar <= targetKB.
export async function compressImage(file, { targetKB = 0, quality = 0.75, maxDim = 0, format = "jpg" } = {}, onProgress = () => {}) {
  const src = await decodeImage(file);
  const mime = MIME[format] || MIME.jpg;
  const { w, h } = srcSize(src);
  let scale = maxDim > 0 ? Math.min(1, maxDim / Math.max(w, h)) : 1;
  const enc = (sc, q) => toBlob(makeCanvas(src, sc, "#ffffff"), mime, q);
  let result;
  let note = "";
  if (!targetKB) {
    result = await enc(scale, quality);
  } else {
    const target = targetKB * 1024;
    let best = null;
    for (let round = 0; round < 9; round++) {
      let lo = 0.3, hi = 0.95, fit = null;
      for (let i = 0; i < 6; i++) {
        const q = (lo + hi) / 2;
        const b = await enc(scale, q);
        if (b.size <= target) { fit = b; lo = q; } else { hi = q; }
        if (!best || b.size < best.size) best = b;
        onProgress(Math.min(0.95, (round * 6 + i + 1) / 54));
        await tick();
      }
      if (fit) { result = fit; break; }
      scale *= 0.85;
      if (Math.max(w, h) * scale < 300) break;
    }
    if (!result) { result = best; note = `Belum tembus ${targetKB} KB; ini hasil terkecil yang bisa dicapai.`; }
  }
  release(src);
  if (result.type !== mime) throw new UbahinError("ENCODE", `Browser ini tidak bisa menyimpan ${format.toUpperCase()}. Pilih JPG.`);
  if (result.size >= file.size && !targetKB && file.type === mime) note = "Ukuran tidak berkurang; file asli sudah cukup kecil.";
  return { blob: result, name: `${baseName(file.name)}-kompres.${format}`, note };
}

/* ---------- PDF (pdf-lib) ---------- */
async function loadPdfDoc(file) {
  const { PDFDocument } = await getPdfLib();
  const buf = await file.arrayBuffer();
  try {
    return await PDFDocument.load(buf);
  } catch (e) {
    if (/encrypt/i.test(String(e && e.message))) throw new UbahinError("LOCKED", `"${file.name}" diproteksi password. Buka kuncinya dulu sebelum diproses.`);
    throw new UbahinError("PDF", `"${file.name}" tidak bisa dibaca sebagai PDF (mungkin rusak).`);
  }
}
const pdfBlob = (bytes) => new Blob([bytes], { type: "application/pdf" });

// "1,3-5" -> [0,2,3,4] (indeks nol). Kosong = semua halaman.
export function parseRanges(text, total) {
  const t = (text || "").trim();
  if (!t || /^semua$/i.test(t)) return Array.from({ length: total }, (_, i) => i);
  const set = new Set();
  for (const part of t.split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) throw new UbahinError("RANGE", `Format halaman "${part.trim()}" tidak valid. Contoh: 1,3-5`);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b < a || b > total) throw new UbahinError("RANGE", `Halaman ${part.trim()} di luar jangkauan (PDF ini ${total} halaman).`);
    for (let i = a; i <= b; i++) set.add(i - 1);
  }
  return [...set].sort((x, y) => x - y);
}

export async function mergePdfs(files, onProgress = () => {}) {
  const { PDFDocument } = await getPdfLib();
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const doc = await loadPdfDoc(files[i]);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
    onProgress((i + 1) / files.length);
    await tick();
  }
  return { blob: pdfBlob(await out.save()), name: "gabungan.pdf" };
}

export async function splitPdf(file, { mode = "each", ranges = "" } = {}, onProgress = () => {}) {
  const { PDFDocument } = await getPdfLib();
  const src = await loadPdfDoc(file);
  const total = src.getPageCount();
  const base = baseName(file.name);
  if (mode === "ranges") {
    const idx = parseRanges(ranges, total);
    const out = await PDFDocument.create();
    (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
    return [{ blob: pdfBlob(await out.save()), name: `${base}-halaman-terpilih.pdf` }];
  }
  const outs = [];
  for (let i = 0; i < total; i++) {
    const out = await PDFDocument.create();
    const [p] = await out.copyPages(src, [i]);
    out.addPage(p);
    outs.push({ blob: pdfBlob(await out.save()), name: `${base}-hal-${i + 1}.pdf` });
    onProgress((i + 1) / total);
    await tick();
  }
  return outs;
}

export async function rotatePdf(file, { angle = 90, ranges = "" } = {}) {
  const { degrees } = await getPdfLib();
  const doc = await loadPdfDoc(file);
  const idx = parseRanges(ranges, doc.getPageCount());
  const pages = doc.getPages();
  idx.forEach((i) => {
    const cur = pages[i].getRotation().angle || 0;
    pages[i].setRotation(degrees((((cur + angle) % 360) + 360) % 360));
  });
  return { blob: pdfBlob(await doc.save()), name: `${baseName(file.name)}-putar.pdf` };
}

export async function deletePdfPages(file, { ranges = "" } = {}) {
  const doc = await loadPdfDoc(file);
  const total = doc.getPageCount();
  if (!ranges.trim()) throw new UbahinError("RANGE", "Isi halaman yang ingin dihapus, misalnya 2,4-5.");
  const idx = parseRanges(ranges, total);
  if (idx.length >= total) throw new UbahinError("RANGE", "Tidak bisa menghapus semua halaman.");
  [...idx].reverse().forEach((i) => doc.removePage(i));
  return { blob: pdfBlob(await doc.save()), name: `${baseName(file.name)}-dihapus.pdf` };
}

export async function imagesToPdf(files, { pageSize = "a4", margin = 24 } = {}, onProgress = () => {}) {
  const { PDFDocument } = await getPdfLib();
  const doc = await PDFDocument.create();
  const A4 = [595.28, 841.89];
  for (let i = 0; i < files.length; i++) {
    const src = await decodeImage(files[i]);
    const { w, h } = srcSize(src);
    const jpg = await toBlob(makeCanvas(src, 1, "#ffffff"), "image/jpeg", 0.92);
    release(src);
    const img = await doc.embedJpg(await jpg.arrayBuffer());
    let pw, ph, dw, dh, x, y;
    if (pageSize === "auto") {
      const k = Math.min(1, 1400 / Math.max(w, h)) * 0.75; // px -> pt
      pw = dw = w * k; ph = dh = h * k; x = 0; y = 0;
    } else {
      [pw, ph] = w > h ? [A4[1], A4[0]] : A4;
      const k = Math.min((pw - margin * 2) / w, (ph - margin * 2) / h);
      dw = w * k; dh = h * k; x = (pw - dw) / 2; y = (ph - dh) / 2;
    }
    doc.addPage([pw, ph]).drawImage(img, { x, y, width: dw, height: dh });
    onProgress((i + 1) / files.length);
    await tick();
  }
  return { blob: pdfBlob(await doc.save()), name: files.length === 1 ? `${baseName(files[0].name)}.pdf` : "gambar-gabungan.pdf" };
}

/* ---------- PDF (pdf.js) ---------- */
async function openWithPdfjs(file) {
  const pdfjs = await getPdfjs();
  try {
    return await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      cMapUrl: "/vendor/pdfjs/cmaps/", cMapPacked: true,
      standardFontDataUrl: "/vendor/pdfjs/standard_fonts/",
      wasmUrl: "/vendor/pdfjs/wasm/", iccUrl: "/vendor/pdfjs/iccs/",
    }).promise;
  } catch (e) {
    if (e && e.name === "PasswordException") throw new UbahinError("LOCKED", `"${file.name}" diproteksi password. Buka kuncinya dulu.`);
    throw new UbahinError("PDF", `"${file.name}" tidak bisa dibaca sebagai PDF (mungkin rusak).`);
  }
}
async function closePdf(pdf) {
  try { if (pdf.loadingTask && pdf.loadingTask.destroy) await pdf.loadingTask.destroy(); else if (pdf.destroy) await pdf.destroy(); } catch (_) { /* abaikan */ }
}
async function renderPage(page, scale, bg) {
  let vp = page.getViewport({ scale });
  if (vp.width * vp.height > MAX_PIXELS) vp = page.getViewport({ scale: scale * Math.sqrt(MAX_PIXELS / (vp.width * vp.height)) });
  const c = document.createElement("canvas");
  c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
  const ctx = c.getContext("2d");
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height); }
  await page.render({ canvas: c, canvasContext: ctx, viewport: vp }).promise;
  return c;
}

export async function pdfToImages(file, { format = "jpg", scale = 2, quality = 0.9 } = {}, onProgress = () => {}) {
  const pdf = await openWithPdfjs(file);
  const outs = [];
  const base = baseName(file.name);
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const canvas = await renderPage(page, scale, "#ffffff");
    const blob = await toBlob(canvas, MIME[format], format === "png" ? undefined : quality);
    outs.push({ blob, name: `${base}-hal-${i}.${format}` });
    page.cleanup();
    onProgress(i / pdf.numPages);
    await tick();
  }
  await closePdf(pdf);
  return outs;
}

const PDF_PRESETS = [
  { scale: 1.6, q: 0.78 }, // ringan
  { scale: 1.3, q: 0.62 }, // seimbang
  { scale: 1.0, q: 0.5 },  // hemat
  { scale: 0.8, q: 0.4 },  // maksimal
];
// Kompres PDF dengan merender ulang tiap halaman menjadi gambar JPEG (teks tidak lagi bisa diseleksi).
export async function compressPdf(file, { level = 1, targetKB = 0 } = {}, onProgress = () => {}) {
  const { PDFDocument } = await getPdfLib();
  const pdf = await openWithPdfjs(file);
  const start = targetKB ? 0 : Math.min(level, PDF_PRESETS.length - 1);
  const end = targetKB ? PDF_PRESETS.length - 1 : start;
  let best = null, note = "";
  for (let p = start; p <= end; p++) {
    const { scale, q } = PDF_PRESETS[p];
    const out = await PDFDocument.create();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const canvas = await renderPage(page, scale, "#ffffff");
      const jpg = await toBlob(canvas, "image/jpeg", q);
      const img = await out.embedJpg(await jpg.arrayBuffer());
      out.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
      page.cleanup();
      onProgress(((p - start) + i / pdf.numPages) / (end - start + 1));
      await tick();
    }
    const blob = pdfBlob(await out.save());
    if (!best || blob.size < best.size) best = blob;
    if (!targetKB || blob.size <= targetKB * 1024) { best = blob; break; }
  }
  await closePdf(pdf);
  if (targetKB && best.size > targetKB * 1024) note = `Belum tembus ${targetKB} KB; ini hasil terkecil yang bisa dicapai.`;
  if (best.size >= file.size) return { blob: file, name: `${baseName(file.name)}.pdf`, note: "PDF ini sudah cukup kecil; tidak ada yang bisa dihemat, jadi file asli dikembalikan." };
  return { blob: best, name: `${baseName(file.name)}-kompres.pdf`, note: note || "Halaman diubah menjadi gambar, jadi teks tidak bisa diseleksi lagi." };
}

/* ---------- ZIP (tanpa kompresi, tanpa library) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
export async function makeZip(entries) {
  const enc = new TextEncoder();
  const used = new Set();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [], central = [];
  let offset = 0;
  for (const e of entries) {
    let name = e.name, n = 2;
    while (used.has(name)) { const i = e.name.lastIndexOf("."); name = i > 0 ? `${e.name.slice(0, i)} (${n})${e.name.slice(i)}` : `${e.name} (${n})`; n++; }
    used.add(name);
    const data = new Uint8Array(await e.blob.arrayBuffer());
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, nameBytes.length, true); lh.setUint16(28, 0, true);
    parts.push(lh.buffer, nameBytes, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, nameBytes.length, true);
    ch.setUint32(42, offset, true);
    central.push(ch.buffer, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const cdSize = central.reduce((s, b) => s + (b.byteLength ?? b.length), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, used.size, true); end.setUint16(10, used.size, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}

/* ---------- unduh ---------- */
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
