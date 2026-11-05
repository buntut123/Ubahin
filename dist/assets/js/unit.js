/* Konverter satuan sederhana (tanpa dependensi) */
(function () {
  'use strict';
  const root = document.getElementById('unit-tool'); if (!root) return;
  const U = {
    panjang: { m: ['Meter (m)', 1], km: ['Kilometer (km)', 1000], cm: ['Sentimeter (cm)', 0.01], mm: ['Milimeter (mm)', 0.001], mil: ['Mil (mi)', 1609.344], ft: ['Kaki (ft)', 0.3048], in: ['Inci (in)', 0.0254], yd: ['Yard (yd)', 0.9144] },
    berat: { kg: ['Kilogram (kg)', 1], g: ['Gram (g)', 0.001], mg: ['Miligram (mg)', 1e-6], ton: ['Ton (t)', 1000], lbs: ['Pon (lbs)', 0.45359237], oz: ['Ons (oz)', 0.028349523125] },
    volume: { l: ['Liter (L)', 1], ml: ['Mililiter (mL)', 0.001], m3: ['Meter kubik (m³)', 1000], gal: ['Galon AS (gal)', 3.785411784], cup: ['Cangkir AS (cup)', 0.2365882365] },
    suhu: { c: ['Celsius (°C)'], f: ['Fahrenheit (°F)'], k: ['Kelvin (K)'] }
  };
  const label = { panjang: 'Panjang', berat: 'Berat / massa', volume: 'Volume', suhu: 'Suhu' };
  function temp(v, a, b) { const c = a === 'c' ? v : a === 'f' ? (v - 32) * 5 / 9 : v - 273.15; return b === 'c' ? c : b === 'f' ? c * 9 / 5 + 32 : c + 273.15; }
  root.innerHTML = `<div class="opts"><div class="opt"><label for="u_cat">Jenis</label><select id="u_cat">${Object.keys(U).map((k) => `<option value="${k}">${label[k]}</option>`).join('')}</select></div></div>
  <div class="unit" style="margin-top:14px"><div class="opt"><label for="u_v">Nilai</label><input type="number" id="u_v" value="1" step="any"><div style="height:8px"></div><label for="u_a" class="sr">Dari</label><select id="u_a"></select></div>
  <button class="btn btn-ghost swap" id="u_sw" type="button" aria-label="Tukar satuan">⇄</button>
  <div class="opt"><label for="u_r">Hasil</label><input type="text" id="u_r" readonly><div style="height:8px"></div><label for="u_b" class="sr">Ke</label><select id="u_b"></select></div></div>`;
  const $ = (id) => document.getElementById(id), cat = $('u_cat'), a = $('u_a'), b = $('u_b'), v = $('u_v'), r = $('u_r');
  function fill() { const o = Object.entries(U[cat.value]).map(([k, x]) => `<option value="${k}">${x[0]}</option>`).join(''); a.innerHTML = o; b.innerHTML = o; b.selectedIndex = 1; calc(); }
  function calc() {
    const x = parseFloat(v.value); if (isNaN(x)) { r.value = ''; return; }
    const res = cat.value === 'suhu' ? temp(x, a.value, b.value) : x * U[cat.value][a.value][1] / U[cat.value][b.value][1];
    r.value = Number(res.toPrecision(10)).toLocaleString(document.documentElement.lang === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 8 });
  }
  cat.onchange = fill; [a, b, v].forEach((e) => e.addEventListener('input', calc));
  $('u_sw').onclick = () => { const t = a.value; a.value = b.value; b.value = t; calc(); };
  fill();
})();
