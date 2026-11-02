// Generator situs statis Ubahin. Jalankan: node build.mjs [--html]
//   --html  → tautan memakai /index.html (untuk hosting tanpa "clean URL", mis. pratinjau)
// Env: SITE_URL (domain final), CONTACT_EMAIL, DONATE_URL
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DIST = path.resolve(ROOT, process.env.OUT_DIR || 'dist');
const HTML_LINKS = process.argv.includes('--html');
const SITE = (process.env.SITE_URL || 'https://ubahin.com').replace(/\/$/, '');
const CONTACT = process.env.CONTACT_EMAIL || 'halo@ubahin.com';
const DONATE = process.env.DONATE_URL || '';
const YEAR = new Date().getFullYear();

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });

/* ---------------- definisi alat ---------------- */
const IMG_IN = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'avif'];
const Q = (v = 90) => ({ id: 'quality', label: 'Kualitas', type: 'range', min: 40, max: 100, value: v, unit: '%' });
const SCALE = { id: 'scale', label: 'Ketajaman', type: 'select', value: 2, options: [[1.5, 'Standar (hemat)'], [2, 'Tinggi (disarankan)'], [3, 'Sangat tinggi (file besar)']] };
const TARGETKB = (v = 0) => ({ id: 'targetKB', label: 'Target ukuran', type: 'select', value: v, options: [[0, 'Tanpa target (pakai kualitas)'], [100, '≤ 100 KB'], [200, '≤ 200 KB'], [300, '≤ 300 KB'], [500, '≤ 500 KB'], [1000, '≤ 1 MB'], [2000, '≤ 2 MB']] });

const tools = [
  // ---- gambar
  { slug: 'heic-ke-jpg', cat: 'gambar', ico: 'HEIC', name: 'HEIC ke JPG', h1: 'Ubah HEIC ke JPG Online', desc: 'Ubah foto HEIC dari iPhone ke JPG secara gratis, langsung di browser. Tanpa daftar, tanpa unggah ke server.', short: 'Foto iPhone jadi JPG yang bisa dibuka di mana saja',
    accept: ['heic', 'heif'], multiple: true, targets: [{ id: 'x', kind: 'img2img', fixed: { to: 'jpg' }, opts: [Q(90)], button: 'Ubah ke JPG' }],
    intro: 'Foto dari iPhone biasanya disimpan sebagai HEIC. Format ini hemat ruang, tetapi sering tidak bisa dibuka di Windows lama, banyak aplikasi Android, atau formulir pendaftaran online. Ubah ke JPG di sini dalam hitungan detik.',
    faq: [['Kenapa foto iPhone saya berformat HEIC?', 'Sejak iOS 11, iPhone memakai HEIC secara bawaan karena ukurannya lebih kecil dibanding JPG pada kualitas yang mirip. Anda bisa mengubahnya di Pengaturan > Kamera > Format > Paling Kompatibel.'], ['Apakah kualitas foto turun?', 'JPG memakai kompresi lossy, jadi ada sedikit perbedaan. Dengan kualitas 90% yang disarankan, perbedaannya nyaris tidak terlihat.']], rel: ['heic-ke-png', 'kompres-gambar', 'jpg-ke-pdf'] },
  { slug: 'heic-ke-png', cat: 'gambar', ico: 'HEIC', name: 'HEIC ke PNG', h1: 'Ubah HEIC ke PNG Online', desc: 'Ubah foto HEIC ke PNG gratis di browser. Cepat, privat, tanpa daftar.', short: 'HEIC jadi PNG tanpa kehilangan detail tambahan',
    accept: ['heic', 'heif'], multiple: true, targets: [{ id: 'x', kind: 'img2img', fixed: { to: 'png' }, opts: [], button: 'Ubah ke PNG' }],
    intro: 'PNG cocok bila Anda ingin menyunting gambar berulang kali tanpa kualitas turun setiap kali disimpan. Ukuran file PNG biasanya lebih besar daripada JPG.',
    faq: [['PNG atau JPG, mana yang lebih baik?', 'Untuk foto, JPG jauh lebih hemat ukuran. PNG lebih cocok untuk gambar dengan teks, logo, atau latar transparan.']], rel: ['heic-ke-jpg', 'png-ke-jpg'] },
  { slug: 'webp-ke-png', cat: 'gambar', ico: 'WEBP', name: 'WEBP ke PNG', h1: 'Ubah WEBP ke PNG Online', desc: 'Ubah gambar WEBP ke PNG gratis, langsung di browser tanpa unggah.', short: 'Gambar dari web jadi PNG',
    accept: ['webp'], multiple: true, targets: [{ id: 'x', kind: 'img2img', fixed: { to: 'png' }, opts: [], button: 'Ubah ke PNG' }],
    intro: 'Gambar yang Anda simpan dari internet sering berformat WEBP dan tidak bisa dibuka di semua aplikasi. Ubah ke PNG agar kompatibel di mana saja.',
    faq: [['Apa itu WEBP?', 'WEBP adalah format gambar buatan Google yang lebih kecil dibanding JPG/PNG. Hampir semua browser modern mendukungnya, tetapi sebagian aplikasi lama belum.']], rel: ['webp-ke-jpg', 'konverter-gambar'] },
  { slug: 'webp-ke-jpg', cat: 'gambar', ico: 'WEBP', name: 'WEBP ke JPG', h1: 'Ubah WEBP ke JPG Online', desc: 'Ubah gambar WEBP ke JPG gratis dan privat di browser Anda.', short: 'WEBP jadi JPG yang universal',
    accept: ['webp'], multiple: true, targets: [{ id: 'x', kind: 'img2img', fixed: { to: 'jpg' }, opts: [Q(90)], button: 'Ubah ke JPG' }],
    intro: 'JPG diterima hampir di semua situs dan aplikasi. Unggah gambar WEBP Anda dan dapatkan JPG dengan ukuran yang tetap kecil.',
    faq: [['Bagaimana dengan latar transparan?', 'JPG tidak mendukung transparansi, jadi bagian transparan diganti latar putih. Pilih PNG bila transparansi penting.']], rel: ['webp-ke-png', 'kompres-gambar'] },
  { slug: 'png-ke-jpg', cat: 'gambar', ico: 'PNG', name: 'PNG ke JPG', h1: 'Ubah PNG ke JPG Online', desc: 'Ubah PNG ke JPG gratis untuk memperkecil ukuran file. Diproses di browser, tanpa unggah.', short: 'PNG jadi JPG yang lebih kecil',
    accept: ['png'], multiple: true, targets: [{ id: 'x', kind: 'img2img', fixed: { to: 'jpg' }, opts: [Q(90)], button: 'Ubah ke JPG' }],
    intro: 'Tangkapan layar dan gambar PNG sering berukuran besar. Mengubahnya ke JPG biasanya memperkecil ukuran secara signifikan, terutama untuk foto.',
    faq: [['Apakah latar transparan akan hilang?', 'Ya, JPG tidak mendukung transparansi, sehingga area transparan menjadi putih.']], rel: ['jpg-ke-png', 'kompres-gambar'] },
  { slug: 'jpg-ke-png', cat: 'gambar', ico: 'JPG', name: 'JPG ke PNG', h1: 'Ubah JPG ke PNG Online', desc: 'Ubah JPG ke PNG gratis di browser. Cepat dan tanpa daftar.', short: 'JPG jadi PNG',
    accept: ['jpg', 'jpeg'], multiple: true, targets: [{ id: 'x', kind: 'img2img', fixed: { to: 'png' }, opts: [], button: 'Ubah ke PNG' }],
    intro: 'Ubah JPG ke PNG bila aplikasi tujuan meminta PNG. Perlu diingat, mengubah JPG ke PNG tidak mengembalikan detail yang sudah hilang.',
    faq: [['Apakah ukuran file jadi lebih besar?', 'Umumnya ya, karena PNG tidak membuang detail seperti JPG.']], rel: ['png-ke-jpg', 'konverter-gambar'] },
  { slug: 'konverter-gambar', cat: 'gambar', ico: 'IMG', name: 'Konverter Gambar', h1: 'Konverter Gambar Online', desc: 'Ubah gambar ke JPG, PNG, atau WEBP. Mendukung HEIC, GIF, BMP, dan AVIF. Gratis dan privat.', short: 'JPG, PNG, WEBP, HEIC — pilih sendiri',
    accept: IMG_IN, multiple: true, targets: [{ id: 'x', kind: 'img2img', opts: [{ id: 'to', label: 'Ubah ke', type: 'select', value: 'jpg', options: [['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WEBP']] }, Q(90)], button: 'Ubah sekarang' }],
    intro: 'Satu alat untuk semua gambar umum. Pilih format tujuan, atur kualitas, lalu unduh.',
    faq: [['Format apa saja yang didukung?', 'Masuk: JPG, PNG, WEBP, HEIC/HEIF, GIF (frame pertama), BMP, AVIF. Keluar: JPG, PNG, WEBP. Dukungan tergantung browser Anda.']], rel: ['heic-ke-jpg', 'webp-ke-png', 'kompres-gambar'] },

  // ---- PDF
  { slug: 'jpg-ke-pdf', cat: 'pdf', ico: 'PDF', name: 'JPG ke PDF', h1: 'Ubah JPG ke PDF Online', desc: 'Gabungkan satu atau banyak foto JPG/PNG menjadi satu PDF. Gratis, privat, tanpa daftar.', short: 'Foto & scan jadi satu PDF',
    accept: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'], multiple: true, orderable: true, targets: [{ id: 'x', kind: 'img2pdf', opts: [{ id: 'size', label: 'Ukuran halaman', type: 'select', value: 'a4', options: [['a4', 'A4'], ['fit', 'Sesuai ukuran gambar']] }, { id: 'margin', label: 'Margin', type: 'select', value: 0, options: [[0, 'Tanpa margin'], [20, 'Kecil'], [40, 'Sedang']] }], button: 'Buat PDF' }],
    intro: 'Cocok untuk berkas pendaftaran, tugas kuliah, atau kumpulan foto dokumen. Tambahkan beberapa gambar, atur urutannya dengan tombol panah, lalu buat satu PDF.',
    faq: [['Bisakah menggabung banyak gambar?', 'Bisa. Semua gambar yang Anda pilih menjadi halaman terpisah dalam satu PDF, sesuai urutan di daftar.'], ['PDF-nya terlalu besar, bagaimana?', 'Kecilkan foto dulu dengan Kompres Gambar, atau kompres PDF hasilnya.']], rel: ['kompres-gambar', 'kompres-pdf', 'gabung-pdf'] },
  { slug: 'pdf-ke-jpg', cat: 'pdf', ico: 'PDF', name: 'PDF ke JPG', h1: 'Ubah PDF ke JPG Online', desc: 'Ubah setiap halaman PDF menjadi gambar JPG. Gratis, tanpa unggah ke server.', short: 'Tiap halaman PDF jadi gambar',
    accept: ['pdf'], multiple: true, targets: [{ id: 'x', kind: 'pdf2img', fixed: { to: 'jpg' }, opts: [SCALE], button: 'Ubah ke JPG' }],
    intro: 'Setiap halaman PDF diubah menjadi satu gambar JPG. Jika PDF punya banyak halaman, Anda bisa mengunduh semuanya sekaligus dalam satu ZIP.',
    faq: [['PDF saya dikunci kata sandi.', 'Saat ini file terkunci belum didukung. Buka kuncinya terlebih dahulu di aplikasi pembaca PDF Anda.']], rel: ['pdf-ke-png', 'pisah-pdf', 'kompres-pdf'] },
  { slug: 'pdf-ke-png', cat: 'pdf', ico: 'PDF', name: 'PDF ke PNG', h1: 'Ubah PDF ke PNG Online', desc: 'Ubah halaman PDF menjadi gambar PNG berkualitas tinggi. Gratis dan privat.', short: 'Tiap halaman PDF jadi PNG tajam',
    accept: ['pdf'], multiple: true, targets: [{ id: 'x', kind: 'pdf2img', fixed: { to: 'png' }, opts: [SCALE], button: 'Ubah ke PNG' }],
    intro: 'PNG menjaga ketajaman teks dan garis, cocok untuk slide, diagram, atau dokumen yang akan dipakai di desain.',
    faq: [['Mengapa file PNG besar?', 'PNG tidak membuang detail. Pilih ketajaman "Standar" atau gunakan PDF ke JPG bila ukuran lebih penting.']], rel: ['pdf-ke-jpg', 'pisah-pdf'] },
  { slug: 'gabung-pdf', cat: 'alatpdf', ico: 'PDF', name: 'Gabung PDF', h1: 'Gabung PDF Online', desc: 'Gabungkan beberapa file PDF menjadi satu. Atur urutan, gratis, tanpa unggah ke server.', short: 'Satukan beberapa PDF',
    accept: ['pdf'], multiple: true, orderable: true, targets: [{ id: 'x', kind: 'pdfmerge', minFiles: 2, opts: [], button: 'Gabung PDF' }],
    intro: 'Pilih dua atau lebih PDF, atur urutannya dengan tombol panah, lalu gabungkan menjadi satu dokumen.',
    faq: [['Apakah ada batas jumlah file?', 'Tidak ada batas tetap, tetapi total ukuran dibatasi oleh memori perangkat Anda.']], rel: ['pisah-pdf', 'kompres-pdf', 'jpg-ke-pdf'] },
  { slug: 'pisah-pdf', cat: 'alatpdf', ico: 'PDF', name: 'Pisah PDF', h1: 'Pisah PDF Online', desc: 'Ambil halaman tertentu dari PDF atau pecah setiap halaman jadi file terpisah. Gratis dan privat.', short: 'Ambil halaman tertentu atau pecah semua',
    accept: ['pdf'], multiple: false, targets: [{ id: 'x', kind: 'pdfsplit', opts: [{ id: 'mode', label: 'Cara', type: 'select', value: 'range', options: [['range', 'Ambil halaman tertentu'], ['each', 'Pisah setiap halaman']] }, { id: 'pages', label: 'Halaman (jika memilih "tertentu")', type: 'text', value: '1', placeholder: '1-3, 5, 8-', hint: 'Contoh: 1-3, 5, 8- (8 sampai akhir)' }], button: 'Pisah PDF' }],
    intro: 'Perlu hanya beberapa halaman dari PDF besar? Tulis nomor halamannya, atau pecah semua halaman menjadi file tersendiri.',
    faq: [['Format penulisan halaman?', 'Pisahkan dengan koma. Gunakan tanda hubung untuk rentang: 1-3, 5, 8-.']], rel: ['hapus-halaman-pdf', 'gabung-pdf'] },
  { slug: 'putar-pdf', cat: 'alatpdf', ico: 'PDF', name: 'Putar PDF', h1: 'Putar Halaman PDF Online', desc: 'Putar semua atau sebagian halaman PDF 90°, 180°, atau 270°. Gratis dan privat.', short: 'Putar halaman PDF yang miring',
    accept: ['pdf'], multiple: false, targets: [{ id: 'x', kind: 'pdfrotate', opts: [{ id: 'angle', label: 'Putar', type: 'select', value: 90, options: [[90, '90° searah jarum jam'], [180, '180°'], [270, '90° berlawanan jarum jam']] }, { id: 'pages', label: 'Halaman (kosong = semua)', type: 'text', value: '', placeholder: 'mis. 2, 4-6' }], button: 'Putar PDF' }],
    intro: 'Hasil scan sering terbalik atau miring. Putar semua halaman sekaligus, atau hanya halaman tertentu.',
    faq: [['Apakah isi PDF berubah?', 'Tidak. Hanya orientasi halaman yang diubah.']], rel: ['hapus-halaman-pdf', 'gabung-pdf'] },
  { slug: 'hapus-halaman-pdf', cat: 'alatpdf', ico: 'PDF', name: 'Hapus Halaman PDF', h1: 'Hapus Halaman PDF Online', desc: 'Hapus halaman yang tidak diperlukan dari PDF. Gratis, cepat, dan privat.', short: 'Buang halaman yang tidak perlu',
    accept: ['pdf'], multiple: false, targets: [{ id: 'x', kind: 'pdfdelete', opts: [{ id: 'pages', label: 'Halaman yang dihapus', type: 'text', value: '', placeholder: 'mis. 2, 4-6', hint: 'Contoh: 2, 4-6' }], button: 'Hapus halaman' }],
    intro: 'Tulis nomor halaman yang ingin dibuang, dan unduh PDF yang sudah bersih.',
    faq: [['Bisakah dibatalkan?', 'File asli Anda tidak berubah. Hasilnya diunduh sebagai file baru.']], rel: ['pisah-pdf', 'putar-pdf'] },
  { slug: 'kompres-pdf', cat: 'kompres', ico: 'PDF', name: 'Kompres PDF', h1: 'Kompres PDF Online', desc: 'Perkecil ukuran PDF untuk upload atau email. Gratis dan diproses di browser Anda, tanpa unggah.', short: 'Perkecil PDF untuk upload & email',
    accept: ['pdf'], multiple: true, targets: [{ id: 'x', kind: 'pdfcompress', opts: [{ id: 'level', label: 'Tingkat kompresi', type: 'select', value: 'sedang', options: [['ringan', 'Ringan (kualitas tinggi)'], ['sedang', 'Sedang (seimbang)'], ['kuat', 'Kuat (file kecil)'], ['ekstrem', 'Ekstrem (terkecil)']] }], button: 'Kompres PDF' }],
    intro: 'Cara kerjanya: setiap halaman dirender ulang sebagai gambar JPEG lalu disusun kembali menjadi PDF. Ini efektif untuk PDF hasil scan atau berisi banyak gambar. Konsekuensinya, teks pada hasil menjadi gambar sehingga tidak bisa disalin atau dicari. Jika PDF Anda berisi teks murni dan sudah kecil, ukuran asli akan dipertahankan.',
    faq: [['Kenapa teks tidak bisa dipilih lagi?', 'Karena halaman diubah menjadi gambar. Untuk berkas yang butuh teks bisa dicari, gunakan tingkat Ringan atau jangan kompres.'], ['Bisakah target 500 KB?', 'Coba tingkat Kuat atau Ekstrem. Hasil tergantung isi dokumen. Panduan lengkap ada di blog kami.']], rel: ['pisah-pdf', 'kompres-gambar', 'gabung-pdf'] },

  // ---- kompres gambar
  { slug: 'kompres-gambar', cat: 'kompres', ico: 'IMG', name: 'Kompres Gambar', h1: 'Kompres Gambar Online', desc: 'Perkecil ukuran foto JPG, PNG, WEBP, HEIC. Pilih target ukuran seperti 100 KB atau 200 KB. Gratis dan privat.', short: 'Perkecil foto sampai target KB',
    accept: IMG_IN, multiple: true, targets: [{ id: 'x', kind: 'imgcompress', opts: [TARGETKB(0), Q(75), { id: 'maxDim', label: 'Batas sisi terpanjang', type: 'select', value: 0, options: [[0, 'Ukuran asli'], [3000, '3000 px'], [2000, '2000 px'], [1600, '1600 px'], [1280, '1280 px'], [800, '800 px']] }, { id: 'to', label: 'Format hasil', type: 'select', value: 'jpg', options: [['jpg', 'JPG (paling kompatibel)'], ['webp', 'WEBP (lebih kecil)']] }], button: 'Kompres' }],
    intro: 'Pilih target ukuran (misalnya ≤ 200 KB) dan Ubahin mencari kualitas terbaik yang masih muat. Jika perlu, resolusi akan diturunkan sedikit demi sedikit.',
    faq: [['Apakah bisa tepat 200 KB?', 'Hasilnya akan sama atau di bawah target. Jika gambar terlalu detail, resolusi diturunkan otomatis sampai target tercapai atau batas terkecil.'], ['Bagaimana dengan PNG transparan?', 'Hasil JPG/WEBP menaruh latar putih pada area transparan.']], rel: ['jpg-ke-pdf', 'heic-ke-jpg', 'kompres-pdf'] },
  ...[100, 200, 500].map((kb) => ({ slug: `kompres-foto-${kb}kb`, cat: 'kompres', ico: kb + 'KB', name: `Kompres Foto ${kb} KB`, h1: `Kompres Foto jadi ${kb} KB`, desc: `Kecilkan foto hingga maksimal ${kb} KB untuk upload pendaftaran, CPNS, beasiswa, atau formulir online. Gratis dan privat.`, short: `Foto maksimal ${kb} KB untuk formulir online`,
    accept: IMG_IN, multiple: true, targets: [{ id: 'x', kind: 'imgcompress', fixed: { targetKB: kb, to: 'jpg', quality: 80, maxDim: 0 }, opts: [], button: `Kecilkan ke ≤ ${kb} KB` }],
    intro: `Banyak formulir online membatasi ukuran foto, misalnya maksimal ${kb} KB. Unggah foto Anda, dan hasilnya akan dibuat sama atau di bawah ${kb} KB dengan kualitas sebaik mungkin. Selalu cek kembali persyaratan resmi dari penyelenggara karena aturan bisa berbeda.`,
    faq: [['Apakah ukuran piksel ikut berubah?', 'Hanya bila diperlukan agar muat di batas ukuran file.']], rel: ['kompres-gambar', 'jpg-ke-pdf', 'kompres-pdf'] })),

  // ---- media
  { slug: 'video-ke-mp3', cat: 'media', ico: 'MP3', name: 'Video ke MP3', h1: 'Ubah Video ke MP3 Online', desc: 'Ambil suara dari video (MP4, MOV, WEBM) dan simpan sebagai MP3 atau WAV. Gratis dan privat.', short: 'Ambil suara dari video jadi MP3',
    accept: ['mp4', 'm4v', 'mov', 'webm', '3gp', 'mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'], multiple: true, maxMB: 200, targets: [{ id: 'x', kind: 'media2audio', opts: [{ id: 'to', label: 'Format', type: 'select', value: 'mp3', options: [['mp3', 'MP3'], ['wav', 'WAV (tanpa kompresi, file besar)']] }, { id: 'bitrate', label: 'Kualitas MP3', type: 'select', value: 128, options: [[96, '96 kbps (hemat)'], [128, '128 kbps (standar)'], [192, '192 kbps (bagus)'], [256, '256 kbps (tinggi)']] }], button: 'Ubah ke audio' }],
    intro: 'Ekstrak suara dari video lalu simpan sebagai MP3. Prosesnya memakai kemampuan browser Anda untuk membaca suara, sehingga format yang umum seperti MP4, MOV, dan WEBM paling aman. Video yang sangat panjang butuh memori besar; gunakan Chrome atau Edge di komputer untuk file besar.',
    faq: [['Format video apa yang didukung?', 'Yang bisa dibaca browser Anda: umumnya MP4, MOV, WEBM, M4A, MP3, WAV, OGG. Format seperti MKV atau AVI sering tidak didukung.'], ['Berapa lama prosesnya?', 'Tergantung durasi dan perangkat. Video 10 menit biasanya selesai dalam beberapa detik di komputer.']], rel: ['mp4-ke-mp3', 'kompres-gambar'] },
  { slug: 'mp4-ke-mp3', cat: 'media', ico: 'MP3', name: 'MP4 ke MP3', h1: 'Ubah MP4 ke MP3 Online', desc: 'Ubah MP4 ke MP3 gratis di browser. Tanpa daftar, tanpa unggah.', short: 'MP4 jadi MP3',
    accept: ['mp4', 'm4v', 'mov'], multiple: true, maxMB: 200, targets: [{ id: 'x', kind: 'media2audio', opts: [{ id: 'to', label: 'Format', type: 'select', value: 'mp3', options: [['mp3', 'MP3'], ['wav', 'WAV']] }, { id: 'bitrate', label: 'Kualitas MP3', type: 'select', value: 128, options: [[96, '96 kbps'], [128, '128 kbps'], [192, '192 kbps'], [256, '256 kbps']] }], button: 'Ubah ke MP3' }],
    intro: 'Simpan musik, ceramah, atau rekaman rapat dari file MP4 sebagai MP3 yang ringan dan mudah diputar di mana saja.',
    faq: [['Apakah video ikut tersimpan?', 'Tidak. Hanya jalur suaranya yang diambil.']], rel: ['video-ke-mp3'] }
];
const bySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));

// Halaman beranda: konverter otomatis
const HOME_TARGETS = [
  { id: 'toimg', label: 'Gambar → JPG', exts: IMG_IN, kind: 'img2img', fixed: { to: 'jpg' }, opts: [Q(90)], button: 'Ubah ke JPG' },
  { id: 'topng', label: 'Gambar → PNG', exts: IMG_IN, kind: 'img2img', fixed: { to: 'png' }, opts: [], button: 'Ubah ke PNG' },
  { id: 'towebp', label: 'Gambar → WEBP', exts: IMG_IN, kind: 'img2img', fixed: { to: 'webp' }, opts: [Q(85)], button: 'Ubah ke WEBP' },
  { id: 'topdf', label: 'Gambar → PDF', exts: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'], kind: 'img2pdf', opts: [{ id: 'size', label: 'Ukuran halaman', type: 'select', value: 'a4', options: [['a4', 'A4'], ['fit', 'Sesuai gambar']] }, { id: 'margin', label: 'Margin', type: 'select', value: 0, options: [[0, 'Tanpa'], [20, 'Kecil'], [40, 'Sedang']] }], button: 'Buat PDF' },
  { id: 'imgsmall', label: 'Kompres gambar', exts: IMG_IN, kind: 'imgcompress', fixed: { to: 'jpg', maxDim: 0, quality: 75 }, opts: [TARGETKB(500)], button: 'Kompres' },
  { id: 'pdf2jpg', label: 'PDF → JPG', exts: ['pdf'], kind: 'pdf2img', fixed: { to: 'jpg' }, opts: [SCALE], button: 'Ubah ke JPG' },
  { id: 'pdf2png', label: 'PDF → PNG', exts: ['pdf'], kind: 'pdf2img', fixed: { to: 'png' }, opts: [SCALE], button: 'Ubah ke PNG' },
  { id: 'pdfsmall', label: 'Kompres PDF', exts: ['pdf'], kind: 'pdfcompress', opts: [{ id: 'level', label: 'Tingkat kompresi', type: 'select', value: 'sedang', options: [['ringan', 'Ringan'], ['sedang', 'Sedang'], ['kuat', 'Kuat'], ['ekstrem', 'Ekstrem']] }], button: 'Kompres PDF' },
  { id: 'pdfmerge', label: 'Gabung PDF', exts: ['pdf'], kind: 'pdfmerge', minFiles: 2, opts: [], button: 'Gabung PDF' },
  { id: 'mp3', label: 'Suara → MP3', exts: ['mp4', 'm4v', 'mov', 'webm', '3gp', 'mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'], kind: 'media2audio', fixed: { to: 'mp3', bitrate: 128 }, opts: [], button: 'Ubah ke MP3' }
];
const HOME_ACCEPT = [...new Set(HOME_TARGETS.flatMap((t) => t.exts))];

const CATS = {
  gambar: 'Gambar', pdf: 'Ubah PDF', alatpdf: 'Alat PDF', kompres: 'Kompres', media: 'Video & Audio'
};

/* ---------------- helper HTML ---------------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rel = (depth) => (depth ? '../'.repeat(depth) : './');
const link = (depth, slug) => (slug ? rel(depth) + slug + (HTML_LINKS ? '/index.html' : '/') : rel(depth) + (HTML_LINKS ? 'index.html' : ''));
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const icoClass = (c) => (c === 'gambar' || c === 'kompres' && false ? 'img' : c === 'pdf' || c === 'alatpdf' ? 'pdf' : c === 'media' ? 'media' : 'img');
const cardClass = (t) => (t.cat === 'media' ? 'media' : t.cat === 'pdf' || t.cat === 'alatpdf' || /pdf/.test(t.slug) ? 'pdf' : 'img');

function header(d) {
  const grp = (cats) => tools.filter((t) => cats.includes(t.cat) && !/^kompres-foto-/.test(t.slug)).map((t) => `<li><a href="${link(d, t.slug)}">${esc(t.name)}</a></li>`).join('');
  return `<a class="skip" href="#main">Lewati ke konten</a>
<header class="site-header"><div class="wrap nav">
<a class="logo" href="${link(d)}" aria-label="Ubahin — beranda"><img src="${rel(d)}assets/img/logo.svg" alt="Ubahin" width="125" height="34"></a>
<button class="burger" aria-label="Buka menu" aria-expanded="false" id="burger">☰</button>
<ul class="nav-menu" id="menu">
<li><button type="button" aria-haspopup="true">Ubah ▾</button><ul class="drop">${grp(['gambar', 'pdf', 'media'])}</ul></li>
<li><button type="button" aria-haspopup="true">Kompres ▾</button><ul class="drop">${grp(['kompres'])}</ul></li>
<li><button type="button" aria-haspopup="true">Alat PDF ▾</button><ul class="drop">${grp(['alatpdf'])}</ul></li>
<li><a href="${link(d, 'konverter-satuan')}">Satuan</a></li>
<li><a href="${link(d, 'blog')}">Blog</a></li>
</ul>
<a class="btn btn-ghost btn-sm nav-cta" href="${link(d, 'donasi')}">♥ Dukung</a>
</div></header>`;
}
function footer(d) {
  const col = (title, cats) => `<div><h3>${title}</h3><ul>${tools.filter((t) => cats.includes(t.cat) && !/^kompres-foto-/.test(t.slug)).map((t) => `<li><a href="${link(d, t.slug)}">${esc(t.name)}</a></li>`).join('')}</ul></div>`;
  return `<footer class="site-footer"><div class="wrap">
<div class="fgrid">
<div><img src="${rel(d)}assets/img/logo.svg" alt="Ubahin" width="125" height="34" style="filter:brightness(0) invert(1)"><p style="margin-top:12px;font-size:.92rem">Konverter file online gratis berbahasa Indonesia. Diproses di perangkat Anda.</p></div>
${col('Gambar & PDF', ['gambar', 'pdf'])}${col('Kompres & Alat PDF', ['kompres', 'alatpdf'])}${col('Video & Lainnya', ['media'])}
<div><h3>Ubahin</h3><ul><li><a href="${link(d, 'semua-alat')}">Semua alat</a></li><li><a href="${link(d, 'konverter-satuan')}">Konverter satuan</a></li><li><a href="${link(d, 'blog')}">Blog</a></li><li><a href="${link(d, 'tentang')}">Tentang</a></li><li><a href="${link(d, 'keamanan')}">Keamanan</a></li><li><a href="${link(d, 'privasi')}">Privasi</a></li><li><a href="${link(d, 'ketentuan')}">Ketentuan</a></li><li><a href="${link(d, 'kontak')}">Kontak</a></li><li><a href="${link(d, 'donasi')}">Donasi</a></li></ul></div>
</div>
<div class="fbottom"><span>© ${YEAR} Ubahin. Hak cipta dilindungi.</span><span>Bahasa Indonesia</span></div>
</div></footer>`;
}

function page({ slug, title, desc, body, depth = 1, head = '', scripts = '', noindex = false, ogType = 'website' }) {
  const canon = SITE + (slug ? '/' + slug + '/' : '/');
  const d = depth;
  return `<!doctype html>
<html lang="id"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canon}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="${ogType}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canon}"><meta property="og:locale" content="id_ID"><meta property="og:site_name" content="Ubahin"><meta property="og:image" content="${SITE}/assets/img/og.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#4F46E5">
<link rel="icon" href="${rel(d)}assets/img/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="${rel(d)}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap">
<link rel="stylesheet" href="${rel(d)}assets/css/style.css">
${head}
</head><body>
${header(d)}
<main id="main">${body}</main>
${footer(d)}
<script>(function(){var b=document.getElementById('burger'),m=document.getElementById('menu');b.addEventListener('click',function(){var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o)})})();</script>
${scripts}
</body></html>`;
}

const GENERIC_FAQ = [
  ['Apakah file saya diunggah ke server?', 'Tidak. Proses konversi berjalan di browser Anda, jadi file tetap berada di perangkat. Yang diunduh hanyalah komponen program (misalnya pustaka PDF) dari situs ini; untuk HEIC dan MP3 dimuat pula satu komponen tambahan dari jsDelivr. File Anda tidak ikut terkirim.'],
  ['Berapa batas ukuran file?', 'Batas di Ubahin adalah 200 MB per file, namun batas sebenarnya bergantung pada memori perangkat Anda. File yang sangat besar bisa membuat browser lambat atau berhenti.'],
  ['Apakah gratis? Perlu daftar?', 'Gratis dan tanpa akun. Tidak ada watermark pada hasil.']
];

const steps = `<ol class="steps"><li><h3>Pilih file</h3><p>Seret file ke kotak di atas atau klik untuk memilih dari perangkat.</p></li><li><h3>Atur pilihan</h3><p>Tentukan format atau kualitas, lalu tekan tombol proses.</p></li><li><h3>Unduh hasilnya</h3><p>Simpan satu per satu atau semuanya sekaligus dalam ZIP.</p></li></ol>`;
const trust = `<ul class="trust"><li>Gratis, tanpa daftar</li><li>Diproses di perangkat Anda</li><li>Tanpa watermark</li></ul>`;
const faqHtml = (items) => items.map(([q, a]) => `<details><summary>${esc(q)}</summary><div>${esc(a)}</div></details>`).join('');
const cardsHtml = (list, d) => list.map((t) => `<a class="card" href="${link(d, t.slug)}"><div class="ico ${cardClass(t)}">${esc(t.ico)}</div><h3>${esc(t.name)}</h3><p>${esc(t.short)}</p></a>`).join('');
const toolScripts = (cfg, d, extra = '') => `<script>window.UBAHIN=${JSON.stringify(cfg)};</script><script src="${rel(d)}assets/js/engines.js"></script><script src="${rel(d)}assets/js/app.js"></script>${extra}`;

/* ---------------- tulis berkas ---------------- */
const written = [];
function write(slug, html) {
  const p = slug ? path.join(DIST, slug, 'index.html') : path.join(DIST, 'index.html');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
  written.push(slug);
}

// Beranda
{
  const d = 0;
  const popular = ['heic-ke-jpg', 'jpg-ke-pdf', 'kompres-pdf', 'kompres-foto-200kb', 'video-ke-mp3', 'gabung-pdf', 'webp-ke-png', 'pdf-ke-jpg'].map((s) => bySlug[s]);
  const faq = [GENERIC_FAQ[0], ['Format apa saja yang bisa diubah?', 'Gambar (JPG, PNG, WEBP, HEIC, GIF, BMP, AVIF), PDF (ke gambar, gabung, pisah, putar, hapus halaman, kompres), dan suara dari video (MP3/WAV). Jika Anda butuh konversi Word atau Excel, fitur itu belum tersedia.'], GENERIC_FAQ[1], GENERIC_FAQ[2]];
  const cfg = { accept: HOME_ACCEPT, multiple: true, maxMB: 200, orderable: true, dropText: 'Seret file ke sini atau klik untuk memilih', hint: 'Gambar, PDF, video & audio · maks. 200 MB per file', targets: HOME_TARGETS };
  const body = `<div class="wrap"><section class="hero"><span class="eyebrow">100% gratis · file tidak diunggah</span><h1>Konverter File Online Gratis</h1><p class="lead">Ubah gambar, PDF, dan video langsung di browser Anda. Tanpa daftar, tanpa watermark, dan file tetap di perangkat Anda.</p>
<div class="tool" id="tool" aria-live="polite"><noscript>Ubahin membutuhkan JavaScript untuk memproses file di browser Anda.</noscript></div>${trust}</section>
<section class="block"><h2>Alat populer</h2><div class="grid">${cardsHtml(popular, d)}</div><p style="margin-top:16px"><a href="${link(d, 'semua-alat')}">Lihat semua alat →</a></p></section>
<section class="block"><h2>Cara menggunakan</h2>${steps}</section>
<section class="block"><h2>Kenapa Ubahin?</h2><div class="grid">
<div class="card"><h3>🔒 Privat</h3><p>Konversi berjalan di perangkat Anda. File tidak dikirim ke server kami.</p></div>
<div class="card"><h3>🇮🇩 Bahasa Indonesia</h3><p>Antarmuka dan panduan ditulis untuk kebutuhan sehari-hari di Indonesia.</p></div>
<div class="card"><h3>📏 Target ukuran</h3><p>Kecilkan foto ke ≤ 100/200/500 KB untuk formulir pendaftaran online.</p></div>
<div class="card"><h3>📱 Semua perangkat</h3><p>Bisa dipakai di HP, tablet, atau komputer lewat browser modern.</p></div></div></section>
<section class="block"><div class="banner"><div><h2>Ubahin gratis untuk semua</h2><p>Bantu kami menjaga situs ini tetap gratis dan tanpa iklan mengganggu.</p></div><a class="btn btn-accent" href="${link(d, 'donasi')}">Dukung Ubahin</a></div></section>
<section class="block prose"><h2>Pertanyaan umum</h2>${faqHtml(faq)}</section></div>`;
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebApplication', name: 'Ubahin', url: SITE + '/', applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'id', offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' } }, { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] });
  write('', page({ slug: '', depth: d, title: 'Ubahin — Konverter File Online Gratis (Gambar, PDF, Video)', desc: 'Ubah HEIC ke JPG, JPG ke PDF, kompres PDF & foto, video ke MP3. Gratis, tanpa daftar, diproses di browser — file tidak diunggah.', body, head: ld, scripts: toolScripts(cfg, d) }));
}

// Halaman alat
for (const t of tools) {
  const d = 1;
  const cfg = { accept: t.accept, multiple: t.multiple, orderable: !!t.orderable, maxMB: t.maxMB || 200, hint: t.accept.map((e) => e.toUpperCase()).filter((e, i, a) => !(e === 'JPEG' && a.includes('JPG'))).join(', ') + ' · maks. ' + (t.maxMB || 200) + ' MB', dropText: t.multiple ? 'Seret file ke sini atau klik untuk memilih' : 'Seret satu file ke sini atau klik untuk memilih', targets: t.targets.map((x) => ({ ...x, exts: undefined })) };
  const faq = [...t.faq, ...GENERIC_FAQ];
  const related = t.rel.map((s) => bySlug[s]).filter(Boolean);
  const body = `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="${link(d)}">Beranda</a> › <a href="${link(d, 'semua-alat')}">Semua alat</a> › ${esc(t.name)}</nav>
<section class="hero" style="padding-top:20px"><h1>${esc(t.h1)}</h1><p class="lead">${esc(t.short)}. Gratis, tanpa daftar, file tetap di perangkat Anda.</p>
<div class="tool" id="tool"><noscript>Alat ini membutuhkan JavaScript.</noscript></div>${trust}</section>
<section class="block prose"><h2>Tentang alat ini</h2><p>${esc(t.intro)}</p></section>
<section class="block"><h2>Cara menggunakan</h2>${steps}</section>
<section class="block prose"><h2>Pertanyaan umum</h2>${faqHtml(faq)}</section>
<section class="block"><h2>Alat terkait</h2><div class="grid">${cardsHtml(related, d)}</div></section></div>`;
  const ld = jsonld({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', name: 'Ubahin — ' + t.name, url: `${SITE}/${t.slug}/`, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'id', offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' } },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: t.name, item: `${SITE}/${t.slug}/` }] }] });
  write(t.slug, page({ slug: t.slug, depth: d, title: `${t.h1} — Gratis | Ubahin`, desc: t.desc, body, head: ld, scripts: toolScripts(cfg, d) }));
}

// Konverter satuan
{
  const d = 1;
  const body = `<div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="${link(d)}">Beranda</a> › Konverter satuan</nav><section class="hero" style="padding-top:20px"><h1>Konverter Satuan Online</h1><p class="lead">Ubah panjang, berat, volume, dan suhu dengan cepat.</p><div class="tool" id="unit-tool"></div></section>
<section class="block prose"><h2>Tentang konverter satuan</h2><p>Pilih jenis satuan, isi nilai, dan hasil muncul seketika. Cocok untuk mengubah kilogram ke pon, kaki ke meter, atau Celsius ke Fahrenheit. Seluruh perhitungan dilakukan di browser.</p></section></div>`;
  write('konverter-satuan', page({ slug: 'konverter-satuan', depth: d, title: 'Konverter Satuan Online — Panjang, Berat, Suhu | Ubahin', desc: 'Konverter satuan gratis: kg ke lbs, feet ke meter, Celsius ke Fahrenheit, liter ke galon, dan lainnya.', body, scripts: `<script src="${rel(d)}assets/js/unit.js"></script>` }));
}

// Semua alat
{
  const d = 1, all = [...tools.filter((t) => !/^kompres-foto-/.test(t.slug)), ...tools.filter((t) => /^kompres-foto-/.test(t.slug))];
  const sec = (title, f) => { const l = all.filter(f); return l.length ? `<section class="block"><h2>${title}</h2><div class="grid">${cardsHtml(l, d)}</div></section>` : ''; };
  const body = `<div class="wrap"><nav class="crumbs"><a href="${link(d)}">Beranda</a> › Semua alat</nav><section class="hero" style="padding-top:20px"><h1>Semua Alat Ubahin</h1><p class="lead">Pilih alat yang Anda butuhkan. Semuanya gratis dan diproses di perangkat Anda.</p></section>
${sec('Gambar', (t) => t.cat === 'gambar')}${sec('PDF', (t) => t.cat === 'pdf')}${sec('Alat PDF', (t) => t.cat === 'alatpdf')}${sec('Kompres', (t) => t.cat === 'kompres')}${sec('Video & Audio', (t) => t.cat === 'media')}
<section class="block"><h2>Lainnya</h2><div class="grid"><a class="card" href="${link(d, 'konverter-satuan')}"><div class="ico">UNIT</div><h3>Konverter Satuan</h3><p>Panjang, berat, volume, suhu</p></a></div></section></div>`;
  write('semua-alat', page({ slug: 'semua-alat', depth: d, title: 'Semua Alat — Konverter, Kompres, Alat PDF | Ubahin', desc: 'Daftar lengkap alat Ubahin: konversi gambar, PDF, video ke MP3, kompres foto dan PDF, serta alat PDF.', body }));
}

// Blog
const posts = [
  { slug: 'cara-kompres-pdf-di-bawah-500-kb', title: 'Cara Kompres PDF agar di Bawah 500 KB', desc: 'Langkah praktis memperkecil ukuran PDF untuk upload berkas pendaftaran, beasiswa, atau lamaran kerja.', body: `<p>Banyak portal pendaftaran membatasi ukuran PDF, misalnya 500 KB. Berikut urutan langkah yang biasanya paling efektif, dari yang paling ringan.</p>
<h2>1. Cari tahu penyebab PDF besar</h2><p>PDF hasil scan atau foto biasanya besar karena tiap halaman berupa gambar beresolusi tinggi. PDF berisi teks murni umumnya sudah kecil.</p>
<h2>2. Buang halaman yang tidak perlu</h2><p>Gunakan <a href="@hapus-halaman-pdf">Hapus Halaman PDF</a> atau <a href="@pisah-pdf">Pisah PDF</a> untuk mengambil halaman yang dibutuhkan saja.</p>
<h2>3. Kompres PDF</h2><p>Buka <a href="@kompres-pdf">Kompres PDF</a>, mulai dari tingkat Sedang. Jika masih di atas batas, coba Kuat, lalu Ekstrem. Perhatikan bahwa teks pada hasil menjadi gambar.</p>
<h2>4. Jika PDF dibuat dari foto</h2><p>Kecilkan foto terlebih dahulu dengan <a href="@kompres-gambar">Kompres Gambar</a> (misalnya target 200 KB per foto), lalu gabungkan dengan <a href="@jpg-ke-pdf">JPG ke PDF</a>.</p>
<h2>5. Periksa hasilnya</h2><p>Buka hasil akhirnya dan pastikan tulisan masih terbaca sebelum diunggah. Cek juga persyaratan resmi dari penyelenggara, karena batas ukuran dan format bisa berbeda.</p>` },
  { slug: 'apa-itu-file-heic', title: 'Apa Itu File HEIC dan Cara Membukanya di Semua Perangkat', desc: 'Penjelasan singkat format HEIC dari iPhone, kenapa sulit dibuka, dan cara mengubahnya ke JPG.', body: `<p>HEIC (High Efficiency Image Container) adalah format foto yang dipakai kamera iPhone secara bawaan sejak iOS 11. Ukurannya lebih kecil daripada JPG pada kualitas yang mirip.</p>
<h2>Kenapa sulit dibuka?</h2><p>Tidak semua sistem dan aplikasi mendukung HEIC. Beberapa versi Windows memerlukan ekstensi tambahan, sebagian aplikasi Android dan formulir online hanya menerima JPG atau PNG.</p>
<h2>Cara mengubahnya</h2><ul><li>Gunakan <a href="@heic-ke-jpg">HEIC ke JPG</a> di Ubahin. Prosesnya di browser, foto tidak diunggah.</li><li>Atau di iPhone: Pengaturan › Kamera › Format › pilih <em>Paling Kompatibel</em> agar foto baru disimpan sebagai JPG.</li></ul>
<h2>Bagaimana dengan ukuran?</h2><p>Setelah menjadi JPG, ukuran file biasanya membesar. Jika perlu, kecilkan dengan <a href="@kompres-gambar">Kompres Gambar</a>.</p>` }
];
{
  const d = 1;
  const rewrite = (h, dd) => h.replace(/href="@([a-z0-9-]+)"/g, (_, s) => `href="${link(dd, s)}"`);
  const list = posts.map((p) => `<a class="card" href="${link(d, 'blog/' + p.slug)}"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p></a>`).join('');
  write('blog', page({ slug: 'blog', depth: d, title: 'Blog — Panduan File & Dokumen | Ubahin', desc: 'Panduan praktis seputar PDF, gambar, dan format file untuk kebutuhan sehari-hari.', body: `<div class="wrap"><section class="hero" style="padding-top:20px"><h1>Blog Ubahin</h1><p class="lead">Panduan singkat seputar file dan dokumen.</p></section><div class="grid">${list}</div></div>` }));
  posts.forEach((p) => {
    const dd = 2;
    write('blog/' + p.slug, page({ slug: 'blog/' + p.slug, depth: dd, ogType: 'article', title: p.title + ' | Ubahin', desc: p.desc, body: `<div class="wrap"><nav class="crumbs"><a href="${link(dd)}">Beranda</a> › <a href="${link(dd, 'blog')}">Blog</a></nav><article class="prose" style="padding:24px 0"><h1>${esc(p.title)}</h1>${rewrite(p.body, dd)}</article></div>` }));
  });
}

// Halaman statis
const statics = {
  tentang: ['Tentang Ubahin', 'Ubahin adalah konverter file online berbahasa Indonesia yang berjalan di browser.', `<p>Ubahin dibuat agar mengubah format file terasa mudah, cepat, dan aman bagi pengguna di Indonesia — tanpa iklan yang mengganggu dan tanpa kewajiban mendaftar.</p><h2>Prinsip kami</h2><ul><li><strong>Privasi lebih dulu:</strong> konversi berjalan di perangkat Anda.</li><li><strong>Jujur soal batasan:</strong> kami menjelaskan apa yang bisa dan tidak bisa dilakukan setiap alat.</li><li><strong>Gratis:</strong> tanpa watermark dan tanpa akun.</li></ul><h2>Yang belum tersedia</h2><p>Konversi Word/Excel/PowerPoint, OCR, dan kompres video belum ada saat ini karena memerlukan pemrosesan di server.</p>`],
  keamanan: ['Keamanan', 'Bagaimana Ubahin menjaga file Anda tetap aman.', `<p>Ubahin memproses file di browser Anda memakai JavaScript dan WebAssembly. Artinya, file tidak dikirim ke server kami.</p><h2>Yang dimuat dari internet</h2><ul><li>Halaman, gaya, dan program konversi dari situs ini.</li><li>Font dari Google Fonts.</li><li>Khusus konversi HEIC dan MP3: satu komponen tambahan dari jsDelivr (CDN). Hanya kode program yang diunduh; file Anda tidak dikirim.</li></ul><h2>Cara memeriksa sendiri</h2><p>Buka alat pengembang browser (tab Network) saat mengonversi: Anda tidak akan melihat file Anda dikirim ke luar.</p><h2>Koneksi</h2><p>Situs disajikan lewat HTTPS.</p>`],
  privasi: ['Kebijakan Privasi', 'Kebijakan privasi Ubahin.', `<p><em>Dokumen ini adalah templat awal. Sebelum situs diluncurkan secara publik, mintalah penasihat hukum untuk meninjau dan menyesuaikannya dengan UU Pelindungan Data Pribadi (UU No. 27 Tahun 2022).</em></p><h2>File Anda</h2><p>File yang Anda pilih diproses di perangkat Anda dan tidak kami unggah, simpan, atau baca.</p><h2>Data yang kami kumpulkan</h2><p>Saat ini Ubahin tidak memiliki akun dan tidak memasang pelacak iklan. Penyedia hosting dapat mencatat data teknis standar (alamat IP, jenis browser) dalam log server. Jika analitik ditambahkan kelak, halaman ini akan diperbarui.</p><h2>Layanan pihak ketiga</h2><p>Google Fonts (font) dan jsDelivr (komponen HEIC/MP3) menerima permintaan dari browser Anda dan dapat mencatat alamat IP sesuai kebijakan masing-masing.</p><h2>Kontak</h2><p>Pertanyaan: <a href="mailto:${CONTACT}">${CONTACT}</a></p>`],
  ketentuan: ['Ketentuan Penggunaan', 'Syarat dan ketentuan penggunaan Ubahin.', `<p><em>Templat awal — mohon ditinjau penasihat hukum sebelum peluncuran.</em></p><ol><li>Anda hanya boleh memproses file yang Anda miliki atau berhak gunakan.</li><li>Dilarang memakai layanan untuk tujuan melanggar hukum.</li><li>Layanan disediakan "apa adanya" tanpa jaminan. Hasil konversi dapat berbeda dari file asli; periksa hasilnya sebelum dipakai untuk hal penting.</li><li>Kami tidak bertanggung jawab atas kehilangan data akibat penggunaan layanan. Simpan salinan file asli Anda.</li><li>Ketentuan dapat berubah sewaktu-waktu.</li></ol>`],
  kontak: ['Kontak', 'Hubungi tim Ubahin.', `<p>Saran, laporan bug, atau pertanyaan: <a href="mailto:${CONTACT}">${CONTACT}</a></p><p>Saat melapor bug, sebutkan alat, jenis browser, dan perangkat Anda. Mohon jangan melampirkan dokumen pribadi.</p>`],
  donasi: ['Dukung Ubahin', 'Bantu Ubahin tetap gratis.', `<p>Ubahin gratis dan tanpa iklan mengganggu. Biaya domain dan pengembangan ditanggung pengelola. Jika alat ini membantu Anda, dukungan Anda sangat berarti.</p>${DONATE ? `<p><a class="btn btn-accent" href="${esc(DONATE)}" rel="noopener" target="_blank">Donasi sekarang</a></p>` : '<p><span class="pill">Segera hadir</span> Tautan donasi (Trakteer/Saweria/QRIS) akan ditambahkan oleh pengelola.</p>'}`]
};
for (const [slug, [title, desc, html]] of Object.entries(statics)) {
  write(slug, page({ slug, depth: 1, title: title + ' | Ubahin', desc, body: `<div class="wrap"><nav class="crumbs"><a href="${link(1)}">Beranda</a> › ${esc(title)}</nav><article class="prose" style="padding:24px 0"><h1>${esc(title)}</h1>${html}</article></div>` }));
}

// 404 (di root; pakai jalur absolut karena dilayani dari URL mana pun)
{
  const h = page({ slug: '404', depth: 0, noindex: true, title: 'Halaman tidak ditemukan | Ubahin', desc: 'Halaman tidak ditemukan.', body: `<div class="wrap"><section class="hero"><h1>404 — Halaman tidak ditemukan</h1><p class="lead">Tautan yang Anda buka tidak ada atau sudah dipindahkan.</p><a class="btn btn-primary" href="${link(0)}">Kembali ke beranda</a></section></div>` });
  fs.writeFileSync(path.join(DIST, '404.html'), h.replaceAll('"./assets/', '"/assets/').replaceAll('href="./"', 'href="/"'));
}

/* ---------------- berkas pendukung ---------------- */
const urls = ['', ...written.filter((s) => s && s !== '404')].map((s) => `<url><loc>${SITE}/${s ? s + '/' : ''}</loc></url>`).join('');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`);

// ikon & gambar OG
try {
  const sharp = createRequire(import.meta.url)(process.env.SHARP_PATH || 'sharp');
  const icon = fs.readFileSync(path.join(ROOT, 'public/assets/img/icon.svg'));
  await sharp(icon, { density: 600 }).resize(180, 180).png().toFile(path.join(DIST, 'assets/img/apple-touch-icon.png'));
  await sharp(icon, { density: 600 }).resize(512, 512).png().toFile(path.join(DIST, 'assets/img/icon-512.png'));
  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><g transform="translate(90 90) scale(3.2)"><rect width="48" height="48" rx="12" fill="#fff"/><path d="M15 13v14a9 9 0 0 0 18 0V16" fill="none" stroke="#4F46E5" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 17.5 15 13l4.5 4.5" fill="none" stroke="#4F46E5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28.5 11.5 33 16l4.5-4.5" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g><text x="90" y="400" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="84" fill="#fff">Ubahin</text><text x="90" y="480" font-family="DejaVu Sans, Arial, sans-serif" font-size="40" fill="#E0E7FF">Konverter file online gratis</text><text x="90" y="540" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#C7D2FE">Gambar · PDF · Video — diproses di perangkat Anda</text></svg>`;
  await sharp(Buffer.from(og)).png().toFile(path.join(DIST, 'assets/img/og.png'));
} catch (e) { console.warn('Lewati pembuatan ulang PNG (opsional, sharp tidak terpasang). PNG bawaan di public/assets/img tetap dipakai.'); }

console.log(`OK: ${written.length} halaman → dist/ ${HTML_LINKS ? '(mode --html)' : ''}`);
