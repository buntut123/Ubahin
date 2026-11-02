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
  E.media2audio = async (files, o, prog) => {
    const out = [], AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('Browser ini tidak mendukung pemrosesan audio.');
    for (let i = 0; i < files.length; i++) {
      prog(i / files.length, files[i].name + ' — membaca suara…');
      const ctx = new AC();
      let audio;
      try { audio = await ctx.decodeAudioData(await files[i].arrayBuffer()); }
      catch (e) { throw new Error('Browser tidak bisa membaca suara dari "' + files[i].name + '". Coba format MP4/WEBM/MOV/MP3/WAV/M4A/OGG yang umum, atau gunakan Chrome/Edge.'); }
      finally { ctx.close && ctx.close(); }
      const chN = Math.min(2, audio.numberOfChannels), chs = [];
      for (let k = 0; k < chN; k++) chs.push(audio.getChannelData(k));
      const b = baseName(files[i].name);
      if (o.to === 'wav') { out.push({ name: b + '.wav', blob: wavBlob(chs, audio.sampleRate) }); continue; }
      try { await loadScript(CDN.lame); } catch (e) { throw new Error('Komponen MP3 gagal dimuat (periksa koneksi internet). Anda bisa memilih WAV sebagai alternatif.'); }
      const kbps = +o.bitrate || 128, enc = new window.lamejs.Mp3Encoder(chN, audio.sampleRate, kbps);
      const L = floatTo16(chs[0]), R = chN > 1 ? floatTo16(chs[1]) : null, parts = [], step = 1152 * 20;
      for (let s = 0; s < L.length; s += step) {
        const buf = R ? enc.encodeBuffer(L.subarray(s, s + step), R.subarray(s, s + step)) : enc.encodeBuffer(L.subarray(s, s + step));
        if (buf.length) parts.push(new Uint8Array(buf));
        if ((s / step) % 25 === 0) { prog((i + s / L.length) / files.length, files[i].name + ' — mengonversi ' + Math.round((s / L.length) * 100) + '%'); await tick(); }
      }
      const tail = enc.flush(); if (tail.length) parts.push(new Uint8Array(tail));
      out.push({ name: b + '.mp3', blob: new Blob(parts, { type: 'audio/mpeg' }) });
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

  window.UbahinEngines = { run: (kind, files, opts, prog) => { if (!E[kind]) throw new Error('Mesin tidak dikenal: ' + kind); return E[kind](files, opts || {}, prog || (() => {})); }, zip, ext, baseName, parsePages };
})();
