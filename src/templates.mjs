import { site, cats, tools, toolBySlug, soon, popular, presets, homeFaq } from "./site.mjs";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

const ICON = {
  menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>',
};

/* ---------- potongan umum ---------- */
function toolLinks(list, cls = "") {
  return list.map((t) => `<a href="${t.path}"${cls ? ` class="${cls}"` : ""}>${esc(t.nav)}</a>`).join("");
}
const byCat = (c) => tools.filter((t) => t.cat === c);

function header() {
  const ubah = [...byCat("gambar"), ...byCat("pdf-dokumen")];
  return `<header class="site-header"><div class="wrap nav">
  <a class="brand" href="/" aria-label="Ubahin — beranda"><img src="/assets/logo.svg" alt="Ubahin" width="130" height="33"></a>
  <nav class="nav-menu" aria-label="Menu utama">
    <details class="dd"><summary>Ubah</summary><div class="dd-panel">${toolLinks(ubah.slice(0, 9))}<a href="/ubah/"><strong>Semua konverter →</strong></a></div></details>
    <details class="dd"><summary>Kompres</summary><div class="dd-panel">${toolLinks(byCat("kompres"))}</div></details>
    <details class="dd"><summary>Alat PDF</summary><div class="dd-panel">${toolLinks(byCat("alat-pdf"))}</div></details>
    <a href="/konverter-satuan/">Satuan</a>
    <a href="/blog/">Blog</a>
    <a class="btn btn-sm btn-accent" href="/donasi/">Donasi</a>
  </nav>
  <details class="burger"><summary aria-label="Buka menu">${ICON.menu}</summary><div class="burger-panel">
    <h3>Ubah</h3>${toolLinks(ubah)}
    <h3>Kompres</h3>${toolLinks(byCat("kompres"))}
    <h3>Alat PDF</h3>${toolLinks(byCat("alat-pdf"))}
    <h3>Lainnya</h3><a href="/konverter-satuan/">Konverter Satuan</a><a href="/blog/">Blog</a><a href="/donasi/">Donasi</a>
  </div></details>
</div></header>`;
}

function footer() {
  const li = (list) => `<ul>${list.map((t) => `<li><a href="${t.path}">${esc(t.nav)}</a></li>`).join("")}</ul>`;
  return `<footer class="site-footer"><div class="wrap">
  <div class="foot-grid">
    <div class="foot-brand"><img src="/assets/logo-white.svg" alt="Ubahin" width="130" height="33"><p>${esc(site.tagline)}</p></div>
    <div><h3>Konverter</h3>${li([...byCat("gambar").slice(0, 5), ...byCat("pdf-dokumen")])}</div>
    <div><h3>Kompres & Alat PDF</h3>${li([...byCat("kompres"), ...byCat("alat-pdf")])}</div>
    <div><h3>Ubahin</h3><ul>
      <li><a href="/tentang/">Tentang</a></li><li><a href="/blog/">Blog</a></li><li><a href="/donasi/">Donasi</a></li>
      <li><a href="/privasi/">Privasi</a></li><li><a href="/ketentuan/">Ketentuan</a></li><li><a href="/keamanan/">Keamanan</a></li><li><a href="/kontak/">Kontak</a></li>
    </ul></div>
  </div>
  <div class="foot-bottom"><span>© ${site.year} Ubahin. Semua hak dilindungi.</span><span>File diproses di perangkatmu, bukan di server.</span></div>
</div></footer>`;
}

export function layout({ title, desc, path, body, jsonld = [], noindex = false, type = "website" }) {
  const url = site.url + path;
  const ld = jsonld.map((o) => `<script type="application/ld+json">${jsonForScript(o)}</script>`).join("\n");
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow">'}
<meta name="theme-color" content="#4F46E5">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Ubahin">
<meta property="og:locale" content="id_ID">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.url}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/style.css">
${ld}
</head>
<body>
<a class="skip" href="#main">Lewati ke konten</a>
${header()}
<main id="main">
${body}
</main>
${footer()}
<script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}

const breadcrumbs = (items) => `<nav class="crumbs wrap" aria-label="Breadcrumb">${items.map(([n, p], i) => (i < items.length - 1 ? `<a href="${p}">${esc(n)}</a> / ` : `<span aria-current="page">${esc(n)}</span>`)).join("")}</nav>`;
const crumbLd = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([n, p], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: site.url + p })) });
const faqLd = (faq) => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
const faqHtml = (faq) => `<div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="ans">${esc(a)}</div></details>`).join("")}</div>`;

function steps() {
  return `<div class="steps">
  <div class="step"><h3>Pilih file</h3><p>Seret file ke kotak unggah atau pilih dari perangkatmu.</p></div>
  <div class="step"><h3>Atur pilihan</h3><p>Tentukan format atau ukuran yang kamu mau.</p></div>
  <div class="step"><h3>Unduh hasil</h3><p>Simpan satu per satu, atau semuanya dalam satu ZIP.</p></div>
</div>`;
}

function toolCard(t) {
  return `<a class="card" href="${t.path}"><div class="ico ${t.color}" aria-hidden="true">${esc(t.icon)}</div><h3>${esc(t.nav)}</h3><p>${esc(t.lead)}</p></a>`;
}
function soonCards() {
  return soon.map((s) => `<div class="card soon"><h3>${esc(s)} <span class="tag-soon">Segera hadir</span></h3><p>Sedang disiapkan.</p></div>`).join("");
}

function toolConfig(t) {
  const cfg = { kind: t.kind, to: t.to || null, accept: t.accept || "", actionLabel: t.actionLabel || "Ubah" };
  return `<script type="application/json" id="tool-config">${jsonForScript(cfg)}</script>`;
}
const appBox = `<div id="app" class="tool"><noscript><div class="alert err">Ubahin membutuhkan JavaScript yang aktif untuk memproses file di browser.</div></noscript></div>`;

/* ---------- halaman ---------- */
export function homePage() {
  const faq = homeFaq;
  const body = `
<section class="hero"><div class="wrap">
  <span class="badge">Gratis · Tanpa daftar · Tanpa watermark</span>
  <h1>Konverter File Online Gratis</h1>
  <p class="lead">Ubah dan perkecil gambar serta PDF langsung di browser. File tidak diunggah ke server, jadi tetap privat.</p>
  ${toolConfig({ kind: "universal", accept: "image/*,.heic,.heif,.pdf,application/pdf", actionLabel: "Ubah" })}
  ${appBox}
</div></section>
<section class="block"><div class="wrap">
  <div class="sec-head"><h2>Alat populer</h2><p>Yang paling sering dicari untuk tugas, berkas pendaftaran, dan pekerjaan harian.</p></div>
  <div class="grid">${popular.map((s) => toolCard(toolBySlug[s])).join("")}</div>
  <p class="sec-more"><a href="/ubah/">Lihat semua konverter →</a></p>
</div></section>
<section class="block"><div class="wrap">
  <div class="sec-head"><h2>Cara kerja</h2></div>${steps()}
</div></section>
<section class="block"><div class="wrap">
  <div class="sec-head"><h2>Kenapa Ubahin</h2></div>
  <div class="grid">
    <div class="card"><h3>Privat</h3><p>Konversi berjalan di perangkatmu. File tidak dikirim ke server.</p></div>
    <div class="card"><h3>Gratis</h3><p>Tanpa akun, tanpa watermark, tanpa batas jumlah konversi.</p></div>
    <div class="card"><h3>Cepat</h3><p>Tanpa antre unggah dan unduh; hemat kuota internet.</p></div>
    <div class="card"><h3>Di semua perangkat</h3><p>Android, iPhone, Windows, Mac, atau Linux. Cukup buka browser.</p></div>
  </div>
</div></section>
<section class="block"><div class="wrap">
  <div class="sec-head"><h2>Preset untuk syarat unggah berkas</h2><p>Satu klik untuk ukuran yang umum diminta portal pendaftaran.</p></div>
  <div class="chips">${presets.map(([n, p]) => `<a class="chip" href="${p}">${esc(n)}</a>`).join("")}</div>
</div></section>
<section class="block"><div class="wrap prose">
  <div class="sec-head"><h2>Pertanyaan umum</h2></div>${faqHtml(faq)}
</div></section>
<section class="block"><div class="wrap"><div class="cta-band">
  <h2>Suka dengan Ubahin?</h2><p>Ubahin gratis dan dikelola sukarela. Dukunganmu membantu menjaga situs tetap bebas iklan mengganggu.</p>
  <a class="btn btn-accent btn-lg" href="/donasi/">Dukung Ubahin</a>
</div></div></section>`;
  return layout({
    title: "Ubahin — Konverter File Online Gratis (Gambar & PDF)",
    desc: "Ubah, kompres, dan olah gambar serta PDF gratis langsung di browser. Tanpa daftar, tanpa watermark, file tidak diunggah.",
    path: "/", body,
    jsonld: [
      { "@context": "https://schema.org", "@type": "WebSite", name: "Ubahin", url: site.url + "/", inLanguage: "id" },
      { "@context": "https://schema.org", "@type": "WebApplication", name: "Ubahin", url: site.url + "/", applicationCategory: "UtilitiesApplication", operatingSystem: "Semua", inLanguage: "id", offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" } },
      faqLd(faq),
    ],
  });
}

export function toolPage(t) {
  const crumbs = [["Beranda", "/"]];
  const c = cats[t.cat];
  if (c) crumbs.push([c.title, c.path]);
  crumbs.push([t.nav, t.path]);
  const related = (t.related || []).map((s) => toolBySlug[s]).filter(Boolean);
  const body = `
${breadcrumbs(crumbs)}
<section class="hero"><div class="wrap">
  <h1>${esc(t.h1)}</h1>
  <p class="lead">${esc(t.lead)}</p>
  ${t.beta ? `<div class="alert info tool">${esc(t.beta)}</div>` : ""}
  ${toolConfig(t)}
  ${appBox}
</div></section>
<section class="block"><div class="wrap prose"><h2>Cara memakai</h2>${steps()}</div></section>
<section class="block"><div class="wrap prose"><h2>Tentang ${esc(t.nav)}</h2>${t.about.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>
<section class="block"><div class="wrap prose"><h2>Pertanyaan umum</h2>${faqHtml(t.faq)}</div></section>
${related.length ? `<section class="block"><div class="wrap"><div class="sec-head"><h2>Alat terkait</h2></div><div class="grid">${related.map(toolCard).join("")}</div></div></section>` : ""}`;
  return layout({
    title: t.metaTitle, desc: t.metaDesc, path: t.path, body,
    jsonld: [
      { "@context": "https://schema.org", "@type": "WebApplication", name: t.nav + " — Ubahin", url: site.url + t.path, applicationCategory: "UtilitiesApplication", operatingSystem: "Semua", inLanguage: "id", description: t.metaDesc, offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" } },
      crumbLd(crumbs), faqLd(t.faq),
    ],
  });
}

export function listPage({ title, desc, path, lead, list, crumbs, showSoon = false }) {
  const body = `${breadcrumbs(crumbs)}
<section class="hero"><div class="wrap"><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p></div></section>
<section class="block"><div class="wrap"><div class="grid">${list.map(toolCard).join("")}${showSoon ? soonCards() : ""}</div></div></section>`;
  return layout({ title: `${title} — Ubahin`, desc, path, body, jsonld: [crumbLd(crumbs)] });
}

export function textPage({ title, desc, path, body: blocks, crumbs }) {
  const html = blocks.map(([tag, c]) => {
    if (tag === "ul" || tag === "ol") return `<${tag}>${c.map((x) => `<li>${x}</li>`).join("")}</${tag}>`;
    return `<${tag}>${c}</${tag}>`;
  }).join("\n");
  const body = `${breadcrumbs(crumbs)}<section class="block"><div class="wrap prose"><h1>${esc(title)}</h1>${html}</div></section>`;
  return layout({ title: `${title} — Ubahin`, desc, path, body, jsonld: [crumbLd(crumbs)] });
}

export function donatePage() {
  const crumbs = [["Beranda", "/"], ["Donasi", "/donasi/"]];
  const action = site.donateUrl
    ? `<p><a class="btn btn-accent btn-lg" href="${esc(site.donateUrl)}" rel="noopener">Donasi sekarang</a></p>`
    : `<div class="alert info">Tautan donasi akan segera tersedia.</div>`;
  const body = `${breadcrumbs(crumbs)}<section class="block"><div class="wrap prose"><h1>Dukung Ubahin</h1>
<p>Ubahin gratis, tanpa akun dan tanpa watermark. Biaya domain dan pengembangan ditanggung sukarela. Jika Ubahin membantumu, donasi berapa pun sangat berarti.</p>${action}</div></section>`;
  return layout({ title: "Dukung Ubahin — Donasi", desc: "Dukung Ubahin agar tetap gratis dan bebas iklan mengganggu.", path: "/donasi/", body, jsonld: [crumbLd(crumbs)] });
}

export function notFoundPage() {
  const body = `<section class="hero"><div class="wrap"><h1>Halaman tidak ditemukan</h1><p class="lead">Alamat yang kamu buka tidak ada atau sudah dipindahkan.</p><a class="btn btn-lg" href="/">Kembali ke beranda</a></div></section>
<section class="block"><div class="wrap"><div class="sec-head"><h2>Mungkin kamu mencari</h2></div><div class="grid">${popular.map((s) => toolCard(toolBySlug[s])).join("")}</div></div></section>`;
  return layout({ title: "Halaman tidak ditemukan — Ubahin", desc: "Halaman tidak ditemukan.", path: "/404.html", body, noindex: true });
}

export function blogIndex(articles) {
  const crumbs = [["Beranda", "/"], ["Blog", "/blog/"]];
  const body = `${breadcrumbs(crumbs)}<section class="hero"><div class="wrap"><h1>Blog Ubahin</h1><p class="lead">Panduan singkat mengolah file untuk tugas, berkas pendaftaran, dan pekerjaan harian.</p></div></section>
<section class="block"><div class="wrap"><div class="grid">${articles.map((a) => `<a class="card" href="/blog/${a.slug}/"><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p></a>`).join("")}</div></div></section>`;
  return layout({ title: "Blog — Panduan Mengolah File — Ubahin", desc: "Panduan praktis mengompres PDF, mengubah HEIC, dan mengolah file untuk berkas pendaftaran.", path: "/blog/", body, jsonld: [crumbLd(crumbs)] });
}

export function articlePage(a) {
  const crumbs = [["Beranda", "/"], ["Blog", "/blog/"], [a.title, `/blog/${a.slug}/`]];
  const html = a.body.map(([tag, c]) => (tag === "ul" || tag === "ol" ? `<${tag}>${c.map((x) => `<li>${x}</li>`).join("")}</${tag}>` : `<${tag}>${c}</${tag}>`)).join("\n");
  const body = `${breadcrumbs(crumbs)}<article class="block"><div class="wrap prose"><h1>${esc(a.title)}</h1>${html}</div></article>`;
  return layout({
    title: `${a.title} — Ubahin`, desc: a.desc, path: `/blog/${a.slug}/`, body, type: "article",
    jsonld: [crumbLd(crumbs), { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.desc, inLanguage: "id", author: { "@type": "Organization", name: "Ubahin" }, publisher: { "@type": "Organization", name: "Ubahin" } }],
  });
}
