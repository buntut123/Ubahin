/* Ubahin — alat potong gambar interaktif (sentuh & mouse). Diproses di browser. */
(function () {
  'use strict';
  const root = document.getElementById('crop-tool'); if (!root) return;
  const Eng = window.UbahinEngines, U = Eng && Eng.util;
  if (!U) { root.innerHTML = '<div class="alert err" style="display:block">Berkas situs di perangkat Anda belum yang terbaru. Muat ulang halaman, atau hapus cache browser lalu coba lagi.</div>'; return; }
  const ACCEPT = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'avif'];
  const fmt = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  root.innerHTML = `
  <div class="drop-zone" id="cdz" role="button" tabindex="0" aria-label="Pilih gambar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
    <div class="big">Seret gambar ke sini atau klik untuk memilih</div><small>JPG, PNG, WEBP, HEIC · maks. 200 MB</small>
  </div>
  <input type="file" id="cfi" class="sr" accept="${ACCEPT.map((e) => '.' + e).join(',')}" tabindex="-1">
  <div class="alert" id="cal" role="alert"></div>
  <div id="cwork" hidden>
    <div class="opts">
      <div class="opt"><label for="casp">Bentuk potongan</label><select id="casp">
        <option value="free">Bebas</option><option value="1">Persegi 1:1</option><option value="0.75">3:4 (pas foto 3×4)</option><option value="0.6667">2:3 (pas foto 4×6)</option>
        <option value="1.3333">4:3</option><option value="1.5">3:2</option><option value="1.7778">16:9 (lanskap)</option><option value="0.5625">9:16 (cerita/reels)</option></select></div>
      <div class="opt"><label for="cfmt">Format hasil</label><select id="cfmt"><option value="jpg">JPG</option><option value="png">PNG</option><option value="webp">WEBP</option></select></div>
    </div>
    <div class="crop-stage" id="stage"><canvas id="cv"></canvas><div class="cbox" id="box"><i class="tl" data-h="tl"></i><i class="tr" data-h="tr"></i><i class="bl" data-h="bl"></i><i class="br" data-h="br"></i></div></div>
    <div class="crop-info" id="cinfo">Geser kotak untuk memindahkan, tarik titik di sudut untuk mengubah ukuran.</div>
    <div class="actions"><button class="btn btn-primary" id="cgo" type="button">Potong gambar</button><button class="btn btn-ghost" id="cchg" type="button">Ganti gambar</button></div>
    <div class="status" id="cst" aria-live="polite"></div>
  </div>
  <div class="results" id="crs"><h3>Selesai! 🎉</h3><div id="crl"></div><div class="actions"><button class="btn btn-ghost" id="cagain" type="button">Potong lagi</button></div></div>`;

  const $ = (s) => root.querySelector(s);
  const dz = $('#cdz'), fi = $('#cfi'), al = $('#cal'), work = $('#cwork'), stage = $('#stage'), cv = $('#cv'), box = $('#box'), info = $('#cinfo'), asp = $('#casp'), fm = $('#cfmt'), st = $('#cst'), rs = $('#crs'), rl = $('#crl');
  let img = null, name = 'gambar', dW = 0, dH = 0, nat = { w: 0, h: 0 }, R = { x: 0, y: 0, w: 0, h: 0 }, drag = null, url = null;
  const showErr = (m) => { al.className = 'alert err'; al.textContent = m; }; const clr = () => { al.className = 'alert'; al.textContent = ''; };
  const ratio = () => (asp.value === 'free' ? null : parseFloat(asp.value));

  function layout() {
    const maxW = Math.min(stage.parentElement.clientWidth || 600, 760), maxH = Math.max(280, Math.round(window.innerHeight * 0.6));
    const k = Math.min(maxW / nat.w, maxH / nat.h, 1);
    dW = Math.max(60, Math.round(nat.w * k)); dH = Math.max(60, Math.round(nat.h * k));
    cv.width = dW; cv.height = dH; cv.style.width = dW + 'px'; cv.style.height = dH + 'px'; stage.style.width = dW + 'px';
    const c = cv.getContext('2d'); c.drawImage(img, 0, 0, dW, dH);
  }
  function fitRatio(cx, cy, w, h, r) { // pertahankan pusat, sesuaikan ke rasio r dan muat di dalam gambar
    if (r) { if (w / h > r) w = h * r; else h = w / r; const m = Math.min(dW / w, dH / h, 1); w *= m; h *= m; }
    w = Math.min(w, dW); h = Math.min(h, dH);
    R = { x: Math.min(Math.max(cx - w / 2, 0), dW - w), y: Math.min(Math.max(cy - h / 2, 0), dH - h), w, h };
  }
  function paint() {
    box.style.left = R.x + 'px'; box.style.top = R.y + 'px'; box.style.width = R.w + 'px'; box.style.height = R.h + 'px';
    const k = nat.w / dW; info.textContent = 'Area potongan: ' + Math.round(R.w * k) + ' × ' + Math.round(R.h * k) + ' px';
  }
  function reset() { fitRatio(dW / 2, dH / 2, dW * 0.8, dH * 0.8, ratio()); paint(); }

  async function load(file) {
    clr(); rs.style.display = 'none';
    if (!ACCEPT.includes(Eng.ext(file.name))) return showErr('Format tidak didukung. Gunakan JPG, PNG, WEBP, atau HEIC.');
    if (file.size > 200 * 1048576) return showErr('File terlalu besar (maks 200 MB).');
    st.textContent = '';
    try { img = await U.decodeImage(file); } catch (e) { return showErr(e.message || 'Gambar tidak bisa dibaca.'); }
    const d = U.dimsOf(img); nat = { w: d.w, h: d.h }; name = Eng.baseName(file.name);
    dz.style.display = 'none'; work.hidden = false; layout(); reset();
  }

  /* ---- interaksi pointer ---- */
  const pos = (e) => { const b = stage.getBoundingClientRect(); return { x: Math.min(Math.max(e.clientX - b.left, 0), dW), y: Math.min(Math.max(e.clientY - b.top, 0), dH) }; };
  box.addEventListener('pointerdown', (e) => {
    e.preventDefault(); box.setPointerCapture(e.pointerId); const p = pos(e), h = e.target.dataset && e.target.dataset.h;
    if (h) { const ax = h.endsWith('l') ? R.x + R.w : R.x, ay = h.startsWith('t') ? R.y + R.h : R.y; drag = { mode: 'resize', ax, ay }; }
    else drag = { mode: 'move', dx: p.x - R.x, dy: p.y - R.y };
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag) return; const p = pos(e), r = ratio();
    if (drag.mode === 'move') { R.x = Math.min(Math.max(p.x - drag.dx, 0), dW - R.w); R.y = Math.min(Math.max(p.y - drag.dy, 0), dH - R.h); }
    else {
      const sx = p.x >= drag.ax ? 1 : -1, sy = p.y >= drag.ay ? 1 : -1, spaceX = sx > 0 ? dW - drag.ax : drag.ax, spaceY = sy > 0 ? dH - drag.ay : drag.ay;
      let w = Math.max(24, Math.abs(p.x - drag.ax)), h = Math.max(24, Math.abs(p.y - drag.ay));
      if (r) { h = w / r; if (Math.abs(p.y - drag.ay) > h) { h = Math.abs(p.y - drag.ay); w = h * r; } const m = Math.min(spaceX / w, spaceY / h, 1); w *= m; h *= m; }
      else { w = Math.min(w, spaceX); h = Math.min(h, spaceY); }
      R = { x: sx > 0 ? drag.ax : drag.ax - w, y: sy > 0 ? drag.ay : drag.ay - h, w, h };
    }
    paint();
  });
  const end = () => { drag = null; };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  asp.addEventListener('change', () => { if (img) { fitRatio(R.x + R.w / 2, R.y + R.h / 2, R.w, R.h, ratio()); paint(); } });
  window.addEventListener('resize', () => { if (!img || work.hidden) return; const k = dW; layout(); const f = dW / k; R = { x: R.x * f, y: R.y * f, w: R.w * f, h: R.h * f }; paint(); });

  /* ---- hasil ---- */
  $('#cgo').addEventListener('click', async () => {
    clr(); st.textContent = 'Memotong…';
    try {
      const k = nat.w / dW, sx = Math.max(0, Math.round(R.x * k)), sy = Math.max(0, Math.round(R.y * k));
      const sw = Math.max(1, Math.min(nat.w - sx, Math.round(R.w * k))), sh = Math.max(1, Math.min(nat.h - sy, Math.round(R.h * k)));
      const f = fm.value, mime = U.MIME[f], c = U.newCanvas(sw, sh), ctx = c.getContext('2d');
      if (mime === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, sw, sh); }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const blob = await U.toBlob(c, mime, 0.92);
      if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob);
      const fname = name + '-potong.' + f;
      rl.innerHTML = `<div class="res"><img class="thumb" src="${url}" alt=""><div class="meta"><div class="name">${esc(fname)}</div><div class="sub">${sw} × ${sh} px · ${fmt(blob.size)}</div></div><a class="btn btn-primary btn-sm" href="${url}" download="${esc(fname)}">Unduh</a></div>`;
      rs.style.display = 'block'; work.hidden = true; st.textContent = '';
      rs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) { st.textContent = ''; showErr(e.message || 'Gagal memotong gambar.'); }
  });
  const again = () => { img = null; work.hidden = true; rs.style.display = 'none'; dz.style.display = ''; clr(); };
  $('#cagain').addEventListener('click', again); $('#cchg').addEventListener('click', again);

  /* ---- pilih file ---- */
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });
  fi.addEventListener('change', () => { if (fi.files[0]) load(fi.files[0]); fi.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => root.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => root.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
  root.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });
  window.__ubahinReady = true;
})();
