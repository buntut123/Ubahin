/* Ubahin — antarmuka konverter. Konfigurasi dibaca dari window.UBAHIN (diisi per halaman). */
(function () {
  'use strict';
  const root = document.getElementById('tool');
  const cfg = window.UBAHIN;
  if (!root || !cfg) return;
  const Eng = window.UbahinEngines;
  const $ = (s, r) => (r || root).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const IMG = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'avif'];
  const kindOf = (n) => { const e = Eng.ext(n); return IMG.includes(e) ? 'img' : e === 'pdf' ? 'pdf' : 'media'; };
  const fmt = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(b < 10240 ? 1 : 0) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
  const maxBytes = (cfg.maxMB || 200) * 1048576;
  let files = [], running = false, lastResults = [];

  root.innerHTML = `
    <div class="drop-zone" id="dz" role="button" tabindex="0" aria-label="Pilih file atau seret file ke sini">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
      <div class="big">${esc(cfg.dropText || 'Seret file ke sini atau klik untuk memilih')}</div>
      <small>${esc(cfg.hint || '')}</small>
    </div>
    <input type="file" id="fi" class="sr" ${cfg.multiple ? 'multiple' : ''} accept="${cfg.accept.map((e) => '.' + e).join(',')}" tabindex="-1">
    <div class="alert" id="al" role="alert"></div>
    <div id="work" hidden>
      <div class="picked" id="list"></div>
      <div class="opts" id="opts"></div>
      <div class="actions"><button class="btn btn-primary" id="go" type="button"></button><button class="btn btn-ghost" id="more" type="button">+ Tambah file</button><button class="btn btn-ghost" id="clear" type="button">Kosongkan</button></div>
      <div class="progress" id="pg" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div></div></div>
      <div class="status" id="st" aria-live="polite"></div>
    </div>
    <div class="results" id="rs"><h3>Selesai! 🎉</h3><div id="rl"></div><div class="actions"><button class="btn btn-accent" id="zipbtn" type="button" hidden>Unduh semua (ZIP)</button><button class="btn btn-ghost" id="again" type="button">Ubah file lain</button></div></div>`;

  const dz = $('#dz'), fi = $('#fi'), al = $('#al'), work = $('#work'), list = $('#list'), optsEl = $('#opts');
  const go = $('#go'), pg = $('#pg'), st = $('#st'), rs = $('#rs'), rl = $('#rl');

  const showErr = (m, info) => { al.className = 'alert ' + (info ? 'info' : 'err'); al.textContent = m; };
  const clearErr = () => { al.className = 'alert'; al.textContent = ''; };

  /* ---- target & opsi ---- */
  function availableTargets() {
    if (!files.length) return cfg.targets;
    const ex = files.map((f) => Eng.ext(f.name));
    const t = cfg.targets.filter((t) => !t.exts || ex.every((e) => t.exts.includes(e)));
    return t.length ? t : cfg.targets;
  }
  let curTarget = null;
  function renderOpts() {
    const ts = availableTargets();
    if (!curTarget || !ts.includes(curTarget)) curTarget = ts[0];
    const prev = {}; optsEl.querySelectorAll('[data-o]').forEach((el) => { prev[el.dataset.o] = el.value; });
    let h = '';
    if (ts.length > 1) h += `<div class="opt"><label for="tg">Ubah ke</label><select id="tg">${ts.map((t) => `<option value="${t.id}" ${t === curTarget ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select></div>`;
    (curTarget.opts || []).forEach((o) => {
      const v = prev[o.id] !== undefined && !o._reset ? prev[o.id] : o.value;
      let inp;
      if (o.type === 'select') inp = `<select id="o_${o.id}" data-o="${o.id}">${o.options.map(([val, lab]) => `<option value="${val}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
      else if (o.type === 'range') inp = `<input type="range" id="o_${o.id}" data-o="${o.id}" min="${o.min}" max="${o.max}" step="${o.step || 1}" value="${v}"><div class="hint"><span id="rv_${o.id}">${v}</span>${esc(o.unit || '')}</div>`;
      else inp = `<input type="${o.type || 'text'}" id="o_${o.id}" data-o="${o.id}" value="${esc(v ?? '')}" placeholder="${esc(o.placeholder || '')}" ${o.min !== undefined ? 'min="' + o.min + '"' : ''}>`;
      h += `<div class="opt" ${o.showIf ? `data-sif="${o.showIf.id}" data-sin="${o.showIf.in.join(',')}"` : ''}><label for="o_${o.id}">${esc(o.label)}</label>${inp}${o.hint && o.type !== 'range' ? `<div class="hint">${esc(o.hint)}</div>` : ''}</div>`;
    });
    optsEl.innerHTML = h;
    const applyShow = () => optsEl.querySelectorAll('[data-sif]').forEach((d) => { const c = optsEl.querySelector('[data-o="' + d.dataset.sif + '"]'); d.style.display = c && d.dataset.sin.split(',').includes(c.value) ? '' : 'none'; });
    optsEl.onchange = applyShow; applyShow();
    optsEl.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => { $('#rv_' + r.dataset.o).textContent = r.value; }));
    const tg = $('#tg'); if (tg) tg.addEventListener('change', () => { curTarget = cfg.targets.find((t) => t.id === tg.value); renderOpts(); });
    go.textContent = curTarget.button || cfg.button || 'Ubah sekarang';
  }
  function collectOpts() {
    const o = Object.assign({}, curTarget.fixed || {});
    optsEl.querySelectorAll('[data-o]').forEach((el) => { o[el.dataset.o] = el.value; });
    return o;
  }

  /* ---- daftar file ---- */
  function renderList() {
    list.innerHTML = files.map((f, i) => `<div class="file"><div class="ext ${kindOf(f.name)}">${esc(Eng.ext(f.name).slice(0, 4))}</div><div class="meta"><div class="name">${esc(f.name)}</div><div class="sub">${fmt(f.size)}</div></div><span class="state" data-s="${i}"></span>${cfg.orderable && files.length > 1 ? `<button class="x" data-up="${i}" aria-label="Naikkan" ${i === 0 ? 'disabled' : ''}>↑</button><button class="x" data-dn="${i}" aria-label="Turunkan" ${i === files.length - 1 ? 'disabled' : ''}>↓</button>` : ''}<button class="x" data-rm="${i}" aria-label="Hapus ${esc(f.name)}">×</button></div>`).join('');
    work.hidden = !files.length;
    dz.style.display = files.length ? 'none' : '';
    $('#more').style.display = cfg.multiple ? '' : 'none';
    if (files.length) renderOpts();
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || running) return;
    if (b.dataset.rm !== undefined) files.splice(+b.dataset.rm, 1);
    else if (b.dataset.up !== undefined) { const i = +b.dataset.up; [files[i - 1], files[i]] = [files[i], files[i - 1]]; }
    else if (b.dataset.dn !== undefined) { const i = +b.dataset.dn; [files[i + 1], files[i]] = [files[i], files[i + 1]]; }
    renderList();
  });

  function addFiles(fl) {
    clearErr(); rs.style.display = 'none';
    const bad = [], big = [];
    let arr = Array.from(fl);
    if (!cfg.multiple) { arr = arr.slice(0, 1); files = []; }
    arr.forEach((f) => {
      if (!cfg.accept.includes(Eng.ext(f.name))) bad.push(f.name);
      else if (f.size > maxBytes) big.push(f.name);
      else files.push(f);
    });
    const msgs = [];
    if (bad.length) msgs.push('Format tidak didukung di halaman ini: ' + bad.slice(0, 3).join(', ') + (bad.length > 3 ? '…' : '') + '. Didukung: ' + cfg.accept.map((e) => e.toUpperCase()).join(', ') + '.');
    if (big.length) msgs.push('File terlalu besar (maks ' + (cfg.maxMB || 200) + ' MB): ' + big.slice(0, 3).join(', ') + '. Browser bisa kehabisan memori jika file sebesar itu diproses di perangkat.');
    if (msgs.length) showErr(msgs.join(' '));
    renderList();
  }

  /* ---- dropzone ---- */
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });
  fi.addEventListener('change', () => { addFiles(fi.files); fi.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => root.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => root.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
  root.addEventListener('drop', (e) => { if (!running && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  $('#more').addEventListener('click', () => fi.click());
  $('#clear').addEventListener('click', () => { if (running) return; files = []; clearErr(); renderList(); });

  /* ---- jalankan ---- */
  function setProg(p, label) {
    pg.style.display = 'block'; pg.firstElementChild.style.width = Math.round(p * 100) + '%'; pg.setAttribute('aria-valuenow', Math.round(p * 100));
    st.textContent = label || '';
  }
  go.addEventListener('click', async () => {
    if (running) return;
    clearErr();
    const min = curTarget.minFiles || 1;
    if (files.length < min) return showErr('Pilih minimal ' + min + ' file.');
    running = true; go.disabled = true; go.textContent = 'Memproses…';
    setProg(0, 'Menyiapkan…');
    try {
      const out = await Eng.run(curTarget.kind, files, collectOpts(), setProg);
      lastResults = out; showResults(out);
    } catch (e) {
      console.error(e);
      showErr(e && e.message ? e.message : 'Terjadi kesalahan saat memproses file.');
    } finally {
      running = false; go.disabled = false; go.textContent = curTarget.button || cfg.button || 'Ubah sekarang';
      pg.style.display = 'none'; st.textContent = '';
    }
  });

  const urls = [];
  function showResults(out) {
    urls.splice(0).forEach(URL.revokeObjectURL);
    rl.innerHTML = '';
    out.forEach((r, i) => {
      const url = URL.createObjectURL(r.blob); urls.push(url);
      const isImg = /^image\//.test(r.blob.type);
      const delta = r.before && r.before !== r.blob.size ? ` · ${fmt(r.before)} → ${fmt(r.blob.size)} (${r.blob.size < r.before ? '−' + Math.round((1 - r.blob.size / r.before) * 100) + '%' : 'tidak mengecil'})` : ' · ' + fmt(r.blob.size);
      const d = document.createElement('div'); d.className = 'res';
      d.innerHTML = `${isImg ? `<img class="thumb" src="${url}" alt="">` : ''}<div class="meta"><div class="name">${esc(r.name)}</div><div class="sub">${esc(delta.replace(/^ · /, ''))}${r.note ? ' — ' + esc(r.note) : ''}</div></div><a class="btn btn-primary btn-sm" href="${url}" download="${esc(r.name)}">Unduh</a>`;
      rl.appendChild(d);
    });
    $('#zipbtn').hidden = out.length < 2;
    rs.style.display = 'block'; work.hidden = true; dz.style.display = 'none';
    rs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  $('#zipbtn').addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true; b.textContent = 'Membuat ZIP…';
    try {
      const blob = await Eng.zip(lastResults), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'ubahin-hasil.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) { showErr('Gagal membuat ZIP: ' + err.message); }
    b.disabled = false; b.textContent = 'Unduh semua (ZIP)';
  });
  $('#again').addEventListener('click', () => { files = []; lastResults = []; rs.style.display = 'none'; clearErr(); renderList(); });

  renderList();
  window.__ubahinReady = true;
})();
