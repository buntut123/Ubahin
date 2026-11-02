// Artikel blog. Tautan ke alat memakai format href="@slug-alat".
const DATE = '2026-11-02';
export const posts = [
  {
    slug: 'cara-kompres-pdf-di-bawah-500-kb', date: DATE, tools: ['kompres-pdf', 'hapus-halaman-pdf', 'kompres-gambar'],
    title: 'Cara Kompres PDF agar di Bawah 500 KB',
    desc: 'Langkah praktis memperkecil ukuran PDF untuk upload berkas pendaftaran, beasiswa, atau lamaran kerja.',
    body: `<p>Banyak portal pendaftaran membatasi ukuran PDF, misalnya 500 KB. Berikut urutan langkah yang biasanya paling efektif, dari yang paling ringan.</p>
<h2>1. Cari tahu penyebab PDF besar</h2><p>PDF hasil scan atau foto biasanya besar karena tiap halaman berupa gambar beresolusi tinggi. PDF berisi teks murni umumnya sudah kecil.</p>
<h2>2. Buang halaman yang tidak perlu</h2><p>Gunakan <a href="@hapus-halaman-pdf">Hapus Halaman PDF</a> atau <a href="@pisah-pdf">Pisah PDF</a> untuk mengambil halaman yang dibutuhkan saja.</p>
<h2>3. Kompres PDF</h2><p>Buka <a href="@kompres-pdf">Kompres PDF</a>, mulai dari tingkat Sedang. Jika masih di atas batas, coba Kuat, lalu Ekstrem. Perhatikan bahwa teks pada hasil menjadi gambar.</p>
<h2>4. Jika PDF dibuat dari foto</h2><p>Kecilkan foto terlebih dahulu dengan <a href="@kompres-gambar">Kompres Gambar</a> (misalnya target 200 KB per foto), lalu gabungkan dengan <a href="@jpg-ke-pdf">JPG ke PDF</a>.</p>
<h2>5. Periksa hasilnya</h2><p>Buka hasil akhirnya dan pastikan tulisan masih terbaca sebelum diunggah. Cek juga persyaratan resmi dari penyelenggara, karena batas ukuran dan format bisa berbeda.</p>`
  },
  {
    slug: 'apa-itu-file-heic', date: DATE, tools: ['heic-ke-jpg', 'heic-ke-png', 'kompres-gambar'],
    title: 'Apa Itu File HEIC dan Cara Membukanya di Semua Perangkat',
    desc: 'Penjelasan singkat format HEIC dari iPhone, kenapa sulit dibuka, dan cara mengubahnya ke JPG.',
    body: `<p>HEIC (High Efficiency Image Container) adalah format foto yang dipakai kamera iPhone secara bawaan sejak iOS 11. Ukurannya lebih kecil daripada JPG pada kualitas yang mirip.</p>
<h2>Kenapa sulit dibuka?</h2><p>Tidak semua sistem dan aplikasi mendukung HEIC. Beberapa versi Windows memerlukan ekstensi tambahan, sebagian aplikasi Android dan formulir online hanya menerima JPG atau PNG.</p>
<h2>Cara mengubahnya</h2><ul><li>Gunakan <a href="@heic-ke-jpg">HEIC ke JPG</a> di Ubahin. Prosesnya di browser, foto tidak diunggah.</li><li>Atau di iPhone: Pengaturan › Kamera › Format › pilih <em>Paling Kompatibel</em> agar foto baru disimpan sebagai JPG.</li></ul>
<h2>Bagaimana dengan ukuran?</h2><p>Setelah menjadi JPG, ukuran file biasanya membesar. Jika perlu, kecilkan dengan <a href="@kompres-gambar">Kompres Gambar</a>.</p>`
  },
  {
    slug: 'cara-kompres-foto-jadi-200-kb', date: DATE, tools: ['kompres-foto-200kb', 'kompres-gambar', 'heic-ke-jpg'],
    title: 'Cara Mengecilkan Foto Menjadi 200 KB untuk Formulir Online',
    desc: 'Panduan memperkecil ukuran foto sampai batas 100 KB, 200 KB, atau 500 KB tanpa membuatnya buram.',
    body: `<p>Formulir pendaftaran sekolah, beasiswa, atau lowongan kerja sering membatasi ukuran foto, misalnya maksimal 200 KB. Foto langsung dari kamera ponsel biasanya jauh lebih besar, antara 2 sampai 8 MB. Berikut cara mengecilkannya dengan tetap enak dilihat.</p>
<h2>Dua hal yang menentukan ukuran foto</h2><p>Ukuran file ditentukan oleh jumlah piksel (lebar dan tinggi) dan tingkat kompresi (kualitas). Menurunkan salah satunya akan memperkecil file. Foto yang hanya dipakai di layar tidak perlu ribuan piksel, jadi menurunkan resolusi sedikit hampir tidak terlihat.</p>
<h2>Langkah cepat</h2>
<ol><li>Buka <a href="@kompres-foto-200kb">Kompres Foto 200 KB</a>. Untuk batas lain, pakai <a href="@kompres-gambar">Kompres Gambar</a> dan pilih target ukuran.</li><li>Pilih foto dari galeri atau file Anda.</li><li>Tekan tombol kompres, lalu unduh hasilnya.</li><li>Buka hasilnya dan pastikan wajah atau tulisan pada foto masih jelas.</li></ol>
<h2>Jika foto Anda berformat HEIC</h2><p>Foto dari iPhone sering berformat HEIC dan tidak diterima formulir. Ubah dulu dengan <a href="@heic-ke-jpg">HEIC ke JPG</a>, atau pilih HEIC langsung di alat kompres karena formatnya juga didukung.</p>
<h2>Tips agar hasil tetap bagus</h2>
<ul><li>Foto dengan latar polos lebih mudah dikecilkan daripada foto ramai dan penuh detail.</li><li>Gunakan format JPG untuk foto. PNG cenderung jauh lebih besar.</li><li>Jangan mengompres berkali-kali. Selalu mulai dari foto asli, karena tiap kompresi menurunkan kualitas.</li><li>Cek ketentuan resmi penyelenggara. Ada yang meminta ukuran piksel tertentu, bukan hanya ukuran file.</li></ul>
<h2>Apakah foto saya diunggah?</h2><p>Tidak. Seluruh proses berjalan di browser Anda, jadi foto pribadi tidak dikirim ke server.</p>`
  },
  {
    slug: 'cara-menggabungkan-foto-jadi-satu-pdf', date: DATE, tools: ['jpg-ke-pdf', 'kompres-pdf', 'gabung-pdf'],
    title: 'Cara Menggabungkan Beberapa Foto Menjadi Satu PDF',
    desc: 'Langkah mengubah foto KTP, ijazah, atau dokumen hasil jepretan HP menjadi satu file PDF yang rapi.',
    body: `<p>Banyak pendaftaran online meminta berkas dalam satu PDF, padahal dokumen Anda masih berupa foto terpisah. Anda tidak perlu aplikasi tambahan untuk menyatukannya.</p>
<h2>Persiapan</h2><p>Foto dokumen dengan cahaya cukup dan posisi lurus. Pastikan seluruh halaman masuk bingkai dan tulisan terbaca. Jika foto terlalu besar, kecilkan dulu dengan <a href="@kompres-gambar">Kompres Gambar</a> agar PDF akhir tidak membengkak.</p>
<h2>Langkah-langkah</h2>
<ol><li>Buka <a href="@jpg-ke-pdf">JPG ke PDF</a>.</li><li>Pilih semua foto sekaligus. Format JPG, PNG, WEBP, dan HEIC didukung.</li><li>Atur urutan dengan tombol panah naik dan turun. Halaman pertama di daftar menjadi halaman pertama PDF.</li><li>Pilih ukuran halaman: A4 untuk dokumen resmi, atau "sesuai ukuran gambar" bila ingin tanpa ruang kosong.</li><li>Tekan Buat PDF dan unduh hasilnya.</li></ol>
<h2>Kalau hasil PDF terlalu besar</h2><p>Gunakan <a href="@kompres-pdf">Kompres PDF</a>, atau kecilkan fotonya sebelum digabung. Cara kedua biasanya memberi hasil yang lebih tajam.</p>
<h2>Menggabung PDF yang sudah ada</h2><p>Jika dokumen Anda sudah berupa beberapa file PDF, gunakan <a href="@gabung-pdf">Gabung PDF</a>.</p>
<h2>Privasi</h2><p>KTP dan ijazah adalah data pribadi. Karena Ubahin memproses file di browser Anda, dokumen tidak dikirim ke server kami.</p>`
  },
  {
    slug: 'perbedaan-jpg-png-webp', date: DATE, tools: ['konverter-gambar', 'png-ke-jpg', 'webp-ke-png'],
    title: 'Perbedaan JPG, PNG, dan WEBP: Kapan Memakai yang Mana',
    desc: 'Penjelasan sederhana tiga format gambar paling umum, lengkap dengan panduan memilih sesuai kebutuhan.',
    body: `<p>Tiga format gambar paling sering ditemui adalah JPG, PNG, dan WEBP. Ketiganya menyimpan gambar dengan cara berbeda, dan memilih yang tepat bisa menghemat ukuran file atau menjaga kualitas.</p>
<h2>JPG</h2><p>JPG memakai kompresi lossy: sebagian detail dibuang agar file kecil. Cocok untuk foto. Tidak mendukung latar transparan. Setiap kali disimpan ulang dengan kompresi, kualitas bisa turun sedikit.</p>
<h2>PNG</h2><p>PNG memakai kompresi lossless: tidak ada detail yang dibuang. Mendukung latar transparan. Cocok untuk logo, ikon, tangkapan layar, dan gambar dengan teks. Untuk foto, ukurannya biasanya jauh lebih besar daripada JPG.</p>
<h2>WEBP</h2><p>WEBP dikembangkan Google dan bisa bekerja dalam mode lossy maupun lossless, serta mendukung transparansi. Pada kualitas yang mirip, ukurannya umumnya lebih kecil daripada JPG atau PNG. Hampir semua browser modern mendukungnya, tetapi sebagian aplikasi lama dan formulir online belum menerimanya.</p>
<h2>Ringkasan pilihan</h2>
<table><tr><th>Kebutuhan</th><th>Format yang cocok</th></tr><tr><td>Foto untuk dikirim atau diunggah ke formulir</td><td>JPG</td></tr><tr><td>Logo, ikon, gambar dengan teks tajam</td><td>PNG</td></tr><tr><td>Gambar untuk situs web yang ingin ringan</td><td>WEBP</td></tr><tr><td>Butuh latar transparan</td><td>PNG atau WEBP</td></tr></table>
<h2>Cara mengubah antar format</h2><p>Gunakan <a href="@konverter-gambar">Konverter Gambar</a> untuk mengubah ke JPG, PNG, atau WEBP. Ada juga alat khusus seperti <a href="@png-ke-jpg">PNG ke JPG</a> dan <a href="@webp-ke-png">WEBP ke PNG</a>. Ingat bahwa mengubah JPG ke PNG tidak mengembalikan detail yang sudah hilang.</p>`
  },
  {
    slug: 'perbedaan-mp3-aac-wav', date: DATE, tools: ['video-ke-mp3', 'mp4-ke-mp3'],
    title: 'MP3, AAC, dan WAV: Bedanya dan Cara Mengambil Suara dari Video',
    desc: 'Memahami tiga format audio populer dan cara menyimpan suara dari video milik Anda sebagai file audio.',
    body: `<p>Kadang kita hanya butuh suaranya saja: rekaman rapat, kuliah, atau video acara keluarga yang Anda rekam sendiri. Sebelum mengubahnya, ada baiknya paham perbedaan tiga format audio ini.</p>
<h2>MP3</h2><p>Format paling dikenal dan paling kompatibel. Memakai kompresi lossy. Pada 128 kbps, satu menit audio sekitar 1 MB. Cocok untuk musik dan rekaman suara umum.</p>
<h2>AAC</h2><p>Format yang dipakai di banyak video MP4 dan ponsel. Pada bitrate yang sama, AAC umumnya terdengar sedikit lebih baik daripada MP3. Jika video Anda sudah berisi AAC, suara bisa diambil apa adanya tanpa dikonversi ulang, jadi kualitasnya tidak turun dan prosesnya sangat cepat.</p>
<h2>WAV</h2><p>Audio tanpa kompresi. Kualitas penuh, tetapi ukurannya besar: kualitas CD stereo sekitar 10 MB per menit. Cocok untuk bahan penyuntingan, kurang cocok untuk disimpan lama atau dikirim.</p>
<h2>Mana yang dipilih?</h2>
<ul><li>Ingin file kecil dan bisa diputar di mana saja: MP3.</li><li>Video berasal dari ponsel dan ingin hasil tercepat tanpa penurunan kualitas: AAC.</li><li>Akan disunting lagi di aplikasi audio: WAV.</li></ul>
<h2>Cara mengambil suara dari video</h2>
<ol><li>Buka <a href="@video-ke-mp3">Video ke MP3</a>.</li><li>Pilih video dari perangkat Anda.</li><li>Pilih format (MP3, AAC, atau WAV). Untuk MP3, pilih kualitas: 128 kbps sudah cukup untuk suara bicara.</li><li>Tekan tombol proses dan unduh hasilnya.</li></ol>
<h2>Catatan</h2><p>Hanya proses video yang Anda miliki atau yang Anda berhak gunakan. Video yang sangat panjang butuh memori besar, jadi untuk file di atas beberapa ratus MB lebih baik memakai komputer.</p>`
  },
  {
    slug: 'cara-gabung-dan-pisah-pdf', date: DATE, tools: ['gabung-pdf', 'pisah-pdf', 'hapus-halaman-pdf'],
    title: 'Cara Menggabung dan Memisah File PDF Tanpa Aplikasi',
    desc: 'Panduan menyatukan beberapa PDF atau mengambil halaman tertentu langsung dari browser.',
    body: `<p>Menggabung dan memisah PDF adalah pekerjaan yang sering muncul saat mengurus berkas. Keduanya bisa dilakukan di browser tanpa memasang program.</p>
<h2>Menggabung beberapa PDF</h2>
<ol><li>Buka <a href="@gabung-pdf">Gabung PDF</a>.</li><li>Pilih dua file PDF atau lebih.</li><li>Susun urutannya dengan tombol panah.</li><li>Tekan Gabung PDF dan unduh hasilnya.</li></ol>
<p>Hasilnya mempertahankan teks dan kualitas asli, karena halaman-halaman disalin utuh ke dokumen baru.</p>
<h2>Mengambil halaman tertentu</h2>
<p>Dengan <a href="@pisah-pdf">Pisah PDF</a>, tulis nomor halaman yang diinginkan. Pisahkan dengan koma dan gunakan tanda hubung untuk rentang.</p>
<table><tr><th>Ditulis</th><th>Artinya</th></tr><tr><td>1-3</td><td>Halaman 1 sampai 3</td></tr><tr><td>1, 5, 9</td><td>Halaman 1, 5, dan 9</td></tr><tr><td>8-</td><td>Halaman 8 sampai halaman terakhir</td></tr><tr><td>1-3, 7-</td><td>Halaman 1 sampai 3, lalu 7 sampai akhir</td></tr></table>
<h2>Memecah setiap halaman</h2><p>Pilih opsi "Pisah setiap halaman" untuk mendapatkan satu file per halaman, lalu unduh semuanya dalam satu ZIP.</p>
<h2>Menghapus halaman yang tidak perlu</h2><p>Jika yang Anda butuhkan adalah membuang sebagian halaman, <a href="@hapus-halaman-pdf">Hapus Halaman PDF</a> lebih cepat: tulis nomor halaman yang dibuang dan sisanya tetap.</p>
<h2>PDF terkunci</h2><p>File PDF yang dilindungi kata sandi belum bisa diproses. Buka kuncinya terlebih dahulu di aplikasi pembaca PDF Anda.</p>`
  },
  {
    slug: 'cara-memutar-dan-menghapus-halaman-pdf', date: DATE, tools: ['putar-pdf', 'hapus-halaman-pdf', 'pisah-pdf'],
    title: 'Cara Memutar Halaman PDF yang Terbalik dan Menghapus Halaman Berlebih',
    desc: 'Memperbaiki PDF hasil scan yang miring atau terbalik, serta membuang halaman kosong atau tidak perlu.',
    body: `<p>PDF hasil scan sering bermasalah: ada halaman yang terbalik, miring 90 derajat, atau ada halaman kosong yang ikut terpindai. Dua perbaikan berikut menyelesaikan sebagian besar masalah itu.</p>
<h2>Memutar halaman</h2>
<ol><li>Buka <a href="@putar-pdf">Putar PDF</a> dan pilih file Anda.</li><li>Pilih arah putar: 90° searah jarum jam, 180°, atau 90° berlawanan.</li><li>Jika hanya sebagian halaman yang terbalik, isi kolom halaman, misalnya <em>2, 4-6</em>. Kosongkan untuk memutar semua halaman.</li><li>Unduh hasilnya.</li></ol>
<h2>Menghapus halaman</h2>
<ol><li>Buka <a href="@hapus-halaman-pdf">Hapus Halaman PDF</a>.</li><li>Tulis nomor halaman yang akan dibuang, misalnya <em>3, 7-8</em>.</li><li>Unduh PDF yang sudah bersih. File asli Anda tidak berubah.</li></ol>
<h2>Tips</h2>
<ul><li>Buka PDF di pembaca bawaan dulu untuk mencatat nomor halaman yang bermasalah.</li><li>Nomor halaman dihitung dari halaman pertama sebagai 1, bukan nomor yang tercetak di kertas.</li><li>Setelah dirapikan, Anda bisa memperkecil ukurannya dengan <a href="@kompres-pdf">Kompres PDF</a> bila perlu.</li></ul>`
  },
  {
    slug: 'kenapa-pdf-hasil-scan-berukuran-besar', date: DATE, tools: ['kompres-pdf', 'kompres-gambar', 'jpg-ke-pdf'],
    title: 'Kenapa PDF Hasil Scan Berukuran Besar dan Cara Mengecilkannya',
    desc: 'Penjelasan penyebab PDF hasil scan atau foto membengkak, dan langkah-langkah memperkecilnya dengan aman.',
    body: `<p>Dokumen satu halaman yang discan bisa berukuran lebih dari 2 MB, sementara PDF berisi seratus halaman teks hanya beberapa ratus KB. Perbedaannya ada pada isi di dalam PDF.</p>
<h2>Penyebab utama: halaman berupa gambar</h2><p>PDF hasil scan menyimpan setiap halaman sebagai gambar. Sebagai gambaran, kertas A4 yang dipindai pada 300 dpi menghasilkan gambar sekitar 2480 × 3508 piksel. Gambar sebesar itu menghasilkan file besar, apalagi bila disimpan dengan kualitas tinggi atau berwarna padahal isinya hanya teks hitam putih.</p>
<h2>Cara mengecilkan</h2>
<ol><li><strong>Turunkan resolusi atau kompres gambarnya.</strong> Untuk dokumen yang hanya dibaca di layar, resolusi sekitar 150 dpi biasanya sudah cukup jelas. Coba <a href="@kompres-pdf">Kompres PDF</a> mulai dari tingkat Sedang.</li><li><strong>Kecilkan foto sebelum dijadikan PDF.</strong> Jika dokumen dibuat dari foto ponsel, kecilkan foto dengan <a href="@kompres-gambar">Kompres Gambar</a>, lalu gabungkan dengan <a href="@jpg-ke-pdf">JPG ke PDF</a>.</li><li><strong>Buang halaman yang tidak perlu</strong>, termasuk halaman kosong.</li></ol>
<h2>Konsekuensi yang perlu diketahui</h2><p>Kompresi PDF di Ubahin bekerja dengan merender ulang tiap halaman menjadi gambar JPEG. Untuk PDF hasil scan, ini sudah sesuai karena isinya memang gambar. Untuk PDF yang berisi teks asli, hasilnya berubah menjadi gambar sehingga teks tidak bisa disalin atau dicari. Jika file Anda sudah efisien, ukuran aslinya dipertahankan.</p>
<h2>Seberapa kecil yang wajar?</h2><p>Jika batasnya 500 KB untuk beberapa halaman, siapkan hasil yang masih terbaca jelas. Periksa hasil akhir dengan memperbesar tampilan sebelum mengunggah.</p>`
  },
  {
    slug: 'keamanan-konverter-file-online', date: DATE, tools: ['kompres-pdf', 'jpg-ke-pdf', 'heic-ke-jpg'],
    title: 'Amankah Konverter File Online? Cara Memeriksa Privasi File Anda',
    desc: 'Apa risiko mengunggah dokumen ke situs konverter, dan cara memastikan sebuah situs tidak mengirim file Anda.',
    body: `<p>Dokumen seperti KTP, ijazah, atau kontrak sering perlu dikonversi atau dikecilkan. Banyak situs konverter bekerja dengan mengunggah file Anda ke server mereka. Itu berarti salinan file Anda berpindah ke komputer orang lain, walau biasanya dihapus setelah beberapa jam.</p>
<h2>Dua cara situs konverter bekerja</h2>
<ul><li><strong>Diproses di server.</strong> File diunggah, diproses, lalu hasilnya diunduh. Cocok untuk konversi berat, tetapi file Anda keluar dari perangkat.</li><li><strong>Diproses di browser.</strong> Program berjalan di perangkat Anda dan file tidak dikirim ke mana pun. Inilah cara yang dipakai Ubahin untuk semua alatnya.</li></ul>
<h2>Cara memeriksa sendiri</h2>
<ol><li>Buka situs konverter di komputer dengan Chrome atau Edge.</li><li>Tekan F12 untuk membuka alat pengembang, lalu pilih tab <strong>Network</strong>.</li><li>Lakukan konversi seperti biasa.</li><li>Perhatikan daftar permintaan. Jika ada permintaan bertipe POST atau PUT yang membawa data berukuran sebesar file Anda, berarti file diunggah. Pada alat yang diproses di browser, Anda tidak akan melihatnya.</li></ol>
<p>Satu catatan: beberapa fitur memuat komponen tambahan dari internet, misalnya pustaka pengubah HEIC atau MP3. Yang diunduh adalah kode programnya, bukan file Anda.</p>
<h2>Kebiasaan aman lainnya</h2>
<ul><li>Pastikan alamat situs memakai HTTPS.</li><li>Untuk dokumen sangat sensitif, pertimbangkan memakai aplikasi di perangkat sendiri.</li><li>Jangan mengunggah dokumen yang tidak perlu diubah.</li><li>Simpan file asli sebelum mengonversi.</li></ul>
<h2>Alat yang bisa Anda coba</h2><p>Semua alat di Ubahin, misalnya <a href="@kompres-pdf">Kompres PDF</a>, <a href="@jpg-ke-pdf">JPG ke PDF</a>, dan <a href="@heic-ke-jpg">HEIC ke JPG</a>, berjalan di browser Anda. Anda bisa membuktikannya dengan langkah pemeriksaan di atas. Detail lebih lanjut ada di halaman <a href="@keamanan">Keamanan</a>.</p>`
  }
];
