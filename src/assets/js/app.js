// Ubahin — controller UI. Membaca konfigurasi alat dari <script id="tool-config"> lalu membangun antarmuka.
import * as E from "./engine.js";

const MAX_MB = 200;
const MAX_FILES = 50;
const ICON_UPLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>';
const ICON_LOCK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

/* ---------- helper DOM (tanpa innerHTML untuk data pengguna) ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}
function staticSvg(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstChild;
}
let uid = 0;

/* ---------- definisi jenis alat ---------- */
const IMG_FORMATS = [["jpg", "JPG"], ["png", "PNG"], ["webp", "WEBP"]];
const RANGE_HINT = "Contoh: 1,3-5 (halaman 1, lalu 3 sampai 5)";

const kinds = {
  "img-convert": {
    accepts: "image", multiple: true, mode: () => "each",
    schema: (cfg) => [
      cfg.to ? null : { id: "to", label: "Ubah ke", type: "select", options: IMG_FORMATS, value: "jpg" },
      { id: "quality", label: "Kualitas", type: "range", min: 50, max: 100, step: 1, value: 92, hint: "Makin tinggi makin tajam, tapi ukuran file makin besar.", showIf: (v) => (cfg.to || v.to) !== "png" },
    ].filter(Boolean),
    runOne: async (file, v, cfg) => [await E.convertImage(file, { format: cfg.to || v.to, quality: v.quality / 100 })],
  },
  "img-compress": {
    accepts: "image", multiple: true, mode: () => "each",
    schema: () => [
      { id: "target", label: "Ukuran maksimal", type: "select", value: "500", options: [["100", "≤ 100 KB"], ["200", "≤ 200 KB"], ["300", "≤ 300 KB"], ["500", "≤ 500 KB"], ["1024", "≤ 1 MB"], ["2048", "≤ 2 MB"], ["0", "Atur kualitas sendiri"]], hint: "Cocok untuk syarat unggah berkas (CPNS, beasiswa, KTP online)." },
      { id: "quality", label: "Kualitas", type: "range", min: 30, max: 95, step: 1, value: 75, showIf: (v) => v.target === "0" },
      { id: "maxDim", label: "Perkecil dimensi", type: "select", value: "0", options: [["0", "Biarkan ukuran asli"], ["3000", "Maks. 3000 px"], ["2000", "Maks. 2000 px"], ["1600", "Maks. 1600 px"], ["1280", "Maks. 1280 px"], ["1024", "Maks. 1024 px"]] },
      { id: "format", label: "Format hasil", type: "select", value: "jpg", options: [["jpg", "JPG (paling kompatibel)"], ["webp", "WEBP (lebih kecil)"]] },
    ],
    runOne: async (file, v, cfg, prog) => [await E.compressImage(file, { targetKB: +v.target, quality: v.quality / 100, maxDim: +v.maxDim, format: v.format }, prog)],
  },
  "img-to-pdf": {
    accepts: "image", multiple: true, ordered: true, mode: () => "all",
    schema: () => [{ id: "pageSize", label: "Ukuran halaman", type: "select", value: "a4", options: [["a4", "A4 (dengan margin)"], ["auto", "Sesuai ukuran gambar"]] }],
    runAll: async (files, v, cfg, prog) => [await E.imagesToPdf(files, { pageSize: v.pageSize }, prog)],
    hint: "Urutan halaman mengikuti urutan daftar. Gunakan tombol panah untuk mengubahnya.",
  },
  "pdf-to-img": {
    accepts: "pdf", multiple: true, mode: () => "each",
    schema: (cfg) => [
      { id: "format", label: "Format gambar", type: "select", value: cfg.to || "jpg", options: [["jpg", "JPG"], ["png", "PNG"]] },
      { id: "scale", label: "Ketajaman", type: "select", value: "2", options: [["1.5", "Standar (≈108 dpi)"], ["2", "Tinggi (≈144 dpi)"], ["3", "Sangat tinggi (≈216 dpi)"]] },
    ],
    runOne: (file, v, cfg, prog) => E.pdfToImages(file, { format: v.format, scale: +v.scale }, prog),
  },
  "pdf-merge": {
    accepts: "pdf", multiple: true, ordered: true, minFiles: 2, mode: () => "all",
    schema: () => [],
    runAll: async (files, v, cfg, prog) => [await E.mergePdfs(files, prog)],
    hint: "Pilih minimal 2 file PDF. Urutan gabungan mengikuti urutan daftar.",
  },
  "pdf-split": {
    accepts: "pdf", multiple: false, mode: () => "each",
    schema: () => [
      { id: "mode", label: "Cara memisahkan", type: "select", value: "each", options: [["each", "Pisahkan setiap halaman"], ["ranges", "Ambil halaman tertentu"]] },
      { id: "ranges", label: "Halaman yang diambil", type: "text", placeholder: "1,3-5", hint: RANGE_HINT, showIf: (v) => v.mode === "ranges" },
    ],
    runOne: (file, v, cfg, prog) => E.splitPdf(file, { mode: v.mode, ranges: v.ranges }, prog),
  },
  "pdf-rotate": {
    accepts: "pdf", multiple: false, mode: () => "each",
    schema: () => [
      { id: "angle", label: "Putar", type: "select", value: "90", options: [["90", "Searah jarum jam 90°"], ["180", "180°"], ["270", "Berlawanan jarum jam 90°"]] },
      { id: "ranges", label: "Halaman (opsional)", type: "text", placeholder: "Kosongkan untuk semua halaman", hint: RANGE_HINT },
    ],
    runOne: async (file, v) => [await E.rotatePdf(file, { angle: +v.angle, ranges: v.ranges })],
  },
  "pdf-delete": {
    accepts: "pdf", multiple: false, mode: () => "each",
    schema: () => [{ id: "ranges", label: "Halaman yang dihapus", type: "text", placeholder: "2,4-5", hint: RANGE_HINT }],
    runOne: async (file, v) => [await E.deletePdfPages(file, { ranges: v.ranges })],
  },
  "pdf-compress": {
    accepts: "pdf", multiple: true, mode: () => "each",
    schema: () => [
      { id: "target", label: "Ukuran maksimal", type: "select", value: "1024", options: [["200", "≤ 200 KB"], ["500", "≤ 500 KB"], ["1024", "≤ 1 MB"], ["2048", "≤ 2 MB"], ["0", "Pilih tingkat kompresi"]] },
      { id: "level", label: "Tingkat kompresi", type: "select", value: "1", options: [["0", "Ringan (kualitas terbaik)"], ["1", "Seimbang"], ["2", "Hemat"], ["3", "Maksimal"]], showIf: (v) => v.target === "0" },
    ],
    note: "Catatan: kompresi mengubah halaman menjadi gambar, jadi teks di hasilnya tidak bisa diseleksi atau dicari.",
    runOne: async (file, v, cfg, prog) => [await E.compressPdf(file, { level: +v.level, targetKB: +v.target }, prog)],
  },
  universal: {
    accepts: "any", multiple: true,
    classify(items) {
      if (!items.length) return "";
      const img = items.every((i) => E.isImage(i.file));
      const pdf = items.every((i) => E.isPdf(i.file));
      return img ? "img" : pdf ? "pdf" : "mixed";
    },
    mode: (v) => (v.action === "img:pdf" ? "all" : "each"),
    schema(cfg, items) {
      const c = this.classify(items);
      if (c === "img") return [{ id: "action", label: "Ubah menjadi", type: "select", value: "img:jpg", options: [["img:jpg", "JPG"], ["img:png", "PNG"], ["img:webp", "WEBP"], ["img:pdf", "PDF (semua gambar digabung)"], ["img:compress", "Kompres gambar (≤ 500 KB)"]] }];
      if (c === "pdf") return [{ id: "action", label: "Ubah menjadi", type: "select", value: "pdf:jpg", options: [["pdf:jpg", "Gambar JPG"], ["pdf:png", "Gambar PNG"], ["pdf:compress", "PDF lebih kecil (≤ 1 MB)"]] }];
      return [];
    },
    blocked: (items) => (items.length && !items.every((i) => E.isImage(i.file)) && !items.every((i) => E.isPdf(i.file)) ? "Pilih satu jenis file saja (semua gambar atau semua PDF) agar pilihan format tepat." : ""),
    runOne(file, v, cfg, prog) {
      const [type, act] = v.action.split(":");
      if (type === "img" && act === "compress") return kinds["img-compress"].runOne(file, { target: "500", quality: 75, maxDim: "0", format: "jpg" }, cfg, prog);
      if (type === "img") return kinds["img-convert"].runOne(file, { quality: 92 }, { to: act }, prog);
      if (act === "compress") return kinds["pdf-compress"].runOne(file, { target: "1024", level: "1" }, cfg, prog);
      return kinds["pdf-to-img"].runOne(file, { format: act, scale: "2" }, cfg, prog);
    },
    runAll: async (files, v, cfg, prog) => [await E.imagesToPdf(files, { pageSize: "a4" }, prog)],
  },
};

/* ---------- pesan error ---------- */
function errorText(e) {
  if (e instanceof E.UbahinError) return e.message;
  console.error(e);
  if (e && e.name === "RangeError") return "Memori browser tidak cukup untuk file ini. Coba file yang lebih kecil atau tutup tab lain.";
  return "Terjadi kesalahan saat memproses file ini. Coba file lain atau muat ulang halaman.";
}

/* ---------- mount alat file ---------- */
function mountFileTool(root, cfg) {
  const kind = kinds[cfg.kind];
  const state = { items: [], vals: {}, outputs: [], running: false, cancel: false };
  const multiple = kind.multiple;
  // Preset ukuran dari tautan, mis. ?target=200 (nilai tidak valid diabaikan oleh validasi opsi)
  const presetTarget = new URLSearchParams(location.search).get("target");
  if (presetTarget && /^\d{1,5}$/.test(presetTarget)) state.vals.target = presetTarget;

  const input = h("input", { type: "file", id: "fileinput", class: "sr-only", accept: cfg.accept || "", multiple: multiple || null, tabindex: "-1" });
  const dz = h("label", { class: "dropzone", for: "fileinput", tabindex: "0", role: "button", "aria-label": "Pilih file atau seret ke sini" },
    staticSvg(ICON_UPLOAD),
    h("strong", null, multiple ? "Pilih file atau seret ke sini" : "Pilih file atau seret ke sini"),
    h("small", null, cfg.dropHint || `Maksimal ${MAX_MB} MB per file`));
  const privacy = h("p", { class: "privacy-note" }, staticSvg(ICON_LOCK), h("span", null, "File diproses di perangkatmu dan tidak diunggah ke server."));
  const alerts = h("div", { "aria-live": "polite" });
  const optsHost = h("div");
  const listHost = h("div");
  const resultHost = h("div");
  root.replaceChildren(input, dz, privacy, alerts, listHost, optsHost, resultHost);

  const showAlert = (msg, type = "err") => alerts.replaceChildren(msg ? h("div", { class: "alert " + type, role: type === "err" ? "alert" : "status" }, msg) : "");

  dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));
  input.addEventListener("change", () => { addFiles(input.files); input.value = ""; });

  function accepted(file) {
    if (kind.accepts === "image") return E.isImage(file);
    if (kind.accepts === "pdf") return E.isPdf(file);
    return E.isImage(file) || E.isPdf(file);
  }
  function addFiles(fileList) {
    if (state.running) return;
    const rejected = [], tooBig = [];
    let incoming = [];
    for (const f of fileList) {
      if (!accepted(f)) rejected.push(f);
      else if (f.size > MAX_MB * 1048576) tooBig.push(f);
      else incoming.push(f);
    }
    if (!multiple && incoming.length) { clearItems(); incoming = incoming.slice(0, 1); }
    const room = MAX_FILES - state.items.length;
    if (incoming.length > room) { incoming = incoming.slice(0, room); showAlert(`Maksimal ${MAX_FILES} file sekaligus.`); }
    for (const file of incoming) {
      const item = { id: ++uid, file, status: "idle", progress: 0, msg: "", url: E.isImage(file) && !E.isHeic(file) ? URL.createObjectURL(file) : "" };
      state.items.push(item);
    }
    state.outputs = [];
    const msgs = [];
    if (rejected.length) {
      const media = rejected.some((f) => /\.(mp4|mov|avi|mkv|webm|mp3|wav|m4a|docx?|xlsx?|pptx?)$/i.test(f.name));
      msgs.push(`${rejected.length} file dilewati karena formatnya tidak cocok untuk alat ini.` + (media ? " Konversi video, audio, dan Word akan hadir di tahap berikutnya." : ""));
    }
    if (tooBig.length) msgs.push(`${tooBig.length} file dilewati karena lebih dari ${MAX_MB} MB.`);
    if (msgs.length) showAlert(msgs.join(" "));
    else if (incoming.length) showAlert("");
    render();
  }
  function clearItems() { state.items.forEach((i) => i.url && URL.revokeObjectURL(i.url)); state.items = []; state.outputs = []; }
  function removeItem(id) {
    if (state.running) return;
    const i = state.items.findIndex((x) => x.id === id);
    if (i < 0) return;
    if (state.items[i].url) URL.revokeObjectURL(state.items[i].url);
    state.items.splice(i, 1); state.outputs = []; showAlert(""); render();
  }
  function move(id, d) {
    const i = state.items.findIndex((x) => x.id === id), j = i + d;
    if (i < 0 || j < 0 || j >= state.items.length) return;
    [state.items[i], state.items[j]] = [state.items[j], state.items[i]]; state.outputs = []; render();
  }

  function rowFor(item, idx) {
    const thumb = h("div", { class: "thumb", "aria-hidden": "true" }, item.url ? h("img", { src: item.url, alt: "", onerror: (e) => e.target.remove() }) : "", item.url ? null : E.extOf(item.file.name).toUpperCase().slice(0, 4));
    const sub = h("div", { class: "sub" + (item.status === "done" ? " ok" : item.status === "err" ? " err" : ""), "data-sub": "" }, subText(item));
    const bar = h("div", { class: "bar", hidden: item.status === "run" ? null : true }, h("i"));
    bar.firstChild.style.width = Math.round(item.progress * 100) + "%";
    item.ui = { sub, bar };
    const actions = h("div", { class: "actions" });
    if (kind.ordered && !state.running && state.items.length > 1) {
      actions.append(
        h("button", { class: "icon-btn", type: "button", "aria-label": "Naikkan " + item.file.name, onclick: () => move(item.id, -1), disabled: idx === 0 || null }, "↑"),
        h("button", { class: "icon-btn", type: "button", "aria-label": "Turunkan " + item.file.name, onclick: () => move(item.id, 1), disabled: idx === state.items.length - 1 || null }, "↓"));
    }
    actions.append(h("button", { class: "icon-btn", type: "button", "aria-label": "Hapus " + item.file.name, disabled: state.running || null, onclick: () => removeItem(item.id) }, "✕"));
    return h("li", { class: "file" }, thumb, h("div", { class: "meta" }, h("div", { class: "name", title: item.file.name }, item.file.name), sub, bar), actions);
  }
  function subText(item) {
    if (item.status === "run") return `Memproses… ${Math.round(item.progress * 100)}%`;
    if (item.status === "done") return item.msg;
    if (item.status === "err") return item.msg;
    return E.fmtBytes(item.file.size);
  }
  function updateRow(item) {
    if (!item.ui) return;
    item.ui.sub.textContent = subText(item);
    item.ui.sub.className = "sub" + (item.status === "done" ? " ok" : item.status === "err" ? " err" : "");
    item.ui.bar.hidden = item.status !== "run";
    item.ui.bar.firstChild.style.width = Math.round(item.progress * 100) + "%";
  }

  function currentSchema() {
    const all = kind.schema ? kind.schema(cfg, state.items) : [];
    // isi nilai bawaan / validasi nilai lama
    for (const f of all) {
      if (f.type === "select") { if (!f.options.some(([val]) => val === state.vals[f.id])) state.vals[f.id] = f.value; }
      else if (state.vals[f.id] === undefined) state.vals[f.id] = f.value;
    }
    return all;
  }
  function renderOptions() {
    const schema = currentSchema();
    const fields = schema.filter((f) => !f.showIf || f.showIf(state.vals));
    if (!fields.length && !kind.hint && !kind.note) { optsHost.replaceChildren(); return; }
    const grid = h("div", { class: "opts" });
    for (const f of fields) {
      const id = "opt-" + f.id;
      let control;
      if (f.type === "select") {
        control = h("select", { id, onchange: (e) => { state.vals[f.id] = e.target.value; renderOptions(); } }, f.options.map(([val, label]) => h("option", { value: val, selected: state.vals[f.id] === val || null }, label)));
      } else if (f.type === "range") {
        const out = h("span", null, String(state.vals[f.id]));
        control = h("div", null, h("input", { id, type: "range", min: f.min, max: f.max, step: f.step, value: state.vals[f.id], oninput: (e) => { state.vals[f.id] = +e.target.value; out.textContent = e.target.value; } }), h("small", null, "Nilai: ", out, "%"));
      } else {
        control = h("input", { id, type: "text", placeholder: f.placeholder || "", value: state.vals[f.id] || "", oninput: (e) => { state.vals[f.id] = e.target.value; } });
      }
      grid.append(h("div", { class: "field" }, h("label", { for: id }, f.label), control, f.hint ? h("div", { class: "hint" }, f.hint) : null));
    }
    const wrap = h("div", { class: "panel" }, grid);
    if (kind.hint) wrap.append(h("p", { class: "hint" }, kind.hint));
    if (kind.note) wrap.append(h("p", { class: "hint" }, kind.note));
    optsHost.replaceChildren(wrap);
  }

  function renderToolbar() {
    const n = state.items.length;
    if (!n && !state.running) return h("div");
    const blocked = kind.blocked ? kind.blocked(state.items) : "";
    const need = kind.minFiles && n < kind.minFiles ? `Tambahkan minimal ${kind.minFiles} file.` : "";
    const bar = h("div", { class: "toolbar" });
    if (!state.running) {
      bar.append(h("button", { class: "btn btn-lg", type: "button", disabled: n === 0 || blocked || need ? true : null, onclick: run }, cfg.actionLabel || "Ubah"));
      bar.append(h("button", { class: "btn btn-ghost", type: "button", onclick: () => input.click() }, multiple ? "Tambah file" : "Ganti file"));
      bar.append(h("span", { class: "spacer" }));
      bar.append(h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => { clearItems(); showAlert(""); render(); } }, "Kosongkan"));
    } else {
      bar.append(h("button", { class: "btn btn-ghost", type: "button", onclick: () => { state.cancel = true; } }, "Batal setelah file ini"));
    }
    return h("div", null, blocked || need ? h("div", { class: "alert info" }, blocked || need) : null, bar);
  }

  function renderResults() {
    if (!state.outputs.length) { resultHost.replaceChildren(); return; }
    const head = h("div", { class: "toolbar" }, h("h3", null, `Hasil (${state.outputs.length} file)`), h("span", { class: "spacer" }));
    if (state.outputs.length > 1) {
      head.append(h("button", { class: "btn btn-accent", type: "button", onclick: async (e) => {
        const btn = e.currentTarget; btn.disabled = true; btn.textContent = "Menyiapkan ZIP…";
        try { E.downloadBlob(await E.makeZip(state.outputs), "ubahin-hasil.zip"); } finally { btn.disabled = false; btn.textContent = "Unduh semua (ZIP)"; }
      } }, "Unduh semua (ZIP)"));
    }
    const ul = h("ul", { class: "files" });
    for (const o of state.outputs) {
      ul.append(h("li", { class: "file" },
        h("div", { class: "thumb", "aria-hidden": "true" }, E.extOf(o.name).toUpperCase().slice(0, 4)),
        h("div", { class: "meta" }, h("div", { class: "name", title: o.name }, o.name), h("div", { class: "sub" }, E.fmtBytes(o.blob.size)), o.note ? h("div", { class: "hint" }, o.note) : null),
        h("div", { class: "actions" }, h("button", { class: "btn btn-sm", type: "button", onclick: () => E.downloadBlob(o.blob, o.name) }, "Unduh"))));
    }
    resultHost.replaceChildren(h("div", { class: "panel" }, head, ul));
  }

  function render() {
    state.items.forEach((it, i) => { /* nomor urut untuk rowFor */ it._i = i; });
    listHost.replaceChildren(state.items.length ? h("div", { class: "panel" }, h("ul", { class: "files" }, state.items.map((it, i) => rowFor(it, i)))) : "");
    renderOptions();
    const tb = renderToolbar();
    const old = root.querySelector("[data-toolbar]");
    if (old) old.remove();
    tb.setAttribute("data-toolbar", "");
    // toolbar ditempatkan setelah opsi dan sebelum hasil
    root.insertBefore(tb, resultHost);
    renderResults();
  }

  async function run() {
    if (state.running || !state.items.length) return;
    state.running = true; state.cancel = false; state.outputs = []; showAlert("");
    state.items.forEach((i) => { i.status = "idle"; i.progress = 0; i.msg = ""; });
    render();
    const v = { ...state.vals };
    const mode = kind.mode(v);
    let ok = 0, fail = 0;
    try {
      if (mode === "all") {
        state.items.forEach((i) => { i.status = "run"; });
        const prog = (p) => state.items.forEach((i) => { i.progress = p; updateRow(i); });
        try {
          const outs = await kind.runAll(state.items.map((i) => i.file), v, cfg, prog);
          state.outputs.push(...outs);
          state.items.forEach((i) => { i.status = "done"; i.progress = 1; i.msg = "Selesai"; });
          ok = state.items.length;
        } catch (e) {
          const m = errorText(e);
          state.items.forEach((i) => { i.status = "err"; i.msg = m; });
          showAlert(m); fail = state.items.length;
        }
      } else {
        for (const item of state.items) {
          if (state.cancel) { item.status = "idle"; continue; }
          item.status = "run"; item.progress = 0; updateRow(item);
          try {
            const outs = await kind.runOne(item.file, v, cfg, (p) => { item.progress = p; updateRow(item); });
            state.outputs.push(...outs);
            const total = outs.reduce((s, o) => s + o.blob.size, 0);
            item.status = "done"; item.progress = 1;
            item.msg = outs.length > 1 ? `Selesai · ${outs.length} file (${E.fmtBytes(total)})`
              : `Selesai · ${E.fmtBytes(total)}` + (total < item.file.size ? ` (−${Math.round((1 - total / item.file.size) * 100)}%)` : "");
            ok++;
          } catch (e) {
            item.status = "err"; item.msg = errorText(e); fail++;
          }
          updateRow(item);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    } finally {
      state.running = false;
      render();
      if (state.cancel) showAlert("Proses dibatalkan. File yang sudah selesai tetap bisa diunduh.", "info");
      else if (fail && !ok) showAlert("Semua file gagal diproses. Lihat keterangan di tiap file.");
      else if (fail) showAlert(`${fail} file gagal diproses; sisanya selesai.`, "info");
      else showAlert(`Selesai. ${state.outputs.length} file siap diunduh.`, "info");
    }
  }

  render();
}

/* ---------- konverter satuan ---------- */
const UNITS = {
  Panjang: { base: "m", u: { mm: ["Milimeter", 0.001], cm: ["Sentimeter", 0.01], m: ["Meter", 1], km: ["Kilometer", 1000], in: ["Inci", 0.0254], ft: ["Kaki", 0.3048], yd: ["Yard", 0.9144], mi: ["Mil", 1609.344] } },
  Berat: { base: "kg", u: { mg: ["Miligram", 1e-6], g: ["Gram", 0.001], kg: ["Kilogram", 1], t: ["Ton", 1000], oz: ["Ons (oz)", 0.028349523125], lb: ["Pon (lb)", 0.45359237] } },
  Suhu: { temp: true, u: { C: ["Celsius (°C)"], F: ["Fahrenheit (°F)"], K: ["Kelvin (K)"] } },
  Luas: { base: "m²", u: { cm2: ["Sentimeter persegi", 1e-4], m2: ["Meter persegi", 1], are: ["Are", 100], ha: ["Hektare", 10000], km2: ["Kilometer persegi", 1e6], ft2: ["Kaki persegi", 0.09290304], ac: ["Acre", 4046.8564224] } },
  Volume: { base: "L", u: { ml: ["Mililiter", 0.001], l: ["Liter", 1], m3: ["Meter kubik", 1000], gal: ["Galon (AS)", 3.785411784], cup: ["Cangkir (AS)", 0.2365882365] } },
  Kecepatan: { base: "m/s", u: { ms: ["Meter/detik", 1], kmh: ["Kilometer/jam", 1 / 3.6], mph: ["Mil/jam", 0.44704], kn: ["Knot", 1852 / 3600] } },
  "Data (biner)": { base: "B", u: { b: ["Byte", 1], kb: ["Kilobyte (1024 B)", 1024], mb: ["Megabyte", 1048576], gb: ["Gigabyte", 1073741824], tb: ["Terabyte", 1099511627776] } },
};
function convertUnit(cat, from, to, val) {
  const c = UNITS[cat];
  if (c.temp) {
    const k = from === "C" ? val + 273.15 : from === "F" ? ((val - 32) * 5) / 9 + 273.15 : val;
    return to === "C" ? k - 273.15 : to === "F" ? ((k - 273.15) * 9) / 5 + 32 : k;
  }
  return (val * c.u[from][1]) / c.u[to][1];
}
function mountUnit(root) {
  const st = { cat: "Panjang", from: "km", to: "m", val: "1" };
  const host = h("div", { class: "panel" });
  root.replaceChildren(host);
  const fmt = (n) => (Number.isFinite(n) ? new Intl.NumberFormat("id-ID", { maximumSignificantDigits: 10 }).format(n) : "–");
  function draw() {
    const c = UNITS[st.cat];
    const keys = Object.keys(c.u);
    if (!keys.includes(st.from)) st.from = keys[0];
    if (!keys.includes(st.to)) st.to = keys[1] || keys[0];
    const opt = (sel) => keys.map((k) => h("option", { value: k, selected: sel === k || null }, c.u[k][0]));
    const result = h("div", { class: "unit-result", "aria-live": "polite" });
    const calc = () => {
      const v = parseFloat(String(st.val).replace(",", "."));
      result.textContent = isNaN(v) ? "–" : `${fmt(v)} ${c.u[st.from][0]} = ${fmt(convertUnit(st.cat, st.from, st.to, v))} ${c.u[st.to][0]}`;
    };
    host.replaceChildren(
      h("div", { class: "field" }, h("label", { for: "u-cat" }, "Jenis satuan"),
        h("select", { id: "u-cat", onchange: (e) => { st.cat = e.target.value; draw(); } }, Object.keys(UNITS).map((k) => h("option", { value: k, selected: k === st.cat || null }, k)))),
      h("div", { class: "unit-grid" },
        h("div", { class: "field" }, h("label", { for: "u-val" }, "Nilai"), h("input", { id: "u-val", type: "text", inputmode: "decimal", value: st.val, oninput: (e) => { st.val = e.target.value; calc(); } })),
        h("div", { class: "field" }, h("label", { for: "u-from" }, "Dari"), h("select", { id: "u-from", onchange: (e) => { st.from = e.target.value; calc(); } }, opt(st.from))),
        h("div", { class: "field" }, h("label", { for: "u-to" }, "Ke"), h("select", { id: "u-to", onchange: (e) => { st.to = e.target.value; calc(); } }, opt(st.to)))),
      h("div", { class: "toolbar" }, h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: () => { [st.from, st.to] = [st.to, st.from]; draw(); } }, "⇄ Tukar satuan")),
      result);
    calc();
  }
  draw();
}

/* ---------- start ---------- */
const root = document.getElementById("app");
if (root) {
  const cfg = JSON.parse(document.getElementById("tool-config").textContent);
  if (cfg.kind === "unit") mountUnit(root);
  else if (kinds[cfg.kind]) mountFileTool(root, cfg);
}

/* ---------- menu: tutup dropdown saat klik di luar / tekan Escape ---------- */
document.addEventListener("click", (e) => {
  document.querySelectorAll(".nav-menu details[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".nav-menu details[open], .burger[open]").forEach((d) => { d.open = false; });
});
