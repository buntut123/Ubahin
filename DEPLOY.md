# Panduan Deploy Ubahin ke Internet

Biaya minimal: hanya domain (± Rp 150–300 ribu/tahun). Hosting Cloudflare Pages gratis.

## Cara tercepat (tanpa GitHub) — Direct Upload
1. Di komputer, pasang Node.js 18+ (nodejs.org).
2. Di folder proyek jalankan:
   `SITE_URL=https://NAMADOMAIN node build.mjs`  (Windows PowerShell: `$env:SITE_URL="https://NAMADOMAIN"; node build.mjs`)
3. Daftar gratis di dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
4. Beri nama proyek (mis. `ubahin`), seret **isi folder `dist`**, klik **Deploy**. Anda langsung dapat alamat `ubahin.pages.dev`.

## Cara disarankan (otomatis tiap perubahan) — GitHub + Pages
1. Buat akun github.com, buat repositori baru, upload seluruh isi proyek ini.
2. Cloudflare → Workers & Pages → Create → Pages → **Connect to Git** → pilih repositori.
3. Pengaturan build: **Build command** `node build.mjs`, **Build output directory** `dist`.
4. Tambah **Environment variables**: `SITE_URL` (mis. `https://ubahin.com`), `CONTACT_EMAIL`, `DONATE_URL`.
5. Deploy. Setiap `git push` akan membangun dan memublikasikan ulang.

## Domain
1. Beli domain (Niagahoster, Rumahweb, IDwebhost, atau Cloudflare Registrar untuk .com). Periksa ketersediaan nama dulu; jika `ubahin` sudah dipakai, ganti nama di seluruh proyek.
2. Pages → proyek Anda → **Custom domains** → tambahkan domain, ikuti petunjuk DNS. HTTPS aktif otomatis.

## Setelah online
- Google Search Console: tambahkan situs, kirim `https://DOMAIN/sitemap.xml`. Lakukan juga di Bing Webmaster.
- Cloudflare Web Analytics (gratis, tanpa cookie) bila ingin tahu jumlah pengunjung; jika dipasang, perbarui halaman Privasi.

## Wajib diperiksa sebelum diumumkan
1. **HEIC dan MP3** belum bisa diuji oleh saya karena komponennya dimuat dari CDN (jsDelivr). Coba sendiri: unggah foto .heic dari iPhone ke `/heic-ke-jpg/`, dan satu video ke `/video-ke-mp3/` (format MP3). Jika gagal, buka Console browser dan kirimkan pesan errornya.
2. Ganti email kontak (`CONTACT_EMAIL`) dengan email yang benar-benar aktif.
3. Minta penasihat hukum meninjau halaman Privasi dan Ketentuan (UU PDP).
4. Isi `DONATE_URL` atau biarkan teks "Segera hadir".
5. Uji di HP Android dan iPhone/Safari. pdf.js versi baru membutuhkan browser yang cukup baru (± 2023 ke atas).
6. Opsional: unduh font Inter dan Plus Jakarta Sans lalu pasang sendiri agar tidak bergantung pada Google Fonts.
7. Opsional: tambahkan header `Content-Security-Policy` di `_headers` setelah semua fitur (termasuk HEIC dan MP3) lolos uji di domain Anda.
