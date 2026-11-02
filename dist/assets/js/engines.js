/* Ubahin — mesin konversi. Semua proses berjalan di browser; file tidak dikirim ke server. */
(function () {
  'use strict';
  const BASE = new URL('../', document.currentScript.src).href; // folder assets/
  const CDN = {
    heic: 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js',
    lame: 'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js'
  };

  /* ---------- util ---------- */
  const ext = (n) => (n.split('.').pop() || '').toLowerCase();
  const baseName = (n) => n.replace(/\.[^.]+$/, '');
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const scripts = {};
  function loadScript(url) {
    return (scripts[url] ||= new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = url; s.onload = res;
      s.onerror = () => { delete scripts[url]; rej(new Error('Gagal memuat komponen: ' + url.split('/').pop())); };
      document.head.appendChild(s);
    }));
  }
  const loadLocal = (f) => loadScript(BASE + 'vendor/' + f);
  let pdfjsP;
  function pdfjs() {
    return (pdfjsP ||= import(BASE + 'vendor/pdf.min.js').then((m) => {
      m.GlobalWorkerOptions.workerSrc = BASE + 'vendor/pdf.worker.min.js';
      return m;
    }));
  }
  async function pdfLib() { await loadLocal('pdf-lib.min.js'); return window.PDFLib; }
  async function JSZipLib() { await loadLocal('jszip.min.js'); return window.JSZip; }

  function toBlob(canvas, mime, q) {
    return new Promise((res, rej) => canvas.toBlob((b) => {
      if (!b) return rej(new Error('Browser tidak bisa membuat file ' + mime));
      if (b.type !== mime) return rej(new Error('Browser ini belum mendukung format ' + mime.split('/')[1].toUpperCase() + '. Coba format lain.'));
      res(b);
    }, mime, q));
  }
  const newCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  /* ---------- decode gambar (termasuk HEIC) ---------- */
  async function bitmapFrom(blob) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch (e) { /* fallback */ }
    }
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image(); img.src = url; await img.decode();
      return img;
    } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
  }
  const dimsOf = (s) => ({ w: s.naturalWidth || s.width, h: s.naturalHeight || s.height });
  async function decodeImage(file) {
    const e = ext(file.name);
    if (e === 'heic' || e === 'heif' || /hei[cf]/.test(file.type)) {
      try { return await bitmapFrom(file); } catch (_) { /* Chrome/Firefox tidak bisa HEIC → pakai heic2any */ }
      await loadScript(CDN.heic);
      const out = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      return bitmapFrom(Array.isArray(out) ? out[0] : out);
    }
    try { return await bitmapFrom(file); }
    catch (_) { throw new Error('File "' + file.name + '" tidak bisa dibaca sebagai gambar (mungkin rusak).'); }
  }
  function drawScaled(src, scale, flatten) {
    const { w, h } = dimsOf(src);
    const W = Math.max(1, Math.round(w * scale)), H = Math.max(1, Math.round(h * scale));
    const c = newCanvas(W, H), ctx = c.getContext('2d');
    if (flatten) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
    ctx.drawImage(src, 0, 0, W, H);
    return c;
  }
  const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

  /* ---------- parser rentang halaman ---------- */
  function parsePages(text, total) {
    const out = [];
    const parts = String(text || '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      const m = p.match(/^(\d*)\s*-\s*(\d*)$/);
      let a, b;
      if (m && (m[1] || m[2])) { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : total; }
      else if (/^\d+$/.test(p)) { a = b = +p; }
      else throw new Error('Rentang halaman tidak valid: "' + p + '". Contoh yang benar: 1-3, 5, 8-');
      if (a < 1 || b > total || a > b) throw new Error('Halaman "' + p + '" di luar batas (dokumen punya ' + total + ' halaman).');
      for (let i = a; i <= b; i++) out.push(i - 1);
    }
    return out;
  }

  /* ---------- PDF helpers ---------- */
  async function loadPdfDoc(PDFLib, file) {
    const buf = await file.arrayBuffer();
    try { return await PDFLib.PDFDocument.load(buf); }
    catch (e) {
      if (/encrypt/i.test(e.message)) throw new Error('"' + file.name + '" dikunci dengan kata sandi. Buka kuncinya dulu.');
      throw new Error('"' + file.name + '" bukan PDF yang valid atau rusak.');
    }
  }
  async function openPdfJs(file) {
    const lib = await pdfjs();
    const data = new Uint8Array(await file.arrayBuffer());
    try { return await lib.getDocument({ data }).promise; }
    catch (e) {
      if (e && e.name === 'PasswordException') throw new Error('"' + file.name + '" dikunci dengan kata sandi.');
      throw new Error('"' + file.name + '" bukan PDF yang valid atau rusak.');
    }
  }
  function closePdf(pdf) { try { if (pdf.destroy) return pdf.destroy(); if (pdf.cleanup) return pdf.cleanup(); } catch (e) { /* abaikan */ } }
  async function renderPage(page, scale, flatten) {
    let vp = page.getViewport({ scale });
    const MAXPX = 16e6;
    if (vp.width * vp.height > MAXPX) { scale *= Math.sqrt(MAXPX / (vp.width * vp.height)); vp = page.getViewport({ scale }); }
    const c = newCanvas(Math.ceil(vp.width), Math.ceil(vp.height)), ctx = c.getContext('2d');
    if (flatten) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    await page.render({ canvasContext: ctx, canvas: c, viewport: vp }).promise;
    return c;
  }
  const pdfBlob = (bytes) => new Blob([bytes], { type: 'application/pdf' });

  /* ---------- ENGINE ---------- */
  const E = {};

  // Gambar → gambar
  E.img2img = async (files, o, prog) => {
    const mime = MIME[o.to || 'jpg'], q = (o.quality || 90) / 100, out = [];
    for (let i = 0; i < files.length; i++) {
      prog(i / files.length, files[i].name);
      const src = await decodeImage(files[i]);
      const c = drawScaled(src, 1, mime === 'image/jpeg');
      const b = await toBlob(c, mime, q);
      out.push({ name: baseName(files[i].name) + '.' + (o.to || 'jpg'), blob: b });
      await tick();
    }
    return out;
  };

  // Kompres gambar (kualitas / target KB)
  E.imgcompress = async (files, o, prog) => {
    const mime = o.to === 'webp' ? 'image/webp' : 'image/jpeg', extn = o.to === 'webp' ? 'webp' : 'jpg';
    const target = (+o.targetKB || 0) * 1024, maxDim = +o.maxDim || 0, out = [];
    for (let i = 0; i < files.length; i++) {
      prog(i / files.length, files[i].name);
      const src = await decodeImage(files[i]);
      const { w, h } = dimsOf(src);
      let scale = maxDim ? Math.min(1, maxDim / Math.max(w, h)) : 1;
      let q = (o.quality || 75) / 100, best, note = '';
      const encode = async (s, qq) => toBlob(drawScaled(src, s, true), mime, qq);
      if (!target) best = await encode(scale, q);
      else {
        for (let attempt = 0; attempt < 8; attempt++) {
          let lo = 0.3, hi = 0.95, found = null;
          for (let k = 0; k < 7; k++) {
            const mid = (lo + hi) / 2, b = await encode(scale, mid);
            if (b.size <= target) { found = b; lo = mid; } else hi = mid;
          }
          if (found) { best = found; break; }
          best = await encode(scale, 0.3);
          scale *= 0.85;
          await tick();
        }
        if (best.size > target) note = 'Belum mencapai ' + o.targetKB + ' KB; ini ukuran terkecil yang bisa dicapai.';
      }
      out.push({ name: baseName(files[i].name) + '-kecil.' + extn, blob: best, note, before: files[i].size });
      await tick();
    }
    return out;
  };

  // Gambar → PDF (digabung)
  E.img2pdf = async (files, o, prog) => {
    const PDFLib = await pdfLib(), doc = await PDFLib.PDFDocument.create();
    const A4 = [595.28, 841.89], margin = +o.margin || 0;
    for (let i = 0; i < files.length; i++) {
      prog(i / files.length, files[i].name);
      const src = await decodeImage(files[i]), { w, h } = dimsOf(src);
      const isPng = ext(files[i].name) === 'png';
      const blob = await toBlob(drawScaled(src, 1, !isPng), isPng ? 'image/png' : 'image/jpeg', 0.92);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      let pw, ph;
      if (o.size === 'a4') {
        [pw, ph] = w > h ? [A4[1], A4[0]] : A4;
        const k = Math.min((pw - 2 * margin) / w, (ph - 2 * margin) / h);
        const dw = w * k, dh = h * k, page = doc.addPage([pw, ph]);
        page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      } else {
        const k = Math.min(1, 1200 / Math.max(w, h)) * 0.75;
        pw = w * k + 2 * margin; ph = h * k + 2 * margin;
        doc.addPage([pw, ph]).drawImage(img, { x: margin, y: margin, width: w * k, height: h * k });
      }
      await tick();
    }
    const name = (files.length === 1 ? baseName(files[0].name) : 'gambar-gabungan') + '.pdf';
    return [{ name, blob: pdfBlob(await doc.save()) }];
  };

  // PDF → gambar
  E.pdf2img = async (files, o, prog) => {
    const mime = MIME[o.to || 'jpg'], scale = +o.scale || 2, out = [];
    for (let f = 0; f < files.length; f++) {
      const pdf = await openPdfJs(files[f]), n = pdf.numPages;
      for (let p = 1; p <= n; p++) {
        prog((f + (p - 1) / n) / files.length, files[f].name + ' — hal. ' + p + '/' + n);
        const page = await pdf.getPage(p);
        const c = await renderPage(page, scale, mime === 'image/jpeg');
        const blob = await toBlob(c, mime, 0.9);
        out.push({ name: baseName(files[f].name) + (n > 1 || files.length > 1 ? '-hal' + p : '') + '.' + (o.to || 'jpg'), blob });
        page.cleanup(); await tick();
      }
      closePdf(pdf);
    }
    return out;
  };

  // Gabung PDF
  E.pdfmerge = async (files, o, prog) => {
    if (files.length < 2) throw new Error('Pilih minimal 2 file PDF untuk digabung.');
    const PDFLib = await pdfLib(), out = await PDFLib.PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      prog(i / files.length, files[i].name);
      const src = await loadPdfDoc(PDFLib, files[i]);
      (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
      await tick();
    }
    return [{ name: 'gabungan.pdf', blob: pdfBlob(await out.save()) }];
  };

  // Pisah / ambil halaman PDF
  E.pdfsplit = async (files, o, prog) => {
    const PDFLib = await pdfLib(), res = [];
    for (let f = 0; f < files.length; f++) {
      prog(f / files.length, files[f].name);
      const src = await loadPdfDoc(PDFLib, files[f]), total = src.getPageCount(), b = baseName(files[f].name);
      if (o.mode === 'each') {
        for (let i = 0; i < total; i++) {
          const d = await PDFLib.PDFDocument.create();
          d.addPage((await d.copyPages(src, [i]))[0]);
          res.push({ name: b + '-hal' + (i + 1) + '.pdf', blob: pdfBlob(await d.save()) });
          if (i % 10 === 9) await tick();
        }
      } else {
        const idx = parsePages(o.pages, total);
        if (!idx.length) throw new Error('Isi halaman yang ingin diambil, misalnya 1-3, 5');
        const d = await PDFLib.PDFDocument.create();
        (await d.copyPages(src, idx)).forEach((p) => d.addPage(p));
        res.push({ name: b + '-sebagian.pdf', blob: pdfBlob(await d.save()) });
      }
    }
    return res;
  };

  // Putar PDF
  E.pdfrotate = async (files, o, prog) => {
    const PDFLib = await pdfLib(), res = [], a = +o.angle || 90;
    for (let f = 0; f < files.length; f++) {
      prog(f / files.length, files[f].name);
      const doc = await loadPdfDoc(PDFLib, files[f]), total = doc.getPageCount();
      const idx = o.pages && o.pages.trim() ? parsePages(o.pages, total) : doc.getPageIndices();
      idx.forEach((i) => { const pg = doc.getPage(i); pg.setRotation(PDFLib.degrees((pg.getRotation().angle + a) % 360)); });
      res.push({ name: baseName(files[f].name) + '-putar.pdf', blob: pdfBlob(await doc.save()) });
    }
    return res;
  };

  // Hapus halaman PDF
  E.pdfdelete = async (files, o, prog) => {
    const PDFLib = await pdfLib(), res = [];
    for (let f = 0; f < files.length; f++) {
      prog(f / files.length, files[f].name);
      const doc = await loadPdfDoc(PDFLib, files[f]), total = doc.getPageCount();
      if (!o.pages || !o.pages.trim()) throw new Error('Isi nomor halaman yang ingin dihapus, misalnya 2, 4-6');
      const idx = [...new Set(parsePages(o.pages, total))].sort((x, y) => y - x);
      if (idx.length >= total) throw new Error('Tidak bisa menghapus semua halaman.');
      idx.forEach((i) => doc.removePage(i));
      res.push({ name: baseName(files[f].name) + '-edit.pdf', blob: pdfBlob(await doc.save()) });
    }
    return res;
  };

  // Kompres PDF (render ulang tiap halaman jadi JPEG)
  const LEVELS = { ringan: [2, 0.8], sedang: [1.5, 0.65], kuat: [1.2, 0.5], ekstrem: [1, 0.38] };
  E.pdfcompress = async (files, o, prog) => {
    const PDFLib = await pdfLib(), [scale, q] = LEVELS[o.level] || LEVELS.sedang, res = [];
    for (let f = 0; f < files.length; f++) {
      const pdf = await openPdfJs(files[f]), n = pdf.numPages, out = await PDFLib.PDFDocument.create();
      for (let p = 1; p <= n; p++) {
        prog((f + (p - 1) / n) / files.length, files[f].name + ' — hal. ' + p + '/' + n);
        const page = await pdf.getPage(p), base = page.getViewport({ scale: 1 });
        const c = await renderPage(page, scale, true);
        const jpg = await toBlob(c, 'image/jpeg', q);
        const img = await out.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
        out.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
        page.cleanup(); await tick();
      }
      closePdf(pdf);
      const blob = pdfBlob(await out.save());
      if (blob.size >= files[f].size) res.push({ name: files[f].name, blob: files[f], before: files[f].size, note: 'File ini sudah sangat efisien — ukuran asli dipertahankan.' });
      else res.push({ name: baseName(files[f].name) + '-kecil.pdf', blob, before: files[f].size, note: 'Teks pada hasil berupa gambar (tidak bisa disalin/dicari).' });
    }
    return res;
  };

  // Video/audio → MP3 atau WAV
  function floatTo16(f32) { const o = new Int16Array(f32.length); for (let i = 0; i < f32.length; i++) { const s = Math.max(-1, Math.min(1, f32[i])); o[i] = s < 0 ? s * 0x8000 : s * 0x7fff; } return o; }
  function wavBlob(chs, rate) {
    const n = chs[0].length, c = chs.length, buf = new ArrayBuffer(44 + n * c * 2), v = new DataView(buf);
    const W = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    W(0, 'RIFF'); v.setUint32(4, 36 + n * c * 2, true); W(8, 'WAVE'); W(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, c, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * c * 2, true); v.setUint16(32, c * 2, true); v.setUint16(34, 16, true); W(36, 'data'); v.setUint32(40, n * c * 2, true);
    const i16 = chs.map(floatTo16); let off = 44;
    for (let i = 0; i < n; i++) for (let k = 0; k < c; k++) { v.setInt16(off, i16[k][i], true); off += 2; }
    return new Blob([buf], { type: 'audio/wav' });
  }
  /* ---- demuxer MP4 minimal: ambil jalur AAC tanpa dekode ---- */
  const MP4EXT = ['mp4', 'm4v', 'mov', 'm4a', '3gp'];
  function u32(d, o) { return d.getUint32(o); }
  function boxes(d, start, end) {
    const out = []; let p = start;
    while (p + 8 <= end) {
      let size = u32(d, p); const type = String.fromCharCode(d.getUint8(p + 4), d.getUint8(p + 5), d.getUint8(p + 6), d.getUint8(p + 7)); let hdr = 8;
      if (size === 1) { size = Number(d.getBigUint64(p + 8)); hdr = 16; } else if (size === 0) size = end - p;
      if (size < hdr || p + size > end) break;
      out.push({ type, start: p + hdr, end: p + size });
      p += size;
    }
    return out;
  }
  const kid = (d, b, t) => boxes(d, b.start, b.end).find((x) => x.type === t);
  function readLen(d, o) { let len = 0, n = 0, b; do { b = d.getUint8(o + n); len = (len << 7) | (b & 0x7f); n++; } while (b & 0x80 && n < 4); return [len, n]; }
  function findAsc(d, start, end) { // cari DecoderSpecificInfo (tag 5) di dalam esds
    let p = start;
    while (p < end) {
      const tag = d.getUint8(p++); const [len, n] = readLen(d, p); p += n;
      if (tag === 3) { p += 2; const fl = d.getUint8(p++); if (fl & 0x80) p += 2; if (fl & 0x40) p += 1 + d.getUint8(p); if (fl & 0x20) p += 2; }
      else if (tag === 4) { p += 13; }
      else if (tag === 5) return new Uint8Array(d.buffer, d.byteOffset + p, len);
      else p += len;
    }
    return null;
  }
  const SR = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
  function parseAsc(asc) {
    let bit = 0; const rd = (n) => { let v = 0; for (let i = 0; i < n; i++, bit++) v = (v << 1) | ((asc[bit >> 3] >> (7 - (bit & 7))) & 1); return v; };
    let aot = rd(5); if (aot === 31) aot = 32 + rd(6);
    let fi = rd(4), rate; if (fi === 15) rate = rd(24); else rate = SR[fi];
    const cc = rd(4);
    if (aot === 5 || aot === 29) { const e = rd(4); if (e === 15) rd(24); aot = rd(5); }
    if (fi === 15) fi = Math.max(0, SR.indexOf(rate));
    return { aot, fi, rate, cc };
  }
  async function demuxAac(file) {
    const buf = await file.arrayBuffer(), d = new DataView(buf);
    const moov = boxes(d, 0, buf.byteLength).find((b) => b.type === 'moov');
    if (!moov) throw new Error('Struktur file tidak dikenali (bukan MP4/MOV yang lengkap).');
    for (const trak of boxes(d, moov.start, moov.end).filter((b) => b.type === 'trak')) {
      const mdia = kid(d, trak, 'mdia'); if (!mdia) continue;
      const hdlr = kid(d, mdia, 'hdlr'); if (!hdlr || String.fromCharCode(...[8, 9, 10, 11].map((i) => d.getUint8(hdlr.start + i))) !== 'soun') continue;
      const stbl = kid(d, kid(d, mdia, 'minf'), 'stbl'), stsd = kid(d, stbl, 'stsd');
      const ent = boxes(d, stsd.start + 8, stsd.end)[0];
      if (!ent || ent.type !== 'mp4a') continue;
      const ver = d.getUint16(ent.start + 8), channels = d.getUint16(ent.start + 16), rate0 = d.getUint16(ent.start + 24);
      const esds = boxes(d, ent.start + 28 + (ver === 1 ? 16 : ver === 2 ? 36 : 0), ent.end).find((b) => b.type === 'esds');
      if (!esds) continue;
      const asc = findAsc(d, esds.start + 4, esds.end); if (!asc) continue;
      const cfg = parseAsc(asc);
      const stsz = kid(d, stbl, 'stsz'), stsc = kid(d, stbl, 'stsc'), co = kid(d, stbl, 'stco') || kid(d, stbl, 'co64');
      const fixed = u32(d, stsz.start + 4), count = u32(d, stsz.start + 8);
      const sizes = new Array(count); for (let i = 0; i < count; i++) sizes[i] = fixed || u32(d, stsz.start + 12 + 4 * i);
      const nsc = u32(d, stsc.start + 4), sc = []; for (let i = 0; i < nsc; i++) sc.push([u32(d, stsc.start + 8 + 12 * i), u32(d, stsc.start + 12 + 12 * i)]);
      const nco = u32(d, co.start + 4), is64 = co.type === 'co64', samples = []; let si = 0, k = 0;
      for (let c = 1; c <= nco && si < count; c++) {
        while (k + 1 < sc.length && sc[k + 1][0] <= c) k++;
        let off = is64 ? Number(d.getBigUint64(co.start + 8 + 8 * (c - 1))) : u32(d, co.start + 8 + 4 * (c - 1));
        for (let j = 0; j < sc[k][1] && si < count; j++, si++) { samples.push(new Uint8Array(buf, off, sizes[si])); off += sizes[si]; }
      }
      return { samples, asc, aot: cfg.aot, fi: cfg.fi, sampleRate: cfg.rate || rate0, channels: cfg.cc || channels };
    }
    throw new Error('Tidak ditemukan jalur suara AAC di file ini.');
  }
  function adtsBlob(t) {
    const parts = [];
    for (const s of t.samples) {
      const L = s.length + 7, h = new Uint8Array(7);
      h[0] = 0xff; h[1] = 0xf1; h[2] = ((t.aot - 1) << 6) | (t.fi << 2) | (t.channels >> 2); h[3] = ((t.channels & 3) << 6) | (L >> 11); h[4] = (L >> 3) & 0xff; h[5] = ((L & 7) << 5) | 0x1f; h[6] = 0xfc;
      parts.push(h, s);
    }
    return new Blob(parts, { type: 'audio/aac' });
  }
  async function decodeWithWebCodecs(t, prog) { // dekode AAC lewat WebCodecs (Chrome/Edge/Android)
    if (!('AudioDecoder' in window)) throw new Error('nodecoder');
    const cfg = { codec: 'mp4a.40.' + t.aot, sampleRate: t.sampleRate, numberOfChannels: t.channels, description: t.asc };
    const sup = await AudioDecoder.isConfigSupported(cfg); if (!sup.supported) throw new Error('nodecoder');
    const chunks = [], chN = Math.min(2, t.channels); let rate = t.sampleRate, failure = null;
    const dec = new AudioDecoder({
      output: (ad) => {
        rate = ad.sampleRate; const n = ad.numberOfFrames, set = [];
        for (let c = 0; c < chN; c++) { const a = new Float32Array(n); ad.copyTo(a, { planeIndex: Math.min(c, ad.numberOfChannels - 1), format: 'f32-planar' }); set.push(a); }
        chunks.push(set); ad.close();
      },
      error: (e) => { failure = e; }
    });
    dec.configure(cfg);
    let ts = 0;
    for (let i = 0; i < t.samples.length; i++) {
      if (failure) break;
      dec.decode(new EncodedAudioChunk({ type: 'key', timestamp: Math.round(ts), data: t.samples[i] })); ts += 1024 / t.sampleRate * 1e6;
      if (i % 200 === 0) { prog(i / t.samples.length, 'Membaca suara…'); await tick(); }
      while (dec.decodeQueueSize > 100) await tick();
    }
    if (!failure) await dec.flush();
    try { dec.close(); } catch (e) { /* abaikan */ }
    if (failure || !chunks.length) throw new Error('nodecoder');
    const total = chunks.reduce((a, s) => a + s[0].length, 0), chs = [];
    for (let c = 0; c < chN; c++) { const a = new Float32Array(total); let o = 0; for (const s of chunks) { a.set(s[c], o); o += s[c].length; } chs.push(a); }
    return { chs, rate };
  }
  async function getPcm(file, o, prog) {
    const AC = window.AudioContext || window.webkitAudioContext, e = ext(file.name);
    if (AC && !o._forceWC) {
      const ctx = new AC();
      try {
        const a = await ctx.decodeAudioData(await file.arrayBuffer()), chs = [];
        for (let k = 0; k < Math.min(2, a.numberOfChannels); k++) chs.push(a.getChannelData(k));
        return { chs, rate: a.sampleRate };
      } catch (err) { /* coba jalur cadangan di bawah */ } finally { ctx.close && ctx.close(); }
    }
    if (MP4EXT.includes(e)) {
      try { return await decodeWithWebCodecs(await demuxAac(file), prog); }
      catch (err) { if (err.message !== 'nodecoder') throw err; }
      throw new Error('Browser Anda tidak bisa membaca suara dari "' + file.name + '" untuk dijadikan MP3/WAV. Pilih format "AAC" (tanpa konversi, tetap bisa diputar di HP), atau coba Chrome versi terbaru di komputer.');
    }
    throw new Error('Browser tidak bisa membaca suara dari "' + file.name + '". Coba format MP4/WEBM/MOV/MP3/WAV/M4A/OGG yang umum, atau gunakan Chrome/Edge.');
  }
  E.media2audio = async (files, o, prog) => {
    const out = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i], b = baseName(f.name), P = (x, m) => prog((i + x) / files.length, f.name + ' — ' + m);
      P(0, 'membaca…');
      if (o.to === 'aac') {
        if (!MP4EXT.includes(ext(f.name))) throw new Error('Format AAC hanya untuk file MP4/MOV/M4A. Untuk "' + f.name + '" pilih MP3 atau WAV.');
        out.push({ name: b + '.aac', blob: adtsBlob(await demuxAac(f)), note: 'Suara asli dari video, tidak dikonversi ulang.' }); continue;
      }
      const { chs, rate } = await getPcm(f, o, (x, m) => P(x * 0.5, m));
      const chN = chs.length;
      if (o.to === 'wav') { out.push({ name: b + '.wav', blob: wavBlob(chs, rate) }); continue; }
      try { await loadScript(CDN.lame); } catch (e) { throw new Error('Komponen MP3 gagal dimuat (periksa koneksi internet). Anda bisa memilih AAC atau WAV sebagai alternatif.'); }
      const kbps = +o.bitrate || 128, enc = new window.lamejs.Mp3Encoder(chN, rate, kbps);
      const L = floatTo16(chs[0]), R = chN > 1 ? floatTo16(chs[1]) : null, parts = [], step = 1152 * 20;
      for (let s = 0; s < L.length; s += step) {
        const buf = R ? enc.encodeBuffer(L.subarray(s, s + step), R.subarray(s, s + step)) : enc.encodeBuffer(L.subarray(s, s + step));
        if (buf.length) parts.push(new Uint8Array(buf));
        if ((s / step) % 25 === 0) { P(0.5 + 0.5 * (s / L.length), 'mengonversi ' + Math.round((s / L.length) * 100) + '%'); await tick(); }
      }
      const tail = enc.flush(); if (tail.length) parts.push(new Uint8Array(tail));
      out.push({ name: b + '.mp3', blob: new Blob(parts, { type: 'audio/mpeg' }) });
    }
    return out;
  };

  /* ================= ALAT GAMBAR: ubah ukuran, tanda air, kolase ================= */
  const pickFmt = (name, pick) => (pick && pick !== 'auto' ? pick : ext(name) === 'png' ? 'png' : ext(name) === 'webp' ? 'webp' : 'jpg');

  E.imgresize = async (files, o, prog) => {
    const out = [], W = Math.round(+o.width || 0), H = Math.round(+o.height || 0), pct = +o.percent || 100;
    for (let i = 0; i < files.length; i++) {
      prog(i / files.length, files[i].name);
      const src = await decodeImage(files[i]), { w, h } = dimsOf(src);
      let tw, th, sx = 0, sy = 0, sw = w, sh = h;
      if (o.mode === 'width') { if (!W) throw new Error('Isi lebar (px) yang diinginkan.'); tw = W; th = Math.round(h * W / w); }
      else if (o.mode === 'height') { if (!H) throw new Error('Isi tinggi (px) yang diinginkan.'); th = H; tw = Math.round(w * H / h); }
      else if (o.mode === 'fit') { if (!W || !H) throw new Error('Isi lebar dan tinggi maksimal (px).'); const k = Math.min(W / w, H / h); tw = Math.round(w * k); th = Math.round(h * k); }
      else if (o.mode === 'exact') { if (!W || !H) throw new Error('Isi lebar dan tinggi (px).'); tw = W; th = H; const k = Math.max(W / w, H / h); sw = W / k; sh = H / k; sx = (w - sw) / 2; sy = (h - sh) / 2; }
      else { tw = Math.round(w * pct / 100); th = Math.round(h * pct / 100); }
      tw = Math.max(1, tw); th = Math.max(1, th);
      if (tw * th > 80e6) throw new Error('Ukuran hasil terlalu besar (' + tw + ' × ' + th + ' px). Kecilkan ukuran target.');
      const fmt = pickFmt(files[i].name, o.to), mime = MIME[fmt], c = newCanvas(tw, th), ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tw, th); }
      ctx.drawImage(src, sx, sy, sw, sh, 0, 0, tw, th);
      out.push({ name: baseName(files[i].name) + '-' + tw + 'x' + th + '.' + fmt, blob: await toBlob(c, mime, (+o.quality || 90) / 100), note: w + ' × ' + h + ' → ' + tw + ' × ' + th + ' px' });
      await tick();
    }
    return out;
  };

  E.watermark = async (files, o, prog) => {
    const text = String(o.text || '').trim();
    if (!text) throw new Error('Isi teks tanda air terlebih dahulu.');
    const out = [];
    for (let i = 0; i < files.length; i++) {
      prog(i / files.length, files[i].name);
      const src = await decodeImage(files[i]), fmt = pickFmt(files[i].name, o.to), mime = MIME[fmt];
      const c = drawScaled(src, 1, mime === 'image/jpeg'), ctx = c.getContext('2d'), W = c.width, H = c.height;
      const fs = Math.max(12, Math.round(W * (+o.size || 5) / 100));
      const dark = o.color === 'black';
      ctx.font = '700 ' + fs + 'px "Plus Jakarta Sans", Inter, Arial, sans-serif';
      ctx.globalAlpha = Math.min(1, Math.max(0.05, (+o.opacity || 50) / 100));
      ctx.fillStyle = dark ? '#000' : '#fff'; ctx.strokeStyle = dark ? '#fff' : '#000'; ctx.lineWidth = Math.max(1, fs / 14); ctx.lineJoin = 'round';
      if (o.pos === 'tile') {
        ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 6); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const stepX = ctx.measureText(text).width + fs * 2, stepY = fs * 3, diag = Math.hypot(W, H);
        for (let y = -diag / 2, r = 0; y < diag / 2; y += stepY, r++) for (let x = -diag / 2 + (r % 2 ? stepX / 2 : 0); x < diag / 2; x += stepX) { ctx.strokeText(text, x, y); ctx.fillText(text, x, y); }
        ctx.restore();
      } else {
        const m = fs * 0.6, p = o.pos || 'br';
        ctx.textAlign = p.endsWith('l') ? 'left' : p.endsWith('r') ? 'right' : 'center';
        ctx.textBaseline = p.startsWith('t') ? 'top' : p.startsWith('b') ? 'bottom' : 'middle';
        const x = p.endsWith('l') ? m : p.endsWith('r') ? W - m : W / 2, y = p.startsWith('t') ? m : p.startsWith('b') ? H - m : H / 2;
        ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
      }
      out.push({ name: baseName(files[i].name) + '-tandaair.' + fmt, blob: await toBlob(c, mime, 0.92) });
      await tick();
    }
    return out;
  };

  E.collage = async (files, o, prog) => {
    const n = files.length;
    if (n < 2) throw new Error('Pilih minimal 2 foto untuk dibuat kolase.');
    if (n > 12) throw new Error('Maksimal 12 foto per kolase.');
    const W = +o.width || 1500, gap = Math.round(W * (o.gap === undefined || o.gap === '' || isNaN(+o.gap) ? 2 : +o.gap) / 100), ratio = +o.ratio || 1;
    const cols = o.layout === 'row' ? n : o.layout === 'col' ? 1 : o.layout === 'c2' ? Math.min(2, n) : o.layout === 'c3' ? Math.min(3, n) : Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols), cw = Math.floor((W - gap * (cols + 1)) / cols), ch = Math.round(cw / ratio), H = rows * ch + gap * (rows + 1);
    if (cw < 20) throw new Error('Terlalu banyak foto dalam satu baris untuk lebar ini. Pilih tata letak lain.');
    if (W * H > 60e6) throw new Error('Kolase terlalu besar. Kecilkan lebar atau pilih tata letak lain.');
    const BG = { white: '#ffffff', black: '#111111', gray: '#e2e8f0', indigo: '#4F46E5', amber: '#F59E0B' };
    const c = newCanvas(W, H), ctx = c.getContext('2d'); ctx.fillStyle = BG[o.bg] || '#fff'; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingQuality = 'high';
    for (let i = 0; i < n; i++) {
      prog(i / n, files[i].name);
      const src = await decodeImage(files[i]), { w, h } = dimsOf(src), k = Math.max(cw / w, ch / h), sw = cw / k, sh = ch / k;
      const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - cols * (rows - 1) : cols, shift = (cols - inRow) * (cw + gap) / 2;
      ctx.drawImage(src, (w - sw) / 2, (h - sh) / 2, sw, sh, Math.round(gap + (i % cols) * (cw + gap) + shift), gap + r * (ch + gap), cw, ch);
      await tick();
    }
    const fmt = o.to === 'png' ? 'png' : 'jpg';
    return [{ name: 'kolase-ubahin.' + fmt, blob: await toBlob(c, MIME[fmt], 0.92), note: W + ' × ' + H + ' px' }];
  };

  /* ================= ALAT VIDEO ================= */
  const NOVID = 'Browser tidak bisa membaca video ini. Coba video MP4 (H.264) atau WEBM, dan gunakan Chrome atau Edge versi terbaru.';
  function parseTime(v, dflt) {
    if (v === undefined || v === null || String(v).trim() === '') return dflt;
    const s = String(v).trim().replace(',', '.');
    const val = s.includes(':') ? s.split(':').map(Number).reduce((a, x) => a * 60 + x, 0) : Number(s);
    if (isNaN(val) || val < 0) throw new Error('Format waktu tidak valid: "' + v + '". Contoh: 90 (detik) atau 1:30');
    return val;
  }
  function closeVideo(v) { try { v.pause(); } catch (e) { /* abaikan */ } v.removeAttribute('src'); try { v.load(); } catch (e) { /* abaikan */ } v.remove(); URL.revokeObjectURL(v._url); }
  function openVideo(file) {
    return new Promise((res, rej) => {
      const v = document.createElement('video'), url = URL.createObjectURL(file);
      v.muted = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('playsinline', ''); v._url = url;
      v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
      let t;
      const fail = () => { clearTimeout(t); closeVideo(v); rej(new Error(NOVID)); };
      t = setTimeout(fail, 25000);
      v.onerror = fail;
      v.onloadedmetadata = async () => {
        if (!v.videoWidth) return fail();
        if (!isFinite(v.duration)) { // WEBM tanpa durasi
          await new Promise((r) => { v.ontimeupdate = () => { v.ontimeupdate = null; r(); }; v.currentTime = 1e101; setTimeout(r, 3000); });
          v.currentTime = 0;
        }
        if (!isFinite(v.duration) || v.duration <= 0) return fail();
        clearTimeout(t); res(v);
      };
      v.src = url; document.body.appendChild(v);
    });
  }
  function seekTo(v, t) {
    return new Promise((res) => {
      if (Math.abs(v.currentTime - t) < 0.001 && v.readyState >= 2) return res();
      const done = () => { v.removeEventListener('seeked', done); clearTimeout(to); res(); };
      const to = setTimeout(done, 5000);
      v.addEventListener('seeked', done); v.currentTime = t;
    });
  }

  /* --- encoder GIF (palet global median-cut + LZW) --- */
  function buildPalette(hist) {
    const cols = []; for (let i = 0; i < 32768; i++) if (hist[i]) cols.push(i);
    const sum = (a) => a.reduce((s, c) => s + hist[c], 0);
    const boxes = [{ cols, n: sum(cols) }];
    while (boxes.length < 256) {
      let bi = -1, best = 0; boxes.forEach((b, i) => { if (b.cols.length > 1 && b.n > best) { best = b.n; bi = i; } });
      if (bi < 0) break;
      const b = boxes[bi], mn = [31, 31, 31], mx = [0, 0, 0];
      for (const c of b.cols) { const r = [(c >> 10) & 31, (c >> 5) & 31, c & 31]; for (let k = 0; k < 3; k++) { if (r[k] < mn[k]) mn[k] = r[k]; if (r[k] > mx[k]) mx[k] = r[k]; } }
      const ch = [0, 1, 2].sort((a, c) => (mx[c] - mn[c]) - (mx[a] - mn[a]))[0], sh = [10, 5, 0][ch];
      b.cols.sort((a, c) => ((a >> sh) & 31) - ((c >> sh) & 31));
      let acc = 0, cut = 0; for (; cut < b.cols.length - 1; cut++) { acc += hist[b.cols[cut]]; if (acc >= b.n / 2) break; }
      const a1 = b.cols.slice(0, cut + 1), a2 = b.cols.slice(cut + 1);
      boxes.splice(bi, 1, { cols: a1, n: sum(a1) }, { cols: a2, n: sum(a2) });
    }
    const pal = new Uint8Array(768);
    boxes.forEach((b, i) => {
      let r = 0, g = 0, bl = 0, n = 0; for (const c of b.cols) { const w = hist[c]; r += ((c >> 10) & 31) * w; g += ((c >> 5) & 31) * w; bl += (c & 31) * w; n += w; }
      const f = (v) => { const x = Math.round(v / n); return (x << 3) | (x >> 2); };
      pal[i * 3] = f(r); pal[i * 3 + 1] = f(g); pal[i * 3 + 2] = f(bl);
    });
    return pal;
  }
  function lzwGif(idx, minCode) { // mengikuti pola omggif
    const clear = 1 << minCode, eoi = clear + 1, out = new Uint8Array(Math.ceil(idx.length * 1.6) + 1024);
    let p = 0, next = eoi + 1, size = minCode + 1, cur = 0, shift = 0, table = new Int16Array(4096 * 256);
    const emit = (code) => { cur |= code << shift; shift += size; while (shift >= 8) { out[p++] = cur & 255; cur >>= 8; shift -= 8; } };
    emit(clear);
    let ib = idx[0];
    for (let i = 1; i < idx.length; i++) {
      const k = idx[i], key = (ib << 8) | k, c = table[key];
      if (c === 0) {
        emit(ib);
        if (next === 4096) { emit(clear); next = eoi + 1; size = minCode + 1; table.fill(0); }
        else { if (next >= (1 << size)) size++; table[key] = next++; }
        ib = k;
      } else ib = c;
    }
    emit(ib); emit(eoi); if (shift > 0) out[p++] = cur & 255;
    return out.subarray(0, p);
  }
  function gifBlob(frames, w, h, pal, delayCs) {
    const parts = [], u16 = (n) => [n & 255, (n >> 8) & 255];
    parts.push(new Uint8Array([71, 73, 70, 56, 57, 97, ...u16(w), ...u16(h), 0xf7, 0, 0]), pal);
    parts.push(new Uint8Array([0x21, 0xff, 0x0b, 78, 69, 84, 83, 67, 65, 80, 69, 50, 46, 48, 3, 1, 0, 0, 0]));
    for (const f of frames) {
      parts.push(new Uint8Array([0x21, 0xf9, 4, 0x04, ...u16(delayCs), 0, 0, 0x2c, 0, 0, 0, 0, ...u16(w), ...u16(h), 0, 8]));
      const data = lzwGif(f, 8);
      for (let o = 0; o < data.length; o += 255) { const n = Math.min(255, data.length - o), blk = new Uint8Array(n + 1); blk[0] = n; blk.set(data.subarray(o, o + n), 1); parts.push(blk); }
      parts.push(new Uint8Array([0]));
    }
    parts.push(new Uint8Array([0x3b]));
    return new Blob(parts, { type: 'image/gif' });
  }

  E.video2gif = async (files, o, prog) => {
    const out = [];
    for (let f = 0; f < files.length; f++) {
      const v = await openVideo(files[f]);
      try {
        const dur = v.duration, start = parseTime(o.start, 0);
        if (start >= dur) throw new Error('Waktu mulai (' + start + ' dtk) melebihi durasi video (' + dur.toFixed(1) + ' dtk).');
        const len = Math.min(Math.max(parseTime(o.duration, 5), 0.5), 20, dur - start), fps = +o.fps || 10;
        const width = Math.min(+o.width || 480, v.videoWidth), height = Math.max(1, Math.round(v.videoHeight * width / v.videoWidth)), n = Math.max(1, Math.floor(len * fps));
        if (n * width * height > 150e6) throw new Error('GIF terlalu besar. Kecilkan lebar, durasi, atau frame per detik.');
        const c = newCanvas(width, height), ctx = c.getContext('2d', { willReadFrequently: true }), raw = [], hist = new Uint32Array(32768);
        for (let i = 0; i < n; i++) {
          prog((f + (i / n) * 0.6) / files.length, files[f].name + ' — mengambil frame ' + (i + 1) + '/' + n);
          await seekTo(v, Math.min(start + i / fps, dur - 0.05));
          ctx.drawImage(v, 0, 0, width, height);
          const d = ctx.getImageData(0, 0, width, height).data; raw.push(d);
          if (i % 2 === 0) for (let q = 0; q < d.length; q += 16) hist[((d[q] >> 3) << 10) | ((d[q + 1] >> 3) << 5) | (d[q + 2] >> 3)]++;
        }
        prog((f + 0.65) / files.length, 'Membuat palet warna…'); await tick();
        const pal = buildPalette(hist), lut = new Int16Array(32768).fill(-1);
        const near = (key) => {
          const r = ((key >> 10) & 31) << 3 | 4, g = ((key >> 5) & 31) << 3 | 4, b = (key & 31) << 3 | 4; let best = 0, bd = 1e9;
          for (let i = 0; i < 256; i++) { const dr = pal[i * 3] - r, dg = pal[i * 3 + 1] - g, db = pal[i * 3 + 2] - b, d = dr * dr + dg * dg + db * db; if (d < bd) { bd = d; best = i; } }
          return best;
        };
        const frames = [];
        for (let i = 0; i < n; i++) {
          const d = raw[i], idx = new Uint8Array(width * height);
          for (let p = 0, q = 0; p < idx.length; p++, q += 4) { const key = ((d[q] >> 3) << 10) | ((d[q + 1] >> 3) << 5) | (d[q + 2] >> 3); let v2 = lut[key]; if (v2 < 0) v2 = lut[key] = near(key); idx[p] = v2; }
          frames.push(idx); raw[i] = null;
          if (i % 5 === 0) { prog((f + 0.7 + 0.3 * (i / n)) / files.length, 'Menyusun GIF…'); await tick(); }
        }
        const blob = gifBlob(frames, width, height, pal, Math.round(100 / fps));
        out.push({ name: baseName(files[f].name) + '.gif', blob, note: width + ' × ' + height + ' px, ' + n + ' frame, ' + (n / fps).toFixed(1) + ' dtk' });
      } finally { closeVideo(v); }
    }
    return out;
  };

  /* --- rekam ulang video (pangkas & kompres) — berjalan seiring durasi video --- */
  const REC_TYPES = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  async function recordClip(file, o, prog) {
    if (!window.MediaRecorder) throw new Error('Browser ini belum mendukung perekaman video. Gunakan Chrome, Edge, atau Safari terbaru.');
    const mime = REC_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    if (!mime) throw new Error('Browser ini tidak mendukung format keluaran video.');
    const v = await openVideo(file); let ac = null, stream = null, rec = null;
    try {
      const dur = v.duration, start = parseTime(o.start, 0), end = Math.min(parseTime(o.end, dur), dur);
      if (start >= dur) throw new Error('Waktu mulai (' + start + ' dtk) melebihi durasi video (' + dur.toFixed(1) + ' dtk).');
      if (end - start < 0.3) throw new Error('Rentang waktu terlalu pendek. Pastikan "Selesai" lebih besar dari "Mulai".');
      const k = o.maxH && v.videoHeight > +o.maxH ? +o.maxH / v.videoHeight : 1;
      const w = Math.max(2, Math.round(v.videoWidth * k / 2) * 2), h = Math.max(2, Math.round(v.videoHeight * k / 2) * 2);
      const c = newCanvas(w, h), ctx = c.getContext('2d', { alpha: false }), fps = Math.min(+o.fps || 30, 30);
      stream = c.captureStream(fps);
      let mutedFallback = false;
      if (!o.mute) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext; ac = new AC();
          const srcNode = ac.createMediaElementSource(v), dest = ac.createMediaStreamDestination(); srcNode.connect(dest);
          v.muted = false; v.volume = 1; stream.addTrack(dest.stream.getAudioTracks()[0]); await ac.resume();
        } catch (e) { mutedFallback = true; }
      }
      const bps = o.vbps || Math.min(10e6, Math.max(6e5, (file.size * 8 / dur) * 1.2));
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.round(bps), audioBitsPerSecond: o.abps || 128000 });
      const chunks = []; rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      await seekTo(v, start);
      ctx.drawImage(v, 0, 0, w, h);
      let stop = false;
      const draw = () => { if (stop) return; ctx.drawImage(v, 0, 0, w, h); v.requestVideoFrameCallback ? v.requestVideoFrameCallback(draw) : requestAnimationFrame(draw); };
      rec.start(500); draw();
      try { await v.play(); } catch (e) { v.muted = true; mutedFallback = true; await v.play(); }
      await new Promise((resolve) => {
        const hard = setTimeout(resolve, ((end - start) * 2 + 60) * 1000);
        const iv = setInterval(() => {
          const cur = v.currentTime;
          prog(Math.min(0.99, (cur - start) / (end - start)), 'Memproses ' + Math.round(Math.min(1, (cur - start) / (end - start)) * 100) + '% — biarkan tab ini tetap terbuka');
          if (cur >= end - 0.05 || v.ended || (v.paused && cur > start)) { clearInterval(iv); clearTimeout(hard); resolve(); }
        }, 150);
      });
      stop = true; v.pause(); await tick();
      if (rec.state !== 'inactive') rec.stop();
      await stopped;
      const blob = new Blob(chunks, { type: mime.split(';')[0] });
      if (!blob.size) throw new Error('Perekaman gagal menghasilkan video. Coba lagi dengan video yang lebih pendek.');
      return { blob, ext: (rec.mimeType || mime).startsWith('video/mp4') ? 'mp4' : 'webm', mutedFallback, w, h };
    } finally {
      try { stream && stream.getTracks().forEach((t) => t.stop()); } catch (e) { /* abaikan */ }
      try { ac && ac.close(); } catch (e) { /* abaikan */ }
      closeVideo(v);
    }
  }
  E.videotrim = async (files, o, prog) => {
    const out = [];
    for (let i = 0; i < files.length; i++) {
      const r = await recordClip(files[i], { start: o.start, end: o.end }, (x, m) => prog((i + x) / files.length, files[i].name + ' — ' + m));
      out.push({ name: baseName(files[i].name) + '-pangkas.' + r.ext, blob: r.blob, before: files[i].size, note: r.mutedFallback ? 'Suara tidak ikut terekam di browser ini.' : '' });
    }
    return out;
  };
  const VPRESET = { 720: [720, 2.5e6, 96000], 480: [480, 1.1e6, 80000], 360: [360, 6e5, 64000], 240: [240, 3e5, 48000] };
  E.videocompress = async (files, o, prog) => {
    const [maxH, vbps, abps] = VPRESET[o.preset] || VPRESET[480], out = [];
    for (let i = 0; i < files.length; i++) {
      const r = await recordClip(files[i], { maxH, vbps, abps, mute: o.mute === 'yes', fps: 30 }, (x, m) => prog((i + x) / files.length, files[i].name + ' — ' + m));
      const small = r.blob.size < files[i].size;
      out.push({ name: baseName(files[i].name) + '-kecil.' + r.ext, blob: small ? r.blob : files[i], before: files[i].size, note: small ? (r.mutedFallback ? 'Suara tidak ikut terekam di browser ini.' : '') : 'Video sudah sangat efisien; ukuran asli dipertahankan.' });
    }
    return out;
  };

  async function zip(results) {
    const Z = await JSZipLib(), z = new Z(), seen = {};
    results.forEach((r) => {
      let n = r.name; if (seen[n]) { const e = ext(n); n = baseName(n) + '-' + (++seen[r.name]) + '.' + e; } else seen[n] = 1;
      z.file(n, r.blob);
    });
    return z.generateAsync({ type: 'blob' });
  }

  window.UbahinEngines = { run: (kind, files, opts, prog) => { if (!E[kind]) throw new Error('Mesin tidak dikenal: ' + kind); return E[kind](files, opts || {}, prog || (() => {})); }, zip, ext, baseName, parsePages, util: { decodeImage, toBlob, drawScaled, dimsOf, MIME, newCanvas } };
})();
