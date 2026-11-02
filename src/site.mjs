// Data konten Ubahin. Ubah di sini: nama, domain, email, dan teks alat.
export const site = {
  name: "Ubahin",
  tagline: "Ubah file apa pun, gratis dan aman.",
  url: (process.env.SITE_URL || "https://ubahin.id").replace(/\/$/, ""), // ganti dengan domain asli saat deploy
  email: "halo@ubahin.id", // GANTI dengan email kontak asli
  donateUrl: process.env.DONATE_URL || "", // isi tautan Trakteer/Saweria bila ada
  year: new Date().getFullYear(),
};

export const cats = {
  gambar: { path: "/ubah/gambar/", title: "Konverter Gambar", desc: "Ubah format gambar JPG, PNG, WEBP, dan HEIC langsung di browser." },
  "pdf-dokumen": { path: "/ubah/pdf-dokumen/", title: "PDF & Dokumen", desc: "Ubah gambar menjadi PDF dan PDF menjadi gambar." },
  kompres: { path: "/kompres/", title: "Kompres File", desc: "Perkecil ukuran gambar dan PDF sampai di bawah batas unggah." },
  "alat-pdf": { path: "/alat-pdf/", title: "Alat PDF", desc: "Gabung, pisah, putar, dan hapus halaman PDF." },
};

const IMG_ACCEPT = "image/*,.heic,.heif,.jfif";
const common = (n) => `Semua proses terjadi di browser ${n}: file tidak dikirim ke server mana pun.`;

export const tools = [
  {
    slug: "heic-ke-jpg", cat: "gambar", icon: "HEIC", color: "image", kind: "img-convert", to: "jpg", accept: ".heic,.heif,image/heic,image/heif,image/*", actionLabel: "Ubah ke JPG",
    nav: "HEIC ke JPG", h1: "HEIC ke JPG", metaTitle: "HEIC ke JPG Online Gratis — Ubahin",
    metaDesc: "Ubah foto HEIC dari iPhone menjadi JPG langsung di browser. Gratis, tanpa daftar, file tidak diunggah.",
    lead: "Ubah foto HEIC dari iPhone menjadi JPG agar bisa dibuka dan diunggah di mana saja.",
    beta: "Berjalan langsung di Safari (iPhone, iPad, Mac). Di browser lain, dukungan HEIC bergantung pada sistem perangkatmu.",
    about: ["HEIC adalah format foto bawaan iPhone. Ukurannya hemat, tetapi banyak aplikasi, situs formulir, dan komputer lama belum bisa membukanya. JPG diterima hampir di mana-mana.", common("kamu")],
    faq: [
      ["Kenapa HEIC tidak bisa diubah di browser saya?", "HEIC memerlukan dukungan dekoder di browser. Safari di iPhone, iPad, dan Mac membacanya langsung. Di browser lain hasilnya bergantung pada sistem. Jika gagal, buka halaman ini lewat Safari, atau atur iPhone ke Pengaturan > Kamera > Format > Paling Kompatibel agar foto baru langsung berformat JPG."],
      ["Apakah kualitas foto turun?", "JPG memakai kompresi, tetapi pada kualitas 92% (bawaan) perbedaannya hampir tidak terlihat. Kamu bisa menaikkannya ke 100% lewat opsi Kualitas."],
      ["Apakah foto saya diunggah?", "Tidak. Foto diproses di perangkatmu sendiri."],
    ],
    related: ["jpg-ke-pdf", "kompres-gambar", "webp-ke-jpg"],
  },
  {
    slug: "webp-ke-png", cat: "gambar", icon: "PNG", color: "image", kind: "img-convert", to: "png", accept: ".webp,image/webp,image/*", actionLabel: "Ubah ke PNG",
    nav: "WEBP ke PNG", h1: "WEBP ke PNG", metaTitle: "WEBP ke PNG Online Gratis — Ubahin",
    metaDesc: "Ubah gambar WEBP menjadi PNG tanpa kehilangan transparansi. Gratis dan diproses di browser.",
    lead: "Ubah gambar WEBP menjadi PNG dengan latar transparan tetap terjaga.",
    about: ["WEBP banyak dipakai situs web karena ukurannya kecil, tetapi sebagian aplikasi desain dan pengolah dokumen belum mendukungnya. PNG diterima luas dan menyimpan transparansi.", common("kamu")],
    faq: [
      ["Apakah transparansi tetap ada?", "Ya. PNG menyimpan latar transparan dari gambar WEBP."],
      ["Kenapa ukuran PNG lebih besar?", "PNG tidak membuang detail sehingga ukurannya biasanya lebih besar dari WEBP. Jika ukuran lebih penting, pakai WEBP ke JPG."],
    ],
    related: ["webp-ke-jpg", "png-ke-jpg", "kompres-gambar"],
  },
  {
    slug: "webp-ke-jpg", cat: "gambar", icon: "JPG", color: "image", kind: "img-convert", to: "jpg", accept: ".webp,image/webp,image/*", actionLabel: "Ubah ke JPG",
    nav: "WEBP ke JPG", h1: "WEBP ke JPG", metaTitle: "WEBP ke JPG Online Gratis — Ubahin",
    metaDesc: "Ubah gambar WEBP menjadi JPG agar bisa dibuka di semua aplikasi. Gratis, tanpa daftar.",
    lead: "Ubah gambar WEBP menjadi JPG yang bisa dibuka di semua aplikasi.",
    about: ["JPG adalah format foto paling universal. Jika gambar WEBP-mu ditolak oleh formulir atau aplikasi, ubah ke JPG di sini.", "Catatan: JPG tidak mendukung transparansi, jadi bagian transparan diganti latar putih.", common("kamu")],
    faq: [["Bagaimana dengan latar transparan?", "Diganti menjadi putih karena JPG tidak punya kanal transparan. Pakai WEBP ke PNG bila transparansi penting."]],
    related: ["webp-ke-png", "png-ke-jpg", "kompres-gambar"],
  },
  {
    slug: "png-ke-jpg", cat: "gambar", icon: "JPG", color: "image", kind: "img-convert", to: "jpg", accept: ".png,image/png,image/*", actionLabel: "Ubah ke JPG",
    nav: "PNG ke JPG", h1: "PNG ke JPG", metaTitle: "PNG ke JPG Online Gratis — Ubahin",
    metaDesc: "Ubah PNG menjadi JPG yang ukurannya lebih kecil. Gratis, cepat, diproses di browser.",
    lead: "Ubah PNG menjadi JPG agar ukuran file jauh lebih kecil.",
    about: ["PNG cocok untuk grafik dan tangkapan layar, tetapi ukurannya sering besar. Untuk foto, JPG biasanya jauh lebih hemat.", "Latar transparan akan menjadi putih.", common("kamu")],
    faq: [["Seberapa kecil hasilnya?", "Tergantung isi gambar. Foto biasanya mengecil jauh; grafik sederhana bisa kurang terasa. Atur Kualitas untuk menyeimbangkan ukuran dan ketajaman."]],
    related: ["jpg-ke-png", "kompres-gambar", "jpg-ke-pdf"],
  },
  {
    slug: "jpg-ke-png", cat: "gambar", icon: "PNG", color: "image", kind: "img-convert", to: "png", accept: ".jpg,.jpeg,.jfif,image/jpeg,image/*", actionLabel: "Ubah ke PNG",
    nav: "JPG ke PNG", h1: "JPG ke PNG", metaTitle: "JPG ke PNG Online Gratis — Ubahin",
    metaDesc: "Ubah JPG menjadi PNG di browser. Gratis, tanpa daftar, file tidak diunggah.",
    lead: "Ubah JPG menjadi PNG tanpa menurunkan kualitas lebih jauh.",
    about: ["PNG menyimpan gambar tanpa kompresi lossy, berguna bila gambar akan diedit berulang kali.", "Konversi ini tidak menambah detail yang sudah hilang di JPG asli, dan ukuran file PNG biasanya lebih besar.", common("kamu")],
    faq: [["Apakah JPG yang dijadikan PNG jadi lebih tajam?", "Tidak. PNG hanya menyimpan apa yang ada di JPG tanpa kompresi tambahan."]],
    related: ["png-ke-jpg", "jpg-ke-webp", "jpg-ke-pdf"],
  },
  {
    slug: "jpg-ke-webp", cat: "gambar", icon: "WEBP", color: "image", kind: "img-convert", to: "webp", accept: ".jpg,.jpeg,.jfif,image/jpeg,image/*", actionLabel: "Ubah ke WEBP",
    nav: "JPG ke WEBP", h1: "JPG ke WEBP", metaTitle: "JPG ke WEBP Online Gratis — Ubahin",
    metaDesc: "Ubah JPG menjadi WEBP agar situs web lebih ringan. Gratis dan diproses di browser.",
    lead: "Ubah JPG menjadi WEBP untuk gambar situs web yang lebih ringan.",
    about: ["WEBP umumnya menghasilkan file lebih kecil daripada JPG pada kualitas yang sebanding, sehingga halaman web lebih cepat dimuat.", "Jika tombol gagal di browser lamamu, coba browser yang lebih baru: tidak semua browser bisa menyimpan WEBP.", common("kamu")],
    faq: [["Browser apa yang bisa menyimpan WEBP?", "Chrome, Edge, Firefox, dan Android Chrome bisa. Beberapa versi Safari belum bisa menyimpan WEBP; pakai JPG atau PNG di sana."]],
    related: ["kompres-gambar", "webp-ke-jpg", "png-ke-webp"],
  },
  {
    slug: "png-ke-webp", cat: "gambar", icon: "WEBP", color: "image", kind: "img-convert", to: "webp", accept: ".png,image/png,image/*", actionLabel: "Ubah ke WEBP",
    nav: "PNG ke WEBP", h1: "PNG ke WEBP", metaTitle: "PNG ke WEBP Online Gratis — Ubahin",
    metaDesc: "Ubah PNG menjadi WEBP dengan transparansi terjaga. Gratis, diproses di browser.",
    lead: "Ubah PNG menjadi WEBP yang lebih kecil, transparansi tetap ada.",
    about: ["WEBP mendukung transparansi seperti PNG, tetapi biasanya berukuran lebih kecil.", common("kamu")],
    faq: [["Apakah latar transparan tetap ada?", "Ya, WEBP menyimpan kanal transparan."]],
    related: ["jpg-ke-webp", "kompres-gambar", "webp-ke-png"],
  },
  {
    slug: "jpg-ke-pdf", cat: "pdf-dokumen", icon: "PDF", color: "doc", kind: "img-to-pdf", accept: IMG_ACCEPT, actionLabel: "Buat PDF",
    nav: "JPG ke PDF", h1: "JPG ke PDF", metaTitle: "JPG ke PDF Online Gratis — Gabung Banyak Gambar — Ubahin",
    metaDesc: "Ubah satu atau banyak gambar JPG/PNG menjadi satu file PDF. Atur urutan halaman. Gratis, tanpa daftar.",
    lead: "Gabungkan satu atau banyak gambar menjadi satu file PDF, urutannya bisa kamu atur.",
    about: ["Cocok untuk menyatukan foto KTP, ijazah, atau hasil foto dokumen menjadi satu PDF untuk diunggah ke portal pendaftaran.", "Pilih ukuran A4 dengan margin atau halaman yang mengikuti ukuran gambar. Gambar PNG, WEBP, dan HEIC (bila didukung browser) juga bisa dipakai.", common("kamu")],
    faq: [
      ["Bagaimana mengatur urutan halaman?", "Urutan mengikuti daftar file. Pakai tombol panah atas/bawah di tiap file untuk menggesernya sebelum menekan Buat PDF."],
      ["Bisakah hasilnya diperkecil?", "Bisa. Setelah jadi, perkecil lewat Kompres PDF."],
    ],
    related: ["kompres-pdf", "gabung-pdf", "kompres-gambar"],
  },
  {
    slug: "pdf-ke-jpg", cat: "pdf-dokumen", icon: "JPG", color: "doc", kind: "pdf-to-img", to: "jpg", accept: ".pdf,application/pdf", actionLabel: "Ubah ke gambar",
    nav: "PDF ke JPG", h1: "PDF ke JPG", metaTitle: "PDF ke JPG Online Gratis — Ubahin",
    metaDesc: "Ubah setiap halaman PDF menjadi gambar JPG atau PNG. Gratis, tanpa daftar, diproses di browser.",
    lead: "Ubah setiap halaman PDF menjadi gambar JPG atau PNG.",
    about: ["Setiap halaman PDF dirender menjadi satu gambar. Jika halamannya banyak, semuanya bisa diunduh sekaligus dalam satu ZIP.", "Atur ketajaman sesuai kebutuhan: makin tinggi makin tajam, tetapi file makin besar.", common("kamu")],
    faq: [
      ["PDF saya diproteksi password, bisakah?", "Belum. Buka kunci PDF dengan aplikasi aslinya terlebih dahulu."],
      ["Berapa lama prosesnya?", "Tergantung jumlah halaman dan kekuatan perangkatmu. PDF puluhan halaman di ponsel bisa memakan waktu beberapa detik per halaman."],
    ],
    related: ["pisah-pdf", "kompres-pdf", "jpg-ke-pdf"],
  },
  {
    slug: "kompres-gambar", cat: "kompres", icon: "IMG", color: "image", kind: "img-compress", accept: IMG_ACCEPT, actionLabel: "Kompres gambar",
    nav: "Kompres Gambar", h1: "Kompres Gambar", metaTitle: "Kompres Gambar Online ke 100 KB, 200 KB, 500 KB — Ubahin",
    metaDesc: "Perkecil ukuran foto sampai di bawah 100 KB, 200 KB, atau 500 KB untuk syarat unggah berkas. Gratis, diproses di browser.",
    lead: "Perkecil ukuran foto sampai di bawah batas unggah, tanpa daftar dan tanpa watermark.",
    about: ["Banyak portal pendaftaran (CPNS, beasiswa, KIP, lowongan kerja) membatasi ukuran foto, misalnya maksimal 200 KB. Pilih target ukurannya, dan Ubahin akan mencari kualitas terbaik yang masih muat.", "Jika kualitas saja belum cukup, dimensi foto diperkecil bertahap. Kamu juga bisa membatasi dimensi sendiri.", common("kamu")],
    faq: [
      ["Kenapa hasilnya tidak tembus target?", "Gambar yang sangat besar atau sangat detail kadang sulit ditekan. Coba perkecil dimensi (misalnya maks. 1280 px) atau naikkan batas ukuran."],
      ["Format apa yang paling aman untuk portal pendaftaran?", "JPG. WEBP lebih kecil, tetapi tidak semua portal menerimanya."],
    ],
    related: ["kompres-pdf", "jpg-ke-pdf", "png-ke-jpg"],
  },
  {
    slug: "kompres-pdf", cat: "kompres", icon: "PDF", color: "doc", kind: "pdf-compress", accept: ".pdf,application/pdf", actionLabel: "Kompres PDF",
    nav: "Kompres PDF", h1: "Kompres PDF", metaTitle: "Kompres PDF Online ke 200 KB, 500 KB, 1 MB — Ubahin",
    metaDesc: "Perkecil ukuran PDF sampai di bawah 200 KB, 500 KB, atau 1 MB untuk unggah berkas. Gratis, tanpa daftar.",
    lead: "Perkecil ukuran PDF sampai di bawah batas unggah portal pendaftaran.",
    about: ["Pilih target ukuran, dan Ubahin mencoba tingkat kompresi dari ringan sampai maksimal hingga hasilnya muat.", "Cara kerjanya: tiap halaman dirender ulang menjadi gambar JPEG lalu disusun kembali menjadi PDF. Hasilnya efektif untuk PDF hasil scan atau foto, tetapi teks di hasilnya tidak bisa diseleksi atau dicari. Untuk PDF yang isinya teks murni, ukuran aslinya biasanya sudah kecil.", common("kamu")],
    faq: [
      ["Apakah teks di PDF tetap bisa dicopy?", "Tidak. Karena halaman diubah menjadi gambar, teks tidak lagi bisa diseleksi. Simpan file asli jika kamu masih membutuhkannya."],
      ["Bagaimana jika hasilnya lebih besar dari aslinya?", "Ubahin akan mengembalikan file asli dan memberi tahu bahwa tidak ada yang bisa dihemat."],
    ],
    related: ["kompres-gambar", "gabung-pdf", "pdf-ke-jpg"],
  },
  {
    slug: "gabung-pdf", cat: "alat-pdf", icon: "PDF", color: "doc", kind: "pdf-merge", accept: ".pdf,application/pdf", actionLabel: "Gabungkan PDF",
    nav: "Gabung PDF", h1: "Gabung PDF", metaTitle: "Gabung PDF Online Gratis — Ubahin",
    metaDesc: "Gabungkan beberapa file PDF menjadi satu dokumen. Atur urutannya. Gratis dan diproses di browser.",
    lead: "Gabungkan beberapa file PDF menjadi satu dokumen dengan urutan sesuai keinginanmu.",
    about: ["Pilih beberapa PDF, atur urutannya dengan tombol panah, lalu gabungkan. Isi halaman disalin apa adanya sehingga kualitas tidak berubah.", common("kamu")],
    faq: [["Apakah kualitas PDF berubah?", "Tidak. Halaman disalin tanpa dirender ulang."], ["PDF berpassword?", "Belum didukung. Buka kuncinya dulu."]],
    related: ["pisah-pdf", "kompres-pdf", "jpg-ke-pdf"],
  },
  {
    slug: "pisah-pdf", cat: "alat-pdf", icon: "PDF", color: "doc", kind: "pdf-split", accept: ".pdf,application/pdf", actionLabel: "Pisahkan PDF",
    nav: "Pisah PDF", h1: "Pisah PDF", metaTitle: "Pisah PDF Online Gratis — Ubahin",
    metaDesc: "Pisahkan setiap halaman PDF atau ambil halaman tertentu. Gratis, tanpa daftar, diproses di browser.",
    lead: "Pisahkan setiap halaman PDF menjadi file sendiri, atau ambil halaman tertentu saja.",
    about: ["Pilih salah satu cara: pisahkan semua halaman (hasilnya bisa diunduh sekaligus dalam ZIP), atau ambil halaman tertentu menjadi satu PDF baru, misalnya 1,3-5.", common("kamu")],
    faq: [["Format penulisan halaman?", "Pisahkan dengan koma, dan pakai tanda hubung untuk rentang. Contoh: 1,3-5 berarti halaman 1, 3, 4, dan 5."]],
    related: ["gabung-pdf", "hapus-halaman-pdf", "putar-pdf"],
  },
  {
    slug: "putar-pdf", cat: "alat-pdf", icon: "PDF", color: "doc", kind: "pdf-rotate", accept: ".pdf,application/pdf", actionLabel: "Putar PDF",
    nav: "Putar PDF", h1: "Putar PDF", metaTitle: "Putar Halaman PDF Online Gratis — Ubahin",
    metaDesc: "Putar semua atau sebagian halaman PDF 90°, 180°, atau 270°. Gratis dan diproses di browser.",
    lead: "Putar semua atau sebagian halaman PDF yang posisinya miring atau terbalik.",
    about: ["Pilih sudut putar, lalu kosongkan kolom halaman untuk memutar semuanya, atau isi misalnya 2,4-6 untuk halaman tertentu.", common("kamu")],
    faq: [["Apakah kualitas berubah?", "Tidak. Hanya orientasi halaman yang diubah."]],
    related: ["pisah-pdf", "hapus-halaman-pdf", "gabung-pdf"],
  },
  {
    slug: "hapus-halaman-pdf", cat: "alat-pdf", icon: "PDF", color: "doc", kind: "pdf-delete", accept: ".pdf,application/pdf", actionLabel: "Hapus halaman",
    nav: "Hapus Halaman PDF", h1: "Hapus Halaman PDF", metaTitle: "Hapus Halaman PDF Online Gratis — Ubahin",
    metaDesc: "Hapus halaman yang tidak diperlukan dari PDF. Gratis, tanpa daftar, diproses di browser.",
    lead: "Buang halaman yang tidak diperlukan dari PDF dalam hitungan detik.",
    about: ["Isi nomor halaman yang ingin dibuang, misalnya 2,4-5. Halaman lain tetap utuh.", common("kamu")],
    faq: [["Bisakah menghapus semua halaman?", "Tidak, minimal satu halaman harus tersisa."]],
    related: ["pisah-pdf", "gabung-pdf", "putar-pdf"],
  },
  {
    slug: "konverter-satuan", cat: "alat", path: "/konverter-satuan/", icon: "kg", color: "tool", kind: "unit", noFiles: true,
    nav: "Konverter Satuan", h1: "Konverter Satuan", metaTitle: "Konverter Satuan: Panjang, Berat, Suhu, Luas — Ubahin",
    metaDesc: "Ubah satuan panjang, berat, suhu, luas, volume, kecepatan, dan data secara instan. Gratis.",
    lead: "Ubah satuan panjang, berat, suhu, luas, volume, kecepatan, dan ukuran data secara instan.",
    about: ["Hitungannya berjalan langsung di browser. Untuk satuan data, 1 KB dihitung 1024 byte (sistem biner)."],
    faq: [["Seberapa teliti hasilnya?", "Hasil ditampilkan hingga 10 angka penting."]],
    related: ["kompres-gambar", "jpg-ke-pdf"],
  },
];
for (const t of tools) {
  t.path = t.path || (t.cat === "gambar" ? `/ubah/gambar/${t.slug}/` : t.cat === "pdf-dokumen" ? `/ubah/pdf-dokumen/${t.slug}/` : t.cat === "kompres" ? `/kompres/${t.slug}/` : `/alat-pdf/${t.slug}/`);
}
export const toolBySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));

export const soon = ["Video ke MP3", "MP4 ke MP3", "MOV ke MP4", "Video ke GIF", "DOCX ke PDF", "PDF ke Word", "Kompres Video"];

export const popular = ["heic-ke-jpg", "jpg-ke-pdf", "kompres-pdf", "kompres-gambar", "gabung-pdf", "webp-ke-png"];

export const presets = [
  ["Foto ≤ 100 KB", "/kompres/kompres-gambar/?target=100"],
  ["Foto ≤ 200 KB", "/kompres/kompres-gambar/?target=200"],
  ["Foto ≤ 500 KB", "/kompres/kompres-gambar/?target=500"],
  ["PDF ≤ 200 KB", "/kompres/kompres-pdf/?target=200"],
  ["PDF ≤ 500 KB", "/kompres/kompres-pdf/?target=500"],
  ["PDF ≤ 1 MB", "/kompres/kompres-pdf/?target=1024"],
];

export const homeFaq = [
  ["Apakah file saya aman?", "Konversi berjalan di browser perangkatmu. File tidak dikirim atau disimpan di server Ubahin. Kamu bisa memastikannya lewat tab Network di alat pengembang browser."],
  ["Apakah benar-benar gratis?", "Ya. Tanpa daftar, tanpa watermark, tanpa batas jumlah konversi. Ubahin didukung lewat donasi sukarela."],
  ["Berapa batas ukuran file?", "Hingga 200 MB per file. Karena diproses di perangkatmu, file sangat besar bisa lambat atau gagal di ponsel dengan memori kecil."],
  ["Format apa saja yang didukung?", "Gambar (JPG, PNG, WEBP, GIF, BMP, dan HEIC di Safari), serta PDF. Konversi video, audio, dan dokumen Word sedang disiapkan."],
  ["Kenapa HEIC tidak jalan di browser saya?", "HEIC butuh dukungan dekoder dari browser. Safari di perangkat Apple membukanya langsung; browser lain bergantung pada sistem. Lihat panduan di halaman HEIC ke JPG."],
  ["Kenapa prosesnya terasa lama?", "Semua dikerjakan oleh perangkatmu, bukan server. Foto resolusi tinggi atau PDF puluhan halaman butuh waktu lebih lama di ponsel."],
];

export const articles = [
  {
    slug: "cara-kompres-pdf-di-bawah-500-kb", title: "Cara Kompres PDF Jadi di Bawah 500 KB", desc: "Langkah praktis memperkecil PDF agar lolos batas unggah portal pendaftaran, plus tips jika ukurannya masih besar.",
    body: [
      ["p", "Portal CPNS, beasiswa, dan lowongan kerja sering membatasi ukuran PDF, misalnya maksimal 500 KB. Berikut cara mencapainya tanpa aplikasi tambahan."],
      ["h2", "Langkah singkat"],
      ["ol", ["Buka halaman <a href=\"/kompres/kompres-pdf/?target=500\">Kompres PDF</a> dengan target 500 KB.", "Pilih atau seret file PDF-mu.", "Tekan Kompres PDF, lalu unduh hasilnya."]],
      ["h2", "Kalau masih terlalu besar"],
      ["ul", ["Hapus halaman yang tidak perlu lewat <a href=\"/alat-pdf/hapus-halaman-pdf/\">Hapus Halaman PDF</a>.", "Jika PDF berasal dari foto, kompres fotonya dulu lewat <a href=\"/kompres/kompres-gambar/\">Kompres Gambar</a> sebelum dijadikan PDF.", "Pecah dokumen menjadi beberapa file bila portal mengizinkan."]],
      ["h2", "Hal yang perlu diketahui"],
      ["p", "Kompresi di Ubahin mengubah halaman menjadi gambar. Ukuran turun drastis untuk PDF hasil scan, tetapi teks tidak lagi bisa diseleksi. Simpan file asli sebagai cadangan."],
    ],
  },
  {
    slug: "cara-ubah-heic-ke-jpg", title: "Cara Ubah Foto HEIC iPhone ke JPG", desc: "Apa itu HEIC, kenapa sering ditolak, dan tiga cara mengubahnya menjadi JPG.",
    body: [
      ["p", "iPhone menyimpan foto dalam format HEIC agar hemat ruang. Masalahnya, tidak semua situs dan aplikasi menerimanya."],
      ["h2", "Cara 1: ubah lewat Ubahin"],
      ["p", "Buka <a href=\"/ubah/gambar/heic-ke-jpg/\">HEIC ke JPG</a> di Safari, pilih fotomu, lalu unduh hasil JPG-nya. Di browser selain Safari, dukungan HEIC bergantung pada sistem perangkat."],
      ["h2", "Cara 2: ubah pengaturan kamera"],
      ["p", "Buka Pengaturan > Kamera > Format, lalu pilih Paling Kompatibel. Foto baru akan tersimpan sebagai JPG."],
      ["h2", "Cara 3: bagikan sebagai JPG"],
      ["p", "Saat mengirim foto dari aplikasi Foto lewat beberapa aplikasi, iOS dapat mengonversinya otomatis ke format yang lebih kompatibel."],
    ],
  },
];

export const legal = {
  tentang: {
    title: "Tentang Ubahin",
    body: [["p", "Ubahin adalah kumpulan alat file online berbahasa Indonesia: ubah format gambar, buat dan olah PDF, serta perkecil ukuran file untuk syarat unggah berkas."], ["p", "Prinsipnya sederhana: gratis, cepat, dan privat. Konversi berjalan di browser kamu, sehingga file tidak perlu dikirim ke server."], ["p", `Ada masukan atau menemukan masalah? Tulis ke <a href="mailto:${site.email}">${site.email}</a>.`]],
  },
  privasi: {
    title: "Kebijakan Privasi",
    body: [
      ["p", "Terakhir diperbarui: 1 November 2026."],
      ["h2", "File yang kamu proses"], ["p", "Konversi dan pengolahan file dilakukan di browser perangkatmu. File tidak diunggah, disimpan, atau dilihat oleh Ubahin."],
      ["h2", "Data yang kami kumpulkan"], ["p", "Ubahin tidak meminta akun dan saat ini tidak memasang pelacak iklan. Server hosting dapat mencatat data teknis standar seperti alamat IP dan waktu akses untuk keamanan dan operasional. Jika kami menambahkan analitik atau iklan di masa depan, kebijakan ini akan diperbarui lebih dulu."],
      ["h2", "Penyimpanan di perangkatmu"], ["p", "Ubahin tidak menyimpan file di perangkatmu setelah halaman ditutup."],
      ["h2", "Hak kamu"], ["p", "Sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, kamu berhak menanyakan data pribadi yang kami miliki. Hubungi kami lewat email di halaman Kontak."],
    ],
  },
  ketentuan: {
    title: "Ketentuan Penggunaan",
    body: [
      ["p", "Terakhir diperbarui: 1 November 2026."],
      ["h2", "Penggunaan"], ["p", "Dengan memakai Ubahin, kamu menyatakan memiliki hak atas file yang kamu proses dan tidak memakai layanan ini untuk konten yang melanggar hukum."],
      ["h2", "Tanpa jaminan"], ["p", "Layanan diberikan apa adanya. Hasil konversi dapat berbeda dari file asli. Simpan salinan file asli sebelum memproses."],
      ["h2", "Batasan tanggung jawab"], ["p", "Sejauh diizinkan hukum, Ubahin tidak bertanggung jawab atas kerugian akibat penggunaan layanan, termasuk kehilangan atau kerusakan data."],
      ["h2", "Perubahan"], ["p", "Ketentuan dapat diperbarui sewaktu-waktu. Penggunaan berkelanjutan berarti kamu menyetujui versi terbaru."],
    ],
  },
  keamanan: {
    title: "Keamanan",
    body: [
      ["p", "Cara paling aman menjaga file adalah tidak mengirimnya ke mana pun. Itu yang dilakukan Ubahin."],
      ["ul", ["File diproses lokal di browser, bukan di server.", "Situs hanya diakses lewat HTTPS dan memakai header keamanan seperti Content-Security-Policy.", "Pustaka pihak ketiga (pdf-lib dan PDF.js) disajikan dari server Ubahin sendiri, bukan dari CDN eksternal."]],
      ["p", `Menemukan celah keamanan? Laporkan ke <a href="mailto:${site.email}">${site.email}</a>.`],
    ],
  },
  kontak: {
    title: "Kontak",
    body: [["p", `Pertanyaan, saran, laporan masalah, atau laporan penyalahgunaan: <a href="mailto:${site.email}">${site.email}</a>.`], ["p", "Saat melapor masalah konversi, sebutkan browser, perangkat, dan jenis file agar kami bisa menelusurinya."]],
  },
};
