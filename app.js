/* =====================================================================
   Kerangka aplikasi, login, siklus data (boot + SWR), tampilan bersama:
   materi, pengumuman, kelas live, lainnya/profil
   ===================================================================== */
'use strict';
const LOGO = '<svg viewBox="0 0 100 100" aria-hidden="true"><rect fill="#5B5BD6" height="12" rx="6" width="52" x="14" y="22"/><rect fill="#6366F1" height="12" rx="6" width="72" x="14" y="44"/><rect fill="#8B5CF6" height="12" rx="6" width="40" x="14" y="66"/><circle cx="76" cy="28" fill="#EC4899" r="6"/></svg>';
const liveSekarang = () => (B().live || []).filter(l => tms(l.mulai) <= sekarang() && tms(l.selesai) >= sekarang());

// ---------------------------------------------------------------- Kerangka
const Shell = {
  sig: '',
  menu() {
    const m = [{ id: 'beranda', l: isWali() ? 'Pantau Anak' : 'Beranda', i: 'home' }];
    if (isMurid()) {
      const sd = SD(), belum = sd ? sd.tugas.filter(t => !t.kumpul && tms(t.deadline) > sekarang()).length : 0;
      m.push({ id: 'kelas', l: 'Kelas Saya', i: 'users' }, { id: 'materi', l: 'Perpustakaan', i: 'book' }, { id: 'tugas', l: 'Tugas & Kuis', i: 'clipboard', cnt: belum },
        { id: 'live', l: 'Kelas Live', i: 'video', dot: liveSekarang().length > 0 }, { id: 'absensi', l: 'Presensi Saya', i: 'calendar' }, { id: 'nilai', l: 'Nilai & Rapor', i: 'award' }, { id: 'pengumuman', l: 'Pengumuman', i: 'megaphone' });
    }
    if (isWali()) {
      m.push({ id: 'tugas', l: 'Tugas Anak', i: 'clipboard' }, { id: 'absensi', l: 'Kehadiran', i: 'calendar' }, { id: 'nilai', l: 'Nilai & Rapor', i: 'award' });
      if (SET('WALI_LIHAT_CATATAN') === 'YA') m.push({ id: 'catatan', l: 'Catatan Sekolah', i: 'note' });
      m.push({ id: 'pengumuman', l: 'Pengumuman', i: 'megaphone' });
    }
    if (isGuru()) {
      m.push({ grp: 'Mengajar' }, { id: 'kelas', l: 'Kelas Saya', i: 'users' }, { id: 'materi', l: 'Materi', i: 'book' }, { id: 'tugas', l: 'Tugas & Kuis', i: 'clipboard' },
        { id: 'absensi', l: 'Absensi per Jam', i: 'userCheck' }, { id: 'nilai', l: 'Buku Nilai', i: 'award' }, { id: 'live', l: 'Kelas Live', i: 'video', dot: liveSekarang().length > 0 });
    }
    if (isWK()) m.push({ grp: 'Wali Kelas' }, { id: 'pantauan', l: 'Pantauan Kelas', i: 'chart' }, { id: 'catatan', l: 'Catatan Siswa', i: 'note' });
    if (isAdmin()) m.push({ grp: 'Administrasi' }, { id: 'data', l: 'Data Induk', i: 'database' }, { id: 'rekap', l: 'Rekap Absensi', i: 'calendar' }, { id: 'rapor', l: 'Rapor Siswa', i: 'award' },
      { id: 'notif', l: 'Notifikasi & CRM', i: 'wa' }, { id: 'migrasi', l: 'Migrasi & Impor', i: 'swap' }, { id: 'log', l: 'Log & Sesi', i: 'history' }, { id: 'pengaturan', l: 'Pengaturan', i: 'settings' });
    if (!isMurid() && !isWali()) m.push({ grp: 'Umum' }, { id: 'pengumuman', l: 'Pengumuman', i: 'megaphone' }, { id: 'laporan', l: 'Laporan', i: 'pie' });
    return m;
  },
  bawah() {
    const ids = isMurid() ? ['beranda', 'materi', 'tugas', 'nilai'] : isWali() ? ['beranda', 'tugas', 'absensi', 'nilai'] : isGuru() ? ['beranda', 'tugas', 'absensi', 'nilai'] : ['beranda', 'data', 'laporan', 'notif'];
    const all = Shell.menu().filter(x => x.id);
    return ids.map(id => all.find(x => x.id === id)).filter(Boolean).concat([{ id: 'lainnya', l: 'Lainnya', i: 'grid' }]);
  },
  pasang() {
    const menu = Shell.menu(), sig = JSON.stringify(menu) + U().nama;
    if ($('#view') && sig === Shell.sig) { Shell.atas(); return; }
    Shell.sig = sig;
    const nav = menu.map(x => x.grp ? `<div class="grp">${esc(x.grp)}</div>` :
      `<a href="#/${x.id}" data-nav="${x.id}">${ic(x.i)}<span>${esc(x.l)}</span>${x.dot ? '<i class="dot" aria-label="sedang berlangsung"></i>' : ''}${x.cnt ? `<b class="cnt">${x.cnt}</b>` : ''}</a>`).join('');
    ROOT().innerHTML = `<a class="sr" href="#view">Lewati ke konten</a>
    <div class="app"><aside class="side" aria-label="Navigasi utama"><div><div class="brand">${`<div class="logo">${LOGO}</div>`}<div><b>Spendas</b><span class="tag-lms">LMS</span><p class="xs mut2 sb">${esc(SET('NAMA_SEKOLAH') || 'SMP Negeri 1 Dasuk')}</p></div></div>
      <nav class="nav">${nav}</nav></div>
      <div class="help"><div class="ico">${ic('help')}</div><b class="tx sm">Butuh bantuan?</b><p class="xs mut" style="margin:4px 0 12px">${isWali() ? 'Hubungi wali kelas ananda.' : 'Hubungi wali kelas atau admin IT Spendas.'}</p><a class="btn p sm blk" href="#/lainnya">Pusat Bantuan ${ic('arrowR', 's')}</a></div></aside>
    <main class="main"><header class="top" id="topbar"></header><div id="view" class="col gap24" tabindex="-1"></div>
      <footer class="foot"><span>© ${wib(sekarang()).y} Portal Belajar Spendas · ${esc(SET('NAMA_SEKOLAH') || 'SMP Negeri 1 Dasuk')}</span><span>Sistem Manajemen Pembelajaran Digital · Powered by <b>hd.dsk</b></span></footer></main></div>
    <nav class="bnav" aria-label="Navigasi bawah">${Shell.bawah().map(x => `<a href="#/${x.id}" data-nav="${x.id}">${ic(x.i)}<span>${esc(x.l.split(' ')[0] === 'Tugas' ? 'Tugas' : x.l.replace('Perpustakaan', 'Materi').replace('Pantau Anak', 'Beranda').split(' ')[0])}</span></a>`).join('')}</nav>`;
    Shell.atas();
  },
  atas() {
    const live = liveSekarang(), lihat = LS.get('spd_pgm_lihat', 0), baru = (B().pengumuman || []).some(p => tms(p.waktu) > lihat);
    const u = U(), foto = LS.get('spd_foto', '');
    $('#topbar').innerHTML = `<div class="search"><label class="sr" for="cari-global">Cari</label>${ic('search')}<input id="cari-global" type="search" placeholder="${isWali() ? 'Cari tugas, mapel…' : isAdmin() && !isGuru() ? 'Cari siswa, guru, menu…' : 'Cari materi, tugas, kuis…'}" autocomplete="off" data-i="cari"><div class="sres hide" id="sres"></div></div>
      <div class="tb-act">${live.length ? `<a class="live-pill" href="#/live">${'<i></i>'}<span>Live Class Aktif</span></a>` : ''}
      <button class="ibtn pasang-app hide-m ${PWA.prompt && !PWA.terpasang() ? '' : 'hide'}" data-a="pasang" title="Pasang aplikasi" aria-label="Pasang aplikasi">${ic('phoneApp')}</button>
      <button class="ibtn" data-a="tema" title="Mode gelap/terang" aria-label="Ganti tema">${ic(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}</button>
      <button class="ibtn" data-a="lonceng" title="Pengumuman" aria-label="Pengumuman">${ic('bell')}${baru ? '<span class="badge-dot"></span>' : ''}</button>
      <a class="av" href="#/lainnya" title="${esc(u.nama)}" style="background:var(--${PASTEL[hashStr(u.nama) % 6]})">${foto ? `<img src="${esc(foto)}" alt="" referrerpolicy="no-referrer">` : esc(inisial(u.nama))}</a></div>`;
  },
  aktif() { $$('[data-nav]').forEach(a => { const on = a.dataset.nav === R.cur.path || (R.cur.path === 'buku' && a.dataset.nav === 'nilai') || (R.cur.path === 'kuis' && a.dataset.nav === 'tugas'); a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); }
};
ACT.lonceng = () => {
  const p = (B().pengumuman || []).slice(0, 12);
  LS.set('spd_pgm_lihat', sekarang()); Shell.atas();
  Modal.open(`${Modal.head('Pengumuman terbaru', '', 'megaphone')}<div class="modal-b col">${p.length ? p.map(kartuPengumuman).join('') : kosong('inbox', 'Belum ada pengumuman')}</div><div class="modal-f"><a class="btn soft" href="#/pengumuman">Lihat semua</a></div>`);
};

// ---------------------------------------------------------------- Pencarian global (instan, dari data lokal)
INP.cari = debounce(el => {
  const q = el.value.trim().toLowerCase(), box = $('#sres');
  if (q.length < 2) { box.classList.add('hide'); return; }
  const h = [], b = B(), sd = SD(), g = b.guru;
  Shell.menu().filter(x => x.id && x.l.toLowerCase().includes(q)).forEach(x => h.push({ i: x.i, t: x.l, s: 'Menu', go: '#/' + x.id }));
  const materi = (sd ? sd.materi : []).concat(g ? g.materi : []);
  materi.filter(m => (m.judul + ' ' + (m.deskripsi || '')).toLowerCase().includes(q)).slice(0, 6).forEach(m => h.push({ i: IKON_JENIS[m.jenis] || 'book', t: m.judul, s: 'Materi · ' + namaMapel(m.id_mapel), go: '#/materi?id=' + m.id_materi }));
  (sd ? sd.tugas : g ? g.tugas : []).filter(t => t.judul.toLowerCase().includes(q)).slice(0, 6).forEach(t => h.push({ i: 'clipboard', t: t.judul, s: 'Tugas · ' + namaMapel(t.id_mapel), go: sd ? '#/tugas/' + t.id_tugas : '#/buku/' + t.id_mapel + '?t=' + t.id_tugas }));
  (sd ? sd.kuis : g ? g.kuis : []).filter(k => k.judul.toLowerCase().includes(q)).slice(0, 4).forEach(k => h.push({ i: 'timer', t: k.judul, s: 'Kuis · ' + namaMapel(k.id_mapel), go: sd && isMurid() ? '#/kuis/' + k.id_kuis : '#/tugas?tab=kuis' }));
  const siswa = b.admin ? b.admin.siswa : g ? g.siswa : [];
  siswa.filter(s => (s.nama + ' ' + s.nis).toLowerCase().includes(q)).slice(0, 6).forEach(s => h.push({ i: 'user', t: s.nama, s: 'Siswa · NIS ' + s.nis, go: isWK() ? '#/pantauan?s=' + s.id_siswa : '#/rapor?s=' + s.id_siswa }));
  box.innerHTML = h.length ? h.slice(0, 14).map((x, i) => `<a href="${x.go}" class="${i ? '' : 'on'}"><span class="sq ungu" style="width:32px;height:32px;border-radius:10px">${ic(x.i, 's')}</span><span class="grow"><b class="tx sm trunc" style="display:block">${esc(x.t)}</b><span class="xs mut">${esc(x.s)}</span></span></a>`).join('') : `<p class="sm mut" style="padding:10px">Tidak ditemukan "${esc(q)}".</p>`;
  box.classList.remove('hide');
}, 80);
document.addEventListener('click', e => { if (!e.target.closest('.search')) { const b = $('#sres'); if (b) b.classList.add('hide'); } else if (e.target.closest('#sres a')) { $('#sres').classList.add('hide'); $('#cari-global').value = ''; } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'cari-global') { const a = $('#sres a'); if (a) { a.click(); location.hash = a.getAttribute('href'); } } if (e.key === '/' && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) { const s = $('#cari-global'); if (s) { e.preventDefault(); s.focus(); } } });

// ---------------------------------------------------------------- Login
const Login = {
  tab: 'google', tahap: 'nomor', noWa: '',
  render() {
    if (Store.token && !Store.boot) { ROOT().innerHTML = `<div class="boot"><div class="col" style="align-items:center"><div class="logo">${LOGO}</div><p class="sm mut b">Menyiapkan ruang belajar…</p></div></div>`; return; }
    Shell.sig = '';
    const sekolah = esc(SET('NAMA_SEKOLAH') || 'SMP Negeri 1 Dasuk');
    ROOT().innerHTML = `<div class="login"><div class="login-card">
      <section class="login-art"><span class="ring" style="width:220px;height:220px;top:-70px;left:-60px"></span><span class="ring" style="width:340px;height:340px;bottom:-150px;right:-120px"></span>
        <div class="row" style="gap:12px;position:relative"><div class="logo" style="background:#fff">${LOGO}</div><div><b style="font-size:20px">Spendas</b> <span class="tag-lms" style="background:rgba(255,255,255,.2);color:#fff">LMS</span><p class="xs" style="opacity:.85">${sekolah}</p></div></div>
        <div style="position:relative"><h1>Portal Belajar<br>Spendas</h1><p style="opacity:.88;margin-top:10px;max-width:380px">Materi, tugas, kuis, presensi per jam pelajaran, dan rapor dalam satu tempat — untuk murid, guru, wali kelas, dan wali murid.</p>
          <div class="col feat mt24" style="gap:10px">${[['book', 'Perpustakaan materi & tugas terstruktur'], ['userCheck', 'Presensi per jam & rekap otomatis'], ['wa', 'Notifikasi WhatsApp untuk wali murid']].map(f => `<div class="row sm" style="opacity:.95">${ic(f[0])}<span>${f[1]}</span></div>`).join('')}</div></div>
        <div class="row" style="position:relative;justify-content:space-between;align-items:flex-end"><div class="ill" style="transform:scale(.8);transform-origin:left bottom"><div class="bk b1"></div><div class="bk b2"></div><div class="bk b3"></div><div class="gl"><span></span><i></i><span></span></div></div><span class="xs" style="opacity:.8">Powered by <b>hd.dsk</b></span></div></section>
      <section class="login-form" id="login-form">${Login.form()}</section></div></div>`;
    if (Login.tab === 'google') Login.pasangGoogle();
  },
  form() {
    const demo = window.DEMO ? `<div class="card flat col" style="gap:10px;border:1.5px dashed var(--p-200)"><div class="row"><span class="bd ungu">${ic('sparkles')}MODE DEMO</span><span class="xs mut">Data contoh, berjalan di browser</span></div>
      <div class="demo-roles">${window.DEMO.peran.map(p => `<button data-a="demo-masuk" data-p="${p.id}">${avatar(p.nama, 'sm')}<span class="grow"><b class="tx" style="display:block">${esc(p.label)}</b><span class="xs mut">${esc(p.nama)}</span></span></button>`).join('')}</div></div><div class="divider">atau coba alur asli</div>` : '';
    const tabs = `<div class="seg" role="tablist"><button role="tab" class="${Login.tab === 'google' ? 'on' : ''}" data-a="login-tab" data-t="google">Murid · Guru · Admin</button><button role="tab" class="${Login.tab === 'wali' ? 'on' : ''}" data-a="login-tab" data-t="wali">Wali Murid</button></div>`;
    let isi;
    if (Login.tab === 'google') isi = `<div class="col"><p class="sm mut">Masuk dengan akun Google sekolah (belajar.id) atau Gmail yang didaftarkan admin.</p><div class="gbtn-wrap" id="gbtn"><span class="spin p"></span></div><p class="xs mut2 center" id="gbtn-info"></p></div>`;
    else if (Login.tahap === 'nomor') isi = `<form class="col" data-f="wali-minta"><div class="fld"><label for="no_wa">Nomor WhatsApp wali murid</label><input class="inp" id="no_wa" name="no_wa" inputmode="tel" autocomplete="tel" placeholder="0812xxxxxxxx" value="${esc(Login.noWa)}" required><span class="hint">Nomor yang terdaftar di sekolah. Kami kirim tautan & kode masuk lewat WhatsApp.</span></div><button class="btn p blk">${ic('wa')} Kirim tautan masuk</button></form>`;
    else isi = `<form class="col" data-f="wali-kode"><div class="card flat sm">${ic('wa')} Bila nomor terdaftar, tautan & <b>kode 6 digit</b> telah dikirim ke WhatsApp <b>${esc(Login.noWa)}</b>. Ketuk tautannya, atau ketik kodenya di sini.</div><div class="fld"><label for="kode">Kode masuk</label><input class="inp" id="kode" name="kode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••" style="font-size:22px;letter-spacing:.4em;text-align:center;font-weight:800" required></div><button class="btn p blk">${ic('logIn')} Masuk</button><button type="button" class="btn ghost sm" data-a="wali-ulang">Ganti nomor / kirim ulang</button></form>`;
    return `<div><h2 style="font-size:24px">Selamat datang 👋</h2><p class="mut mt8">Masuk untuk melanjutkan ke ${esc(SET('NAMA_APLIKASI') || 'Portal Belajar Spendas')}.</p></div>${demo}${tabs}${isi}
      <div class="row sb2 xs mut2"><button class="btn ghost xs" data-a="darurat">${ic('key', 's')} Akses darurat admin</button><span>v${APPV}</span></div>`;
  },
  ulang() { $('#login-form').innerHTML = Login.form(); if (Login.tab === 'google') Login.pasangGoogle(); },
  async pasangGoogle() {
    const el = $('#gbtn'), info = $('#gbtn-info'); if (!el) return;
    if (window.DEMO) { el.innerHTML = `<button class="btn w blk" data-a="demo-google">${ic('logIn')} Masuk dengan Google (simulasi demo)</button>`; return; }
    try {
      const cfg = await API.call('auth.config', {}, { ttl: 600000 });
      if (!cfg.clientId) { el.innerHTML = ''; info.innerHTML = 'Login Google belum dikonfigurasi. Admin: masuk lewat <b>Akses darurat</b> lalu isi Google Client ID di Pengaturan.'; return; }
      await Ekspor.muat('https://accounts.google.com/gsi/client');
      google.accounts.id.initialize({ client_id: cfg.clientId, callback: r => Login.google(r.credential), ux_mode: 'popup', itp_support: true, cancel_on_tap_outside: true });
      el.innerHTML = ''; google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'id', width: Math.min(340, (el.clientWidth || 320)) });
    } catch (e) { el.innerHTML = `<button class="btn w" data-a="login-ulang">${ic('refresh')} Coba lagi</button>`; info.textContent = e.message; }
  },
  async google(cred) { const el = $('#gbtn'); if (el) el.innerHTML = '<span class="spin p"></span>'; try { App.masuk(await API.call('auth.google', { credential: cred })); } catch (e) { salah(e); Login.pasangGoogle(); } },
  async masukLink(t) {
    ROOT().innerHTML = `<div class="boot"><div class="col" style="align-items:center"><div class="logo">${LOGO}</div><p class="sm mut b">Memeriksa tautan masuk…</p></div></div>`;
    try { const r = await API.call('auth.waliMasuk', { t }); history.replaceState(null, '', location.pathname + '#/beranda'); App.masuk(r); }
    catch (e) { history.replaceState(null, '', location.pathname + '#/'); Store.bersih(); Login.tab = 'wali'; Login.tahap = 'nomor'; R.render(); salah(e); }
  }
};
ACT['login-tab'] = el => { Login.tab = el.dataset.t; Login.ulang(); };
ACT['login-ulang'] = () => Login.pasangGoogle();
ACT['wali-ulang'] = () => { Login.tahap = 'nomor'; Login.ulang(); };
FRM['wali-minta'] = (f) => sibuk($('button', f), async () => { Login.noWa = formData(f).no_wa; await API.call('auth.waliMinta', { no_wa: Login.noWa }); Login.tahap = 'kode'; Login.ulang(); }, 'Mengirim…');
FRM['wali-kode'] = (f) => sibuk($('button', f), async () => App.masuk(await API.call('auth.waliMasuk', { no_wa: Login.noWa, kode: formData(f).kode })), 'Memeriksa…');
ACT.darurat = () => {
  Modal.open(`${Modal.head('Akses darurat admin', 'Gunakan hanya bila login Google belum siap', 'key')}<form class="modal-b col" data-f="darurat"><div class="fld"><label>Username</label><input class="inp" name="user" value="darurat" autocomplete="username"></div><div class="fld"><label>Sandi darurat</label><input class="inp" name="pass" type="password" autocomplete="current-password" required><span class="hint">Sandi tampil sekali di Log eksekusi saat setupAppEnvironment(). Lupa? jalankan resetAksesDarurat() di editor Apps Script.</span></div><button class="btn p">${ic('logIn')} Masuk</button></form>`, { size: 'sm' });
};
FRM.darurat = f => sibuk($('button', f), async () => { const r = await API.call('auth.darurat', formData(f)); Modal.close(); App.masuk(r); });
ACT['demo-masuk'] = el => sibuk(el, async () => App.masuk(await window.DEMO.masuk(el.dataset.p)));
ACT['demo-google'] = () => toast('Mode demo: pilih salah satu peran di atas untuk masuk.', 'warn');

// ---------------------------------------------------------------- Siklus aplikasi
const App = {
  terakhir: 0,
  async mulai() {
    const t = LS.get('spd_tema', window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = t;
    PWA.init();
    if (!API.siap()) { ROOT().innerHTML = `<div class="login"><div class="card l col" style="max-width:520px"><span class="sq A lg">${ic('alert', 'l')}</span><h2>Alamat backend belum diisi</h2><p class="mut">Buka berkas <b>js/config.js</b>, isi <code>GAS_URL</code> dengan URL Web App Apps Script (berakhiran <code>/exec</code>), lalu unggah ulang ke GitHub.</p></div></div>`; return; }
    if (!window.DEMO) fetch(API.url() + '?action=ping', { cache: 'no-store' }).catch(() => { });   // bangunkan server (warm-up)
    Store.muat();
    R.render();
    if (Store.token) App.segarkan(true);
    setInterval(() => { if (document.visibilityState === 'visible' && Store.token && Date.now() - App.terakhir > 180e3) App.segarkan(); }, 30e3);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Store.token && Date.now() - App.terakhir > 60e3) App.segarkan(); });
    window.addEventListener('online', () => { $$('.offline').forEach(x => x.remove()); if (Store.token) App.segarkan(); });
    window.addEventListener('offline', () => { const d = document.createElement('div'); d.className = 'offline'; d.innerHTML = ic('offline', 's') + ' Offline — menampilkan data terakhir'; document.body.appendChild(d); });
    document.addEventListener('focusout', () => setTimeout(() => { if (R.tunda && !Modal.stack.length) R.segarkan(); }, 300));
  },
  /** SWR: tampilkan data lokal, ambil boot terbaru di latar, render ulang bila berubah. */
  async segarkan(awal) {
    App.terakhir = Date.now();
    try {
      const b = await API.call('boot');
      const beda = JSON.stringify(Store.boot) !== JSON.stringify(b);
      Store.simpanBoot(b);
      if (beda || awal) R.segarkan();
      return b;
    } catch (e) {
      if (e.code === 'SESI') return;
      if (!Store.boot) ROOT().innerHTML = `<div class="login"><div class="card l col center" style="max-width:460px;align-items:center"><span class="sq A lg">${ic('offline', 'l')}</span><h2>Belum bisa terhubung</h2><p class="mut">${esc(e.message)}</p><button class="btn p" onclick="location.reload()">${ic('refresh')} Coba lagi</button></div></div>`;
      else if (awal) toast(e.message, 'warn');
    }
  },
  async masuk(res) {
    Store.token = res.token; LS.set('spd_tok', res.token);
    if (res.user && res.user.foto) LS.set('spd_foto', res.user.foto); else LS.del('spd_foto');
    Store.boot = null; Store.anak = 0; R.render();
    const b = await App.segarkan(true);
    if (b) { if (!location.hash || location.hash === '#/' || /masuk/.test(location.hash)) location.hash = '#/beranda'; else R.render(); toast('Selamat datang, ' + b.user.nama + '!'); }
  },
  sesiHabis(msg) { const ada = !!Store.token; Store.bersih(); Shell.sig = ''; R.render(); if (ada) toast(msg || 'Sesi berakhir. Silakan masuk kembali.', 'warn'); },
  keluar() { $$('.toast').forEach(t => t.remove()); Store.bersih(); LS.del('spd_foto'); Shell.sig = ''; try { window.google && google.accounts.id.disableAutoSelect(); } catch (e) { } history.replaceState(null, '', location.pathname + '#/'); R.render(); }
};
ACT.keluar = async () => { if (await Modal.konfirmasi('Keluar dari aplikasi?', 'Data tersimpan di perangkat ini akan dihapus.', { ok: 'Keluar' })) App.keluar(); };
ACT['keluar-semua'] = async () => { if (!(await Modal.konfirmasi('Keluar dari semua perangkat?', 'Semua sesi akun ini (HP, laptop lain) akan diakhiri.', { ok: 'Keluar semua', bahaya: true }))) return; try { await API.call('auth.keluarSemua'); } catch (e) { } App.keluar(); };
ACT.segarkan = el => sibuk(el, async () => { await App.segarkan(); toast('Data diperbarui.'); });

// ---------------------------------------------------------------- Beranda (dispatcher)
R.def('beranda', () => isMurid() ? V.berandaMurid() : isWali() ? V.berandaWali() : isGuru() ? V.berandaGuru() : V.berandaAdmin());
const V = {};
const hero = (judul, sub, pill, tombol, ilustrasi) => `<section class="hero ${ilustrasi === false ? 'sm' : ''}">
  <span class="ring" style="width:140px;height:140px;top:-50px;left:-30px;opacity:.6"></span><span class="ring" style="width:260px;height:260px;bottom:-110px;right:-70px;opacity:.5"></span><span class="ring" style="width:320px;height:320px;top:50%;left:34%;transform:translateY(-50%);opacity:.35"></span>
  ${ilustrasi === false ? '' : '<div class="ill"><div class="bk b1"></div><div class="bk b2"></div><div class="bk b3"></div><div class="gl"><span></span><i></i><span></span></div></div>'}
  <div class="txt">${pill ? `<span class="pill">${pill}</span>` : ''}<h1>${judul}</h1>${sub ? `<p>${sub}</p>` : ''}${tombol ? `<div class="row w mt16">${tombol}</div>` : ''}</div>
  ${ilustrasi === false ? '' : '<div class="shelf"><div class="bks"><span style="height:64px;background:#D8B4FE"></span><span style="height:80px;background:#6366F1"></span><span style="height:50px;background:#F472B6;transform:rotate(6deg)"></span><span style="height:58px;background:#67E8F9"></span></div><div class="base"></div><div class="legs"><i></i><i></i></div></div>'}</section>`;
const secH = (judul, sub, link, label) => `<div class="sec-h"><div><h2>${judul}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${link ? `<a class="see" href="${link}">${label || 'LIHAT SEMUA'} ${ic('arrowR', 's')}</a>` : ''}</div>`;
const kartuPengumuman = p => `<div class="card flat" style="padding:14px"><div class="row sb2"><span class="bd ${p.penting ? 'bad' : 'ungu'}">${ic(p.penting ? 'alert' : 'megaphone')}${p.penting ? 'Penting' : esc(p.kelas || 'Info')}</span><span class="xs mut">${esc(relatif(p.waktu))}</span></div><h4 class="mt8">${esc(p.judul)}</h4><p class="sm mt8" style="white-space:pre-line">${esc(p.isi)}</p><p class="xs mut mt8">— ${esc(p.nama_pengirim || '')}</p></div>`;

// ---------------------------------------------------------------- Materi (perpustakaan) — bersama murid & guru
R.def('materi', r => {
  const sd = SD(), g = B().guru, guru = !sd && g;
  if (!sd && !g) return kosong('book', 'Menu materi untuk murid & guru');
  const st = Store.v.materi = Object.assign({ m: '', t: 'semua', q: '' }, Store.v.materi || {});
  const mapel = sd ? sd.mapel : g.mapel;
  if (r.q.id) setTimeout(() => ACT.materi({ dataset: { id: r.q.id } }), 0);
  return `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Perpustakaan Materi</b></div><h1>${guru ? 'Materi Pelajaran' : 'Perpustakaan Materi'}</h1><p class="mut mt8">${guru ? 'Unggah dokumen, tautkan video YouTube/Drive, atur status terbit.' : 'Video, dokumen, dan presentasi dari guru mapel. Tandai materi yang sedang dipelajari.'}</p></div>
    ${guru ? `<button class="btn p" data-a="materi-form">${ic('plus')} Tambah Materi</button>` : ''}</div>
    <div class="card" style="padding:14px"><div class="row w" style="gap:10px"><div class="search" style="max-width:320px">${ic('search')}<input type="search" placeholder="Cari judul materi…" value="${esc(st.q)}" data-i="materi-cari" aria-label="Cari materi" style="height:40px"></div>
      <select class="sel pill" style="width:auto" data-c="materi-mapel" aria-label="Filter mapel"><option value="">Semua mata pelajaran</option>${mapel.map(m => `<option value="${esc(m.id_mapel)}" ${st.m === m.id_mapel ? 'selected' : ''}>${esc(m.nama_mapel)}${guru ? ' · ' + esc(m.kelas) : ''}</option>`).join('')}</select>
      ${guru ? '' : `<div class="seg">${[['semua', 'Semua'], ['dipelajari', 'Sedang dipelajari'], ['selesai', 'Selesai'], ['baru', 'Belum dibuka']].map(x => `<button class="${st.t === x[0] ? 'on' : ''}" data-a="materi-tab" data-t="${x[0]}">${x[1]}</button>`).join('')}</div>`}</div></div>
    <div id="materi-grid">${V.gridMateri()}</div>`;
});
V.gridMateri = () => {
  const sd = SD(), g = B().guru, st = Store.v.materi;
  let list = (sd ? sd.materi : g.materi).map(m => Object.assign({ nama_mapel: namaMapel(m.id_mapel) }, m));
  if (st.m) list = list.filter(m => m.id_mapel === st.m);
  if (st.q) list = list.filter(m => (m.judul + ' ' + m.deskripsi).toLowerCase().includes(st.q.toLowerCase()));
  if (sd && st.t !== 'semua') list = list.filter(m => st.t === 'baru' ? !m.progres : m.progres === st.t);
  list = urut(list, m => tms(m.tanggal_terbit) || 0, -1);
  return list.length ? `<div class="gridc">${list.map(m => kartuMateri(m, { tanpaProg: !sd, meta: g && !sd ? (mapelById(m.id_mapel) || {}).kelas + ' · ' + (m.status === 'draf' ? 'Draf' : 'Terbit ' + fTgl(m.tanggal_terbit)) : '' })).join('')}</div>` : kosong('book', 'Belum ada materi', st.q || st.m ? 'Coba ubah filter.' : g && !sd ? 'Klik "Tambah Materi" untuk mulai.' : 'Guru belum menerbitkan materi.');
};
INP['materi-cari'] = debounce(el => { Store.v.materi.q = el.value; $('#materi-grid').innerHTML = V.gridMateri(); }, 100);
CHG['materi-mapel'] = el => { Store.v.materi.m = el.value; $('#materi-grid').innerHTML = V.gridMateri(); };
ACT['materi-tab'] = el => { Store.v.materi.t = el.dataset.t; $$('[data-a=materi-tab]').forEach(b => b.classList.toggle('on', b === el)); $('#materi-grid').innerHTML = V.gridMateri(); };

ACT.materi = el => {
  const sd = SD(), g = B().guru, id = el.dataset.id;
  const m = (sd ? sd.materi : []).concat(g ? g.materi : []).find(x => x.id_materi === id);
  if (!m) return toast('Materi tidak ditemukan.', 'warn');
  const mp = mapelById(m.id_mapel) || {}, pemilik = g && g.mapel.some(x => x.id_mapel === m.id_mapel), emb = urlEmbed(m.tautan);
  if (isMurid() && !m.progres) { m.progres = 'dibuka'; API.call('materi.progres', { id_materi: id, status: 'dibuka' }).catch(() => { }); }
  Modal.open(`${Modal.head(esc(m.judul), esc((mp.nama_mapel || '') + ' · ' + (mp.guru || '') + ' · ' + fTgl(m.tanggal_terbit)), IKON_JENIS[m.jenis] || 'book')}
    <div class="modal-b col gap16">
      ${emb ? `<div style="position:relative;padding-top:56.25%;border-radius:16px;overflow:hidden;background:#000"><iframe src="${esc(emb)}" title="${esc(m.judul)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>` : ''}
      <a class="file-it" href="${esc(m.tautan)}" target="_blank" rel="noopener"><span class="sq ungu">${ic(ikonTautan(m.tautan))}</span><span class="grow"><b class="tx trunc" style="display:block">${esc(labelTautan(m.tautan))}</b><span class="xs mut">Buka di tab baru</span></span>${ic('external')}</a>
      ${m.deskripsi ? `<p style="white-space:pre-line">${esc(m.deskripsi)}</p>` : ''}
      ${isMurid() ? `<div class="row w"><button class="btn ${m.progres === 'dipelajari' ? 'p' : 'soft'}" data-a="progres" data-id="${esc(id)}" data-s="dipelajari">${ic('bookmark')} Sedang dipelajari</button><button class="btn ${m.progres === 'selesai' ? 'p' : 'ok'}" data-a="progres" data-id="${esc(id)}" data-s="selesai">${ic('checkCircle')} Tandai selesai</button></div>` : ''}
      ${pemilik ? `<div class="row w"><button class="btn soft" data-a="materi-form" data-id="${esc(id)}">${ic('edit')} Ubah</button><button class="btn bad" data-a="materi-hapus" data-id="${esc(id)}">${ic('trash')} Hapus</button><span class="bd ${m.status === 'draf' ? 'warn' : 'ok'}">${m.status === 'draf' ? 'Draf (tidak terlihat murid)' : 'Terbit'}</span></div>` : ''}
      <div><h3 class="row">${ic('chat')} Tanya-jawab</h3><div id="kmn" class="col mt12" style="gap:10px"><div class="sk" style="height:56px"></div></div>
      ${isWali() ? '' : `<form class="row mt12" data-f="kmn" data-id="${esc(id)}" style="align-items:flex-end"><input type="hidden" name="id_balasan" value=""><div class="grow col gap4"><span class="xs mut hide" id="kmn-balas"></span><textarea class="ta" name="isi" rows="2" placeholder="Tulis pertanyaan atau komentar…" style="min-height:48px" required></textarea></div><button class="btn p ico" aria-label="Kirim">${ic('send')}</button></form>`}</div>
    </div>`, { size: 'lg', fokus: false });
  Komentar.muat(id);
};
const Komentar = {
  id: '',
  async muat(id) {
    Komentar.id = id;
    const c = API.cached('komentar.list', { id_materi: id });
    if (c) Komentar.render(c);
    try { Komentar.render(await API.call('komentar.list', { id_materi: id })); } catch (e) { const el = $('#kmn'); if (el) el.innerHTML = `<p class="sm mut">${esc(e.message)}</p>`; }
  },
  render(list) {
    const el = $('#kmn'); if (!el) return;
    const g = B().guru, m = (g ? g.materi : []).find(x => x.id_materi === Komentar.id), boleh = isAdmin() || (g && m && g.mapel.some(x => x.id_mapel === m.id_mapel));
    const akar = list.filter(k => !k.id_balasan);
    const satu = (k, bls) => `<div class="row top" style="${bls ? 'margin-left:44px' : ''}">${avatar(k.nama, 'sm')}<div class="grow"><div class="card flat" style="padding:10px 12px;border-radius:14px;${k.guru ? 'background:var(--p-50)' : ''}"><div class="row sb2"><b class="tx sm">${esc(k.nama)} ${k.guru ? '<span class="bd ungu" style="padding:0 7px">Guru</span>' : ''}</b><span class="xs mut">${esc(relatif(k.waktu))}</span></div><p class="sm mt8" style="white-space:pre-line">${esc(k.isi)}</p></div>
      <div class="row xs" style="gap:4px;margin-top:2px">${!bls && !isWali() ? `<button class="btn ghost xs" data-a="kmn-balas" data-id="${esc(k.id_komentar)}" data-n="${esc(k.nama)}">${ic('reply', 's')} Balas</button>` : ''}${boleh ? `<button class="btn ghost xs" data-a="kmn-hapus" data-id="${esc(k.id_komentar)}">${ic('trash', 's')} Hapus</button>` : ''}</div></div></div>`;
    el.innerHTML = akar.length ? akar.map(k => satu(k) + list.filter(x => x.id_balasan === k.id_komentar).map(x => satu(x, true)).join('')).join('') : `<p class="sm mut">Belum ada pertanyaan. Jadilah yang pertama bertanya!</p>`;
  }
};
FRM.kmn = f => sibuk($('button', f), async () => { const d = formData(f); Komentar.render(await API.call('komentar.tambah', { id_materi: f.dataset.id, isi: d.isi, id_balasan: d.id_balasan })); f.reset(); $('[name=id_balasan]', f).value = ''; $('#kmn-balas').classList.add('hide'); });
ACT['kmn-balas'] = el => { const f = $('form[data-f=kmn]'); $('[name=id_balasan]', f).value = el.dataset.id; const s = $('#kmn-balas'); s.innerHTML = 'Membalas <b>' + esc(el.dataset.n) + '</b> · <a href="#" data-a="kmn-batal">batal</a>'; s.classList.remove('hide'); $('textarea', f).focus(); };
ACT['kmn-batal'] = () => { $('[name=id_balasan]').value = ''; $('#kmn-balas').classList.add('hide'); };
ACT['kmn-hapus'] = async el => { if (await Modal.konfirmasi('Hapus komentar?', 'Balasan di bawahnya ikut terhapus.', { ok: 'Hapus', bahaya: true })) { try { Komentar.render(await API.call('komentar.hapus', { id_komentar: el.dataset.id })); } catch (e) { salah(e); } } };
ACT.progres = el => {
  const m = SD().materi.find(x => x.id_materi === el.dataset.id), lama = m.progres;
  m.progres = el.dataset.s; LS.set('spd_boot', Store.boot);
  $$('[data-a=progres]').forEach(b => { const on = b.dataset.s === m.progres; b.className = 'btn ' + (on ? 'p' : b.dataset.s === 'selesai' ? 'ok' : 'soft'); });
  toast(m.progres === 'selesai' ? 'Materi ditandai selesai. Hebat!' : 'Ditandai sedang dipelajari.');
  API.call('materi.progres', { id_materi: m.id_materi, status: m.progres }).catch(e => { m.progres = lama; salah(e); });
  if ($('#materi-grid')) $('#materi-grid').innerHTML = V.gridMateri();
};

// ---------------------------------------------------------------- Pengumuman
R.def('pengumuman', () => {
  const p = B().pengumuman || [], bolehBuat = isGuru() || isWK() || isAdmin();
  LS.set('spd_pgm_lihat', sekarang());
  return `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Pengumuman</b></div><h1>Pengumuman</h1><p class="mut mt8">Informasi sekolah & kelas.</p></div>${bolehBuat ? `<button class="btn p" data-a="pgm-form">${ic('plus')} Buat Pengumuman</button>` : ''}</div>
    <div class="grid3" style="align-items:start">${p.length ? p.map(x => `<div>${kartuPengumuman(x).replace('class="card flat"', 'class="card"')}${bolehBuat && (isAdmin() || x.pengirim === U().email) ? `<div class="row" style="justify-content:flex-end;margin-top:6px"><button class="btn ghost xs" data-a="pgm-form" data-id="${esc(x.id_pengumuman)}">${ic('edit', 's')} Ubah</button><button class="btn ghost xs" data-a="pgm-hapus" data-id="${esc(x.id_pengumuman)}">${ic('trash', 's')} Hapus</button></div>` : ''}</div>`).join('') : `<div class="card" style="grid-column:1/-1">${kosong('megaphone', 'Belum ada pengumuman')}</div>`}</div>`;
});
ACT['pgm-form'] = el => {
  const id = el.dataset && el.dataset.id, x = id ? (B().pengumuman || []).find(p => p.id_pengumuman === id) : {};
  const kelas = isAdmin() ? (B().admin || {}).kelas || [] : (B().guru || {}).kelas || [];
  const bolehWA = isAdmin() || isWK();
  Modal.open(`${Modal.head(id ? 'Ubah pengumuman' : 'Buat pengumuman', '', 'megaphone')}<form class="modal-b col" data-f="pgm" data-id="${esc(id || '')}">
    <div class="fld"><label>Judul</label><input class="inp" name="judul" value="${esc(x.judul || el.dataset.judul || '')}" maxlength="150" required></div>
    <div class="fld"><label>Isi pengumuman</label><textarea class="ta" name="isi" rows="5" maxlength="3000" required>${esc(x.isi || '')}</textarea></div>
    <div class="f2"><div class="fld"><label>Ditujukan untuk</label><select class="sel" name="target_peran">${[['semua', 'Semua (murid & wali)'], ['murid', 'Murid'], ['wali', 'Wali murid']].concat(isAdmin() ? [['guru', 'Guru']] : []).map(o => `<option value="${o[0]}" ${x.target_peran === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
    <div class="fld"><label>Kelas</label><select class="sel" name="target_kelas">${isAdmin() ? '<option value="">Semua kelas</option>' : ''}${kelas.map(k => `<option value="${esc(k.id_kelas)}" ${x.target_kelas === k.id_kelas || el.dataset.kelas === k.id_kelas ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select></div></div>
    <label class="chk"><input type="checkbox" name="penting" ${x.penting || el.dataset.penting ? 'checked' : ''}><span><b class="tx">Tandai penting</b><br><span class="xs mut">Ditampilkan menonjol di beranda.</span></span></label>
    ${bolehWA ? `<label class="chk"><input type="checkbox" name="kirimWA" ${el.dataset.penting ? 'checked' : ''}><span><b class="tx">Kirim WhatsApp ke wali murid</b><br><span class="xs mut">Hanya untuk pengumuman penting; masuk antrean & dikirim bertahap.</span></span></label>` : ''}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('send')} Simpan</button></div></form>`);
};
FRM.pgm = f => sibuk($('button.p', f), async () => {
  const d = formData(f); if (f.dataset.id) d.id_pengumuman = f.dataset.id;
  if (d.kirimWA && !d.penting) d.penting = true;
  const r = await API.call('pengumuman.simpan', d); Modal.close(); toast('Pengumuman tersimpan' + (r.antri ? ' · ' + r.antri + ' pesan WA diantrikan' : '') + '.'); await App.segarkan();
});
ACT['pgm-hapus'] = async el => { if (await Modal.konfirmasi('Hapus pengumuman?', 'Tindakan ini tidak dapat dibatalkan.', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { await API.call('pengumuman.hapus', { id_pengumuman: el.dataset.id }); toast('Pengumuman dihapus.'); await App.segarkan(); }); };

// ---------------------------------------------------------------- Kelas Live
R.def('live', () => {
  const l = B().live || [], g = B().guru, now = sekarang();
  const kartu = x => { const on = tms(x.mulai) <= now && tms(x.selesai) >= now, lewat = tms(x.selesai) < now; return `<div class="card col"><div class="row sb2">${on ? '<span class="live-pill"><i></i>Sedang berlangsung</span>' : lewat ? '<span class="bd belum">Selesai</span>' : `<span class="bd ungu">${ic('calendar')}${esc(relatif(x.mulai))}</span>`}<span class="xs mut">${esc(x.kelas)}</span></div>
    <div><h3>${esc(x.judul)}</h3><p class="sm mut mt8">${esc(x.nama_mapel)} · ${esc(fHari(x.mulai))}, ${fJam(x.mulai)}–${fJam(x.selesai)} WIB</p></div>
    <div class="row w">${lewat ? '' : `<a class="btn ${on ? 'p' : 'soft'}" href="${esc(x.tautan)}" target="_blank" rel="noopener">${ic('video')} ${on ? 'Gabung sekarang' : 'Buka tautan'}</a>`}${g && g.mapel.some(m => m.id_mapel === x.id_mapel) ? `<button class="btn ghost sm" data-a="live-form" data-id="${esc(x.id_live)}">${ic('edit', 's')} Ubah</button><button class="btn ghost sm" data-a="live-hapus" data-id="${esc(x.id_live)}">${ic('trash', 's')}</button>` : ''}</div></div>`; };
  return `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Kelas Live</b></div><h1>Kelas Langsung (Live)</h1><p class="mut mt8">Tautan Google Meet / Zoom dari guru mapel.</p></div>${g && g.mapel.length ? `<button class="btn p" data-a="live-form">${ic('plus')} Jadwalkan Kelas Live</button>` : ''}</div>
    <div class="grid3">${l.length ? urut(l, x => tms(x.mulai)).map(kartu).join('') : `<div class="card" style="grid-column:1/-1">${kosong('video', 'Tidak ada kelas live terjadwal')}</div>`}</div>`;
});
ACT['live-form'] = el => {
  const id = el.dataset.id, x = id ? (B().live || []).find(l => l.id_live === id) : {}, now = sekarang();
  const v = s => s ? String(s).replace(' ', 'T').slice(0, 16) : '';
  Modal.open(`${Modal.head(id ? 'Ubah kelas live' : 'Jadwalkan kelas live', '', 'video')}<form class="modal-b col" data-f="live" data-id="${esc(id || '')}">
    <div class="fld"><label>Mata pelajaran</label><select class="sel" name="id_mapel">${mapelSaya().map(m => `<option value="${esc(m.id_mapel)}" ${x.id_mapel === m.id_mapel ? 'selected' : ''}>${esc(m.nama_mapel)} · ${esc(m.kelas)}</option>`).join('')}</select></div>
    <div class="fld"><label>Judul sesi</label><input class="inp" name="judul" value="${esc(x.judul || '')}" required></div>
    <div class="fld"><label>Tautan Google Meet / Zoom</label><input class="inp" name="tautan" type="url" placeholder="https://meet.google.com/…" value="${esc(x.tautan || '')}" required></div>
    <div class="f2"><div class="fld"><label>Mulai</label><input class="inp" type="datetime-local" name="mulai" value="${v(x.mulai) || tglKey(now) + 'T' + p2(wib(now).h + 1) + ':00'}" required></div><div class="fld"><label>Selesai</label><input class="inp" type="datetime-local" name="selesai" value="${v(x.selesai) || tglKey(now) + 'T' + p2(wib(now).h + 2) + ':00'}" required></div></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('save')} Simpan</button></div></form>`);
};
FRM.live = f => sibuk($('button.p', f), async () => { const d = formData(f); if (f.dataset.id) d.id_live = f.dataset.id; await API.call('live.simpan', d); Modal.close(); toast('Jadwal kelas live tersimpan.'); await App.segarkan(); });
ACT['live-hapus'] = async el => { if (await Modal.konfirmasi('Hapus jadwal ini?', '', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { await API.call('live.hapus', { id_live: el.dataset.id }); await App.segarkan(); }); };

// ---------------------------------------------------------------- Lainnya / profil
R.def('lainnya', () => {
  const u = U(), b = B(), menu = Shell.menu().filter(x => x.id && x.id !== 'beranda');
  const peranL = { murid: 'Murid', guru: 'Guru', admin: 'Admin / Kepala Sekolah', wali: 'Wali Murid' }[u.peran] + (u.isWaliKelas ? ' · Wali Kelas ' + u.kelasWali.map(k => k.nama_kelas).join(', ') : '');
  return `<div class="cols"><div class="stack">
    <div class="card l"><div class="row" style="gap:16px">${avatar(u.nama, 'lg')}<div class="grow"><h2>${esc(u.nama)}</h2><p class="sm mut">${esc(peranL)}</p><p class="xs mut2">${esc(u.email || u.no_wa || '')}${u.kelas ? ' · ' + esc(u.kelas) + ' · NIS ' + esc(u.nis) : ''}</p></div></div></div>
    <div class="card"><h3>Semua menu</h3><div class="sheet-menu mt16">${menu.map(x => `<a href="#/${x.id}">${ic(x.i, 'l')}<span>${esc(x.l)}</span></a>`).join('')}</div></div>
    ${isWali() ? `<div class="card"><h3>Notifikasi WhatsApp</h3><label class="row sb2 mt12" style="cursor:pointer"><span><b class="tx">Terima notifikasi sekolah</b><br><span class="sm mut">Ketidakhadiran, tugas belum dikumpulkan, nilai, & pengumuman penting. Anda juga bisa membalas STOP/MULAI di WhatsApp.</span></span><span class="sw"><input type="checkbox" ${b.wali.optout ? '' : 'checked'} data-c="optout"><span></span></span></label></div>` : ''}
  </div><div class="stack">
    <div class="card col"><h3>Perangkat ini</h3>
      <button class="btn w blk pasang-app" data-a="pasang">${ic('phoneApp')} Pasang aplikasi di HP</button>
      <button class="btn w blk" data-a="tema">${ic(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')} Mode ${document.documentElement.dataset.theme === 'dark' ? 'terang' : 'gelap'}</button>
      <button class="btn w blk" data-a="segarkan">${ic('refresh')} Muat ulang data</button>
      <button class="btn soft blk" data-a="keluar">${ic('logout')} Keluar</button>
      ${u.darurat ? '' : `<button class="btn ghost blk sm" data-a="keluar-semua">Keluar dari semua perangkat</button>`}</div>
    <div class="card"><h3>Pusat bantuan</h3><div class="col mt12 sm">
      <p>${ic('info', 's')} Lupa tugas/nilai tidak muncul? Tarik ke bawah atau ketuk <b>Muat ulang data</b>.</p>
      <p>${ic('video', 's')} Video besar unggah ke YouTube (unlisted) lalu tempel tautannya.</p>
      <p>${ic('lock', 's')} Data Anda hanya bisa dilihat guru & wali yang berwenang.</p>
      <p class="xs mut2 mt8">${esc(SET('NAMA_APLIKASI') || 'Portal Belajar Spendas')} v${APPV} · backend v${esc(b.v || '-')} · Powered by hd.dsk</p></div></div>
  </div></div>`;
});
CHG.optout = el => sibuk(null, async () => { await API.call('wali.optout', { berhenti: !el.checked }); B().wali.optout = !el.checked; toast(el.checked ? 'Notifikasi WhatsApp diaktifkan.' : 'Anda berhenti menerima notifikasi WhatsApp.'); });

document.addEventListener('DOMContentLoaded', () => App.mulai());
