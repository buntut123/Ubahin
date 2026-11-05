/* Ubahin — pemuat header & footer bersama.
   Header ada di  layout/header.html  dan footer di  layout/footer.html.
   Ubah satu berkas itu saja, maka seluruh halaman ikut berubah — tidak perlu menyentuh halaman lain.
   Di dalam berkas tulis tautan dengan awalan "/" (mis. /blog/). Tulisan {tahun} diganti tahun berjalan. */
(function () {
  'use strict';
  // Font judul Plus Jakarta Sans masih dimuat dari Google Fonts. Setelah berkas fontnya
  // dihosting sendiri (assets/fonts/), ubah baris berikut menjadi false.
  var JAKARTA_DARI_GOOGLE = true;
  if (JAKARTA_DARI_GOOGLE) {
    var gl = document.createElement('link'); gl.rel = 'stylesheet';
    gl.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap';
    document.head.appendChild(gl);
  }
  var me = document.currentScript;
  var dir = me && me.src ? me.src.slice(0, me.src.lastIndexOf('/') + 1) : '/layout/';
  var EN = document.documentElement.lang === 'en', SFX = EN ? '-en' : '';
  var KEY = 'ubahin-layout-v2' + SFX, year = new Date().getFullYear(), cache = {};
  try { cache = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { cache = {}; }

  function sig(s) { var h = 0, i; for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return s.length + ':' + h; }
  function here() { return location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/'; }
  function mark(el) {
    var cur = here(), links = el.querySelectorAll('a[href]'), i, p;
    for (i = 0; i < links.length; i++) {
      if (links[i].getAttribute('href').charAt(0) === '#') continue;
      try { p = new URL(links[i].getAttribute('href'), location.origin).pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/'; } catch (e) { continue; }
      if (p === cur) links[i].setAttribute('aria-current', 'page');
    }
  }
  function put(name) {
    var html = cache[name], el = document.getElementById('site-' + name);
    if (!html || !el) return;
    var s = sig(html); if (el.getAttribute('data-sig') === s) return;
    el.innerHTML = html.replace(/\{tahun\}/g, year); el.setAttribute('data-sig', s); mark(el); langSwitch(el);
  }
  function langSwitch(el) {
    var a = el.querySelector('#lang-switch'); if (!a) return;
    var alt = document.querySelector('link[rel="alternate"][hreflang="' + a.getAttribute('hreflang') + '"]');
    if (alt && alt.href) { try { a.setAttribute('href', new URL(alt.href).pathname); } catch (e) {} }
  }
  function paint() { put('header'); put('footer'); }

  // tombol menu (HP) — satu pendengar untuk semua, tetap bekerja walau header diganti
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#burger') : null; if (!b) return;
    var m = document.getElementById('menu'); if (!m) return;
    var open = m.classList.toggle('open'); b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  paint();                                             // dari cache sesi: tampil seketika
  document.addEventListener('DOMContentLoaded', paint);
  ['header', 'footer'].forEach(function (name) {       // selalu cek versi terbaru
    fetch(dir + name + SFX + '.html', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (t) {
      if (!t || t.indexOf('<') < 0) return;
      cache[name] = t; try { sessionStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {}
      paint();
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint);
    }).catch(function () { /* gagal: cadangan di halaman tetap tampil */ });
  });
})();
