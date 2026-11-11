/* Sidebar blog Ubahin. Dimuat otomatis di halaman artikel; isinya dari artikel.json
   (satu berkas untuk semua halaman, jadi tidak perlu mengedit halaman satu per satu). */
(function () {
  'use strict';
  var box = document.getElementById('blog-sidebar'); if (!box) return;
  var me = document.currentScript, src = me && me.src ? me.src : '';
  var dir = src.slice(0, src.lastIndexOf('/') + 1);            // .../sidebar/
  var root = dir.replace(/sidebar\/$/, '');                     // situs utama
  var EN = document.documentElement.lang === 'en';
  var asHtml = /index\.html$/.test(location.pathname);
  var url = function (slug) { return root + (EN ? 'en/' : '') + 'blog/' + slug + '/' + (asHtml ? 'index.html' : ''); };
  var here = (location.pathname.match(/\/blog\/([^\/]+)\//) || [])[1] || '';
  var fmt = function (iso) { try { return new Date(iso + 'T00:00:00Z').toLocaleDateString(EN ? 'en-US' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso; } };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  fetch(dir + (EN ? 'artikel-en.json' : 'artikel.json'), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (items) {
    if (!Array.isArray(items) || !items.length) return;
    items = items.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    box.innerHTML = '<h2>' + (EN ? 'More articles' : 'Artikel Lainnya') + '</h2><input class="bs-search" type="search" placeholder="' + (EN ? 'Search articles…' : 'Cari artikel…') + '" aria-label="' + (EN ? 'Search articles' : 'Cari artikel') + '"><ul class="bs-list"></ul><p class="bs-empty" hidden>' + (EN ? 'No matching articles.' : 'Tidak ada artikel yang cocok.') + '</p><a class="bs-all" href="' + root + (EN ? 'en/' : '') + 'blog/' + (asHtml ? 'index.html' : '') + '">' + (EN ? 'See all articles →' : 'Lihat semua artikel →') + '</a>';
    var ul = box.querySelector('.bs-list'), inp = box.querySelector('.bs-search'), none = box.querySelector('.bs-empty');
    function draw(q) {
      q = (q || '').toLowerCase().trim(); var n = 0;
      ul.innerHTML = items.filter(function (a) { return !q || String(a.title).toLowerCase().indexOf(q) > -1; }).map(function (a) {
        n++; return '<li><a href="' + url(a.slug) + '"' + (a.slug === here ? ' aria-current="page"' : '') + '>' + esc(a.title) + '<small>' + fmt(a.date) + '</small></a></li>';
      }).join('');
      none.hidden = n > 0;
    }
    inp.addEventListener('input', function () { draw(inp.value); });
    draw('');
  }).catch(function () { /* gagal memuat: sidebar tetap tersembunyi, artikel tetap terbaca */ });
})();
