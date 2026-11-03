# Ubahin

Konverter file online berbahasa Indonesia. Situs statis; semua konversi berjalan di browser pengguna (file tidak diunggah).

## Struktur
- `build.mjs` — generator halaman (beranda, 28 halaman alat, blog, legal, sitemap, robots, `_headers`)
- `public/assets/` — CSS, JS (`engines.js` = mesin konversi, `app.js` = antarmuka), pustaka (pdf-lib, pdf.js, JSZip), logo
- `dist/` — hasil build, siap di-upload ke hosting

## Perintah
```
node build.mjs                      # build ke dist/
SITE_URL=https://ubahin.com CONTACT_EMAIL=halo@ubahin.com DONATE_URL=https://trakteer.id/xxx node build.mjs
python3 -m http.server 8080 --directory dist   # coba di http://localhost:8080
```
Variabel build: `SITE_URL` (domain final, untuk canonical/sitemap), `CONTACT_EMAIL`, `DONATE_URL`.

## Menambah alat baru
Tambahkan satu objek di array `tools` pada `build.mjs` (slug, teks, `targets` yang menunjuk ke salah satu mesin di `engines.js`), lalu build ulang. Halaman, menu, footer, sitemap, dan data terstruktur dibuat otomatis.

## Lisensi pustaka
pdf-lib (MIT), pdf.js (Apache-2.0), JSZip (MIT/GPLv3) — salinan lisensi ada di `public/assets/vendor/`. heic2any (MIT) dan lamejs (LGPL) dimuat dari jsDelivr saat dibutuhkan.
