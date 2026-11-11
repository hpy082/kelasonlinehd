/* =====================================================================
   Tampilan ADMIN / KEPALA SEKOLAH — beranda, data induk (CRUD + impor),
   rekap absensi, rapor (satuan & massal), notifikasi + CRM + blast WA,
   migrasi spreadsheet lama, log & sesi, pengaturan & rahasia
   ===================================================================== */
'use strict';
const ADM = () => B().admin || { pengguna: [], kelas: [], siswa: [], mapel: [], stat: {} };
const kelasNama = id => { const k = ADM().kelas.find(x => String(x.id_kelas) === String(id)) || (B().guru ? B().guru.kelas.find(x => x.id_kelas === String(id)) : null); return k ? k.nama_kelas : (id || '-'); };
const penggunaNama = e => { const u = ADM().pengguna.find(x => String(x.email).toLowerCase() === String(e || '').toLowerCase()); return u ? u.nama : (e || '-'); };
const aktifS = v => !/^(nonaktif|tidak|false|0|keluar|lulus|pindah|no)$/i.test(String(v === undefined || v === null || v === '' ? 'aktif' : v).trim());
const halAdmin = (judul, sub, crumb, tombol) => `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>${crumb || judul}</b></div><h1>${judul}</h1>${sub ? `<p class="mut mt8">${sub}</p>` : ''}</div>${tombol ? `<div class="row w">${tombol}</div>` : ''}</div>`;
const khususAdmin = () => isAdmin() ? '' : kosong('lock', 'Menu ini khusus admin sekolah');
const skel = (n, h) => Array.from({ length: n || 1 }, () => `<div class="sk" style="height:${h || 120}px"></div>`).join('');
const sw = (attr, on) => `<span class="sw"><input type="checkbox" ${attr} ${on ? 'checked' : ''}><span></span></span>`;

// ---------------------------------------------------------------- BERANDA ADMIN
V.berandaAdmin = () => {
  const a = ADM(), st = a.stat || {}, u = U();
  const html = `${hero('Halo, ' + esc(u.nama), 'Kelola data induk, pantau kehadiran seluruh kelas, dan atur notifikasi WhatsApp wali murid.', 'Admin · ' + esc(SET('TAHUN_AJARAN') || '') + ' · Semester ' + esc(SET('SEMESTER') || ''),
    `<a class="btn glass" href="#/data">${ic('database')} Data induk</a><a class="btn white" href="#/laporan">${ic('pie')} Laporan sekolah</a>`)}
  ${u.darurat ? `<div class="card row top" style="border:1.5px solid var(--i);background:var(--i-bg)"><span class="sq I">${ic('key')}</span><div class="grow"><b class="tx">Anda masuk lewat akses darurat</b><p class="sm mt8">Akses ini hanya untuk penyiapan awal. Isi <b>Google Client ID</b> di Pengaturan → Rahasia, pastikan email admin Anda terdaftar di Data Induk → Guru & Staf (peran admin), lalu masuk kembali dengan Google.</p></div><a class="btn p sm" href="#/pengaturan?tab=rahasia">Buka pengaturan</a></div>` : ''}
  <div class="grid4 k2">
    <div class="kpi"><div class="row sb2"><span class="caps mut">Siswa aktif</span><span class="sq ungu">${ic('users', 's')}</span></div><div class="v">${angka(st.siswaAktif, 0)}</div><span class="xs mut">${a.siswa.length} total terdaftar</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Guru aktif</span><span class="sq S">${ic('user', 's')}</span></div><div class="v">${angka(st.guru, 0)}</div><span class="xs mut">${a.pengguna.length} akun pengguna</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Kelas · Mapel</span><span class="sq I">${ic('school', 's')}</span></div><div class="v">${st.kelas || 0}<small> · ${st.mapel || 0}</small></div><span class="xs mut">${st.materi || 0} materi · ${st.tugas || 0} tugas · ${st.kuis || 0} kuis</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Kehadiran hari ini</span><span class="sq H">${ic('userCheck', 's')}</span></div><div class="v">${st.hadirHariIni === null || st.hadirHariIni === undefined ? '-' : angka(st.hadirHariIni) + '<small>%</small>'}</div>${prog(st.hadirHariIni || 0, 'var(--h)')}<span class="xs mut">${angka(st.tercatat, 0)} catatan jam pelajaran</span></div></div>
  <div class="cols"><div class="stack">
    <div class="card" id="adm-lap"><div class="card-h"><div><h3>Kehadiran per kelas</h3><p class="xs mut2">% jam pelajaran hadir sejak awal semester</p></div><a class="see" href="#/laporan">LAPORAN</a></div>${skel(1, 180)}</div>
    <div class="card"><div class="card-h"><h3>Akses cepat</h3></div><div class="sheet-menu">${[['data', 'database', 'Data induk'], ['rekap', 'calendar', 'Rekap absensi'], ['rapor', 'award', 'Rapor siswa'], ['notif', 'wa', 'Notifikasi & CRM'], ['migrasi', 'swap', 'Migrasi & impor'], ['pengaturan', 'settings', 'Pengaturan']].map(x => `<a href="#/${x[0]}">${ic(x[1], 'l')}<span>${x[2]}</span></a>`).join('')}</div></div>
  </div><div class="stack">
    <div class="card" id="adm-cek"><div class="card-h"><div><h3>Kesiapan sistem</h3><p class="xs mut2">Daftar periksa instalasi</p></div></div>${skel(1, 150)}</div>
    <div class="card" id="adm-notif"><div class="card-h"><h3>Notifikasi WhatsApp</h3><a class="see" href="#/notif">KELOLA</a></div>${skel(1, 90)}</div>
    ${(B().pengumuman || []).length ? `<div class="card"><div class="card-h"><h3>Pengumuman</h3><a class="see" href="#/pengumuman">SEMUA</a></div>${kartuPengumuman(B().pengumuman[0])}</div>` : ''}
  </div></div>`;
  return { html, after: V.berandaAdminMuat };
};
V.berandaAdminMuat = async () => {
  const calls = [{ action: 'laporan.data', data: {} }, { action: 'notif.status', data: {} }, { action: 'admin.pengaturan', data: {} }];
  const tampil = (lap, ns, pg) => {
    const el1 = $('#adm-lap'), el2 = $('#adm-notif'), el3 = $('#adm-cek');
    if (el1 && lap && !(lap instanceof Error)) el1.innerHTML = `<div class="card-h"><div><h3>Kehadiran per kelas</h3><p class="xs mut2">% jam pelajaran hadir sejak awal semester</p></div><a class="see" href="#/laporan">LAPORAN</a></div>` +
      (lap.kelas.length ? Chart.hbars(urut(lap.kelas, k => k.nama_kelas).map(k => ({ l: k.nama_kelas, v: k.persenHadir, warna: k.persenHadir === null ? 'var(--sf3)' : k.persenHadir >= 95 ? 'var(--h)' : k.persenHadir >= 85 ? 'var(--i)' : 'var(--a)', ket: (k.persenHadir === null ? 'Belum ada catatan' : angka(k.persenHadir) + '% hadir') + ' · rata-rata nilai ' + angka(k.rata) + ' · ' + k.siswa + ' siswa' })), { suf: '%', d: 1 }) + `<div class="mt12">${legenda([['≥ 95% baik', '#22C55E'], ['85–95% waspada', '#F59E0B'], ['< 85% perlu tindakan', '#EF4444']])}</div>` : kosong('school', 'Belum ada kelas', '', '<a class="btn p sm" href="#/data?t=Kelas">Tambah kelas</a>'));
    if (el2 && ns && !(ns instanceof Error)) el2.innerHTML = `<div class="card-h"><h3>Notifikasi WhatsApp</h3><a class="see" href="#/notif">KELOLA</a></div>
      <div class="row w" style="gap:8px">${ns.waAktif ? '<span class="bd ok">' + ic('wa', 's') + 'WA aktif</span>' : '<span class="bd belum">WA nonaktif</span>'}${ns.tokenAda ? '<span class="bd info">Token tersimpan</span>' : '<span class="bd bad">' + ic('alert', 's') + 'Token Fonnte belum ada</span>'}${ns.emailAktif ? '<span class="bd ungu">Email aktif</span>' : ''}</div>
      <div class="grid3 mt12">${[['Antrean', ns.antrian.antri + ns.antrian.proses], ['Terkirim 24 j', ns.antrian.terkirim24], ['Gagal 24 j', ns.antrian.gagal24]].map((x, i) => `<div class="card flat center" style="padding:10px"><b class="${i === 2 && x[1] ? 'err' : 'tx'}" style="font-size:18px">${x[1]}</b><div class="xs mut">${x[0]}</div></div>`).join('')}</div>`;
    if (el3 && pg && !(pg instanceof Error)) {
      const s = {}; pg.pengaturan.forEach(x => s[x.kunci] = x.nilai);
      const a = ADM(), trg = ['prosesAntrianNotif', 'pengingatTenggatHarian', 'bersihkanTokenKedaluwarsa', 'warmupCache'].every(t => pg.trigger.includes(t));
      const cek = [[pg.rahasia.GOOGLE_CLIENT_ID.ada, 'Google Client ID (login Google)', '#/pengaturan?tab=rahasia'], [!!s.APP_URL, 'APP_URL alamat frontend (tautan WA wali)', '#/pengaturan?tab=sistem'], [pg.rahasia.FONNTE_TOKEN.ada, 'Token Fonnte (WhatsApp)', '#/pengaturan?tab=rahasia'], [trg, 'Trigger otomatis terpasang', '#/pengaturan?tab=sistem'],
        [a.kelas.length > 0, 'Data kelas', '#/data?t=Kelas'], [a.pengguna.filter(x => x.peran === 'guru').length > 0, 'Data guru', '#/data?t=Pengguna'], [a.siswa.length > 0, 'Data siswa & nomor WA wali', '#/data?t=Siswa'], [a.mapel.length > 0, 'Mapel & guru pengampu', '#/data?t=Mapel']];
      const ok = cek.filter(x => x[0]).length;
      el3.innerHTML = `<div class="card-h"><div><h3>Kesiapan sistem</h3><p class="xs mut2">${ok} dari ${cek.length} langkah selesai</p></div><span class="bd ${ok === cek.length ? 'ok' : 'warn'}">${persen(ok, cek.length)}%</span></div>${prog(persen(ok, cek.length), ok === cek.length ? 'var(--h)' : 'var(--p)')}
        <div class="col mt12" style="gap:2px">${cek.map(x => `<a class="row sm" style="padding:6px 0;text-decoration:none" href="${x[2]}"><span class="sq ${x[0] ? 'H' : 'belum'}" style="width:24px;height:24px;border-radius:8px">${ic(x[0] ? 'check' : 'x', 's')}</span><span class="grow ${x[0] ? 'mut' : 'tx b'}">${x[1]}</span>${x[0] ? '' : ic('chevR', 's')}</a>`).join('')}</div>`;
    }
  };
  const c = calls.map(x => API.cached(x.action, x.data));
  if (c.some(Boolean)) tampil(...c);
  try { tampil(...await API.batch(calls)); } catch (e) { salah(e); }
};

// ---------------------------------------------------------------- DATA INDUK (CRUD + impor CSV/Excel)
const TBA = {
  Siswa: { key: 'siswa', id: 'id_siswa', l: 'Siswa', i: 'users', kol: ['id_siswa', 'nama', 'nis', 'id_kelas', 'email_siswa', 'nama_wali', 'no_wa_wali', 'status_aktif'], wajib: ['nama', 'nis', 'id_kelas'] },
  Pengguna: { key: 'pengguna', id: 'id_pengguna', l: 'Guru & Staf', i: 'user', kol: ['id_pengguna', 'nama', 'email', 'peran', 'status_aktif'], wajib: ['nama', 'email'] },
  Kelas: { key: 'kelas', id: 'id_kelas', l: 'Kelas', i: 'school', kol: ['id_kelas', 'nama_kelas', 'email_wali_kelas', 'tahun_ajaran'], wajib: ['nama_kelas'] },
  Mapel: { key: 'mapel', id: 'id_mapel', l: 'Mata Pelajaran', i: 'book', kol: ['id_mapel', 'nama_mapel', 'email_guru', 'id_kelas', 'jam_per_minggu'], wajib: ['nama_mapel', 'email_guru', 'id_kelas'] }
};
const LBL = { id_siswa: 'ID siswa', nama: 'Nama', nis: 'NIS / NISN', id_kelas: 'Kelas', email_siswa: 'Email siswa', nama_wali: 'Nama wali', no_wa_wali: 'No WA wali', status_aktif: 'Status', id_pengguna: 'ID pengguna', email: 'Email', peran: 'Peran',
  nama_kelas: 'Nama kelas', email_wali_kelas: 'Email wali kelas', tahun_ajaran: 'Tahun ajaran', id_mapel: 'ID mapel', nama_mapel: 'Nama mapel', email_guru: 'Email guru pengampu', jam_per_minggu: 'JP / minggu' };
const CONTOH = { Siswa: ['', 'Ahmad Fauzi', '0098765432', 'VII-A', 'ahmad.fauzi@belajar.id', 'Bapak Slamet', '081234567890', 'aktif'], Pengguna: ['', 'Siti Aminah, S.Pd.', 'siti.aminah@belajar.id', 'guru', 'aktif'],
  Kelas: ['', 'VII-A', 'siti.aminah@belajar.id', SET('TAHUN_AJARAN') || '2025/2026'], Mapel: ['', 'Matematika', 'siti.aminah@belajar.id', 'VII-A', '5'] };
const peranBd = p => ({ admin: '<span class="bd bad">Admin</span>', kepsek: '<span class="bd ungu">Kepala sekolah</span>', guru: '<span class="bd info">Guru</span>' }[String(p).toLowerCase()] || `<span class="bd belum">${esc(p || '-')}</span>`);
const statusBd = v => aktifS(v) ? '<span class="bd ok">Aktif</span>' : '<span class="bd belum">' + esc(v || 'Nonaktif') + '</span>';

R.def('data', r => {
  if (!isAdmin()) return khususAdmin();
  const st = Store.v.dt = Object.assign({ t: 'Siswa', k: '', s: 'aktif', p: '' }, Store.v.dt || {});
  if (r.q.t && TBA[r.q.t]) st.t = r.q.t;
  const a = ADM(), cfg = TBA[st.t];
  const jmlMapel = e => a.mapel.filter(m => String(m.email_guru).toLowerCase() === String(e).toLowerCase()).length;
  const kolom = {
    Siswa: [{ k: 'no', l: '#', sort: false, r: (x, i) => `<span class="xs mut">${i + 1}</span>` },
      { k: 'nama', l: 'Nama siswa', r: x => `<div class="row">${avatar(x.nama, 'sm')}<div><b class="tx">${esc(x.nama)}</b><br><span class="xs mut">NIS ${esc(x.nis)}</span></div></div>` },
      { k: 'id_kelas', l: 'Kelas', r: x => esc(kelasNama(x.id_kelas)), sort: x => kelasNama(x.id_kelas) },
      { k: 'nama_wali', l: 'Wali murid', r: x => `${esc(x.nama_wali || '-')}<br><span class="xs ${x.no_wa_wali ? 'mut' : 'err'}">${x.no_wa_wali ? ic('wa', 's') + ' ' + esc(hpTampil(x.no_wa_wali)) : 'Nomor WA belum ada'}</span>` },
      { k: 'email_siswa', l: 'Email (login)', r: x => x.email_siswa ? `<span class="xs">${esc(x.email_siswa)}</span>` : '<span class="xs mut2">—</span>' },
      { k: 'status_aktif', l: 'Status', r: x => statusBd(x.status_aktif) }],
    Pengguna: [{ k: 'nama', l: 'Nama', r: x => `<div class="row">${avatar(x.nama, 'sm')}<div><b class="tx">${esc(x.nama)}</b><br><span class="xs mut">${esc(x.email)}</span></div></div>` },
      { k: 'peran', l: 'Peran', r: x => peranBd(x.peran) },
      { k: 'ampu', l: 'Mengampu', r: x => { const n = jmlMapel(x.email), wk = a.kelas.filter(k => String(k.email_wali_kelas).toLowerCase() === String(x.email).toLowerCase()); return `${n ? n + ' mapel' : '<span class="mut2">—</span>'}${wk.length ? `<br><span class="bd ungu xs">Wali ${esc(wk.map(k => k.nama_kelas).join(', '))}</span>` : ''}`; }, sort: x => jmlMapel(x.email) },
      { k: 'status_aktif', l: 'Status', r: x => statusBd(x.status_aktif) }],
    Kelas: [{ k: 'nama_kelas', l: 'Kelas', r: x => `<b class="tx">${esc(x.nama_kelas)}</b><br><span class="xs mut">${esc(x.id_kelas)}</span>` },
      { k: 'email_wali_kelas', l: 'Wali kelas', r: x => x.email_wali_kelas ? `${esc(penggunaNama(x.email_wali_kelas))}<br><span class="xs mut">${esc(x.email_wali_kelas)}</span>` : '<span class="bd warn">Belum ditentukan</span>' },
      { k: 'tahun_ajaran', l: 'Tahun ajaran' },
      { k: 'n', l: 'Siswa', num: true, r: x => a.siswa.filter(s => String(s.id_kelas) === String(x.id_kelas) && aktifS(s.status_aktif)).length, sort: x => a.siswa.filter(s => String(s.id_kelas) === String(x.id_kelas)).length },
      { k: 'm', l: 'Mapel', num: true, r: x => a.mapel.filter(m => String(m.id_kelas) === String(x.id_kelas)).length, sort: false }],
    Mapel: [{ k: 'nama_mapel', l: 'Mata pelajaran', r: x => { const g = gayaMapel(x.nama_mapel); return `<div class="row"><span class="sq" style="width:32px;height:32px;background:var(--${g.c});color:${g.w}">${ic(g.i, 's')}</span><b class="tx">${esc(x.nama_mapel)}</b></div>`; } },
      { k: 'id_kelas', l: 'Kelas', r: x => esc(x.kelas || kelasNama(x.id_kelas)), sort: x => kelasNama(x.id_kelas) },
      { k: 'email_guru', l: 'Guru pengampu', r: x => `${esc(x.guru || penggunaNama(x.email_guru))}<br><span class="xs mut">${esc(x.email_guru)}</span>` },
      { k: 'jam_per_minggu', l: 'JP', num: true }]
  }[st.t].concat([{ k: 'aksi', l: '', sort: false, r: x => `<div class="row" style="gap:4px;justify-content:flex-end"><button class="btn ghost xs ico" data-a="dt-form" data-id="${esc(x[cfg.id])}" title="Ubah" aria-label="Ubah">${ic('edit', 's')}</button><button class="btn ghost xs ico" data-a="dt-hapus" data-id="${esc(x[cfg.id])}" title="Hapus" aria-label="Hapus">${ic('trash', 's')}</button></div>` }]);
  const rows = () => (ADM()[cfg.key] || []).filter(x => {
    if (st.t === 'Siswa') return (!st.k || String(x.id_kelas) === st.k) && (!st.s || (st.s === 'aktif') === aktifS(x.status_aktif));
    if (st.t === 'Pengguna') return !st.p || String(x.peran).toLowerCase() === st.p;
    if (st.t === 'Mapel') return !st.k || String(x.id_kelas) === st.k;
    return true;
  });
  const cari = x => Object.values(x).join(' ') + ' ' + kelasNama(x.id_kelas);
  const filter = st.t === 'Siswa' || st.t === 'Mapel' ? `<select class="sel pill" style="width:auto" data-c="dt-k" aria-label="Kelas"><option value="">Semua kelas</option>${urut(a.kelas, k => k.nama_kelas).map(k => `<option value="${esc(k.id_kelas)}" ${st.k === String(k.id_kelas) ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select>` : '';
  const filter2 = st.t === 'Siswa' ? `<select class="sel pill" style="width:auto" data-c="dt-s" aria-label="Status"><option value="aktif" ${st.s === 'aktif' ? 'selected' : ''}>Aktif</option><option value="non" ${st.s === 'non' ? 'selected' : ''}>Nonaktif</option><option value="" ${!st.s ? 'selected' : ''}>Semua status</option></select>`
    : st.t === 'Pengguna' ? `<select class="sel pill" style="width:auto" data-c="dt-p" aria-label="Peran"><option value="">Semua peran</option>${[['guru', 'Guru'], ['kepsek', 'Kepala sekolah'], ['admin', 'Admin']].map(p => `<option value="${p[0]}" ${st.p === p[0] ? 'selected' : ''}>${p[1]}</option>`).join('')}</select>` : '';
  const tanpaWA = st.t === 'Siswa' ? a.siswa.filter(s => aktifS(s.status_aktif) && !s.no_wa_wali).length : 0;
  return `${halAdmin('Data Induk Sekolah', 'Siswa, guru & staf, kelas, dan mata pelajaran. Impor massal dari Excel/Dapodik — data yang sama diperbarui, bukan diduplikasi.', 'Data Induk',
    `<button class="btn w" data-a="dt-impor">${ic('upload')} Impor Excel / CSV</button><button class="btn p" data-a="dt-form">${ic('plus')} Tambah ${esc(cfg.l.toLowerCase())}</button>`)}
    <div class="tabs">${Object.keys(TBA).map(t => `<button class="tab ${st.t === t ? 'on' : ''}" data-a="dt-tab" data-t="${t}">${ic(TBA[t].i, 's')} ${TBA[t].l}<span class="n">${(a[TBA[t].key] || []).length}</span></button>`).join('')}</div>
    ${tanpaWA ? `<div class="card row sm" style="padding:12px 16px;background:var(--i-bg);border:0">${ic('alert')}<span class="grow"><b class="tx">${tanpaWA} siswa aktif</b> belum memiliki nomor WA wali — wali tidak bisa masuk & tidak menerima notifikasi.</span></div>` : ''}
    <div class="card"><div class="row w sb2" style="margin-bottom:12px"><div class="search" style="max-width:300px">${ic('search')}<input type="search" placeholder="Cari ${esc(cfg.l.toLowerCase())}…" data-i="tb-cari" data-t="adm" value="${esc((Tabel.cfg.adm && Tabel.cfg.adm.t === st.t && Tabel.cfg.adm.q) || '')}" style="height:40px"></div>
      <div class="row w">${filter}${filter2}<button class="btn w sm" data-a="dt-xls">${ic('sheet', 's')} Unduh Excel</button></div></div>
      ${(() => { if (Tabel.cfg.adm && Tabel.cfg.adm.t !== st.t) { Tabel.cfg.adm.q = ''; Tabel.cfg.adm.hal = 1; Tabel.cfg.adm.sk = null; } return Tabel.def('adm', { t: st.t, per: 15, rows, cari, kolom, sk: kolom[st.t === 'Siswa' ? 1 : 0].k, kosong: 'Belum ada data ' + cfg.l.toLowerCase() }); })()}</div>`;
});
ACT['dt-tab'] = el => { Store.v.dt.t = el.dataset.t; Store.v.dt.k = ''; R.go('#/data?t=' + el.dataset.t); };
CHG['dt-k'] = el => { Store.v.dt.k = el.value; Tabel.cfg.adm.hal = 1; Tabel.refresh('adm'); };
CHG['dt-s'] = el => { Store.v.dt.s = el.value; Tabel.cfg.adm.hal = 1; Tabel.refresh('adm'); };
CHG['dt-p'] = el => { Store.v.dt.p = el.value; Tabel.cfg.adm.hal = 1; Tabel.refresh('adm'); };

const fieldDT = (t, baru) => {
  const a = ADM(), kelasO = urut(a.kelas, k => k.nama_kelas).map(k => [k.id_kelas, k.nama_kelas]), guruO = a.pengguna.filter(u => aktifS(u.status_aktif)).map(u => [u.email, u.nama + ' — ' + u.email]);
  return {
    Siswa: [{ k: 'nama', req: 1 }, { k: 'nis', req: 1 }, { k: 'id_kelas', type: 'select', opsi: kelasO, req: 1 }, { k: 'status_aktif', type: 'select', opsi: [['aktif', 'Aktif'], ['nonaktif', 'Nonaktif'], ['pindah', 'Pindah'], ['lulus', 'Lulus']] },
      { k: 'email_siswa', type: 'email', hint: 'Akun belajar.id / Gmail untuk masuk dengan Google.' }, { k: 'nama_wali' }, { k: 'no_wa_wali', type: 'tel', hint: '0812… / +62812… — disimpan otomatis sebagai 62…', full: 1 }],
    Pengguna: [{ k: 'nama', req: 1 }, { k: 'email', type: 'email', req: 1, hint: 'Email Google yang dipakai untuk masuk.' }, { k: 'peran', type: 'select', opsi: [['guru', 'Guru'], ['kepsek', 'Kepala sekolah (akses admin)'], ['admin', 'Admin']] }, { k: 'status_aktif', type: 'select', opsi: [['aktif', 'Aktif'], ['nonaktif', 'Nonaktif']] }],
    Kelas: [{ k: 'nama_kelas', req: 1, hint: 'Contoh: VII-A, VIII-B' }].concat(baru ? [{ k: 'id_kelas', hint: 'Opsional — kosongkan agar dibuat otomatis.' }] : []).concat([{ k: 'email_wali_kelas', type: 'select', opsi: [['', '— Belum ditentukan —']].concat(guruO) }, { k: 'tahun_ajaran', def: SET('TAHUN_AJARAN') }]),
    Mapel: [{ k: 'nama_mapel', req: 1 }, { k: 'id_kelas', type: 'select', opsi: kelasO, req: 1 }, { k: 'email_guru', type: 'select', opsi: guruO, req: 1 }, { k: 'jam_per_minggu', type: 'number', def: 2 }]
  }[t];
};
const inputFld = (f, v) => {
  const val = v === undefined || v === null || v === '' ? (f.def === undefined ? '' : f.def) : v, nm = `name="${f.k}" id="f-${f.k}"`;
  const inp = f.type === 'select' ? `<select class="sel" ${nm} ${f.req ? 'required' : ''}>${f.opsi.map(o => `<option value="${esc(o[0])}" ${String(o[0]).toLowerCase() === String(val).toLowerCase() ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`
    : `<input class="inp" ${nm} type="${f.type || 'text'}" value="${esc(val)}" ${f.req ? 'required' : ''} ${f.type === 'tel' ? 'inputmode="tel"' : ''} ${f.type === 'number' ? 'min="0" max="60"' : ''}>`;
  return `<div class="fld" ${f.full ? 'style="grid-column:1/-1"' : ''}><label for="f-${f.k}">${esc(LBL[f.k] || f.k)}${f.req ? ' <span class="err">*</span>' : ''}</label>${inp}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ''}</div>`;
};
ACT['dt-form'] = el => {
  const t = Store.v.dt.t, cfg = TBA[t], id = el.dataset.id, x = id ? ADM()[cfg.key].find(r => String(r[cfg.id]) === id) : {};
  if (!x) return toast('Data tidak ditemukan — muat ulang data.', 'warn');
  if ((t === 'Siswa' || t === 'Mapel') && !ADM().kelas.length) return toast('Tambahkan data kelas terlebih dahulu.', 'warn');
  Modal.open(`${Modal.head((id ? 'Ubah ' : 'Tambah ') + esc(cfg.l.toLowerCase()), id ? esc(cfg.id + ': ' + id) : '', cfg.i)}<form class="modal-b col" data-f="dt" data-id="${esc(id || '')}"><div class="f2">${fieldDT(t, !id).map(f => inputFld(f, x[f.k])).join('')}</div>
    ${t === 'Pengguna' ? `<p class="xs mut">${ic('info', 's')} Guru otomatis mendapat akses ke mapel yang diampunya (menu Mata Pelajaran) & kelas perwaliannya (menu Kelas).</p>` : ''}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('save')} Simpan</button></div></form>`, { size: 'lg' });
};
FRM.dt = f => sibuk($('button.p', f), async () => {
  const t = Store.v.dt.t, cfg = TBA[t], id = f.dataset.id, lama = id ? ADM()[cfg.key].find(r => String(r[cfg.id]) === id) : null;
  const row = Object.assign({}, lama || {}, formData(f)); if (id) row[cfg.id] = id;
  const hasil = await API.call('admin.simpan', { tabel: t, row, baru: !id });
  const arr = ADM()[cfg.key], i = arr.findIndex(r => String(r[cfg.id]) === String(hasil[cfg.id]));
  if (t === 'Mapel') Object.assign(hasil, { guru: penggunaNama(hasil.email_guru), kelas: kelasNama(hasil.id_kelas) });
  if (i >= 0) arr[i] = Object.assign({}, arr[i], hasil); else arr.push(hasil);
  Modal.close(); Tabel.refresh('adm'); toast(cfg.l + ' tersimpan.');
  App.segarkan();
}, 'Menyimpan…');
ACT['dt-hapus'] = async el => {
  const t = Store.v.dt.t, cfg = TBA[t], x = ADM()[cfg.key].find(r => String(r[cfg.id]) === el.dataset.id) || {};
  if (!(await Modal.konfirmasi('Hapus ' + cfg.l.toLowerCase() + '?', `<b>${esc(x.nama || x.nama_kelas || x.nama_mapel || el.dataset.id)}</b> akan dihapus permanen. Data yang sudah dipakai (nilai, absensi, materi) tidak dapat dihapus — ubah statusnya menjadi nonaktif.`, { ok: 'Hapus', bahaya: true }))) return;
  sibuk(null, async () => { await API.call('admin.hapus', { tabel: t, id: el.dataset.id }); const arr = ADM()[cfg.key], i = arr.findIndex(r => String(r[cfg.id]) === el.dataset.id); if (i >= 0) arr.splice(i, 1); Tabel.refresh('adm'); toast('Data dihapus.'); App.segarkan(); });
};
ACT['dt-xls'] = () => { const t = Store.v.dt.t, cfg = TBA[t]; Ekspor.xlsx('Data ' + cfg.l + ' ' + hariIni(), [{ nama: cfg.l, rows: [cfg.kol.map(k => LBL[k] || k)].concat(Tabel.data('adm').map(x => cfg.kol.map(k => k === 'id_kelas' ? kelasNama(x[k]) : (x[k] === undefined ? '' : x[k])))) }]); };

// ---- Impor berkas (CSV / Excel / tempel dari spreadsheet)
function parseCSV(teks) {
  teks = String(teks || '').replace(/^﻿/, '');
  const baris1 = teks.split(/\r?\n/)[0] || '', hitung = c => (baris1.match(new RegExp(c === '\t' ? '\t' : '\\' + c, 'g')) || []).length;
  const pem = ['\t', ';', ','].sort((a, b) => hitung(b) - hitung(a))[0];
  const out = []; let row = [], sel = '', kutip = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (kutip) { if (c === '"') { if (teks[i + 1] === '"') { sel += '"'; i++; } else kutip = false; } else sel += c; continue; }
    if (c === '"' && sel === '') kutip = true;
    else if (c === pem) { row.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && teks[i + 1] === '\n') i++; row.push(sel); out.push(row); row = []; sel = ''; }
    else sel += c;
  }
  if (sel !== '' || row.length) { row.push(sel); out.push(row); }
  return out.filter(r => r.some(x => String(x).trim() !== ''));
}
const aoaKeObjek = aoa => { if (aoa.length < 2) return []; const h = aoa[0].map(x => String(x).trim()); return aoa.slice(1).map(r => { const o = {}; h.forEach((k, i) => { if (k) o[k] = r[i] === undefined || r[i] === null ? '' : String(r[i]).trim(); }); return o; }); };
ACT['dt-impor'] = el => {
  const t = (el && el.dataset && el.dataset.t) || (Store.v.dt || {}).t || 'Siswa', cfg = TBA[t];
  Store.v.imp = { t, rows: [], ok: false };
  Modal.open(`${Modal.head('Impor ' + esc(cfg.l) + ' dari Excel / CSV', 'Kolom dikenali otomatis dari nama header — termasuk format ekspor Dapodik', 'upload')}<div class="modal-b col">
    <div class="seg">${Object.keys(TBA).map(x => `<button class="${x === t ? 'on' : ''}" data-a="imp-t" data-t="${x}">${TBA[x].l}</button>`).join('')}</div>
    <div class="card flat col" style="gap:8px"><b class="tx sm">${ic('listCheck', 's')} Kolom yang dikenali</b><div class="row w" style="gap:6px" id="imp-kol">${cfg.kol.map(k => `<span class="bd ${cfg.wajib.includes(k) ? 'ungu' : 'belum'}">${esc(LBL[k])}${cfg.wajib.includes(k) ? ' *' : ''}</span>`).join('')}</div>
      <p class="xs mut">Header boleh berbeda, mis. <i>Nama Peserta Didik, NISN, Rombel, No HP Ortu</i>. Data dengan NIS/email/nama kelas yang sama <b>diperbarui</b>, tidak digandakan.</p><button class="btn soft xs" style="align-self:flex-start" data-a="imp-templat">${ic('download', 's')} Unduh templat CSV</button></div>
    <label class="drop" style="cursor:pointer"><input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" data-c="imp-file" class="sr">${ic('upload', 'l')}<b class="tx">Pilih berkas .xlsx / .csv</b><span class="xs mut">atau tempel isi spreadsheet di bawah</span></label>
    <textarea class="ta" rows="4" placeholder="Salin sel dari Excel/Google Sheets (termasuk baris header), lalu tempel di sini…" data-i="imp-teks" style="font-family:ui-monospace,monospace;font-size:12px"></textarea>
    ${t === 'Siswa' || t === 'Mapel' ? `<label class="chk"><input type="checkbox" id="imp-kelas" checked><span>Buat kelas otomatis bila nama kelas belum terdaftar</span></label>` : ''}
    <div id="imp-info" class="sm mut"></div><div id="imp-hasil"></div></div>
    <div class="modal-f"><button class="btn ghost" data-a="tutup">Batal</button><button class="btn w" data-a="imp-pindai" disabled>${ic('search')} Pindai (uji coba)</button><button class="btn p" data-a="imp-jalan" disabled>${ic('database')} Jalankan impor</button></div>`, { size: 'lg' });
};
ACT['imp-t'] = el => { Modal.close(); ACT['dt-impor'](el); };
ACT['imp-templat'] = () => { const t = Store.v.imp.t; Ekspor.csv('Templat ' + TBA[t].l, [TBA[t].kol, CONTOH[t]]); };
const impSiap = rows => {
  const st = Store.v.imp; st.rows = rows; st.ok = false;
  const h = rows.length ? Object.keys(rows[0]) : [];
  $('#imp-info').innerHTML = rows.length ? `${ic('checkCircle', 's')} <b class="tx">${rows.length} baris</b> terbaca · kolom: ${h.map(x => `<span class="bd belum" style="margin:2px">${esc(x)}</span>`).join('')}` : '<span class="err">Tidak ada baris data (pastikan baris pertama berisi header).</span>';
  $('[data-a=imp-pindai]').disabled = !rows.length; $('[data-a=imp-jalan]').disabled = true; $('#imp-hasil').innerHTML = '';
};
CHG['imp-file'] = async el => {
  const f = el.files[0]; if (!f) return;
  try {
    let aoa;
    if (/\.xlsx?$/i.test(f.name)) { $('#imp-info').innerHTML = '<span class="spin p"></span> Membaca Excel…'; await Ekspor.muat('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); const wb = XLSX.read(await f.arrayBuffer(), { type: 'array', cellDates: true }); aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }); }
    else aoa = parseCSV(await f.text());
    impSiap(aoaKeObjek(aoa));
  } catch (e) { $('#imp-info').innerHTML = `<span class="err">${esc(e.message || 'Berkas tidak dapat dibaca.')} — simpan ulang sebagai CSV lalu coba lagi.</span>`; }
};
INP['imp-teks'] = debounce(el => impSiap(aoaKeObjek(parseCSV(el.value))), 250);
const impHasil = (r, uji) => `<div class="card flat col" style="gap:10px;${r.galat.length ? 'border:1.5px solid var(--a)' : ''}"><b class="tx">${uji ? ic('search', 's') + ' Hasil pindai (belum ada yang ditulis)' : ic('checkCircle', 's') + ' Impor selesai'}</b>
  <div class="grid4 k2">${[['Ditambah', r.tambah, 'ok'], ['Diperbarui', r.ubah, 'info'], ['Dilewati (sama)', r.lewati, 'belum'], ['Kelas baru', r.kelasBaru, 'ungu']].map(x => `<div class="card center" style="padding:10px"><b style="font-size:20px" class="tx">${x[1]}</b><div class="xs"><span class="bd ${x[2]}">${x[0]}</span></div></div>`).join('')}</div>
  ${r.galat.length ? `<div><b class="err sm">${r.galat.length} baris bermasalah (dilewati):</b><div class="col mt8" style="gap:4px;max-height:160px;overflow:auto">${r.galat.map(g => `<span class="xs">Baris ${g.baris}: ${esc(g.pesan)}</span>`).join('')}</div></div>` : ''}
  ${uji && r.contoh.length ? `<div class="tw"><table class="tbl"><thead><tr>${Object.keys(r.contoh[0]).map(k => `<th>${esc(LBL[k] || k)}</th>`).join('')}</tr></thead><tbody>${r.contoh.map(o => `<tr>${Object.keys(r.contoh[0]).map(k => `<td class="xs">${esc(k === 'id_kelas' ? kelasNama(o[k]) : o[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}</div>`;
const impKirim = dryRun => { const st = Store.v.imp, kb = $('#imp-kelas'); return API.call('admin.impor', { tabel: st.t, rows: st.rows, dryRun, buatKelas: kb ? kb.checked : false }, { timeout: 300000 }); };
ACT['imp-pindai'] = el => sibuk(el, async () => { const r = await impKirim(true); Store.v.imp.ok = true; $('#imp-hasil').innerHTML = impHasil(r, true); $('[data-a=imp-jalan]').disabled = !(r.tambah + r.ubah); }, 'Memindai…');
ACT['imp-jalan'] = el => sibuk(el, async () => { const r = await impKirim(false); $('#imp-hasil').innerHTML = impHasil(r, false); el.disabled = true; toast(`Impor selesai: ${r.tambah} ditambah, ${r.ubah} diperbarui.`); await App.segarkan(); }, 'Mengimpor…');

// ---------------------------------------------------------------- REKAP ABSENSI (admin & wali kelas)
R.def('rekap', r => {
  const daftar = isAdmin() ? urut(ADM().kelas, k => k.nama_kelas) : (U().kelasWali || []);
  if (!daftar.length) return isAdmin() ? kosong('school', 'Belum ada kelas', '', '<a class="btn p sm" href="#/data?t=Kelas">Tambah kelas</a>') : khususAdmin();
  const adaSiswa = daftar.find(k => (isAdmin() ? ADM().siswa : G().siswa).some(s => String(s.id_kelas) === String(k.id_kelas))) || daftar[0];
  const st = Store.v.rk = Object.assign({ k: String(adaSiswa.id_kelas), dari: SET('SEMESTER_MULAI') || hariIni().slice(0, 8) + '01', sampai: hariIni(), mode: 'ringkas' }, Store.v.rk || {});
  if (r.q.k) st.k = r.q.k;
  const w = wib(sekarang()), awalBulan = w.y + '-' + p2(w.m + 1) + '-01', h7 = tglKey(sekarang() - 6 * 86400e3);
  const cepat = [['Hari ini', hariIni(), hariIni()], ['7 hari', h7, hariIni()], ['Bulan ini', awalBulan, hariIni()], ['Semester', SET('SEMESTER_MULAI') || awalBulan, hariIni()]];
  return { html: `${halAdmin('Rekap Absensi Kelas', 'Rekap per jam pelajaran & per hari dalam rentang tanggal, lengkap dengan ekspor Excel.', 'Rekap Absensi')}
    <div class="card row w" style="padding:14px;gap:10px;align-items:flex-end"><div class="fld" style="min-width:160px"><label class="xs">Kelas</label><select class="sel" data-c="rk-k">${daftar.map(k => `<option value="${esc(k.id_kelas)}" ${st.k === String(k.id_kelas) ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select></div>
      <div class="fld"><label class="xs">Dari</label><input class="inp" type="date" value="${esc(st.dari)}" data-c="rk-dari"></div><div class="fld"><label class="xs">Sampai</label><input class="inp" type="date" value="${esc(st.sampai)}" max="${hariIni()}" data-c="rk-sampai"></div>
      <div class="seg">${cepat.map(c => `<button class="${st.dari === c[1] && st.sampai === c[2] ? 'on' : ''}" data-a="rk-cepat" data-d="${c[1]}" data-s="${c[2]}">${c[0]}</button>`).join('')}</div></div>
    <div id="rk" class="col gap24">${skel(1, 110)}${skel(1, 280)}</div>`, after: V.muatRekap };
});
CHG['rk-k'] = el => { Store.v.rk.k = el.value; V.muatRekap(); };
CHG['rk-dari'] = el => { Store.v.rk.dari = el.value; R.render(); };
CHG['rk-sampai'] = el => { Store.v.rk.sampai = el.value; R.render(); };
ACT['rk-cepat'] = el => { Store.v.rk.dari = el.dataset.d; Store.v.rk.sampai = el.dataset.s; R.render(); };
ACT['rk-mode'] = el => { Store.v.rk.mode = el.dataset.m; if (Store.v.rkData) $('#rk').innerHTML = V.rekapHtml(Store.v.rkData); };
V.muatRekap = async () => {
  const st = Store.v.rk, q = { id_kelas: st.k, dari: st.dari, sampai: st.sampai }, key = JSON.stringify(q);
  const tampil = d => { if (JSON.stringify({ id_kelas: Store.v.rk.k, dari: Store.v.rk.dari, sampai: Store.v.rk.sampai }) !== key || !$('#rk')) return; Store.v.rkData = d; $('#rk').innerHTML = V.rekapHtml(d); };
  const c = API.cached('absensi.kelas', q); if (c) tampil(c); else if ($('#rk')) $('#rk').innerHTML = skel(1, 110) + skel(1, 280);
  try { tampil(await API.call('absensi.kelas', q)); } catch (e) { if ($('#rk')) $('#rk').innerHTML = `<div class="card">${kosong('alert', 'Gagal memuat rekap', esc(e.message))}</div>`; }
};
const olahRekap = d => {
  const n = d.roster.length, per = d.roster.map(s => ({ s, c: { H: 0, S: 0, I: 0, A: 0 }, hariA: new Set(), hariSI: new Set() })), tgl = {};
  d.sesi.forEach(x => { const t = tgl[x.t] = tgl[x.t] || { H: 0, S: 0, I: 0, A: 0, j: 0 }; t.j++; for (let i = 0; i < n; i++) { const ch = x.st.charAt(i); if (!'HSIA'.includes(ch) || !ch) continue; per[i].c[ch]++; t[ch]++; if (ch === 'A') per[i].hariA.add(x.t); if (ch === 'S' || ch === 'I') per[i].hariSI.add(x.t); } });
  per.forEach(p => { const tot = p.c.H + p.c.S + p.c.I + p.c.A; p.tot = tot; p.persen = tot ? Math.round(p.c.H / tot * 1000) / 10 : null; });
  return { per, tgl };
};
V.rekapHtml = d => {
  const st = Store.v.rk, { per, tgl } = olahRekap(d), tk = Object.keys(tgl).sort();
  Store.v.rkOlah = per;
  const tot = per.reduce((a, p) => { 'HSIA'.split('').forEach(k => a[k] += p.c[k]); return a; }, { H: 0, S: 0, I: 0, A: 0 }), sum = tot.H + tot.S + tot.I + tot.A;
  const alfaSiswa = per.filter(p => p.c.A).length;
  if (!d.sesi.length) return `<div class="card">${kosong('calendar', 'Belum ada absensi pada rentang ini', 'Ubah rentang tanggal atau minta guru mencatat absensi per jam.')}</div>`;
  const kpi = `<div class="grid4 k2"><div class="kpi"><span class="caps mut">Kehadiran</span><div class="v">${angka(sum ? tot.H / sum * 100 : null)}<small>%</small></div>${prog(sum ? tot.H / sum * 100 : 0, 'var(--h)')}<span class="xs mut">${tot.H} dari ${sum} jam-siswa</span></div>
    <div class="kpi"><span class="caps mut">Sesi tercatat</span><div class="v">${d.sesi.length}</div><span class="xs mut">${tk.length} hari sekolah</span></div>
    <div class="kpi"><span class="caps mut">Sakit · Izin</span><div class="v">${tot.S}<small> · ${tot.I}</small></div><span class="xs mut">jam pelajaran</span></div>
    <div class="kpi"><span class="caps mut">Alfa</span><div class="v" style="color:var(--a-tx)">${tot.A}<small> jam</small></div><span class="xs ${alfaSiswa ? 'err b' : 'mut'}">${alfaSiswa} siswa pernah alfa</span></div></div>`;
  const grafik = `<div class="card"><div class="card-h"><div><h3>Kehadiran per hari — ${esc(d.kelas.nama_kelas)}</h3><p class="xs mut2">${tk.length > 15 ? '15 hari sekolah terakhir dalam rentang' : 'Semua hari dalam rentang'}</p></div>${legendaAbs()}</div>${Chart.stackAbs(tk.slice(-15).map(t => Object.assign({ label: t.slice(8) + '/' + t.slice(5, 7), sub: fHari(t) + ' · ' + tgl[t].j + ' jam' }, tgl[t])), { aria: 'Kehadiran per hari' })}</div>`;
  const seg = `<div class="seg"><button class="${st.mode === 'ringkas' ? 'on' : ''}" data-a="rk-mode" data-m="ringkas">Ringkasan per siswa</button><button class="${st.mode === 'detail' ? 'on' : ''}" data-a="rk-mode" data-m="detail">Detail per jam</button></div>`;
  let isi;
  if (st.mode === 'ringkas') {
    isi = Tabel.def('rk', { per: 40, sk: 'no', rows: () => Store.v.rkOlah.map((p, i) => Object.assign({ no: i + 1 }, p)), cari: p => p.s.nama + ' ' + p.s.nis,
      kolom: [{ k: 'no', l: 'No', r: p => p.no }, { k: 'nama', l: 'Nama siswa', r: p => `<b class="tx">${esc(p.s.nama)}</b><br><span class="xs mut">${esc(p.s.nis)}</span>`, sort: p => p.s.nama },
        ...['H', 'S', 'I', 'A'].map(k => ({ k, l: BD_ABS[k][1], num: true, r: p => k === 'A' && p.c.A ? `<b class="err">${p.c.A}</b>` : p.c[k], sort: p => p.c[k] })),
        { k: 'persen', l: '% Hadir', num: true, r: p => `<span class="bd ${p.persen === null ? 'belum' : p.persen >= 95 ? 'ok' : p.persen >= 85 ? 'warn' : 'bad'}">${p.persen === null ? '-' : angka(p.persen) + '%'}</span>`, sort: p => p.persen === null ? -1 : p.persen },
        { k: 'hariA', l: 'Hari alfa', num: true, r: p => p.hariA.size ? `<b class="err">${p.hariA.size}</b>` : '0', sort: p => p.hariA.size },
        { k: 'x', l: '', sort: false, r: p => `<button class="btn soft xs" data-a="rp-buka" data-s="${esc(p.s.id_siswa)}">${ic('award', 's')} Rapor</button>` }] });
  } else {
    const sesi = d.sesi.slice(-30);
    isi = `<p class="xs mut" style="margin-bottom:8px">${d.sesi.length > 30 ? 'Menampilkan 30 sesi terakhir — unduh Excel untuk seluruh rentang.' : d.sesi.length + ' sesi.'}</p><div class="tw"><table class="tbl" style="font-size:12px"><thead><tr><th style="position:sticky;left:0;background:var(--sf2);z-index:1">Nama</th>${sesi.map(x => `<th class="center" title="${esc(fHari(x.t) + ' · jam ' + x.j + ' · ' + x.nama_mapel)}" style="min-width:34px;padding:6px 4px">${x.t.slice(8)}/${x.t.slice(5, 7)}<br><span class="mut2">J${x.j}</span></th>`).join('')}</tr></thead>
      <tbody>${d.roster.map((s, i) => `<tr><td class="nowrap b tx" style="position:sticky;left:0;background:var(--sf);z-index:1">${esc(s.nama)}</td>${sesi.map(x => { const ch = x.st.charAt(i); return `<td class="center" style="padding:4px">${'HSIA'.includes(ch) && ch ? `<span class="bd ${ch}" style="padding:2px 7px">${ch}</span>` : '<span class="mut2">·</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  return `${kpi}${grafik}<div class="card"><div class="row w sb2" style="margin-bottom:12px">${seg}<div class="row w">${st.mode === 'ringkas' ? `<div class="search" style="max-width:220px">${ic('search')}<input type="search" placeholder="Cari siswa…" data-i="tb-cari" data-t="rk" style="height:38px"></div>` : ''}<button class="btn w sm" data-a="rk-xls">${ic('sheet', 's')} Unduh Excel</button></div></div>${isi}</div>`;
};
ACT['rk-xls'] = () => {
  const d = Store.v.rkData, st = Store.v.rk, per = Store.v.rkOlah;
  Ekspor.xlsx('Rekap Absensi ' + d.kelas.nama_kelas + ' ' + st.dari + ' sd ' + st.sampai, [
    { nama: 'Ringkasan', rows: [['No', 'NIS', 'Nama', 'Hadir (jam)', 'Sakit (jam)', 'Izin (jam)', 'Alfa (jam)', '% Hadir', 'Hari alfa', 'Hari sakit/izin']].concat(per.map((p, i) => [i + 1, p.s.nis, p.s.nama, p.c.H, p.c.S, p.c.I, p.c.A, p.persen === null ? '' : p.persen, p.hariA.size, p.hariSI.size])) },
    { nama: 'Per jam', rows: [['NIS', 'Nama'].concat(d.sesi.map(x => x.t + ' J' + x.j + ' ' + x.nama_mapel))].concat(d.roster.map((s, i) => [s.nis, s.nama].concat(d.sesi.map(x => { const c = x.st.charAt(i); return c === '-' ? '' : c; })))) }]);
};

// ---------------------------------------------------------------- RAPOR SISWA (satuan & massal per kelas)
R.def('rapor', r => {
  if (!isAdmin() && !isWK()) return khususAdmin();
  const siswa = isAdmin() ? ADM().siswa.filter(s => aktifS(s.status_aktif)) : G().siswa.filter(s => (U().kelasWali || []).some(k => k.id_kelas === s.id_kelas));
  const kelas = isAdmin() ? urut(ADM().kelas, k => k.nama_kelas) : U().kelasWali;
  const st = Store.v.rp = Object.assign({ k: '' }, Store.v.rp || {});
  return { html: `${halAdmin('Rapor Mini Siswa', 'Pratinjau, cetak, atau simpan PDF rapor capaian belajar — satu siswa atau satu kelas sekaligus.', 'Rapor Siswa', `<button class="btn p" data-a="rp-massal" ${st.k ? '' : 'disabled title="Pilih kelas terlebih dahulu"'}>${ic('printer')} Cetak rapor 1 kelas</button>`)}
    <div class="card"><div class="row w sb2" style="margin-bottom:12px"><div class="search" style="max-width:300px">${ic('search')}<input type="search" placeholder="Cari nama / NIS…" data-i="tb-cari" data-t="rp" style="height:40px"></div>
      <select class="sel pill" style="width:auto" data-c="rp-k" aria-label="Kelas"><option value="">Semua kelas</option>${kelas.map(k => `<option value="${esc(k.id_kelas)}" ${st.k === String(k.id_kelas) ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select></div>
    ${Tabel.def('rp', { per: 20, sk: 'nama', rows: () => siswa.filter(s => !Store.v.rp.k || String(s.id_kelas) === Store.v.rp.k), cari: s => s.nama + ' ' + s.nis,
      kolom: [{ k: 'nama', l: 'Nama siswa', r: s => `<div class="row">${avatar(s.nama, 'sm')}<div><b class="tx">${esc(s.nama)}</b><br><span class="xs mut">NIS ${esc(s.nis)}</span></div></div>` },
        { k: 'id_kelas', l: 'Kelas', r: s => esc(kelasNama(s.id_kelas)), sort: s => kelasNama(s.id_kelas) }, { k: 'nama_wali', l: 'Wali murid', r: s => esc(s.nama_wali || '-') },
        { k: 'x', l: '', sort: false, r: s => `<button class="btn soft sm" data-a="rp-buka" data-s="${esc(s.id_siswa)}">${ic('award', 's')} Lihat rapor</button>` }] })}</div>`,
    after: () => { if (r.q.s) { const b = document.createElement('button'); b.dataset.s = r.q.s; ACT['rp-buka'](b); } } };
});
CHG['rp-k'] = el => { Store.v.rp.k = el.value; const b = $('[data-a=rp-massal]'); if (b) { b.disabled = !el.value; b.removeAttribute('title'); } Tabel.cfg.rp.hal = 1; Tabel.refresh('rp'); };
ACT['rp-buka'] = el => sibuk(el.isConnected ? el : null, async () => Rapor.buka(await API.call('rapor.siswa', { id_siswa: el.dataset.s }, { ttl: 30000 })));
ACT['rp-massal'] = el => {
  const k = Store.v.rp.k, siswa = (isAdmin() ? ADM().siswa : G().siswa).filter(s => String(s.id_kelas) === k && aktifS(s.status_aktif));
  if (!siswa.length) return toast('Tidak ada siswa aktif di kelas ini.', 'warn');
  sibuk(el, async () => {
    const hasil = [];
    for (let i = 0; i < siswa.length; i += 12) {
      el.innerHTML = `<span class="spin"></span> Menyiapkan ${Math.min(siswa.length, i + 12)}/${siswa.length}…`;
      const r = await API.batch(siswa.slice(i, i + 12).map(s => ({ action: 'rapor.siswa', data: { id_siswa: s.id_siswa } })));
      r.forEach(x => { if (!(x instanceof Error)) hasil.push(x); });
    }
    if (!hasil.length) throw new Error('Rapor tidak dapat dibuat.');
    const o = Object.assign({ nilai: true, hadir: true, tugas: true, catatan: false, ttd: true, kertas: 'A4' }, Rapor.opsi || {});
    Rapor.cetak(hasil.map(rp => Rapor.html(rp, Object.assign({}, o, { catatan: o.catatan && !!rp.catatan }))), o.kertas);
    toast(hasil.length + ' rapor siap dicetak — pilih "Simpan sebagai PDF" untuk berkas PDF.');
  });
};

// ---------------------------------------------------------------- NOTIFIKASI, CRM KONTAK & BLAST WA
R.def('notif', r => {
  if (!isAdmin()) return khususAdmin();
  const st = Store.v.nt = Object.assign({ tab: 'status' }, Store.v.nt || {});
  if (r.q.tab) st.tab = r.q.tab;
  const tabs = [['status', 'Ringkasan', 'zap'], ['matriks', 'Kejadian & template', 'sliders'], ['crm', 'Kontak CRM', 'users'], ['blast', 'Blast WA', 'megaphone'], ['antrean', 'Antrean & log', 'inbox']];
  return { html: `${halAdmin('Notifikasi WhatsApp & CRM', 'Notifikasi otomatis lewat antrean (tidak memperlambat aplikasi), kontak wali & guru, serta broadcast bertahap anti-blokir.', 'Notifikasi & CRM')}
    <div class="tabs">${tabs.map(t => `<button class="tab ${st.tab === t[0] ? 'on' : ''}" data-a="nt-tab" data-t="${t[0]}">${ic(t[2], 's')} ${t[1]}</button>`).join('')}</div><div id="nt" class="col gap24">${skel(1, 120)}${skel(1, 260)}</div>`,
    after: () => (NT[st.tab] || NT.status)() };
});
ACT['nt-tab'] = el => { Store.v.nt.tab = el.dataset.t; Store.v.crmSel = Store.v.crmSel || new Set(); R.go('#/notif?tab=' + el.dataset.t); };
const ntIsi = h => { const el = $('#nt'); if (el) el.innerHTML = h; };
const NT = {
  async status() {
    const calls = [{ action: 'notif.status', data: {} }, { action: 'admin.pengaturan', data: {} }];
    const tampil = (ns, pg) => {
      if (!ns || ns instanceof Error) return; Store.v.ns = ns;
      const a = ns.antrian, hook = pg && !(pg instanceof Error) ? pg.webhookUrl : '';
      ntIsi(`<div class="grid4 k2">
        <div class="kpi"><div class="row sb2"><span class="caps mut">Antrean menunggu</span><span class="sq ungu">${ic('hourglass', 's')}</span></div><div class="v">${a.antri + a.proses}</div><span class="xs mut">dikirim trigger tiap 1 menit</span></div>
        <div class="kpi"><div class="row sb2"><span class="caps mut">Terkirim 24 jam</span><span class="sq H">${ic('checkCircle', 's')}</span></div><div class="v">${a.terkirim24}</div><span class="xs mut">WA & email</span></div>
        <div class="kpi"><div class="row sb2"><span class="caps mut">Gagal 24 jam</span><span class="sq A">${ic('alert', 's')}</span></div><div class="v" style="${a.gagal24 ? 'color:var(--a-tx)' : ''}">${a.gagal24}</div><span class="xs mut">dicoba ulang maks. 3×</span></div>
        <div class="kpi"><div class="row sb2"><span class="caps mut">Kuota email harian</span><span class="sq S">${ic('mail', 's')}</span></div><div class="v">${ns.kuotaEmail === null ? '-' : ns.kuotaEmail}</div><span class="xs mut">sisa hari ini (MailApp)</span></div></div>
      <div class="cols half"><form class="card col" data-f="nt-saklar"><div class="card-h"><div><h3>Saklar utama & kecepatan kirim</h3><p class="xs mut2">Matikan saklar untuk menghentikan semua notifikasi otomatis kanal tersebut</p></div></div>
          <label class="row sb2" style="cursor:pointer"><span class="row">${ic('wa')}<span><b class="tx">WhatsApp (Fonnte)</b><br><span class="xs mut">${ns.tokenAda ? 'Token: <span class="mono">' + esc(ns.tokenSamar) + '</span>' : '<span class="err b">Token belum diatur</span>'}</span></span></span>${sw('name="waAktif"', ns.waAktif)}</label>
          <label class="row sb2" style="cursor:pointer"><span class="row">${ic('mail')}<span><b class="tx">Email (Gmail akun pemilik skrip)</b><br><span class="xs mut">Ke email siswa terdaftar · kuota ±100/hari</span></span></span>${sw('name="emailAktif"', ns.emailAktif)}</label>
          <div class="f2"><div class="fld"><label>Jeda acak antar pesan (detik)</label><input class="inp" name="jeda" value="${esc(ns.jeda || '3-8')}" pattern="\\d{1,2}-\\d{1,2}" placeholder="3-8"><span class="hint">Format min-maks, mis. 3-8 (anti-blokir)</span></div>
          <div class="fld"><label>Pesan per putaran trigger</label><input class="inp" type="number" name="batch" min="5" max="60" value="${esc(ns.batch || 25)}"><span class="hint">Per menit; 20–30 aman</span></div></div>
          <div class="row sb2">${ns.tokenAda ? '' : `<a class="btn soft sm" href="#/pengaturan?tab=rahasia">${ic('key', 's')} Atur token Fonnte</a>`}<span class="grow"></span><button class="btn p">${ic('save')} Simpan</button></div></form>
        <div class="stack"><form class="card col" data-f="nt-tes"><div class="card-h"><div><h3>Uji kirim</h3><p class="xs mut2">Langsung, tanpa antrean · maks. 5×/menit</p></div></div>
          <div class="row w" style="gap:8px"><select class="sel" name="kanal" style="width:120px"><option value="WA">WhatsApp</option><option value="EMAIL">Email</option></select><input class="inp grow" name="tujuan" placeholder="08xxxxxxxxxx / email" required style="min-width:160px"><button class="btn p">${ic('send')} Kirim</button></div><div id="tes-hasil"></div></form>
          <div class="card col"><div class="card-h"><div><h3>Webhook opt-out (balasan STOP / MULAI)</h3><p class="xs mut2">Tempel di Fonnte → Device → Webhook</p></div></div>
            ${hook ? `<div class="row"><code class="grow trunc xs" style="background:var(--sf2);padding:8px 10px;border-radius:10px">${esc(hook.replace(/secret=.+$/, 'secret=••••••'))}</code><button class="btn soft sm" data-a="salin" data-v="${esc(hook)}">${ic('copy', 's')} Salin</button></div>` : '<p class="sm mut">URL Web App belum terbaca (deploy dulu).</p>'}
            <p class="xs mut">Wali yang membalas <b>STOP</b> otomatis berhenti menerima pesan; <b>MULAI</b> untuk berlangganan lagi. URL berisi kunci rahasia — jangan dibagikan.</p></div>
          <div class="card row sb2"><div><b class="tx">Kirim antrean sekarang</b><p class="xs mut">Tanpa menunggu trigger berikutnya</p></div><button class="btn w" data-a="nt-proses">${ic('play')} Proses</button></div></div></div>`);
    };
    const c = calls.map(x => API.cached(x.action, x.data)); if (c[0]) tampil(...c);
    try { tampil(...await API.batch(calls)); } catch (e) { salah(e); }
  },
  async matriks() {
    const tampil = ns => {
      Store.v.ntm = Store.v.ntm || JSON.parse(JSON.stringify(ns.events));
      const ev = Store.v.ntm;
      ntIsi(`<div class="card"><div class="card-h"><div><h3>Kejadian yang memicu notifikasi</h3><p class="xs mut2">Saklar per kejadian berlaku bila saklar utama kanal aktif · variabel dalam {kurung kurawal} diisi otomatis</p></div><button class="btn p" data-a="ntm-simpan">${ic('save')} Simpan perubahan</button></div>
        <div class="tw"><table class="tbl"><thead><tr><th>Kejadian</th><th class="center">WhatsApp</th><th class="center">Email</th><th>Templat pesan</th><th></th></tr></thead><tbody>${Object.keys(ev).map(k => { const e = ev[k]; return `<tr><td><b class="tx">${esc(e.label)}</b><br><span class="xs mut mono">${esc(k)}</span>${e.wajib ? ' <span class="bd ungu xs">wajib</span>' : ''}</td>
          <td class="center">${e.wajib ? '<span class="bd ok">Selalu</span>' : sw(`data-c="ntm-sw" data-k="${k}" data-x="wa" aria-label="WA ${esc(e.label)}"`, e.wa)}</td><td class="center">${e.wajib ? '<span class="mut2">—</span>' : sw(`data-c="ntm-sw" data-k="${k}" data-x="email" aria-label="Email ${esc(e.label)}"`, e.email)}</td>
          <td><span class="xs clamp2" style="max-width:380px;white-space:pre-line">${esc(e.pesan)}</span>${e.pesan !== e.bawaan.pesan ? '<span class="bd info xs mt8">diubah</span>' : ''}</td><td><button class="btn ghost xs ico" data-a="ntm-edit" data-k="${k}" title="Ubah templat">${ic('edit', 's')}</button></td></tr>`; }).join('')}</tbody></table></div></div>
        <div class="card row top"><span class="sq ungu">${ic('info')}</span><p class="sm mut">Tautan masuk wali & konfirmasi opt-out bersifat wajib (keamanan). Setiap blast otomatis diberi kalimat <i>"Balas STOP untuk berhenti"</i>. Kontak yang memilih berhenti tidak akan dikirimi blast.</p></div>`);
    };
    const c = API.cached('notif.status', {}); if (c) tampil(c);
    try { const ns = await API.call('notif.status'); if (!c) tampil(ns); } catch (e) { salah(e); }
  },
  async antrean() {
    const st = Store.v.na = Object.assign({ j: 'antrian', hal: 1 }, Store.v.na || {});
    ntIsi(`<div class="card"><div class="row w sb2" style="margin-bottom:12px"><div class="seg"><button class="${st.j === 'antrian' ? 'on' : ''}" data-a="na-j" data-j="antrian">Antrean kirim</button><button class="${st.j === 'notif' ? 'on' : ''}" data-a="na-j" data-j="notif">Log notifikasi siswa</button></div><button class="btn w sm" data-a="nt-proses">${ic('play', 's')} Proses sekarang</button></div><div id="na">${skel(1, 300)}</div></div>`);
    V.logTabel('#na', st.j, st.hal);
  },
  async crm() {
    const tampil = list => {
      Store.v.crm = list; Store.v.crmSel = Store.v.crmSel || new Set();
      const f = Store.v.crf = Object.assign({ seg: '', wa: '', opt: '', k: '' }, Store.v.crf || {});
      const nTd = list.filter(k => !k.StatusWA && k.NoWA).length;
      ntIsi(`<div class="grid4 k2">${[['Total kontak', list.length, 'users', 'ungu'], ['Wali murid', list.filter(k => k.Segmen === 'Wali Murid').length, 'user', 'S'], ['Opt-out', list.filter(k => k.optout).length, 'stop', 'A'], ['Belum dicek WA', nTd, 'help', 'I']].map(x => `<div class="kpi"><div class="row sb2"><span class="caps mut">${x[0]}</span><span class="sq ${x[3]}">${ic(x[2], 's')}</span></div><div class="v">${x[1]}</div></div>`).join('')}</div>
        <div class="card"><div class="row w sb2" style="margin-bottom:12px"><div class="search" style="max-width:260px">${ic('search')}<input type="search" placeholder="Cari nama / nomor / tag…" data-i="tb-cari" data-t="crm" style="height:40px"></div>
          <div class="row w"><select class="sel pill" style="width:auto" data-c="crf" data-f="seg"><option value="">Semua segmen</option>${['Wali Murid', 'Guru'].map(s => `<option ${f.seg === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <select class="sel pill" style="width:auto" data-c="crf" data-f="k"><option value="">Semua kelas</option>${urut(ADM().kelas, k => k.nama_kelas).map(k => `<option value="${esc(k.id_kelas)}" ${f.k === String(k.id_kelas) ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select>
          <select class="sel pill" style="width:auto" data-c="crf" data-f="wa"><option value="">Status WA</option>${[['Terdaftar', 'Terdaftar'], ['Tidak Terdaftar', 'Tidak terdaftar'], ['-', 'Belum dicek']].map(s => `<option value="${s[0]}" ${f.wa === s[0] ? 'selected' : ''}>${s[1]}</option>`).join('')}</select>
          <select class="sel pill" style="width:auto" data-c="crf" data-f="opt"><option value="">Langganan</option><option value="aktif" ${f.opt === 'aktif' ? 'selected' : ''}>Berlangganan</option><option value="optout" ${f.opt === 'optout' ? 'selected' : ''}>Opt-out</option></select></div></div>
          <div class="row w sb2" style="margin-bottom:10px"><span class="sm" id="crm-sel">${V.crmSelInfo()}</span><div class="row w"><button class="btn w sm" data-a="crm-sync">${ic('refresh', 's')} Sinkronkan dari data siswa & guru</button><button class="btn w sm" data-a="crm-cek">${ic('checkCircle', 's')} Cek nomor WA</button><button class="btn ok sm" data-a="crm-blast">${ic('megaphone', 's')} Blast ke terpilih</button><button class="btn w sm" data-a="crm-xls">${ic('sheet', 's')}</button></div></div>
          ${Tabel.def('crm', { per: 15, sk: 'Nama', rows: V.crmRows, cari: k => [k.Nama, k.NoWA, k.Email, k.Tag, k.Info].join(' '),
            kolom: [{ k: 'pilih', l: `<input type="checkbox" data-c="crm-semua" aria-label="Pilih semua">`, sort: false, r: k => `<input type="checkbox" data-c="crm-pilih" data-id="${esc(k.KontakID)}" ${Store.v.crmSel.has(k.KontakID) ? 'checked' : ''} aria-label="Pilih ${esc(k.Nama)}">` },
              { k: 'Nama', l: 'Kontak', r: k => `<div class="row">${avatar(k.Nama || '?', 'sm')}<div><b class="tx">${esc(k.Nama || '(tanpa nama)')}</b><br><span class="xs mut">${esc(k.Info || k.Email || '')}</span></div></div>` },
              { k: 'NoWA', l: 'WhatsApp', r: k => k.NoWA ? `<a class="xs b" href="${waLink(k.NoWA)}" target="_blank" rel="noopener">${esc(hpTampil(k.NoWA))}</a>` : '<span class="mut2">—</span>' },
              { k: 'Segmen', l: 'Segmen', r: k => `<span class="bd ${k.Segmen === 'Guru' ? 'info' : 'ungu'}">${esc(k.Segmen || '-')}</span>${k.kelas && k.kelas.length ? `<br><span class="xs mut">${esc(k.kelas.map(kelasNama).join(', '))}</span>` : ''}` },
              { k: 'Tag', l: 'Tag', r: k => String(k.Tag || '').split(/[,\s]+/).filter(Boolean).map(t => `<span class="bd belum xs" style="margin:1px">${esc(t)}</span>`).join('') || '<span class="mut2">—</span>' },
              { k: 'StatusWA', l: 'Status', r: k => `${k.StatusWA === 'Terdaftar' ? '<span class="bd ok">WA aktif</span>' : k.StatusWA === 'Tidak Terdaftar' ? '<span class="bd bad">Bukan WA</span>' : '<span class="bd belum">Belum dicek</span>'}${k.optout ? '<br><span class="bd bad xs mt8">' + ic('stop', 's') + 'Opt-out</span>' : ''}` },
              { k: 'JumlahPesan', l: 'Pesan', num: true, r: k => `${angka(k.JumlahPesan || 0, 0)}${k.TerakhirDihubungi ? `<br><span class="xs mut">${esc(relatif(k.TerakhirDihubungi))}</span>` : ''}`, sort: k => Number(k.JumlahPesan || 0) },
              { k: 'x', l: '', sort: false, r: k => `<button class="btn soft xs" data-a="crm-detail" data-id="${esc(k.KontakID)}">Detail</button>` }] })}</div>`);
    };
    const c = API.cached('crm.list', {}); if (c) tampil(c);
    try { const l = await API.call('crm.list'); if (!c || JSON.stringify(c) !== JSON.stringify(l)) tampil(l); } catch (e) { ntIsi(`<div class="card">${kosong('alert', 'Gagal memuat kontak', esc(e.message))}</div>`); }
  },
  async blast() {
    const b = Store.v.bl = Object.assign({ mode: 'semua', seg: 'Wali Murid', kelas: [], tag: '', batch: 20, jeda: SET('JEDA_WA') || '3-8', judul: '', pesan: 'Assalamu\'alaikum Bapak/Ibu {nama},\n\n\n— {sekolah}' }, Store.v.bl || {});
    const sel = Store.v.crmSel || new Set();
    if (b.mode === 'kontak' && !sel.size) b.mode = 'semua';
    ntIsi(`<div class="cols"><form class="card col" data-f="blast"><div class="card-h"><div><h3>Blast WhatsApp baru</h3><p class="xs mut2">Dikirim bertahap oleh antrean · opt-out & nomor bukan WA otomatis dilewati</p></div></div>
        <div class="fld"><label>Judul (untuk arsip)</label><input class="inp" name="judul" value="${esc(b.judul)}" maxlength="150" required placeholder="Mis. Undangan rapat wali murid kelas VII"></div>
        <div class="fld"><label>Sasaran</label><div class="seg">${[['semua', 'Semua di segmen'], ['kelas', 'Per kelas'], ['tag', 'Per tag'], ['kontak', 'Kontak terpilih (' + sel.size + ')']].map(x => `<button type="button" class="${b.mode === x[0] ? 'on' : ''}" data-a="bl-mode" data-m="${x[0]}" ${x[0] === 'kontak' && !sel.size ? 'disabled title="Pilih kontak di tab Kontak CRM"' : ''}>${x[1]}</button>`).join('')}</div></div>
        ${b.mode === 'kontak' ? '' : `<div class="fld"><label>Segmen</label><select class="sel" name="seg">${['Wali Murid', 'Guru'].map(s => `<option ${b.seg === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>`}
        ${b.mode === 'kelas' ? `<div class="fld"><label>Kelas</label><div class="row w" style="gap:6px">${urut(ADM().kelas, k => k.nama_kelas).map(k => `<label class="chk card flat" style="padding:6px 10px"><input type="checkbox" name="kelas" value="${esc(k.id_kelas)}" ${b.kelas.includes(String(k.id_kelas)) ? 'checked' : ''}><span>${esc(k.nama_kelas)}</span></label>`).join('')}</div></div>` : ''}
        ${b.mode === 'tag' ? `<div class="fld"><label>Tag</label><input class="inp" name="tag" value="${esc(b.tag)}" placeholder="mis. komite"></div>` : ''}
        <div class="fld"><label class="row sb2">Isi pesan <span class="xs mut" id="bl-n">${b.pesan.length}/3500</span></label><textarea class="ta" name="pesan" rows="8" maxlength="3500" data-i="bl-pesan" required>${esc(b.pesan)}</textarea>
          <div class="row w" style="gap:6px">${['{nama}', '{anak}', '{kelas}', '{sekolah}', '{link}'].map(v => `<button type="button" class="btn soft xs" data-a="bl-var" data-v="${v}">${v}</button>`).join('')}<span class="xs mut">*tebal* · _miring_</span></div></div>
        <div class="f2"><div class="fld"><label>Ukuran batch</label><div class="seg">${[10, 20, 50].map(n => `<button type="button" class="${Number(b.batch) === n ? 'on' : ''}" data-a="bl-batch" data-n="${n}">${n} / putaran</button>`).join('')}</div></div>
          <div class="fld"><label>Jeda antar pesan (detik)</label><input class="inp" name="jeda" value="${esc(b.jeda)}" pattern="\\d{1,2}-\\d{1,2}"></div></div>
        <div id="bl-prev"></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn w" data-a="bl-pratinjau">${ic('eye')} Pratinjau sasaran</button><button class="btn ok">${ic('send')} Kirim blast</button></div></form>
      <div class="stack"><div class="card"><div class="card-h"><h3>Riwayat blast</h3><button class="btn ghost xs ico" data-a="bl-muat" title="Muat ulang">${ic('refresh', 's')}</button></div><div id="bl-list">${skel(1, 180)}</div></div>
        <div class="card row top"><span class="sq I">${ic('shield')}</span><div class="sm"><b class="tx">Tips anti-blokir</b><p class="xs mut mt8">Gunakan jeda 3–8 detik, batch 20, isi pesan yang personal ({nama}, {anak}). Hindari tautan pendek. Cek nomor WA di tab Kontak sebelum blast besar.</p></div></div></div></div>`);
    V.muatBlast();
  }
};
// ---- ringkasan: saklar, uji, proses
FRM['nt-saklar'] = f => sibuk($('button.p', f), async () => { const d = formData(f); const ns = await API.call('notif.simpanMatriks', { matriks: Store.v.ns ? V.matriksKirim(Store.v.ns.events) : {}, waAktif: d.waAktif, emailAktif: d.emailAktif, jeda: d.jeda, batch: d.batch }); Store.v.ns = ns; Store.v.ntm = null; toast('Pengaturan notifikasi disimpan.'); });
FRM['nt-tes'] = f => sibuk($('button.p', f), async () => { const r = await API.call('notif.tes', formData(f)); $('#tes-hasil').innerHTML = `<div class="card flat sm mt8 row">${r.ok ? '<span class="bd ok">Berhasil</span>' : '<span class="bd bad">Gagal</span>'}<span class="grow">${esc(r.respon || '')}</span></div>`; }, 'Mengirim…');
ACT['nt-proses'] = el => sibuk(el, async () => { const r = await API.call('notif.proses'); toast(r.sibuk ? 'Antrean sedang diproses trigger — coba sebentar lagi.' : r.kosong || !r.diproses ? 'Antrean kosong.' : `${r.diproses} pesan diproses: ${r.terkirim || 0} terkirim, ${r.gagal || 0} gagal.`, r.gagal ? 'warn' : 'ok'); if (Store.v.nt.tab === 'antrean') V.logTabel('#na', Store.v.na.j, 1); else NT.status(); }, 'Memproses…');
// ---- matriks & templat
V.matriksKirim = ev => { const o = {}; Object.keys(ev).forEach(k => { o[k] = { wa: ev[k].wa, email: ev[k].email, pesan: ev[k].pesan, subjek: ev[k].subjek }; }); return o; };
CHG['ntm-sw'] = el => { Store.v.ntm[el.dataset.k][el.dataset.x] = el.checked; };
ACT['ntm-simpan'] = el => sibuk(el, async () => { const ns = await API.call('notif.simpanMatriks', { matriks: V.matriksKirim(Store.v.ntm) }); Store.v.ns = ns; Store.v.ntm = JSON.parse(JSON.stringify(ns.events)); toast('Matriks & templat notifikasi disimpan.'); NT.matriks(); });
ACT['ntm-edit'] = el => {
  const k = el.dataset.k, e = Store.v.ntm[k], vars = [...new Set((e.bawaan.pesan + e.bawaan.subjek).match(/\{\w+\}/g) || [])];
  Modal.open(`${Modal.head('Templat: ' + esc(e.label), esc(k), 'edit')}<form class="modal-b col" data-f="ntm" data-k="${k}">
    <div class="fld"><label>Subjek (email)</label><input class="inp" name="subjek" value="${esc(e.subjek)}"></div>
    <div class="fld"><label>Isi pesan</label><textarea class="ta" name="pesan" rows="8">${esc(e.pesan)}</textarea><span class="hint">Variabel tersedia: ${vars.map(v => `<code>${esc(v)}</code>`).join(' ')}. Format WhatsApp: *tebal*, _miring_.</span></div>
    <div class="row sb2"><button type="button" class="btn ghost sm" data-a="ntm-bawaan" data-k="${k}">${ic('refresh', 's')} Kembalikan bawaan</button><div class="row"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">Terapkan</button></div></div></form>`, { size: 'lg' });
};
ACT['ntm-bawaan'] = el => { const e = Store.v.ntm[el.dataset.k], f = el.closest('form'); $('[name=pesan]', f).value = e.bawaan.pesan; $('[name=subjek]', f).value = e.bawaan.subjek; };
FRM.ntm = f => { const e = Store.v.ntm[f.dataset.k], d = formData(f); e.pesan = d.pesan || e.bawaan.pesan; e.subjek = d.subjek || e.bawaan.subjek; Modal.close(); NT.matriks(); toast('Templat diterapkan — klik "Simpan perubahan" untuk menyimpan.', 'warn'); };
// ---- antrean & log (dipakai juga menu Log)
ACT['na-j'] = el => { Store.v.na = { j: el.dataset.j, hal: 1 }; $$('[data-a=na-j]').forEach(b => b.classList.toggle('on', b === el)); V.logTabel('#na', el.dataset.j, 1); };
ACT['log-hal'] = el => V.logTabel(el.dataset.w, el.dataset.j, Number(el.dataset.h));
V.logTabel = async (wadah, jenis, hal) => {
  const q = { jenis, hal }, act = 'admin.log';
  const status = s => ({ Terkirim: 'ok', terkirim: 'ok', Gagal: 'bad', gagal: 'bad', Antri: 'info', Proses: 'warn', Batal: 'belum' }[s] || 'belum');
  const kol = {
    antrian: [['DibuatPada', 'Dibuat', x => `<span class="xs nowrap">${esc(fWaktu(x.DibuatPada))}</span>`], ['Kanal', 'Kanal', x => `<span class="bd ${x.Kanal === 'WA' ? 'ok' : 'info'}">${esc(x.Kanal)}</span>`], ['Tujuan', 'Tujuan', x => `<span class="xs mono">${esc(x.Tujuan)}</span><br><span class="xs mut">${esc(x.NamaPenerima || '')}</span>`],
      ['Event', 'Kejadian', x => `<span class="xs">${esc(x.Event)}</span>${x.BlastID ? '<br><span class="bd ungu xs">blast</span>' : ''}`], ['Status', 'Status', x => `<span class="bd ${status(x.Status)}">${esc(x.Status)}</span>${Number(x.Percobaan) > 1 ? `<br><span class="xs mut">${x.Percobaan}× coba</span>` : ''}`], ['Respon', 'Respon', x => `<span class="xs mut clamp2" style="max-width:260px">${esc(x.Respon || '')}</span>`]],
    notif: [['waktu', 'Waktu', x => `<span class="xs nowrap">${esc(fWaktu(x.waktu))}</span>`], ['nama_siswa', 'Siswa', x => esc(x.nama_siswa || '-')], ['kanal', 'Kanal', x => `<span class="bd ${x.kanal === 'WA' ? 'ok' : 'info'}">${esc(x.kanal)}</span>`], ['jenis_event', 'Kejadian', x => `<span class="xs">${esc(x.jenis_event)}</span>`], ['status', 'Status', x => `<span class="bd ${status(x.status)}">${esc(x.status)}</span>`]],
    audit: [['waktu', 'Waktu', x => `<span class="xs nowrap">${esc(fWaktu(x.waktu))}</span>`], ['pelaku', 'Pelaku', x => `<span class="xs">${esc(x.pelaku)}</span>`], ['aksi', 'Aksi', x => `<span class="bd ${/hapus|cabut|koreksi/.test(x.aksi) ? 'warn' : /rahasia|darurat/.test(x.aksi) ? 'bad' : 'ungu'}">${esc(x.aksi)}</span>`], ['objek', 'Objek', x => `<span class="xs mono trunc" style="display:inline-block;max-width:180px">${esc(x.objek)}</span>`], ['keterangan', 'Keterangan', x => `<span class="xs clamp2" style="max-width:360px" title="${esc(x.keterangan)}">${esc(x.keterangan)}</span>`]]
  }[jenis];
  const tampil = d => {
    const el = $(wadah); if (!el) return;
    el.innerHTML = `<div class="tw"><table class="tbl"><thead><tr>${kol.map(k => `<th>${k[1]}</th>`).join('')}</tr></thead><tbody>${d.rows.length ? d.rows.map(x => `<tr>${kol.map(k => `<td>${k[2](x)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${kol.length}">${kosong('inbox', 'Belum ada catatan')}</td></tr>`}</tbody></table></div>
      <div class="pager"><span>Halaman <b class="tx">${d.hal}</b> dari <b class="tx">${d.halaman}</b> · ${d.total} baris (terbaru di atas)</span><div class="btns"><button data-a="log-hal" data-w="${wadah}" data-j="${jenis}" data-h="${d.hal - 1}" ${d.hal <= 1 ? 'disabled' : ''}>‹ Baru</button><button data-a="log-hal" data-w="${wadah}" data-j="${jenis}" data-h="${d.hal + 1}" ${d.hal >= d.halaman ? 'disabled' : ''}>Lama ›</button></div></div>`;
  };
  const c = API.cached(act, q); if (c) tampil(c);
  try { tampil(await API.call(act, q)); } catch (e) { const el = $(wadah); if (el) el.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
};
// ---- CRM kontak
V.crmRows = () => { const f = Store.v.crf || {}; return (Store.v.crm || []).filter(k => (!f.seg || k.Segmen === f.seg) && (!f.wa || (f.wa === '-' ? !k.StatusWA : k.StatusWA === f.wa)) && (!f.opt || (f.opt === 'optout') === !!k.optout) && (!f.k || (k.kelas || []).includes(f.k))); };
V.crmSelInfo = () => { const n = (Store.v.crmSel || new Set()).size; return n ? `<b class="tx">${n} kontak terpilih</b> · <button class="btn ghost xs" data-a="crm-bersih">Kosongkan</button>` : '<span class="mut">Centang kontak untuk cek WA / blast terarah</span>'; };
CHG.crf = el => { Store.v.crf[el.dataset.f] = el.value; Tabel.cfg.crm.hal = 1; Tabel.refresh('crm'); };
CHG['crm-pilih'] = el => { const s = Store.v.crmSel; el.checked ? s.add(el.dataset.id) : s.delete(el.dataset.id); $('#crm-sel').innerHTML = V.crmSelInfo(); };
CHG['crm-semua'] = el => { const s = Store.v.crmSel; Tabel.data('crm').forEach(k => el.checked ? s.add(k.KontakID) : s.delete(k.KontakID)); Tabel.refresh('crm'); $('#crm-sel').innerHTML = V.crmSelInfo(); };
ACT['crm-bersih'] = () => { Store.v.crmSel.clear(); Tabel.refresh('crm'); $('#crm-sel').innerHTML = V.crmSelInfo(); };
ACT['crm-sync'] = el => sibuk(el, async () => { const r = await API.call('crm.sync'); toast(`Sinkron selesai: ${r.ditambah} kontak baru, ${r.diperbarui} diperbarui.`); NT.crm(); }, 'Menyinkronkan…');
ACT['crm-cek'] = el => sibuk(el, async () => { const ids = [...(Store.v.crmSel || [])]; const r = await API.call('crm.cekWA', { ids }, { timeout: 90000 }); toast(r.dicek ? `${r.dicek} nomor dicek: ${r.terdaftar} terdaftar WA, ${r.tidak} tidak.` : 'Semua nomor sudah pernah dicek. Centang kontak untuk cek ulang.', r.dicek ? 'ok' : 'warn'); NT.crm(); }, 'Memeriksa…');
ACT['crm-blast'] = () => { if (!Store.v.crmSel.size) return toast('Centang kontak terlebih dahulu.', 'warn'); Store.v.bl = Object.assign(Store.v.bl || {}, { mode: 'kontak' }); Store.v.nt.tab = 'blast'; R.go('#/notif?tab=blast'); };
ACT['crm-xls'] = () => Ekspor.xlsx('Kontak CRM ' + hariIni(), [{ nama: 'Kontak', rows: [['Nama', 'No WA', 'Email', 'Segmen', 'Kelas', 'Tag', 'Status WA', 'Opt-out', 'Jumlah pesan', 'Terakhir dihubungi', 'Catatan']].concat(Tabel.data('crm').map(k => [k.Nama, k.NoWA, k.Email, k.Segmen, (k.kelas || []).map(kelasNama).join(', '), k.Tag, k.StatusWA, k.optout ? 'YA' : '', k.JumlahPesan, k.TerakhirDihubungi, k.Catatan])) }]);
ACT['crm-detail'] = el => {
  const k = Store.v.crm.find(x => x.KontakID === el.dataset.id); if (!k) return;
  Modal.open(`${Modal.head(esc(k.Nama || 'Kontak'), esc(k.Segmen + ' · ' + (k.Info || k.Sumber || '')), 'user')}<div class="modal-b col">
    <div class="row w sb2"><div class="col" style="gap:2px"><span class="sm">${ic('wa', 's')} ${esc(hpTampil(k.NoWA))} ${k.StatusWA ? `<span class="bd ${k.StatusWA === 'Terdaftar' ? 'ok' : 'bad'} xs">${esc(k.StatusWA)}</span>` : ''}</span>${k.Email ? `<span class="sm">${ic('mail', 's')} ${esc(k.Email)}</span>` : ''}<span class="xs mut">${angka(k.JumlahPesan || 0, 0)} pesan terkirim${k.TerakhirDihubungi ? ' · terakhir ' + esc(relatif(k.TerakhirDihubungi)) : ''}</span></div>${k.NoWA ? `<a class="btn ok sm" href="${waLink(k.NoWA)}" target="_blank" rel="noopener">${ic('wa', 's')} Chat</a>` : ''}</div>
    <form class="card flat col" data-f="crm-simpan" data-id="${esc(k.KontakID)}"><div class="fld"><label>Tag (pisahkan dengan koma)</label><input class="inp" name="Tag" value="${esc(k.Tag || '')}" placeholder="komite, alumni"></div><div class="fld"><label>Catatan</label><textarea class="ta" name="Catatan" rows="2">${esc(k.Catatan || '')}</textarea></div>
      <label class="row sb2" style="cursor:pointer"><span><b class="tx">Berlangganan notifikasi</b><br><span class="xs mut">Matikan = opt-out (tidak menerima blast & notifikasi)</span></span>${sw('name="langganan"', !k.optout)}</label><button class="btn p" style="align-self:flex-end">${ic('save')} Simpan</button></form>
    <div><div class="row sb2"><h4>Riwayat interaksi</h4></div><form class="row w mt8" data-f="crm-int" data-id="${esc(k.KontakID)}" style="gap:6px"><select class="sel" name="Kanal" style="width:120px">${['Telepon', 'WA', 'Kunjungan', 'Email', 'Rapat'].map(x => `<option>${x}</option>`).join('')}</select><select class="sel" name="Arah" style="width:100px"><option>Keluar</option><option>Masuk</option></select><input class="inp grow" name="Ringkasan" placeholder="Ringkasan interaksi…" required style="min-width:160px"><button class="btn soft">${ic('plus', 's')}</button></form>
      <div id="crm-int" class="col mt12" style="gap:8px">${skel(1, 60)}</div></div></div>`, { size: 'lg' });
  V.crmInt(k.KontakID);
};
V.crmInt = async id => { try { const l = await API.call('crm.interaksi', { KontakID: id }); const el = $('#crm-int'); if (el) el.innerHTML = l.length ? l.map(x => `<div class="tl ${x.Arah === 'Masuk' ? 'prestasi' : 'bimbingan'}"><div class="row sb2 xs"><span class="bd ${x.Kanal === 'WA' ? 'ok' : 'info'}">${esc(x.Kanal)} · ${esc(x.Arah)}</span><span class="mut">${esc(fWaktu(x.Tanggal))}</span></div><p class="sm">${esc(x.Ringkasan)}</p><span class="xs mut">oleh ${esc(x.Oleh)}</span></div>`).join('') : '<p class="sm mut">Belum ada interaksi.</p>'; } catch (e) { salah(e); } };
FRM['crm-simpan'] = f => sibuk($('button.p', f), async () => { const d = formData(f); const row = await API.call('crm.simpan', { KontakID: f.dataset.id, Tag: d.Tag, Catatan: d.Catatan, OptOut: !d.langganan }); const k = Store.v.crm.find(x => x.KontakID === f.dataset.id); Object.assign(k, row, { optout: !d.langganan }); Tabel.refresh('crm'); toast('Kontak diperbarui.'); });
FRM['crm-int'] = f => sibuk($('button', f), async () => { const d = formData(f); d.KontakID = f.dataset.id; await API.call('crm.tambahInteraksi', d); f.reset(); V.crmInt(f.dataset.id); });
// ---- blast
const blSasaran = () => { const b = Store.v.bl; if (b.mode === 'kontak') return { kontak: [...Store.v.crmSel] }; const s = { segmen: b.seg }; if (b.mode === 'kelas') s.kelas = b.kelas; if (b.mode === 'tag') s.tag = b.tag; return s; };
const blBaca = () => { const f = $('form[data-f=blast]'); if (!f) return; const d = formData(f), b = Store.v.bl; b.judul = d.judul || ''; b.pesan = d.pesan || ''; b.jeda = d.jeda || '3-8'; if (d.seg) b.seg = d.seg; if (b.mode === 'kelas') b.kelas = $$('input[name=kelas]:checked', f).map(x => x.value); if (b.mode === 'tag') b.tag = d.tag || ''; };
ACT['bl-mode'] = el => { blBaca(); Store.v.bl.mode = el.dataset.m; NT.blast(); };
ACT['bl-batch'] = el => { Store.v.bl.batch = Number(el.dataset.n); $$('[data-a=bl-batch]').forEach(b => b.classList.toggle('on', b === el)); };
ACT['bl-var'] = el => { const t = $('[name=pesan]'), p = t.selectionStart || t.value.length; t.value = t.value.slice(0, p) + el.dataset.v + t.value.slice(t.selectionEnd || p); t.focus(); t.selectionStart = t.selectionEnd = p + el.dataset.v.length; INP['bl-pesan'](t); };
INP['bl-pesan'] = el => { const n = $('#bl-n'); if (n) n.textContent = el.value.length + '/3500'; };
ACT['bl-pratinjau'] = el => sibuk(el, async () => {
  blBaca(); const b = Store.v.bl;
  if (b.mode === 'kelas' && !b.kelas.length) throw new Error('Pilih minimal satu kelas.');
  const r = await API.call('blast.buat', { Judul: b.judul || 'Pratinjau', Pesan: b.pesan || '-', sasaran: blSasaran(), pratinjau: true });
  const contoh = (r.contoh[0] || {}).nama || 'Bapak/Ibu', isi = b.pesan.replace(/\{nama\}/g, contoh).replace(/\{anak\}/g, 'Ananda').replace(/\{kelas\}/g, 'VII-A').replace(/\{sekolah\}/g, SET('NAMA_SEKOLAH') || '').replace(/\{link\}/g, SET('APP_URL') || '');
  const menit = Math.ceil(r.total / b.batch);
  $('#bl-prev').innerHTML = `<div class="card flat col" style="gap:10px"><div class="row w sb2"><b class="tx">${r.total} penerima</b><span class="xs mut">± ${menit} menit (batch ${b.batch}/menit, jeda ${esc(b.jeda)} dtk)</span></div>
    <div class="row w" style="gap:6px">${r.contoh.map(c => `<span class="bd belum">${esc(c.nama)} · ${esc(c.no)}</span>`).join('')}${r.total > r.contoh.length ? `<span class="xs mut">+${r.total - r.contoh.length} lainnya</span>` : ''}</div>
    <div style="background:#E7FFDB;color:#111;border-radius:12px 12px 12px 2px;padding:10px 12px;white-space:pre-line;font-size:13px;max-width:420px">${esc(isi)}<div style="color:#667;font-size:11px;margin-top:6px;font-style:italic">Balas STOP untuk berhenti menerima notifikasi.</div></div></div>`;
}, 'Menghitung…');
FRM.blast = f => {
  blBaca(); const b = Store.v.bl;
  if (b.mode === 'kelas' && !b.kelas.length) return toast('Pilih minimal satu kelas.', 'warn');
  sibuk($('button.ok', f), async () => {
    const pv = await API.call('blast.buat', { Judul: b.judul, Pesan: b.pesan, sasaran: blSasaran(), pratinjau: true });
    if (!(await Modal.konfirmasi('Kirim blast ke ' + pv.total + ' kontak?', `Pesan "<b>${esc(b.judul)}</b>" akan dikirim bertahap ${b.batch} pesan/menit dengan jeda ${esc(b.jeda)} detik. Blast dapat dihentikan kapan saja.`, { ok: 'Kirim sekarang' }))) return;
    const r = await API.call('blast.buat', { Judul: b.judul, Pesan: b.pesan, sasaran: blSasaran(), UkuranBatch: b.batch, JedaDetik: b.jeda });
    toast(`Blast dijadwalkan ke ${r.total} kontak.`); Store.v.bl.judul = ''; $('#bl-prev').innerHTML = ''; f.reset(); V.muatBlast();
  }, 'Menyiapkan…');
};
ACT['bl-muat'] = () => V.muatBlast();
ACT['bl-stop'] = async el => { if (await Modal.konfirmasi('Hentikan blast?', 'Pesan yang belum terkirim akan dibatalkan.', { ok: 'Hentikan', bahaya: true })) sibuk(null, async () => { V.blastList(await API.call('blast.stop', { BlastID: el.dataset.id })); toast('Blast dihentikan.'); }); };
V.blastList = l => { const el = $('#bl-list'); if (!el) return; el.innerHTML = l.length ? l.map(x => { const sel = Number(x.Terkirim || 0) + Number(x.Gagal || 0), tot = Number(x.Total || 0); return `<div class="it" style="align-items:flex-start"><span class="sq ${x.Status === 'Berjalan' ? 'ok' : x.Status === 'Dihentikan' ? 'A' : 'ungu'}">${ic('megaphone')}</span><div class="grow"><div class="row sb2"><b class="tx sm trunc">${esc(x.Judul)}</b><span class="bd ${x.Status === 'Berjalan' ? 'warn' : x.Status === 'Selesai' ? 'ok' : 'belum'}">${esc(x.Status)}</span></div><span class="xs mut">${esc(fWaktu(x.Tanggal))} · batch ${esc(x.UkuranBatch)} · jeda ${esc(x.JedaDetik)} dtk</span><div class="mt8">${prog(persen(sel, tot), x.Gagal > 0 ? 'var(--i)' : 'var(--h)')}</div><div class="row sb2 xs mt8"><span>${x.Terkirim || 0} terkirim · <span class="${Number(x.Gagal) ? 'err' : ''}">${x.Gagal || 0} gagal</span> · ${tot} total</span>${x.Status === 'Berjalan' ? `<button class="btn ghost xs" data-a="bl-stop" data-id="${esc(x.BlastID)}">${ic('stop', 's')} Hentikan</button>` : ''}</div></div></div>`; }).join('') : kosong('megaphone', 'Belum ada blast'); };
V.muatBlast = async () => { const c = API.cached('blast.list', {}); if (c) V.blastList(c); try { V.blastList(await API.call('blast.list')); } catch (e) { salah(e); } };

// ---------------------------------------------------------------- MIGRASI DARI SPREADSHEET LAMA
R.def('migrasi', () => {
  if (!isAdmin()) return khususAdmin();
  const st = Store.v.mg = Object.assign({ sumber: '', scan: null, sheet: '', tabel: 'Siswa', pemetaan: {}, buatKelas: true, hasil: null }, Store.v.mg || {});
  const sh = st.scan ? st.scan.sheets.find(s => s.nama === st.sheet) : null, cfg = TBA[st.tabel];
  const langkah = (n, judul, isi, aktif) => `<div class="card col ${aktif ? '' : 'flat'}" style="${aktif ? '' : 'opacity:.6'}"><div class="row"><span class="sq ${aktif ? 'ungu' : 'belum'}" style="width:30px;height:30px"><b>${n}</b></span><h3>${judul}</h3></div>${aktif ? isi : ''}</div>`;
  return `${halAdmin('Migrasi & Impor Data', 'Pindahkan data dari spreadsheet aplikasi lama atau ekspor Dapodik. Spreadsheet sumber hanya dibaca — tidak pernah diubah.', 'Migrasi & Impor', `<button class="btn w" data-a="dt-impor" data-t="Siswa">${ic('upload')} Impor dari berkas Excel/CSV</button>`)}
  <div class="cols"><div class="stack">
    ${langkah(1, 'Spreadsheet sumber', `<form class="row w" data-f="mg-pindai" style="gap:8px"><input class="inp grow" name="sumber" value="${esc(st.sumber)}" placeholder="https://docs.google.com/spreadsheets/d/…  atau ID spreadsheet" required style="min-width:240px"><button class="btn p">${ic('search')} Pindai</button></form><p class="xs mut">Harus bisa dibuka oleh akun Google pemilik skrip (akun yang men-deploy Web App).</p>${st.scan ? `<div class="bd ok" style="align-self:flex-start">${ic('checkCircle', 's')} ${esc(st.scan.nama)} · ${st.scan.sheets.length} sheet</div>` : ''}`, true)}
    ${langkah(2, 'Pilih sheet', st.scan ? `<div class="col" style="gap:6px">${st.scan.sheets.map(s => `<label class="it clk" style="cursor:pointer;${st.sheet === s.nama ? 'background:var(--p-50);border-radius:12px' : ''}"><input type="radio" name="mg-sheet" data-c="mg-sheet" value="${esc(s.nama)}" ${st.sheet === s.nama ? 'checked' : ''}><div class="grow"><b class="tx sm">${esc(s.nama)}</b><br><span class="xs mut">${s.baris} baris · ${s.header.length} kolom</span></div>${s.saran ? `<span class="bd ungu">cocok: ${esc(TBA[s.saran].l)}</span>` : '<span class="bd belum">tidak dikenali</span>'}</label>`).join('')}</div>` : '', !!st.scan)}
    ${langkah(3, 'Cocokkan kolom', sh ? `<div class="row w" style="gap:10px"><div class="fld" style="min-width:180px"><label>Tujuan</label><select class="sel" data-c="mg-tabel">${Object.keys(TBA).map(t => `<option value="${t}" ${st.tabel === t ? 'selected' : ''}>${TBA[t].l}</option>`).join('')}</select></div>${st.tabel === 'Siswa' || st.tabel === 'Mapel' ? `<label class="chk" style="margin-top:22px"><input type="checkbox" data-c="mg-kelas" ${st.buatKelas ? 'checked' : ''}><span>Buat kelas otomatis bila belum ada</span></label>` : ''}</div>
      <div class="tw"><table class="tbl"><thead><tr><th>Kolom aplikasi</th><th>Kolom di sheet "${esc(sh.nama)}"</th></tr></thead><tbody>${cfg.kol.map(k => `<tr><td><b class="tx">${esc(LBL[k])}</b>${cfg.wajib.includes(k) ? ' <span class="err">*</span>' : ''}<br><span class="xs mut mono">${k}</span></td><td><select class="sel" data-c="mg-map" data-k="${k}"><option value="">— lewati —</option>${sh.header.map(h => `<option ${st.pemetaan[k] === h ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="justify-content:flex-end"><button class="btn w" data-a="mg-jalan" data-d="1">${ic('search')} Pindai hasil (uji coba)</button><button class="btn p" data-a="mg-jalan" data-d="0" ${st.hasil && st.hasil.dryRun && st.hasil.tambah + st.hasil.ubah ? '' : 'disabled title="Jalankan uji coba dulu"'}>${ic('database')} Jalankan migrasi</button></div><div id="mg-hasil">${st.hasil ? impHasil(st.hasil, st.hasil.dryRun) : ''}</div>` : '', !!sh)}
  </div><div class="stack">
    <div class="card"><h3>Urutan yang disarankan</h3><div class="col mt12" style="gap:10px">${[['school', 'Kelas', 'Nama kelas & email wali kelas'], ['user', 'Guru & staf', 'Nama, email Google, peran'], ['users', 'Siswa', 'NIS, nama, kelas, wali & nomor WA'], ['book', 'Mata pelajaran', 'Mapel, kelas, email guru pengampu']].map((x, i) => `<div class="row"><span class="sq ungu" style="width:32px;height:32px">${ic(x[0], 's')}</span><div><b class="tx sm">${i + 1}. ${x[1]}</b><br><span class="xs mut">${x[2]}</span></div></div>`).join('')}</div></div>
    <div class="card col" style="gap:10px"><h3>Aman diulang</h3>${[['shield', 'Spreadsheet lama hanya dibaca, tidak pernah ditulis.'], ['refresh', 'Jalankan ulang kapan saja (delta-sync) — data yang sama diperbarui, bukan digandakan.'], ['key', 'Kunci pencocokan: NIS (siswa), email (guru), nama kelas, mapel+kelas.'], ['lock', 'Keputusan baru di aplikasi (mis. status nonaktif) tidak ditimpa data lama.'], ['hourglass', 'Maks. 3.000 baris per jalan; pecah sheet bila lebih.']].map(x => `<p class="sm row top">${ic(x[0], 's')}<span>${x[1]}</span></p>`).join('')}</div></div></div>`;
});
FRM['mg-pindai'] = f => sibuk($('button', f), async () => { const st = Store.v.mg; st.sumber = formData(f).sumber; st.scan = await API.call('migrasi.pindai', { sumber: st.sumber }, { timeout: 90000 }); const s = st.scan.sheets.find(x => x.saran) || st.scan.sheets[0]; st.sheet = s ? s.nama : ''; st.tabel = s && s.saran ? s.saran : 'Siswa'; st.pemetaan = s ? Object.assign({}, s.pemetaan) : {}; st.hasil = null; R.render(); }, 'Memindai…');
CHG['mg-sheet'] = el => { const st = Store.v.mg, s = st.scan.sheets.find(x => x.nama === el.value); st.sheet = s.nama; st.tabel = s.saran || st.tabel; st.pemetaan = Object.assign({}, s.pemetaan); st.hasil = null; R.render(); };
CHG['mg-tabel'] = el => { const st = Store.v.mg, s = st.scan.sheets.find(x => x.nama === st.sheet); st.tabel = el.value; st.pemetaan = s.saran === el.value ? Object.assign({}, s.pemetaan) : V.tebakPemetaan(el.value, s.header); st.hasil = null; R.render(); };
CHG['mg-kelas'] = el => { Store.v.mg.buatKelas = el.checked; };
CHG['mg-map'] = el => { const p = Store.v.mg.pemetaan; if (el.value) p[el.dataset.k] = el.value; else delete p[el.dataset.k]; Store.v.mg.hasil = null; const b = $('[data-a=mg-jalan][data-d="0"]'); if (b) b.disabled = true; };
V.tebakPemetaan = (t, header) => { const out = {}, n = s => String(s).toLowerCase().replace(/[_\-.]+/g, ' ').trim(); TBA[t].kol.forEach(k => { const h = header.find(x => n(x) === n(k) || n(x) === n(LBL[k] || '')); if (h) out[k] = h; }); return out; };
ACT['mg-jalan'] = el => {
  const st = Store.v.mg, dry = el.dataset.d === '1', cfg = TBA[st.tabel];
  const kurang = cfg.wajib.filter(k => !st.pemetaan[k]);
  if (kurang.length) return toast('Kolom wajib belum dipetakan: ' + kurang.map(k => LBL[k]).join(', '), 'warn');
  const jalan = () => sibuk(el, async () => {
    const r = await API.call('migrasi.jalankan', { sumber: st.sumber, sheet: st.sheet, tabel: st.tabel, pemetaan: st.pemetaan, buatKelas: st.buatKelas, dryRun: dry }, { timeout: 330000 });
    st.hasil = r; R.render();
    if (!dry) { toast(`Migrasi ${cfg.l}: ${r.tambah} ditambah, ${r.ubah} diperbarui.`); App.segarkan(); }
  }, dry ? 'Memindai…' : 'Memigrasikan…');
  if (dry) return jalan();
  Modal.konfirmasi('Jalankan migrasi?', `${st.hasil.tambah} baris akan ditambah dan ${st.hasil.ubah} diperbarui di tabel <b>${esc(cfg.l)}</b>. Proses ini aman diulang.`, { ok: 'Jalankan' }).then(ok => ok && jalan());
};

// ---------------------------------------------------------------- LOG AUDIT & SESI
R.def('log', r => {
  if (!isAdmin()) return khususAdmin();
  const st = Store.v.lg = Object.assign({ tab: 'audit' }, Store.v.lg || {});
  if (r.q.tab) st.tab = r.q.tab;
  return { html: `${halAdmin('Log Aktivitas & Sesi', 'Jejak perubahan nilai, absensi, data induk, dan pengaturan. Cabut sesi bila perangkat hilang.', 'Log & Sesi')}
    <div class="tabs">${[['audit', 'Log audit', 'history'], ['notif', 'Log notifikasi', 'bell'], ['sesi', 'Sesi wali murid', 'phoneApp']].map(t => `<button class="tab ${st.tab === t[0] ? 'on' : ''}" data-a="lg-tab" data-t="${t[0]}">${ic(t[2], 's')} ${t[1]}</button>`).join('')}</div>
    <div class="card" id="lg">${skel(1, 300)}</div>`,
    after: () => { if (st.tab === 'sesi') V.sesiWali(); else V.logTabel('#lg', st.tab, 1); } };
});
ACT['lg-tab'] = el => { Store.v.lg.tab = el.dataset.t; R.go('#/log?tab=' + el.dataset.t); };
V.sesiWali = async () => {
  const tampil = l => { const el = $('#lg'); if (!el) return; el.innerHTML = `<div class="card-h"><div><h3>Sesi wali murid aktif</h3><p class="xs mut2">${l.length} sesi · berlaku ${esc(SET('SESI_HARI_WALI') || 7)} hari sejak masuk</p></div></div>
    <div class="tw"><table class="tbl"><thead><tr><th>No WA</th><th>Anak</th><th>Masuk</th><th>Kedaluwarsa</th><th></th></tr></thead><tbody>${l.length ? l.map(s => `<tr><td class="mono xs">${esc(s.no_wa)}</td><td>${esc(s.anak)}</td><td class="xs">${esc(fWaktu(s.dibuat_pada))}</td><td class="xs">${esc(relatif(s.kedaluwarsa))}</td><td><button class="btn ghost xs" data-a="lg-cabut" data-no="${esc(s.kunci)}">${ic('logout', 's')} Cabut</button></td></tr>`).join('') : `<tr><td colspan="5">${kosong('phoneApp', 'Tidak ada sesi wali aktif')}</td></tr>`}</tbody></table></div>
    <form class="card flat row w mt16" data-f="lg-cabut" style="gap:8px"><div class="grow"><b class="tx sm">Cabut semua sesi guru/admin</b><p class="xs mut">Misal HP/laptop guru hilang. Pengguna harus masuk ulang.</p></div><input class="inp" type="email" name="email" placeholder="email@sekolah" required style="max-width:260px"><button class="btn bad">${ic('logout')} Cabut</button></form>`; };
  try { tampil(await API.call('admin.sesiWali')); } catch (e) { salah(e); }
};
ACT['lg-cabut'] = async el => { if (await Modal.konfirmasi('Cabut sesi wali ini?', 'Wali harus meminta tautan masuk baru lewat WhatsApp.', { ok: 'Cabut', bahaya: true })) sibuk(null, async () => { const r = await API.call('admin.cabutSesi', { no_wa: el.dataset.no }); toast(r.pesan); V.sesiWali(); }); };
FRM['lg-cabut'] = f => sibuk($('button', f), async () => { const r = await API.call('admin.cabutSesi', formData(f)); f.reset(); toast(r.pesan); });

// ---------------------------------------------------------------- PENGATURAN & RAHASIA
const GRUP_SET = {
  sekolah: { l: 'Identitas sekolah', i: 'school', k: ['NAMA_SEKOLAH', 'NAMA_APLIKASI', 'KOP_BARIS1', 'KOP_BARIS2', 'ALAMAT_SEKOLAH', 'KEPALA_SEKOLAH', 'NIP_KEPALA_SEKOLAH'] },
  akademik: { l: 'Akademik & jadwal', i: 'calendar', k: ['TAHUN_AJARAN', 'SEMESTER', 'SEMESTER_MULAI', 'KKM', 'BOBOT_KUIS', 'JADWAL_JAM'] },
  aturan: { l: 'Aturan & privasi', i: 'sliders', k: ['WALI_LIHAT_CATATAN', 'BERKAS_TUGAS_PUBLIK', 'MAKS_UNGGAH_MB', 'JAM_PENGINGAT', 'BATAS_ALFA', 'BATAS_TERLAMBAT'] },
  rahasia: { l: 'Kunci & rahasia', i: 'key' },
  sistem: { l: 'Sistem & deployment', i: 'cloud' }
};
const YA_TIDAK = ['WALI_LIHAT_CATATAN', 'BERKAS_TUGAS_PUBLIK', 'NOTIF_WA_AKTIF', 'NOTIF_EMAIL_AKTIF'], ANGKA = ['KKM', 'BOBOT_KUIS', 'MAKS_UNGGAH_MB', 'JAM_PENGINGAT', 'BATAS_ALFA', 'BATAS_TERLAMBAT', 'BATCH_ANTRIAN'];
const TRIGGER_APP = [['prosesAntrianNotif', 'Kirim antrean notifikasi', 'tiap 1 menit'], ['pengingatTenggatHarian', 'Pengingat tenggat tugas', 'harian'], ['bersihkanTokenKedaluwarsa', 'Bersihkan token & sesi kedaluwarsa', 'harian 02:00'], ['warmupCache', 'Pemanasan cache (anti lambat)', 'tiap 10 menit']];
R.def('pengaturan', r => {
  if (!isAdmin()) return khususAdmin();
  const st = Store.v.pg = Object.assign({ tab: 'sekolah' }, Store.v.pg || {});
  if (r.q.tab && GRUP_SET[r.q.tab]) st.tab = r.q.tab;
  const c = API.cached('admin.pengaturan', {});
  return { html: `${halAdmin('Pengaturan Aplikasi', 'Disimpan di sheet Pengaturan; token & kunci rahasia hanya di Script Properties (tidak pernah tampil utuh).', 'Pengaturan')}
    <div class="tabs">${Object.keys(GRUP_SET).map(k => `<button class="tab ${st.tab === k ? 'on' : ''}" data-a="pg-tab" data-t="${k}">${ic(GRUP_SET[k].i, 's')} ${GRUP_SET[k].l}</button>`).join('')}</div>
    <div id="pg" class="col gap24">${c ? V.pgHtml(c) : skel(1, 360)}</div>`,
    after: async () => { try { const d = await API.call('admin.pengaturan'); if (!c || JSON.stringify(c) !== JSON.stringify(d)) { const el = $('#pg'); if (el && !el.contains(document.activeElement)) el.innerHTML = V.pgHtml(d); } } catch (e) { salah(e); } } };
});
ACT['pg-tab'] = el => { Store.v.pg.tab = el.dataset.t; R.go('#/pengaturan?tab=' + el.dataset.t); };
V.pgHtml = d => {
  Store.v.pgData = d;
  const st = Store.v.pg, s = {}, ket = {}; d.pengaturan.forEach(x => { s[x.kunci] = x.nilai; ket[x.kunci] = x.keterangan; });
  if (st.tab === 'rahasia') {
    const r = d.rahasia;
    return `<div class="cols half"><form class="card col" data-f="pg-rahasia" data-k="GOOGLE_CLIENT_ID"><div class="card-h"><div><h3>${ic('logIn', 's')} Google Client ID</h3><p class="xs mut2">Untuk tombol "Masuk dengan Google" (murid, guru, admin)</p></div>${r.GOOGLE_CLIENT_ID.ada ? '<span class="bd ok">Terpasang</span>' : '<span class="bd bad">Belum ada</span>'}</div>
        <div class="fld"><label>Client ID (publik)</label><input class="inp mono" name="nilai" value="${esc(r.GOOGLE_CLIENT_ID.nilai || '')}" placeholder="1234567890-abc.apps.googleusercontent.com"></div>
        <ol class="sm mut" style="padding-left:18px;line-height:1.7"><li>Buka <b>console.cloud.google.com</b> → APIs & Services → Credentials.</li><li>Create credentials → <b>OAuth client ID</b> → Web application.</li><li>Authorized JavaScript origins: <code>${esc(location.origin)}</code></li><li>Salin Client ID ke kolom di atas.</li></ol>
        <div class="row" style="justify-content:flex-end"><button class="btn p">${ic('save')} Simpan</button></div></form>
      <form class="card col" data-f="pg-rahasia" data-k="FONNTE_TOKEN"><div class="card-h"><div><h3>${ic('wa', 's')} Token Fonnte (WhatsApp)</h3><p class="xs mut2">Rahasia — disimpan di Script Properties, tampil tersamar</p></div>${r.FONNTE_TOKEN.ada ? '<span class="bd ok">Tersimpan</span>' : '<span class="bd bad">Belum ada</span>'}</div>
        ${r.FONNTE_TOKEN.ada ? `<div class="card flat row sm">${ic('lock', 's')} <span class="mono grow">${esc(r.FONNTE_TOKEN.samar)}</span></div>` : ''}
        <div class="fld"><label>Token baru</label><input class="inp mono" type="password" name="nilai" autocomplete="off" placeholder="${r.FONNTE_TOKEN.ada ? 'Kosongkan bila tidak diubah' : 'Tempel token dari dashboard Fonnte'}"><span class="hint">Fonnte → Device → Token. Token tidak pernah dikirim kembali ke browser.</span></div>
        <div class="row sb2">${r.FONNTE_TOKEN.ada ? `<button type="button" class="btn ghost sm" data-a="pg-hapus-rahasia" data-k="FONNTE_TOKEN">${ic('trash', 's')} Hapus token</button>` : '<span></span>'}<button class="btn p">${ic('save')} Simpan token</button></div></form></div>
      <div class="card row top"><span class="sq A">${ic('shield')}</span><div class="sm"><b class="tx">Rahasia lain dikelola otomatis</b><p class="xs mut mt8">Kunci sesi (SESSION_SECRET), sandi akses darurat (hash + salt), dan kunci webhook dibuat otomatis saat <code>setupAppEnvironment()</code> dan tidak dapat dilihat dari dasbor. Untuk mengganti: jalankan <code>rotasiSecretSesi()</code> (semua pengguna keluar) atau <code>resetAksesDarurat()</code> dari editor Apps Script.</p></div></div>`;
  }
  if (st.tab === 'sistem') {
    const trg = TRIGGER_APP.map(t => [t, d.trigger.includes(t[0])]);
    const saran = location.origin + location.pathname.replace(/index\.html$/, '');
    return `<div class="cols half"><form class="card col" data-f="pg-set"><div class="card-h"><div><h3>Alamat aplikasi (APP_URL)</h3><p class="xs mut2">${esc(ket.APP_URL || '')}</p></div>${s.APP_URL ? '<span class="bd ok">Terisi</span>' : '<span class="bd bad">Kosong</span>'}</div>
        <div class="fld"><input class="inp mono" name="APP_URL" value="${esc(s.APP_URL || '')}" placeholder="https://username.github.io/portal-spendas/"></div>
        ${!window.DEMO && saran.startsWith('https://') && s.APP_URL !== saran ? `<button type="button" class="btn soft sm" style="align-self:flex-start" data-a="pg-pakai-url" data-v="${esc(saran)}">${ic('link', 's')} Pakai alamat ini: ${esc(saran)}</button>` : ''}
        <p class="xs mut">Dipakai pada tautan masuk wali & pesan WhatsApp. Tautan masuk hanya pernah memakai alamat ini (anti-phishing).</p><div class="row" style="justify-content:flex-end"><button class="btn p">${ic('save')} Simpan</button></div></form>
      <div class="card col"><div class="card-h"><div><h3>Backend (Apps Script)</h3><p class="xs mut2">Versi ${esc(d.versi)}</p></div></div>
        ${d.webAppUrl ? `<div class="row"><code class="grow trunc xs" style="background:var(--sf2);padding:8px 10px;border-radius:10px">${esc(d.webAppUrl)}</code><button class="btn soft sm" data-a="salin" data-v="${esc(d.webAppUrl)}">${ic('copy', 's')}</button></div>` : ''}
        <span class="caps mut">Trigger otomatis</span><div class="col" style="gap:4px">${trg.map(x => `<div class="row sm"><span class="sq ${x[1] ? 'H' : 'A'}" style="width:24px;height:24px;border-radius:8px">${ic(x[1] ? 'check' : 'x', 's')}</span><span class="grow">${x[0][1]}<br><span class="xs mut">${x[0][0]} · ${x[0][2]}</span></span></div>`).join('')}</div>
        <div class="row w"><button class="btn w sm" data-a="pg-trigger">${ic('refresh', 's')} Pasang ulang trigger</button><button class="btn w sm" data-a="pg-cache">${ic('zap', 's')} Muat ulang cache</button></div>
        <p class="xs mut">Muat ulang cache setelah mengedit spreadsheet secara manual agar perubahan langsung tampil.</p></div></div>
      <div class="card row top"><span class="sq ungu">${ic('info')}</span><p class="sm mut">Setelah mengubah kode backend: <b>Deploy → Manage deployments → Edit → Version: New version → Deploy</b>. URL <code>/exec</code> tetap sama sehingga frontend tidak perlu diubah.</p></div>`;
  }
  const g = GRUP_SET[st.tab];
  const fld = k => {
    const v = s[k] === undefined ? '' : s[k], l = `<label for="s-${k}">${esc(ket[k] || k)}</label>`;
    if (k === 'JADWAL_JAM') { let j = []; try { j = JSON.parse(v || '[]'); } catch (e) { } Store.v.jam = j; return `<div class="fld" style="grid-column:1/-1"><label>Jadwal jam pelajaran</label><div id="jam-ed">${V.jamEditor()}</div><span class="hint">Dipakai untuk memilih "jam ke-" otomatis saat guru mencatat absensi.</span></div>`; }
    if (YA_TIDAK.includes(k)) return `<label class="card flat row sb2" style="cursor:pointer;grid-column:1/-1"><span class="sm"><b class="tx">${esc(k.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase()))}</b><br><span class="mut">${esc(ket[k] || '')}</span></span>${sw(`name="${k}" data-yt="1"`, String(v).toUpperCase() === 'YA')}</label>`;
    if (k === 'SEMESTER') return `<div class="fld">${l}<select class="sel" id="s-${k}" name="${k}">${['Ganjil', 'Genap'].map(x => `<option ${v === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
    if (k === 'SEMESTER_MULAI') return `<div class="fld">${l}<input class="inp" type="date" id="s-${k}" name="${k}" value="${esc(v)}"></div>`;
    return `<div class="fld" ${/ALAMAT/.test(k) ? 'style="grid-column:1/-1"' : ''}>${l}<input class="inp" id="s-${k}" name="${k}" value="${esc(v)}" ${ANGKA.includes(k) ? `type="number" min="0" ${k === 'JAM_PENGINGAT' ? 'max="23"' : k === 'KKM' ? 'max="100"' : ''}` : ''}></div>`;
  };
  return `<form class="card col" data-f="pg-set"><div class="card-h"><h3>${ic(g.i, 's')} ${g.l}</h3></div><div class="f2">${g.k.map(fld).join('')}</div>
    ${st.tab === 'akademik' ? `<p class="xs mut">${ic('info', 's')} Mengubah <b>tanggal awal semester</b> akan menghitung ulang rekap absensi sejak tanggal tersebut. Arsip data semester lama: jalankan <code>arsipAbsensiSebelum()</code> di editor.</p>` : ''}
    <div class="row" style="justify-content:flex-end"><button class="btn p">${ic('save')} Simpan pengaturan</button></div></form>`;
};
V.jamEditor = () => `<div class="col" style="gap:6px">${Store.v.jam.map((j, i) => `<div class="row" style="gap:6px"><span class="sq ungu" style="width:34px;height:34px"><b>${i + 1}</b></span><input class="inp" type="time" value="${esc(j.mulai)}" data-i="jam" data-n="${i}" data-f="mulai" style="max-width:130px" aria-label="Mulai jam ${i + 1}"><span class="mut">–</span><input class="inp" type="time" value="${esc(j.selesai)}" data-i="jam" data-n="${i}" data-f="selesai" style="max-width:130px" aria-label="Selesai jam ${i + 1}"><button type="button" class="btn ghost xs ico" data-a="jam-hapus" data-n="${i}" title="Hapus">${ic('x', 's')}</button></div>`).join('')}
  <button type="button" class="btn soft sm" style="align-self:flex-start" data-a="jam-tambah">${ic('plus', 's')} Tambah jam</button></div>`;
INP.jam = el => { Store.v.jam[Number(el.dataset.n)][el.dataset.f] = el.value; };
ACT['jam-tambah'] = () => { const j = Store.v.jam, l = j[j.length - 1]; const tambah = (t, m) => { if (!t) return '07:00'; const [h, mi] = t.split(':').map(Number), x = h * 60 + mi + m; return p2(Math.floor(x / 60) % 24) + ':' + p2(x % 60); }; j.push({ ke: j.length + 1, mulai: l ? l.selesai : '07:00', selesai: tambah(l ? l.selesai : '07:00', 40) }); $('#jam-ed').innerHTML = V.jamEditor(); };
ACT['jam-hapus'] = el => { Store.v.jam.splice(Number(el.dataset.n), 1); Store.v.jam.forEach((j, i) => j.ke = i + 1); $('#jam-ed').innerHTML = V.jamEditor(); };
ACT['pg-pakai-url'] = el => { const i = $('[name=APP_URL]'); i.value = el.dataset.v; i.focus(); };
FRM['pg-set'] = f => sibuk($('button.p', f), async () => {
  const lama = {}; Store.v.pgData.pengaturan.forEach(x => lama[x.kunci] = String(x.nilai === undefined ? '' : x.nilai));
  const kv = {};
  $$('input[name],select[name]', f).forEach(el => { const v = el.dataset.yt ? (el.checked ? 'YA' : 'TIDAK') : String(el.value).trim(); if (v !== lama[el.name]) kv[el.name] = v; });
  if ($('#jam-ed', f)) { const j = JSON.stringify(Store.v.jam.filter(x => x.mulai && x.selesai).map((x, i) => ({ ke: i + 1, mulai: x.mulai, selesai: x.selesai }))); if (j !== lama.JADWAL_JAM) kv.JADWAL_JAM = j; }
  if (!Object.keys(kv).length) return toast('Tidak ada perubahan.', 'warn');
  const d = await API.call('admin.simpanPengaturan', { kv });
  $('#pg').innerHTML = V.pgHtml(d); toast(Object.keys(kv).length + ' pengaturan disimpan.'); App.segarkan();
}, 'Menyimpan…');
FRM['pg-rahasia'] = f => sibuk($('button.p', f), async () => { const v = formData(f).nilai; if (!v) return toast('Isi nilai terlebih dahulu (kosong = tidak berubah).', 'warn'); const d = await API.call('admin.simpanRahasia', { kunci: f.dataset.k, nilai: v }); $('#pg').innerHTML = V.pgHtml(d); toast('Tersimpan aman di Script Properties.'); }, 'Menyimpan…');
ACT['pg-hapus-rahasia'] = async el => { if (await Modal.konfirmasi('Hapus token?', 'Notifikasi WhatsApp berhenti sampai token baru diisi.', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { $('#pg').innerHTML = V.pgHtml(await API.call('admin.simpanRahasia', { kunci: el.dataset.k, nilai: '__HAPUS__' })); toast('Token dihapus.'); }); };
ACT['pg-trigger'] = el => sibuk(el, async () => { const r = await API.call('admin.pasangTrigger'); Store.v.pgData.trigger = r.trigger || Store.v.pgData.trigger; toast('Trigger terpasang: ' + (r.trigger || []).length + ' fungsi.'); $('#pg').innerHTML = V.pgHtml(Store.v.pgData); });
ACT['pg-cache'] = el => sibuk(el, async () => { const r = await API.call('admin.muatUlangCache'); toast(r.pesan); App.segarkan(); });
