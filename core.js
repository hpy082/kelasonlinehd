/* =====================================================================
   Portal Belajar Spendas — inti frontend (vanilla JS, tanpa framework)
   API (fetch → GAS, text/plain, dedupe, retry, SWR) · Store · Router ·
   Kerangka · Modal · Toast · Tabel · Grafik SVG · Ekspor · Unggah · PWA
   ===================================================================== */
'use strict';
const APPV = '1.0.0';

// ---------------------------------------------------------------- util
const $ = (s, el) => (el || document).querySelector(s);
const ROOT = () => document.getElementById('root') || document.body;
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, c) => `<svg class="ic ${c || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BLN_L = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
/** 'yyyy-MM-dd[ HH:mm[:ss]]' (WIB) → epoch ms */
function tms(s) {
  if (typeof s === 'number') return s;
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], (+m[4] || 0) - 7, +m[5] || 0, +m[6] || 0);
}
const wib = ms => { const d = new Date(ms + 7 * 3600e3); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), w: d.getUTCDay() }; };
const p2 = n => String(n).padStart(2, '0');
const sekarang = () => Date.now() + (Store.skew || 0);
const tglKey = ms => { const w = wib(ms); return w.y + '-' + p2(w.m + 1) + '-' + p2(w.d); };
const hariIni = () => tglKey(sekarang());
function fTgl(s, panjang) { const t = tms(s); if (isNaN(t)) return esc(s || '-'); const w = wib(t); return w.d + ' ' + (panjang ? BLN_L : BLN)[w.m] + ' ' + w.y; }
function fJam(s) { const t = tms(s); if (isNaN(t)) return ''; const w = wib(t); return p2(w.h) + ':' + p2(w.mi); }
function fWaktu(s) { const t = tms(s); if (isNaN(t)) return esc(s || '-'); const w = wib(t); return w.d + ' ' + BLN[w.m] + (w.y !== wib(sekarang()).y ? ' ' + w.y : '') + ', ' + p2(w.h) + ':' + p2(w.mi); }
function fHari(s) { const t = tms(s); const w = wib(t); return HARI[w.w] + ', ' + w.d + ' ' + BLN[w.m]; }
function relatif(s) {
  const t = typeof s === 'number' ? s : tms(s); if (isNaN(t)) return '';
  const d = t - sekarang(), a = Math.abs(d), lalu = d < 0;
  const m = Math.round(a / 60e3), j = Math.round(a / 3600e3), h = Math.round(a / 86400e3);
  const x = a < 60e3 ? 'baru saja' : m < 60 ? m + ' menit' : j < 24 ? j + ' jam' : h === 1 ? '1 hari' : h + ' hari';
  if (x === 'baru saja') return x;
  if (!lalu && h >= 1 && h <= 1 && tglKey(t) === tglKey(sekarang() + 86400e3)) return 'Besok, ' + fJam(t);
  if (!lalu && tglKey(t) === hariIni()) return 'Hari ini, ' + fJam(t);
  return lalu ? x + ' lalu' : x + ' lagi';
}
function sisaWaktu(s) { const d = tms(s) - sekarang(); if (d <= 0) return 'Lewat tenggat'; const j = Math.floor(d / 3600e3), m = Math.floor(d % 3600e3 / 60e3); return j >= 48 ? Math.round(j / 24) + ' hari lagi' : 'Tersisa ' + (j ? j + ' jam ' : '') + m + ' menit'; }
const inisial = n => String(n || '?').replace(/^(bpk|ibu|bu|pak)\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?';
const PASTEL = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
const hashStr = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const avatar = (nama, cls) => `<span class="av ${cls || 'md'}" style="background:var(--${PASTEL[hashStr(nama) % 6]})" aria-hidden="true">${esc(inisial(nama))}</span>`;
const angka = (n, d) => n === null || n === undefined || n === '' || isNaN(n) ? '-' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 1 : d });
const persen = (a, b) => b ? Math.round(a / b * 100) : 0;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 200); }; };
const hp = s => { s = String(s || '').replace(/\D/g, ''); if (s.startsWith('0')) s = '62' + s.slice(1); return s; };
const hpTampil = s => { s = hp(s); return s ? '+62 ' + s.slice(2).replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3') : '-'; };
const waLink = (no, teks) => 'https://wa.me/' + hp(no) + (teks ? '?text=' + encodeURIComponent(teks) : '');
const urut = (arr, fn, dir) => arr.slice().sort((a, b) => { const x = fn(a), y = fn(b); return (x < y ? -1 : x > y ? 1 : 0) * (dir || 1); });
const kelompok = (arr, fn) => arr.reduce((o, x) => { const k = fn(x); (o[k] = o[k] || []).push(x); return o; }, {});
const predikat = n => n === null || n === undefined || n === '' ? '-' : n >= 90 ? 'A' : n >= 80 ? 'B' : n >= Number((Store.boot && Store.boot.setting.KKM) || 75) ? 'C' : 'D';
const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }, del(k) { try { localStorage.removeItem(k); } catch (e) { } } };

// ---------------------------------------------------------------- API
const API = {
  inflight: {}, memo: {}, epoch: 0, aktif: 0,
  url() { return String(window.GAS_URL || ''); },
  siap() { return window.DEMO || /^https:\/\/script\.google(usercontent)?\.com\/.+/.test(API.url()); },
  async raw(action, data, opsi) {
    opsi = opsi || {};
    const body = JSON.stringify({ action, token: Store.token || '', data: data || {} });
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const to = setTimeout(() => ctrl && ctrl.abort(), opsi.timeout || 45000);
    API.net(1);
    try {
      const res = window.DEMO ? await window.DEMO.fetch(body) : await fetch(API.url(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, signal: ctrl && ctrl.signal, redirect: 'follow', cache: 'no-store' });
      let j;
      try { j = await res.json(); } catch (e) { throw Object.assign(new Error('Respons server tidak valid. Pastikan Web App di-deploy dengan akses "Anyone".'), { code: 'FORMAT' }); }
      if (!j.ok) throw Object.assign(new Error(j.msg || 'Terjadi kesalahan.'), { code: j.code || 'GAGAL' });
      return j.data;
    } catch (e) {
      if (e.name === 'AbortError') e = Object.assign(new Error('Server terlalu lama merespons. Periksa koneksi lalu coba lagi.'), { code: 'TIMEOUT' });
      else if (!e.code) e = Object.assign(new Error(navigator.onLine === false ? 'Anda sedang offline. Data terakhir tetap ditampilkan.' : 'Tidak dapat terhubung ke server. Coba lagi.'), { code: 'JARINGAN' });
      if (e.code === 'SESI' && !opsi.diam) App.sesiHabis(e.message);
      throw e;
    } finally { clearTimeout(to); API.net(-1); }
  },
  baca: a => /^(boot|ping|auth\.config|batch)$|\.(list|sesi|siswa|kelas|panel|data|hasil|review|pengumpulan|bukuNilai|status|antrian|log|pengaturan|sesiWali|interaksi)$/.test(a),
  /** Panggilan API: baca → dedupe in-flight + memo TTL + 1x retry; tulis → membatalkan memo. */
  call(action, data, opsi) {
    opsi = opsi || {};
    if (!API.baca(action)) { API.epoch++; API.memo = {}; return API.raw(action, data, opsi); }
    const k = API.epoch + '|' + action + '|' + JSON.stringify(data || {});
    const m = API.memo[k];
    if (opsi.ttl && m && Date.now() - m.t < opsi.ttl) return Promise.resolve(m.v);
    if (API.inflight[k]) return API.inflight[k];
    const coba = n => API.raw(action, data, opsi).catch(e => (n > 0 && /JARINGAN|TIMEOUT/.test(e.code)) ? new Promise(r => setTimeout(r, 900)).then(() => coba(n - 1)) : Promise.reject(e));
    const p = coba(1).then(v => { API.memo[k] = { t: Date.now(), v }; return v; });
    API.inflight[k] = p;
    p.then(() => delete API.inflight[k], () => delete API.inflight[k]);
    return p;
  },
  /** Gabungkan beberapa aksi BACA dalam 1 eksekusi server (≤12). Hasil tiap aksi juga disimpan ke memo. */
  async batch(calls, opsi) {
    const r = await API.call('batch', { calls }, opsi);
    return r.map((x, i) => {
      if (!x.ok) return Object.assign(new Error(x.msg || 'Gagal'), { code: x.code });
      API.memo[API.epoch + '|' + calls[i].action + '|' + JSON.stringify(calls[i].data || {})] = { t: Date.now(), v: x.data };
      return x.data;
    });
  },
  /** Ambil dari memo bila ada (untuk render instan), lalu segarkan. */
  cached(action, data) { const k = API.epoch + '|' + action + '|' + JSON.stringify(data || {}); return API.memo[k] ? API.memo[k].v : null; },
  net(d) {
    API.aktif = Math.max(0, API.aktif + d);
    let b = $('#netbar');
    if (API.aktif && !b) { b = document.createElement('div'); b.id = 'netbar'; b.className = 'netbar'; b.innerHTML = '<i></i>'; document.body.appendChild(b); }
    if (!API.aktif && b) b.remove();
  }
};

// ---------------------------------------------------------------- Store
const Store = {
  token: LS.get('spd_tok', ''), boot: null, skew: 0, v: {}, anak: LS.get('spd_anak', 0),
  simpanBoot(b) { Store.boot = b; Store.skew = b.now ? b.now - Date.now() : 0; LS.set('spd_boot', b); },
  muat() { const b = LS.get('spd_boot', null); if (b && Store.token) { Store.boot = b; Store.skew = 0; } },
  bersih() { Store.token = ''; Store.boot = null; Store.v = {}; ['spd_tok', 'spd_boot', 'spd_anak'].forEach(LS.del); API.memo = {}; },
  get user() { return Store.boot ? Store.boot.user : null; }
};
const B = () => Store.boot || {};
const U = () => B().user || {};
const SET = k => (B().setting || {})[k];
const KKM = () => Number(SET('KKM') || 75);
/** Data siswa aktif: murid sendiri, atau anak terpilih untuk wali. */
function SD() { const b = B(); if (b.murid) return b.murid; if (b.wali) { const a = b.wali.anak; return a[Math.min(Store.anak, a.length - 1)] || a[0]; } return null; }
const isMurid = () => U().peran === 'murid', isWali = () => U().peran === 'wali', isAdmin = () => !!U().isAdmin, isGuru = () => !!U().isGuru && !!B().guru, isWK = () => !!U().isWaliKelas && !!B().guru;
const mapelSaya = () => (B().guru ? B().guru.mapel : []);
const mapelById = id => { const b = B(); const all = (b.guru ? b.guru.mapel.concat(b.guru.mapelWali) : []).concat(SD() ? SD().mapel : []).concat(b.admin ? b.admin.mapel : []); return all.find(m => String(m.id_mapel) === String(id)) || null; };
const namaMapel = id => { const m = mapelById(id); return m ? m.nama_mapel : ''; };

// ---------------------------------------------------------------- Toast & Modal & Tooltip
function toast(msg, tipe, aksi) {
  let w = $('#toasts'); if (!w) { w = document.createElement('div'); w.id = 'toasts'; w.className = 'toasts'; w.setAttribute('role', 'status'); w.setAttribute('aria-live', 'polite'); document.body.appendChild(w); }
  const t = document.createElement('div'); t.className = 'toast ' + (tipe || 'ok');
  t.innerHTML = ic(tipe === 'bad' ? 'alert' : tipe === 'warn' ? 'info' : 'checkCircle') + '<span>' + esc(msg) + '</span>' + (aksi ? '<button>' + esc(aksi.label) + '</button>' : '');
  if (aksi) t.querySelector('button').onclick = () => { aksi.fn(); t.remove(); };
  w.appendChild(t); setTimeout(() => t.remove(), tipe === 'bad' ? 6500 : 3800);
}
const salah = e => toast(e && e.message ? e.message : String(e), 'bad');
const Modal = {
  stack: [],
  open(html, opsi) {
    opsi = opsi || {};
    const o = document.createElement('div'); o.className = 'ovl'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.innerHTML = `<div class="modal ${opsi.size || ''}">${html}</div>`;
    o.addEventListener('mousedown', e => { if (e.target === o && !opsi.kunci) Modal.close(); });
    document.body.appendChild(o); Modal.stack.push({ o, onClose: opsi.onClose });
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = o.querySelector('[autofocus],input:not([type=hidden]):not([type=checkbox]),textarea,select'); if (f && opsi.fokus !== false && window.innerWidth > 767) f.focus(); }, 30);
    return o;
  },
  close() { const m = Modal.stack.pop(); if (!m) return; m.o.remove(); if (!Modal.stack.length) document.body.style.overflow = ''; if (m.onClose) m.onClose(); },
  top() { const m = Modal.stack[Modal.stack.length - 1]; return m ? m.o : null; },
  head: (judul, sub, ikon) => `<div class="modal-h">${ikon ? `<span class="sq ungu">${ic(ikon)}</span>` : ''}<div class="grow"><h2>${judul}</h2>${sub ? `<p class="sm mut">${sub}</p>` : ''}</div><button class="btn ghost ico sm" data-a="tutup" aria-label="Tutup">${ic('x')}</button></div>`,
  konfirmasi(judul, pesan, opsi) {
    opsi = opsi || {};
    return new Promise(res => {
      let jawab = false;
      Modal.open(`${Modal.head(esc(judul))}<div class="modal-b"><p>${pesan}</p></div><div class="modal-f"><button class="btn ghost" data-a="tutup">Batal</button><button class="btn ${opsi.bahaya ? 'bad' : 'p'}" id="mk-ok">${esc(opsi.ok || 'Ya, lanjutkan')}</button></div>`, { size: 'sm', onClose: () => res(jawab) });
      $('#mk-ok').onclick = () => { jawab = true; Modal.close(); };
    });
  }
};
document.addEventListener('keydown', e => { if (e.key === 'Escape' && Modal.stack.length) Modal.close(); });
const Tip = {
  el: null,
  show(html, x, y) { if (!Tip.el) { Tip.el = document.createElement('div'); Tip.el.className = 'tip'; document.body.appendChild(Tip.el); } Tip.el.innerHTML = html; Tip.el.style.display = 'block'; const r = Tip.el.getBoundingClientRect(); Tip.el.style.left = Math.min(window.innerWidth - r.width - 8, Math.max(8, x + 12)) + 'px'; Tip.el.style.top = Math.max(8, y - r.height - 12) + 'px'; },
  hide() { if (Tip.el) Tip.el.style.display = 'none'; }
};
document.addEventListener('pointerover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) Tip.show(t.getAttribute('data-tip'), e.clientX, e.clientY); });
document.addEventListener('pointermove', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t) Tip.show(t.getAttribute('data-tip'), e.clientX, e.clientY); else Tip.hide(); });
document.addEventListener('scroll', () => Tip.hide(), true);

// ---------------------------------------------------------------- Aksi (event delegation)
const ACT = {}, INP = {}, CHG = {}, FRM = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => { const el = e.target.closest('[data-i]'); if (el && INP[el.dataset.i]) INP[el.dataset.i](el, e); });
document.addEventListener('change', e => { const el = e.target.closest('[data-c]'); if (el && CHG[el.dataset.c]) CHG[el.dataset.c](el, e); });
document.addEventListener('submit', e => { const f = e.target.closest('form[data-f]'); if (f && FRM[f.dataset.f]) { e.preventDefault(); FRM[f.dataset.f](f, e); } });
ACT.tutup = () => Modal.close();
ACT.ke = el => R.go(el.dataset.h);
ACT.salin = el => { const v = el.dataset.v || ''; const ok = () => toast('Disalin ke papan klip.'); if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(v).then(ok, () => prompt('Salin teks berikut:', v)); else { const t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); ok(); } catch (e) { prompt('Salin teks berikut:', v); } t.remove(); } };
ACT.tema = () => { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; LS.set('spd_tema', d); const b = $('[data-a=tema]'); if (b) b.innerHTML = ic(d === 'dark' ? 'sun' : 'moon'); };
const formData = f => { const o = {}; new FormData(f).forEach((v, k) => { o[k] = typeof v === 'string' ? v.trim() : v; }); $$('input[type=checkbox][name]', f).forEach(c => { o[c.name] = c.checked; }); return o; };
/** Jalankan aksi tulis dengan status tombol (spinner) */
async function sibuk(btn, fn, teks) {
  const asli = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (teks ? ' ' + esc(teks) : ''); }
  try { return await fn(); } catch (e) { salah(e); return undefined; } finally { if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = asli; } }
}

// ---------------------------------------------------------------- Router
const R = {
  rute: {}, cur: { path: 'beranda', id: '', q: {} },
  def(nama, fn) { R.rute[nama] = fn; },
  parse() {
    const h = location.hash.replace(/^#\/?/, ''), [p, qs] = h.split('?'), parts = p.split('/').filter(Boolean), q = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { path: parts[0] || 'beranda', id: parts.slice(1).join('/'), q };
  },
  go(h) { if (location.hash === h) R.render(); else location.hash = h; },
  render() {
    R.cur = R.parse();
    if (R.cur.path === 'masuk' && R.cur.id) return Login.masukLink(R.cur.id);
    if (!Store.token || !Store.boot) return Login.render();
    Shell.pasang();
    const fn = R.rute[R.cur.path] || R.rute.beranda;
    const v = $('#view');
    try {
      const out = fn(R.cur);
      if (out !== undefined) { v.innerHTML = typeof out === 'string' ? out : out.html; if (out && out.after) out.after(); }
    } catch (e) { console.error(e); v.innerHTML = kosong('alert', 'Tampilan gagal dimuat', esc(e.message)); }
    Shell.aktif();
    if (R.lastPath !== R.cur.path + R.cur.id) { window.scrollTo(0, 0); R.lastPath = R.cur.path + R.cur.id; }
  },
  /** Render ulang tampilan aktif TANPA mengganggu pengguna yang sedang mengetik / modal terbuka. */
  segarkan(paksa) {
    const a = document.activeElement;
    if (!paksa && (Modal.stack.length || (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('#view')))) { R.tunda = true; return; }
    R.tunda = false; const y = window.scrollY; R.render(); window.scrollTo(0, y);
  }
};
window.addEventListener('hashchange', () => { Tip.hide(); while (Modal.stack.length) Modal.close(); R.render(); });

// ---------------------------------------------------------------- Komponen kecil
const kosong = (ikon, judul, sub, aksi) => `<div class="empty"><span class="sq ungu">${ic(ikon)}</span><b class="tx">${judul}</b>${sub ? `<span class="sm">${sub}</span>` : ''}${aksi || ''}</div>`;
const prog = (p, warna, lg) => `<div class="prog ${lg ? 'lg' : ''}" role="progressbar" aria-valuenow="${Math.round(p || 0)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(0, Math.min(100, p || 0))}%;${warna ? 'background:' + warna : ''}"></i></div>`;
const BD_ABS = { H: ['H', 'Hadir'], S: ['S', 'Sakit'], I: ['I', 'Izin'], A: ['A', 'Alfa'], '-': ['belum', 'Belum dicatat'] };
const bdAbs = (s, pendek) => { const x = BD_ABS[s] || BD_ABS['-']; return `<span class="bd ${x[0]}">${pendek ? s : x[1]}</span>`; };
function statusTugas(t) {
  const k = t.kumpul, lewat = tms(t.deadline) < sekarang();
  if (k && k.nilai !== '' && k.nilai !== null && k.nilai !== undefined) return { k: 'dinilai', bd: `<span class="bd ok">${ic('star')}Dinilai · ${angka(k.nilai)}</span>` };
  if (k) return { k: k.status === 'terlambat' ? 'terlambat' : 'dikumpulkan', bd: k.status === 'terlambat' ? '<span class="bd terlambat">Terlambat</span>' : '<span class="bd info">Dikumpulkan</span>' };
  if (lewat) return { k: 'lewat', bd: '<span class="bd bad">Belum · lewat tenggat</span>' };
  return { k: 'belum', bd: tms(t.deadline) - sekarang() < 86400e3 ? `<span class="bd warn">${ic('clock')}${esc(sisaWaktu(t.deadline))}</span>` : '<span class="bd belum">Belum dikerjakan</span>' };
}
const MAPEL_GAYA = [
  [/ipa|sains|biologi|fisika/i, 'c3', 'flask', '#7C3AED'], [/mat|mtk/i, 'c1', 'target', '#4F46E5'], [/indonesia|b\. ?indo/i, 'c2', 'book', '#DB2777'],
  [/inggris|english/i, 'c4', 'chat', '#C2410C'], [/ppkn|pancasila|pkn/i, 'c3', 'shield', '#6D28D9'], [/pjok|olahraga|penjas/i, 'c4', 'zap', '#B45309'],
  [/seni|budaya|prakarya/i, 'c5', 'sparkles', '#047857'], [/informatika|tik|komputer/i, 'c6', 'layers', '#0369A1'], [/agama|pai/i, 'c5', 'star', '#047857'], [/ips|sejarah|geografi/i, 'c6', 'school', '#0E7490']];
const gayaMapel = nama => { const g = MAPEL_GAYA.find(x => x[0].test(nama || '')) || [0, PASTEL[hashStr(nama) % 6], 'book', '#4F46E5']; return { c: g[1], i: g[2], w: g[3] }; };
const IKON_JENIS = { video: 'play', dokumen: 'file', presentasi: 'slides', tautan: 'link' };
function kartuMateri(m, opsi) {
  opsi = opsi || {};
  const g = gayaMapel(m.nama_mapel || namaMapel(m.id_mapel));
  const p = { selesai: 100, dipelajari: 50, dibuka: 15 }[m.progres] || 0;
  return `<button class="mcard" data-a="materi" data-id="${esc(m.id_materi)}">
    <div class="cover" style="background:linear-gradient(140deg,var(--${g.c}),var(--sf2))">
      <div class="tile"><b style="color:${g.w}">${ic(IKON_JENIS[m.jenis] || 'book', 's')} ${esc((m.jenis || '').replace(/^./, c => c.toUpperCase()))}</b><span>${esc(fTgl(m.tanggal_terbit))}</span></div>
      <span class="lbl trunc">${esc(m.nama_mapel || namaMapel(m.id_mapel))}</span>
      <span class="bm ${m.progres === 'dipelajari' ? 'on' : ''}">${ic('bookmark', 's')}</span>
      ${m.status === 'draf' ? '<span class="bd warn" style="position:absolute;top:8px;left:8px">Draf</span>' : ''}
    </div>
    <h4 class="clamp2">${esc(m.judul)}</h4>
    <span class="meta trunc">${esc(opsi.meta || m.deskripsi || '')}</span>
    ${opsi.tanpaProg ? '' : `<div class="mt12"><div class="row sb2 xs mut" style="margin-bottom:4px"><span>${m.progres === 'selesai' ? 'Selesai' : m.progres === 'dipelajari' ? 'Sedang dipelajari' : m.progres ? 'Sudah dibuka' : 'Belum dibuka'}</span><b class="p">${p}%</b></div>${prog(p, g.w)}</div>`}
  </button>`;
}

// ---------------------------------------------------------------- Tabel (cari, urut, halaman)
const Tabel = {
  cfg: {},
  /** cfg: { kolom:[{k,l,r(row)→html,num,sort(row)→val, w}], rows:()=>[], cari:(row)=>string, per:10, kosong, klik } */
  def(id, cfg) { const lama = Tabel.cfg[id] || {}; Tabel.cfg[id] = Object.assign({ per: 10, hal: 1, q: '', sk: null, sd: 1 }, cfg, { hal: lama.hal || 1, q: lama.q || '', sk: lama.sk || cfg.sk || null, sd: lama.sd || cfg.sd || 1 }); return `<div id="tb-${id}">${Tabel.html(id)}</div>`; },
  data(id) {
    const c = Tabel.cfg[id]; let rows = c.rows();
    if (c.q && c.cari) { const q = c.q.toLowerCase(); rows = rows.filter(r => c.cari(r).toLowerCase().includes(q)); }
    if (c.sk) { const k = c.kolom.find(x => x.k === c.sk); if (k) rows = urut(rows, k.sort || (r => r[k.k]), c.sd); }
    return rows;
  },
  html(id) {
    const c = Tabel.cfg[id], rows = Tabel.data(id), n = rows.length, hal = Math.min(c.hal, Math.max(1, Math.ceil(n / c.per)));
    c.hal = hal;
    const vis = rows.slice((hal - 1) * c.per, hal * c.per);
    const th = c.kolom.map(k => `<th class="${k.sort !== false && k.l ? 'srt' : ''} ${k.num ? 'num' : ''}" ${k.w ? `style="width:${k.w}"` : ''} ${k.sort !== false && k.l ? `data-a="tb-sort" data-t="${id}" data-k="${k.k}"` : ''} scope="col">${k.l}${c.sk === k.k ? (c.sd > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('');
    const tb = vis.length ? vis.map((r, i) => `<tr ${c.trAttr ? c.trAttr(r) : ''}>${c.kolom.map(k => `<td class="${k.num ? 'num' : ''}">${k.r ? k.r(r, (hal - 1) * c.per + i) : esc(r[k.k])}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${c.kolom.length}">${kosong('inbox', c.kosong || 'Tidak ada data', c.q ? 'Coba kata kunci lain.' : '')}</td></tr>`;
    const tot = Math.max(1, Math.ceil(n / c.per));
    let pg = '';
    if (tot > 1) {
      const nums = []; for (let p = Math.max(1, hal - 2); p <= Math.min(tot, hal + 2); p++) nums.push(p);
      pg = `<div class="btns"><button data-a="tb-hal" data-t="${id}" data-p="${hal - 1}" ${hal <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">‹</button>${nums.map(p => `<button data-a="tb-hal" data-t="${id}" data-p="${p}" class="${p === hal ? 'on' : ''}">${p}</button>`).join('')}<button data-a="tb-hal" data-t="${id}" data-p="${hal + 1}" ${hal >= tot ? 'disabled' : ''} aria-label="Berikutnya">›</button></div>`;
    }
    return `<div class="tw"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>
      <div class="pager"><span>Menampilkan <b class="tx">${n ? (hal - 1) * c.per + 1 : 0}–${Math.min(n, hal * c.per)}</b> dari <b class="tx">${n}</b></span>${pg}</div>`;
  },
  refresh(id) { const el = $('#tb-' + id); if (el && Tabel.cfg[id]) el.innerHTML = Tabel.html(id); },
  cari(id, q) { const c = Tabel.cfg[id]; if (!c) return; c.q = q; c.hal = 1; Tabel.refresh(id); }
};
ACT['tb-sort'] = el => { const c = Tabel.cfg[el.dataset.t]; if (c.sk === el.dataset.k) c.sd = -c.sd; else { c.sk = el.dataset.k; c.sd = 1; } Tabel.refresh(el.dataset.t); };
ACT['tb-hal'] = el => { Tabel.cfg[el.dataset.t].hal = Number(el.dataset.p); Tabel.refresh(el.dataset.t); };
INP['tb-cari'] = debounce(el => Tabel.cari(el.dataset.t, el.value), 120);

// ---------------------------------------------------------------- Grafik SVG (ringan, tanpa pustaka)
const STATUS_WARNA = { H: '#22C55E', S: '#3B82F6', I: '#F59E0B', A: '#EF4444' };
const legenda = items => `<div class="legend">${items.map(x => `<span><i style="background:${x[1]}"></i>${esc(x[0])}</span>`).join('')}</div>`;
const legendaAbs = () => legenda([['Hadir', STATUS_WARNA.H], ['Sakit', STATUS_WARNA.S], ['Izin', STATUS_WARNA.I], ['Alfa', STATUS_WARNA.A]]);
const Chart = {
  /** Kolom bertumpuk H/S/I/A per label. data: [{label, H,S,I,A, sub}] → persen hadir di puncak */
  stackAbs(data, opsi) {
    opsi = opsi || {};
    if (!data.length) return kosong('chart', 'Belum ada data kehadiran');
    const W = 560, H = 210, pl = 34, pb = 26, pt = 18, ch = H - pb - pt, n = data.length, slot = (W - pl - 6) / n, bw = Math.min(26, slot * .55);
    const mn = opsi.min === undefined ? 0 : opsi.min;
    let g = '';
    [0, 25, 50, 75, 100].forEach(v => { const y = pt + ch - ch * (v - mn) / (100 - mn); if (v >= mn) g += `<line class="grid" x1="${pl}" x2="${W}" y1="${y}" y2="${y}"/><text x="${pl - 6}" y="${y + 3.5}" text-anchor="end">${v}%</text>`; });
    data.forEach((d, i) => {
      const tot = (d.H || 0) + (d.S || 0) + (d.I || 0) + (d.A || 0); if (!tot) return;
      const x = pl + slot * i + (slot - bw) / 2; let y = pt + ch;
      const segs = ['H', 'S', 'I', 'A'].filter(k => d[k]);
      const tinggiTot = ch;
      segs.forEach((k, j) => {
        const h = tinggiTot * d[k] / tot - (j < segs.length - 1 ? 2 : 0); y -= h;
        const atas = j === segs.length - 1;
        g += atas ? `<path d="M${x},${y + h}V${y + 4}q0,-4 4,-4h${bw - 8}q4,0 4,4V${y + h}Z" fill="${STATUS_WARNA[k]}"/>` : `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(0, h)}" fill="${STATUS_WARNA[k]}"/>`;
        if (!atas) y -= 2;
      });
      const pH = Math.round((d.H || 0) / tot * 1000) / 10;
      g += `<text x="${x + bw / 2}" y="${pt - 5}" text-anchor="middle" style="fill:var(--tx);font-weight:700">${pH}%</text>`;
      g += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
      g += `<rect x="${pl + slot * i}" y="${pt}" width="${slot}" height="${ch}" fill="transparent" data-tip="${esc(`<b>${esc(d.sub || d.label)}</b>Hadir ${d.H || 0} · Sakit ${d.S || 0} · Izin ${d.I || 0} · Alfa ${d.A || 0}<br>${pH}% hadir`)}"/>`;
    });
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opsi.aria || 'Grafik kehadiran')}">${g}</svg></div>`;
  },
  /** Garis satu seri. data: [{label, v, sub}] */
  line(data, opsi) {
    opsi = opsi || {};
    if (data.length < 1) return kosong('trend', 'Belum ada nilai untuk ditampilkan');
    const W = 560, H = 210, pl = 32, pr = 34, pb = 26, pt = 16, cw = W - pl - pr, chh = H - pt - pb;
    const mn = opsi.min !== undefined ? opsi.min : 0, mx = 100;
    const X = i => pl + (data.length === 1 ? cw / 2 : cw * i / (data.length - 1)), Y = v => pt + chh - chh * (v - mn) / (mx - mn);
    let g = '';
    [0, 25, 50, 75, 100].filter(v => v >= mn).forEach(v => { g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl - 6}" y="${Y(v) + 3.5}" text-anchor="end">${v}</text>`; });
    if (opsi.kkm) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(opsi.kkm)}" y2="${Y(opsi.kkm)}" stroke="#EF4444" stroke-width="1" opacity=".55"/><text x="${W - pr + 4}" y="${Y(opsi.kkm) + 3.5}" style="fill:#B91C1C">KKM</text>`;
    const pts = data.map((d, i) => [X(i), Y(d.v)]);
    const warna = opsi.warna || 'var(--p)';
    if (pts.length > 1) g += `<path d="M${pts[0][0]},${Y(mn)}L${pts.map(p => p.join(',')).join('L')}L${pts[pts.length - 1][0]},${Y(mn)}Z" fill="${warna}" opacity=".1"/><path d="M${pts.map(p => p.join(',')).join('L')}" fill="none" stroke="${warna}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const step = Math.ceil(data.length / 8);
    data.forEach((d, i) => {
      g += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4.5" fill="${warna}" stroke="var(--sf)" stroke-width="2"/>`;
      if (i % step === 0 || i === data.length - 1) g += `<text x="${pts[i][0]}" y="${H - 8}" text-anchor="middle">${esc(String(d.label).slice(0, 10))}</text>`;
      g += `<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="14" fill="transparent" data-tip="${esc(`<b>${esc(d.sub || d.label)}</b>Rata-rata: ${angka(d.v)}`)}"/>`;
    });
    const l = pts[pts.length - 1];
    g += `<text x="${l[0] + 8}" y="${l[1] + 4}" style="fill:var(--tx);font-weight:800">${angka(data[data.length - 1].v, 0)}</text>`;
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opsi.aria || 'Grafik tren')}">${g}</svg></div>`;
  },
  /** Donat. parts: [{l, v, c}] */
  donut(parts, tengah, sub, ukuran) {
    const tot = parts.reduce((a, p) => a + p.v, 0), r = 38, C = 2 * Math.PI * r, s = ukuran || 140;
    let off = 0, g = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--sf3)" stroke-width="13"/>`;
    if (tot) parts.forEach(p => { if (!p.v) return; const len = Math.max(0, C * p.v / tot - (parts.filter(x => x.v).length > 1 ? 1.2 : 0)); g += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${p.c}" stroke-width="13" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)" data-tip="${esc(`<b>${esc(p.l)}</b>${p.v} (${persen(p.v, tot)}%)`)}"/>`; off += C * p.v / tot; });
    return `<div class="donut-wrap" style="width:${s}px;height:${s}px"><svg viewBox="0 0 100 100" width="${s}" height="${s}" role="img" aria-label="${esc(parts.map(p => p.l + ' ' + p.v).join(', '))}">${g}</svg><div class="lbl"><div style="font-size:${s > 110 ? 22 : 16}px;font-weight:800;color:var(--tx)">${tengah}</div>${sub ? `<div class="xs mut b caps" style="font-size:9.5px">${sub}</div>` : ''}</div></div>`;
  },
  /** Batang horizontal. items: [{l, v, max, warna, ket}] */
  hbars(items, opsi) {
    opsi = opsi || {};
    if (!items.length) return kosong('chart', 'Belum ada data');
    return `<div class="bars-h">${items.map(x => `<div class="r" data-tip="${esc(`<b>${esc(x.l)}</b>${esc(x.ket || angka(x.v))}`)}"><span class="trunc">${esc(x.l)}</span><div class="t"><i style="width:${Math.max(2, Math.min(100, (x.v || 0) / (x.max || 100) * 100))}%;background:${x.warna || 'var(--p)'}"></i></div><b class="tx right mono">${x.v === null ? '-' : angka(x.v, opsi.d === undefined ? 0 : opsi.d)}${opsi.suf || ''}</b></div>`).join('')}</div>`;
  }
};

// ---------------------------------------------------------------- Ekspor (Excel / PDF) — pustaka dimuat saat dibutuhkan saja
const Ekspor = {
  muat(src) { return new Promise((res, rej) => { if ($('script[src="' + src + '"]')) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat pustaka ekspor (periksa koneksi).')); document.head.appendChild(s); }); },
  async xlsx(nama, lembar) {
    try {
      await Ekspor.muat('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      const wb = XLSX.utils.book_new();
      lembar.forEach(s => { const ws = XLSX.utils.aoa_to_sheet(s.rows); ws['!cols'] = (s.rows[0] || []).map((_, i) => ({ wch: Math.min(40, Math.max(8, ...s.rows.slice(0, 200).map(r => String(r[i] === undefined ? '' : r[i]).length + 2))) })); XLSX.utils.book_append_sheet(wb, ws, s.nama.slice(0, 31)); });
      XLSX.writeFile(wb, nama + '.xlsx'); toast('Berkas Excel diunduh.');
    } catch (e) { Ekspor.csv(nama, lembar[0].rows); toast('Pustaka Excel tidak termuat — diunduh sebagai CSV.', 'warn'); }
  },
  csv(nama, rows) {
    const s = rows.map(r => r.map(v => { v = String(v === null || v === undefined ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n');
    Ekspor.unduh(new Blob(['﻿' + s], { type: 'text/csv;charset=utf-8' }), nama + '.csv');
  },
  unduh(blob, nama) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nama; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); },
  async pdf(judul, rows, opsi) {
    opsi = opsi || {};
    try {
      await Ekspor.muat('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      await Ekspor.muat('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js');
      const doc = new window.jspdf.jsPDF({ orientation: rows[0].length > 6 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
      doc.setFontSize(13); doc.text(judul, 40, 40);
      doc.setFontSize(9); doc.setTextColor(110); doc.text((SET('NAMA_SEKOLAH') || '') + ' · ' + (SET('TAHUN_AJARAN') || '') + ' · dicetak ' + fWaktu(tglKey(sekarang()) + ' ' + fJam(sekarang())), 40, 56);
      doc.autoTable({ head: [rows[0]], body: rows.slice(1), startY: 68, styles: { fontSize: 8.5, cellPadding: 4 }, headStyles: { fillColor: [91, 91, 214] }, alternateRowStyles: { fillColor: [246, 247, 255] } });
      doc.setFontSize(8); doc.setTextColor(150); doc.text('Portal Belajar Spendas · Powered by hd.dsk', 40, doc.internal.pageSize.getHeight() - 20);
      doc.save((opsi.nama || judul).replace(/[^\w\- ]+/g, '') + '.pdf'); toast('Berkas PDF diunduh.');
    } catch (e) { salah(e); }
  }
};

// ---------------------------------------------------------------- Berkas (kompres foto di browser sebelum dikirim)
const Berkas = {
  maksMB: () => Number(SET('MAKS_UNGGAH_MB') || 8),
  async baca(file) {
    let blob = file, mime = file.type || 'application/octet-stream', nama = file.name;
    if (/^image\/(jpeg|png|webp)$/.test(mime) && file.size > 350 * 1024) {
      try { blob = await Berkas.kompres(file); mime = 'image/jpeg'; nama = nama.replace(/\.\w+$/, '') + '.jpg'; } catch (e) { blob = file; }
    }
    if (blob.size > Berkas.maksMB() * 1048576) throw new Error(`"${file.name}" terlalu besar (${(blob.size / 1048576).toFixed(1)} MB). Maksimal ${Berkas.maksMB()} MB — untuk video gunakan tautan YouTube (unlisted).`);
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Gagal membaca berkas.')); r.readAsDataURL(blob); });
    return { nama, mime, b64, ukuran: blob.size };
  },
  kompres(file) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => { const s = Math.min(1, 1600 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('kompres')), 'image/jpeg', .82); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('gambar')); }; img.src = url;
    });
  },
  ukuran: b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'
};
/** Ubah URL YouTube/Drive menjadi URL embed (pratinjau di dalam aplikasi). */
function urlEmbed(u) {
  u = String(u || '');
  let m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1];
  m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
  m = u.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([\w-]+)/);
  if (m) return 'https://docs.google.com/' + m[1] + '/d/' + m[2] + '/' + (m[1] === 'presentation' ? 'embed' : 'preview');
  return '';
}
const ikonTautan = u => /youtu/.test(u) ? 'play' : /drive|docs\.google/.test(u) ? 'file' : /\.(jpe?g|png|webp)/i.test(u) ? 'image' : 'link';
const labelTautan = u => { try { const x = new URL(u); return /youtu/.test(x.host) ? 'Video YouTube' : /drive|docs/.test(x.host) ? 'Berkas Google Drive' : x.host.replace(/^www\./, ''); } catch (e) { return u.startsWith('blob:') ? 'Berkas unggahan (demo)' : u; } };

// ---------------------------------------------------------------- PWA
const PWA = {
  prompt: null,
  init() {
    if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.DEMO) {
      navigator.serviceWorker.register('./sw.js').then(reg => {
        reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Versi baru aplikasi tersedia.', 'warn', { label: 'Muat ulang', fn: () => location.reload() }); }); });
      }).catch(() => { });
    }
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.prompt = e; $$('.pasang-app').forEach(x => x.classList.remove('hide')); });
    window.addEventListener('appinstalled', () => { PWA.prompt = null; toast('Aplikasi terpasang di perangkat Anda.'); $$('.pasang-app').forEach(x => x.classList.add('hide')); });
  },
  terpasang: () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone,
  ios: () => /iphone|ipad|ipod/i.test(navigator.userAgent),
  async pasang() {
    if (PWA.prompt) { PWA.prompt.prompt(); const r = await PWA.prompt.userChoice; if (r.outcome === 'accepted') PWA.prompt = null; return; }
    Modal.open(`${Modal.head('Pasang di HP', 'Buka seperti aplikasi biasa, lebih cepat & hemat kuota', 'phoneApp')}<div class="modal-b col">
      <div class="card flat"><b class="tx">${ic('phoneApp')} Android (Chrome)</b><p class="sm mt8">Ketuk menu <b>⋮</b> di pojok kanan atas → <b>Instal aplikasi</b> / <b>Tambahkan ke Layar utama</b>.</p></div>
      <div class="card flat"><b class="tx">${ic('phoneApp')} iPhone / iPad (Safari)</b><p class="sm mt8">Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas) → <b>Tambah ke Layar Utama</b> → <b>Tambah</b>.</p></div>
      ${PWA.terpasang() ? '<span class="bd ok">Aplikasi sudah terpasang di perangkat ini.</span>' : ''}</div>`, { size: 'sm' });
  }
};
ACT.pasang = () => PWA.pasang();
