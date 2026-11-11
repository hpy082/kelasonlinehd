/* =====================================================================
   Tampilan GURU MAPEL & WALI KELAS — beranda, kelas, materi, tugas,
   bank soal, kuis, buku nilai, absensi per jam, pantauan kelas,
   catatan siswa, laporan (grafik + tabel + ekspor)
   ===================================================================== */
'use strict';
const G = () => B().guru || { mapel: [], mapelWali: [], kelas: [], siswa: [], materi: [], tugas: [], kuis: [], soal: {} };
const labelMapel = m => m ? m.nama_mapel + ' · ' + m.kelas : '';
const opsiMapel = (list, pilih, kosongL) => (kosongL ? `<option value="">${kosongL}</option>` : '') + list.map(m => `<option value="${esc(m.id_mapel)}" ${pilih === m.id_mapel ? 'selected' : ''}>${esc(labelMapel(m))}</option>`).join('');
const siswaKelasG = k => G().siswa.filter(s => s.id_kelas === k);

// ---------------------------------------------------------------- BERANDA GURU
V.berandaGuru = () => {
  const g = G(), u = U(), now = sekarang();
  const perluNilai = g.tugas.filter(t => t.terkumpul > t.dinilai).sort((a, b) => (b.terkumpul - b.dinilai) - (a.terkumpul - a.dinilai));
  const dekat = urut(g.tugas.filter(t => tms(t.deadline) > now && t.status !== 'draf'), t => tms(t.deadline)).slice(0, 4);
  const kuisAktif = g.kuis.filter(k => tms(k.waktu_buka) <= now && tms(k.waktu_tutup) >= now);
  const jmlSiswa = new Set(g.siswa.map(s => s.id_siswa)).size;
  const wk = u.kelasWali || [];
  const materi = urut(g.materi, m => tms(m.tanggal_terbit) || 0, -1).slice(0, 3).map(m => Object.assign({ nama_mapel: namaMapel(m.id_mapel) }, m));
  const html = `${hero('Selamat datang, ' + esc(u.nama), 'Kelola materi, tugas, presensi per jam, dan buku nilai kelas Anda dalam satu tempat.', 'Guru · ' + g.mapel.length + ' mapel' + (wk.length ? ' · Wali Kelas ' + wk.map(k => esc(k.nama_kelas)).join(', ') : ''),
    `<a class="btn glass" href="#/absensi">${ic('userCheck')} Catat absensi</a><a class="btn white" href="#/nilai">${ic('award')} Buka buku nilai</a>`)}
  <div class="grid4 k2">
    <div class="kpi"><div class="row sb2"><span class="caps mut">Mapel diampu</span><span class="sq ungu">${ic('book', 's')}</span></div><div class="v">${g.mapel.length}</div><span class="xs mut trunc">${esc([...new Set(g.mapel.map(m => m.kelas))].join(', ') || '-')}</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Siswa</span><span class="sq S">${ic('users', 's')}</span></div><div class="v">${jmlSiswa}</div><span class="xs mut">${g.kelas.length} kelas</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Perlu dinilai</span><span class="sq I">${ic('edit', 's')}</span></div><div class="v">${perluNilai.reduce((a, t) => a + t.terkumpul - t.dinilai, 0)}</div><span class="xs mut">dari ${perluNilai.length} tugas</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Kuis aktif</span><span class="sq A">${ic('timer', 's')}</span></div><div class="v">${kuisAktif.length}</div><span class="xs mut">${kuisAktif.reduce((a, k) => a + k.selesai, 0)} siswa sudah mengerjakan</span></div></div>
  <div class="cols"><div class="stack">
    <div class="card"><div class="card-h"><div><h3>Perlu dinilai</h3><p class="xs mut2">Pengumpulan yang belum diberi nilai</p></div><a class="see" href="#/tugas">SEMUA TUGAS</a></div>${perluNilai.length ? perluNilai.slice(0, 5).map(t => `<div class="it"><span class="sq I">${ic('clipboard')}</span><div class="grow"><b class="tx sm trunc" style="display:block">${esc(t.judul)}</b><span class="xs mut">${esc(labelMapel(mapelById(t.id_mapel)))} · ${t.terkumpul - t.dinilai} belum dinilai</span></div><a class="btn p xs" href="#/buku/${esc(t.id_mapel)}?t=${esc(t.id_tugas)}">Nilai</a></div>`).join('') : kosong('checkCircle', 'Semua pengumpulan sudah dinilai')}</div>
    <div class="card"><div class="card-h"><h3>Tenggat terdekat</h3><button class="btn soft sm" data-a="tugas-form">${ic('plus', 's')} Tugas baru</button></div>${dekat.length ? dekat.map(t => `<div class="it"><span class="sq ungu">${ic('clock')}</span><div class="grow"><div class="row sb2"><b class="tx sm trunc">${esc(t.judul)}</b><span class="xs b p">${t.terkumpul}/${t.total}</span></div><span class="xs mut">${esc(labelMapel(mapelById(t.id_mapel)))} · ${esc(relatif(t.deadline))}</span><div class="mt8">${prog(persen(t.terkumpul, t.total))}</div></div></div>`).join('') : kosong('clipboard', 'Tidak ada tugas aktif', '', `<button class="btn p sm" data-a="tugas-form">${ic('plus', 's')} Buat tugas</button>`)}</div>
    <section>${secH('Materi saya', 'Terbaru diterbitkan', '#/materi')}${materi.length ? `<div class="gridc scroll">${materi.map(m => kartuMateri(m, { tanpaProg: true, meta: (mapelById(m.id_mapel) || {}).kelas })).join('')}</div>` : `<div class="card">${kosong('book', 'Belum ada materi', '', `<button class="btn p sm" data-a="materi-form">${ic('plus', 's')} Tambah materi</button>`)}</div>`}</section>
  </div><div class="stack">
    ${wk.length ? `<div class="card" id="wk-mini"><div class="card-h"><div><h3>Kelas perwalian ${esc(wk[0].nama_kelas)}</h3><p class="xs mut2">Ringkasan hari ini</p></div><a class="see" href="#/pantauan">PANEL</a></div><div class="sk" style="height:120px"></div></div>` : ''}
    <div class="card"><div class="card-h"><h3>Absensi cepat</h3><span class="xs mut">${esc(fHari(hariIni()))}</span></div>${g.mapel.map(m => `<a class="it" href="#/absensi?m=${esc(m.id_mapel)}" style="text-decoration:none"><span class="sq" style="background:var(--${gayaMapel(m.nama_mapel).c});color:${gayaMapel(m.nama_mapel).w}">${ic(gayaMapel(m.nama_mapel).i)}</span><div class="grow"><b class="tx sm">${esc(m.nama_mapel)}</b><br><span class="xs mut">${esc(m.kelas)}</span></div><span class="btn soft xs">${ic('userCheck', 's')} Catat</span></a>`).join('') || kosong('book', 'Belum ada mapel')}</div>
    ${(B().live || []).length ? `<div class="card"><div class="card-h"><h3>Kelas live</h3><a class="see" href="#/live">SEMUA</a></div>${B().live.slice(0, 3).map(l => `<div class="it">${tms(l.mulai) <= now && tms(l.selesai) >= now ? '<span class="sq A">' + ic('video') + '</span>' : '<span class="sq ungu">' + ic('video') + '</span>'}<div class="grow"><b class="tx sm trunc" style="display:block">${esc(l.judul)}</b><span class="xs mut">${esc(l.kelas)} · ${esc(relatif(l.mulai))}</span></div></div>`).join('')}</div>` : ''}
    ${(B().pengumuman || []).length ? `<div class="card"><div class="card-h"><h3>Pengumuman</h3><a class="see" href="#/pengumuman">SEMUA</a></div>${kartuPengumuman(B().pengumuman[0])}</div>` : ''}
  </div></div>`;
  return { html, after: () => { if (wk.length) V.wkMini(wk[0].id_kelas); } };
};
V.wkMini = async kelas => {
  try {
    const p = await API.call('walikelas.panel', { id_kelas: kelas }, { ttl: 60000 });
    const el = $('#wk-mini'); if (!el) return;
    const h = p.hariIni;
    el.innerHTML = `<div class="card-h"><div><h3>Kelas perwalian ${esc(p.kelas.nama_kelas)}</h3><p class="xs mut2">${p.acuan === hariIni() ? 'Hari ini' : esc(fHari(p.acuan))}</p></div><a class="see" href="#/pantauan">PANEL</a></div>
      <div class="row" style="gap:16px">${Chart.donut([{ l: 'Hadir', v: h.H, c: STATUS_WARNA.H }, { l: 'Sakit', v: h.S, c: STATUS_WARNA.S }, { l: 'Izin', v: h.I, c: STATUS_WARNA.I }, { l: 'Alfa', v: h.A, c: STATUS_WARNA.A }], h.persen === null ? '-' : angka(h.persen, 0) + '%', 'hadir', 96)}
      <div class="grow col" style="gap:6px">${p.perhatian.length ? '<span class="caps mut">Perlu perhatian</span>' + p.perhatian.slice(0, 3).map(s => `<a class="row sm" href="#/pantauan?s=${esc(s.id_siswa)}">${avatar(s.nama, 'sm')}<span class="grow trunc tx b">${esc(s.nama)}</span><span class="bd bad">${s.flags.length}</span></a>`).join('') : '<span class="bd ok">Tidak ada siswa yang perlu perhatian</span>'}</div></div>`;
  } catch (e) { const el = $('#wk-mini .sk'); if (el) el.outerHTML = `<p class="sm mut">${esc(e.message)}</p>`; }
};

// ---------------------------------------------------------------- KELAS SAYA (guru)
V.kelasGuru = () => {
  const g = G(), u = U();
  if (!g.mapel.length && !g.mapelWali.length) return kosong('users', 'Belum ada kelas', 'Minta admin menautkan Anda sebagai pengampu mapel.');
  const kartu = m => { const gy = gayaMapel(m.nama_mapel), n = siswaKelasG(m.id_kelas).length, mt = g.materi.filter(x => x.id_mapel === m.id_mapel).length, tg = g.tugas.filter(x => x.id_mapel === m.id_mapel).length, kz = g.kuis.filter(x => x.id_mapel === m.id_mapel).length;
    return `<div class="card col"><div class="row"><span class="sq lg" style="background:var(--${gy.c});color:${gy.w}">${ic(gy.i, 'l')}</span><div class="grow"><h3>${esc(m.nama_mapel)}</h3><p class="sm mut">${esc(m.kelas)} · ${n} siswa · ${esc(m.jam_per_minggu || '-')} JP/minggu</p></div></div>
      <div class="grid3">${[['Materi', mt], ['Tugas', tg], ['Kuis', kz]].map(x => `<div class="card flat center" style="padding:10px"><b class="tx" style="font-size:18px">${x[1]}</b><div class="xs mut">${x[0]}</div></div>`).join('')}</div>
      <div class="row w"><a class="btn soft sm" href="#/absensi?m=${esc(m.id_mapel)}">${ic('userCheck', 's')} Absensi</a><a class="btn soft sm" href="#/buku/${esc(m.id_mapel)}">${ic('award', 's')} Buku nilai</a><a class="btn soft sm" href="#/laporan?m=${esc(m.id_mapel)}">${ic('pie', 's')} Laporan</a><button class="btn ghost sm" data-a="roster" data-k="${esc(m.id_kelas)}">${ic('users', 's')} Siswa</button></div></div>`; };
  return `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Kelas Saya</b></div><h1>Kelas & Mata Pelajaran</h1><p class="mut mt8">${esc(u.nama)} mengampu ${g.mapel.length} mapel${u.isWaliKelas ? ' · wali kelas ' + u.kelasWali.map(k => esc(k.nama_kelas)).join(', ') : ''}.</p></div></div>
    <div class="grid3">${g.mapel.map(kartu).join('')}</div>
    ${u.isWaliKelas ? `<div class="card row w sb2"><div class="row"><span class="sq ungu lg">${ic('chart', 'l')}</span><div><h3>Kelas perwalian: ${u.kelasWali.map(k => esc(k.nama_kelas)).join(', ')}</h3><p class="sm mut">Pantau kehadiran, nilai lintas mapel, dan catatan siswa.</p></div></div><div class="row"><a class="btn p" href="#/pantauan">${ic('chart')} Panel pantauan</a><button class="btn w" data-a="roster" data-k="${esc(u.kelasWali[0].id_kelas)}">${ic('users')} Daftar siswa</button></div></div>` : ''}`;
};
ACT.roster = el => {
  const k = el.dataset.k, s = siswaKelasG(k), kl = G().kelas.find(x => x.id_kelas === k) || {};
  Modal.open(`${Modal.head('Siswa ' + esc(kl.nama_kelas || ''), s.length + ' siswa aktif · wali kelas ' + esc(kl.wali_kelas || '-'), 'users')}<div class="modal-b">${s.map((x, i) => `<div class="it">${avatar(x.nama, 'sm')}<div class="grow"><b class="tx sm">${i + 1}. ${esc(x.nama)}</b><br><span class="xs mut">NIS ${esc(x.nis)}${x.nama_wali ? ' · Wali: ' + esc(x.nama_wali) : ''}</span></div>${x.no_wa_wali ? `<a class="btn ok xs" href="${waLink(x.no_wa_wali)}" target="_blank" rel="noopener">${ic('wa', 's')} WA</a>` : ''}</div>`).join('')}</div>`);
};

// ---------------------------------------------------------------- MATERI: form & hapus
ACT['materi-form'] = el => {
  const id = el.dataset && el.dataset.id, m = id ? G().materi.find(x => x.id_materi === id) : {};
  if (!G().mapel.length) return toast('Anda belum menjadi pengampu mapel.', 'warn');
  if (id) Modal.close();
  Modal.open(`${Modal.head(id ? 'Ubah materi' : 'Tambah materi', 'Unggah dokumen atau tautkan video YouTube / Google Drive', 'book')}<form class="modal-b col" data-f="materi" data-id="${esc(id || '')}">
    <div class="f2"><div class="fld"><label>Mata pelajaran</label><select class="sel" name="id_mapel" required>${opsiMapel(G().mapel, m.id_mapel || (Store.v.materi || {}).m)}</select></div>
    <div class="fld"><label>Jenis</label><select class="sel" name="jenis">${[['video', 'Video'], ['dokumen', 'Dokumen'], ['presentasi', 'Presentasi'], ['tautan', 'Tautan web']].map(o => `<option value="${o[0]}" ${m.jenis === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div></div>
    <div class="fld"><label>Judul materi</label><input class="inp" name="judul" value="${esc(m.judul || '')}" maxlength="150" required></div>
    <div class="fld"><label>Sumber</label><div class="seg"><button type="button" class="on" data-a="materi-sumber" data-s="tautan">${ic('link', 's')} Tautan</button><button type="button" data-a="materi-sumber" data-s="berkas">${ic('upload', 's')} Unggah berkas</button></div></div>
    <div class="fld" id="src-tautan"><input class="inp" type="url" name="tautan" placeholder="https://youtu.be/… atau https://drive.google.com/…" value="${esc(m.tautan || '')}"><span class="hint">Video besar: unggah ke YouTube (unlisted) lalu tempel tautannya — hemat kuota Drive.</span></div>
    <div class="fld hide" id="src-berkas"><input class="inp" type="file" name="berkas" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"><span class="hint">Maks ${Berkas.maksMB()} MB. Disimpan di Drive: Materi/[Kelas]/[Mapel].</span></div>
    <div class="fld"><label>Deskripsi</label><textarea class="ta" name="deskripsi" rows="3" maxlength="2000">${esc(m.deskripsi || '')}</textarea></div>
    <div class="fld"><label>Status</label><div class="seg"><label><input type="radio" name="status" value="terbit" class="sr" ${m.status !== 'draf' ? 'checked' : ''}><span class="btn xs ${m.status !== 'draf' ? 'p' : 'ghost'}" data-a="radio-seg">Terbitkan</span></label><label><input type="radio" name="status" value="draf" class="sr" ${m.status === 'draf' ? 'checked' : ''}><span class="btn xs ${m.status === 'draf' ? 'p' : 'ghost'}" data-a="radio-seg">Simpan sebagai draf</span></label></div></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('save')} Simpan materi</button></div></form>`);
};
ACT['radio-seg'] = el => { const lb = el.closest('label'), inp = $('input', lb); inp.checked = true; $$('[data-a=radio-seg]', lb.parentNode).forEach(b => b.className = 'btn xs ' + (b === el ? 'p' : 'ghost')); };
ACT['materi-sumber'] = el => { $$('[data-a=materi-sumber]').forEach(b => b.classList.toggle('on', b === el)); $('#src-tautan').classList.toggle('hide', el.dataset.s !== 'tautan'); $('#src-berkas').classList.toggle('hide', el.dataset.s !== 'berkas'); };
FRM.materi = f => sibuk($('button.p', f), async () => {
  const d = formData(f), fl = $('[name=berkas]', f).files[0]; delete d.berkas;
  if (f.dataset.id) d.id_materi = f.dataset.id;
  if (!$('#src-berkas').classList.contains('hide') && fl) d.file = await Berkas.baca(fl);
  else if (!d.tautan) throw new Error('Isi tautan atau pilih berkas.');
  await API.call('materi.simpan', d, { timeout: 180000 }); Modal.close(); toast('Materi tersimpan.'); await App.segarkan();
}, 'Menyimpan…');
ACT['materi-hapus'] = async el => { if (await Modal.konfirmasi('Hapus materi ini?', 'Komentar terkait tidak akan tampil lagi.', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { await API.call('materi.hapus', { id_materi: el.dataset.id }); Modal.close(); toast('Materi dihapus.'); await App.segarkan(); }); };

// ---------------------------------------------------------------- TUGAS, BANK SOAL, KUIS (guru)
V.tugasGuru = r => {
  const g = G(), st = Store.v.tg = Object.assign({ tab: 'tugas', m: '' }, Store.v.tg || {});
  if (r.q.tab) st.tab = r.q.tab;
  if (!g.mapel.length) return kosong('clipboard', 'Belum ada mapel yang diampu');
  if (st.tab === 'soal' && !st.m) st.m = g.mapel[0].id_mapel;
  const tab = `<div class="tabs">${[['tugas', 'Tugas', g.tugas.length, 'clipboard'], ['soal', 'Bank Soal', Object.values(g.soal).reduce((a, b) => a + b, 0), 'listCheck'], ['kuis', 'Kuis', g.kuis.length, 'timer']].map(x => `<button class="tab ${st.tab === x[0] ? 'on' : ''}" data-a="tg-tab" data-t="${x[0]}">${ic(x[3], 's')} ${x[1]}<span class="n">${x[2]}</span></button>`).join('')}</div>`;
  const filter = `<select class="sel pill" style="width:auto" data-c="tg-mapel" aria-label="Mapel">${opsiMapel(g.mapel, st.m, st.tab === 'soal' ? '' : 'Semua mapel')}</select>`;
  let isi = '', tombol = '';
  if (st.tab === 'tugas') {
    tombol = `<button class="btn p" data-a="tugas-form">${ic('plus')} Tugas baru</button>`;
    isi = `<div class="card">${Tabel.def('tg', { per: 10, sk: 'deadline', sd: -1, rows: () => g.tugas.filter(t => !st.m || t.id_mapel === st.m), cari: t => t.judul,
      kolom: [{ k: 'judul', l: 'Tugas', r: t => `<b class="tx">${esc(t.judul)}</b><br><span class="xs mut">${esc(t.tipe)} · bobot ${esc(t.bobot_nilai)}%</span>` },
        { k: 'id_mapel', l: 'Mapel · kelas', r: t => esc(labelMapel(mapelById(t.id_mapel))), sort: t => labelMapel(mapelById(t.id_mapel)) },
        { k: 'deadline', l: 'Tenggat', r: t => `${esc(fWaktu(t.deadline))}<br><span class="xs ${tms(t.deadline) < sekarang() ? 'mut' : 'p b'}">${esc(relatif(t.deadline))}</span>`, sort: t => tms(t.deadline) },
        { k: 'terkumpul', l: 'Terkumpul', r: t => `<b class="tx">${t.terkumpul}/${t.total}</b> <span class="xs mut">(${t.terlambat} terlambat)</span><div style="width:90px" class="mt8">${prog(persen(t.terkumpul, t.total))}</div>` },
        { k: 'dinilai', l: 'Dinilai', r: t => t.terkumpul > t.dinilai ? `<span class="bd warn">${t.terkumpul - t.dinilai} menunggu</span>` : `<span class="bd ok">${t.dinilai}</span>` },
        { k: 'status', l: 'Status', r: t => t.status === 'draf' ? '<span class="bd warn">Draf</span>' : '<span class="bd ok">Terbit</span>' },
        { k: 'aksi', l: '', sort: false, r: t => `<div class="row" style="gap:4px;justify-content:flex-end"><a class="btn p xs" href="#/buku/${esc(t.id_mapel)}?t=${esc(t.id_tugas)}">Nilai</a>${t.terkumpul < t.total && t.status !== 'draf' ? `<button class="btn ok xs ico" title="Ingatkan wali via WA" data-a="tugas-ingatkan" data-id="${esc(t.id_tugas)}">${ic('wa', 's')}</button>` : ''}<button class="btn ghost xs ico" title="Ubah" data-a="tugas-form" data-id="${esc(t.id_tugas)}">${ic('edit', 's')}</button><button class="btn ghost xs ico" title="Hapus" data-a="tugas-hapus" data-id="${esc(t.id_tugas)}">${ic('trash', 's')}</button></div>` }] })}</div>`;
  } else if (st.tab === 'soal') {
    tombol = `<div class="row"><button class="btn w" data-a="soal-impor">${ic('upload')} Impor dari Excel</button><button class="btn p" data-a="soal-form">${ic('plus')} Soal baru</button></div>`;
    isi = `<div class="card" id="soal-list"><div class="sk" style="height:200px"></div></div>`;
  } else {
    tombol = `<button class="btn p" data-a="kuis-form">${ic('plus')} Kuis baru</button>`;
    const now = sekarang();
    isi = `<div class="card">${Tabel.def('kz', { per: 10, sk: 'waktu_buka', sd: -1, rows: () => g.kuis.filter(k => !st.m || k.id_mapel === st.m), cari: k => k.judul,
      kolom: [{ k: 'judul', l: 'Kuis', r: k => `<b class="tx">${esc(k.judul)}</b><br><span class="xs mut">${k.jumlah_soal} soal acak · ${k.durasi_menit} menit</span>` },
        { k: 'id_mapel', l: 'Mapel · kelas', r: k => esc(labelMapel(mapelById(k.id_mapel))) },
        { k: 'waktu_buka', l: 'Jadwal', r: k => `<span class="xs">${esc(fWaktu(k.waktu_buka))} →<br>${esc(fWaktu(k.waktu_tutup))}</span>`, sort: k => tms(k.waktu_buka) },
        { k: 'st', l: 'Status', r: k => tms(k.waktu_buka) > now ? '<span class="bd info">Terjadwal</span>' : tms(k.waktu_tutup) < now ? '<span class="bd belum">Ditutup</span>' : '<span class="bd bad"><i class="dot-live"></i>Aktif</span>', sort: false },
        { k: 'selesai', l: 'Dikerjakan', r: k => `<b class="tx">${k.selesai}/${k.total}</b><div style="width:80px" class="mt8">${prog(persen(k.selesai, k.total))}</div>` },
        { k: 'aksi', l: '', sort: false, r: k => `<div class="row" style="gap:4px;justify-content:flex-end"><button class="btn soft xs" data-a="kuis-hasil" data-id="${esc(k.id_kuis)}">Hasil</button><button class="btn ghost xs ico" data-a="kuis-form" data-id="${esc(k.id_kuis)}" title="Ubah">${ic('edit', 's')}</button><button class="btn ghost xs ico" data-a="kuis-hapus" data-id="${esc(k.id_kuis)}" title="Hapus">${ic('trash', 's')}</button></div>` }] })}</div>`;
  }
  return { html: `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Tugas & Kuis</b></div><h1>Tugas, Bank Soal & Kuis</h1><p class="mut mt8">Buat penugasan, kelola bank soal pilihan ganda, dan jadwalkan kuis bertimer dengan skor otomatis.</p></div>${tombol}</div>
    <div class="row w sb2">${tab}<div class="row">${st.tab !== 'soal' ? `<div class="search" style="max-width:240px">${ic('search')}<input type="search" placeholder="Cari…" data-i="tb-cari" data-t="${st.tab === 'tugas' ? 'tg' : 'kz'}" style="height:38px"></div>` : ''}${filter}</div></div>${isi}`,
    after: () => { if (st.tab === 'soal') V.muatSoal(); } };
};
ACT['tg-tab'] = el => { Store.v.tg.tab = el.dataset.t; R.go('#/tugas'); R.render(); };
CHG['tg-mapel'] = el => { Store.v.tg.m = el.value; R.render(); };
ACT['tugas-form'] = el => {
  const id = el.dataset && el.dataset.id, t = id ? G().tugas.find(x => x.id_tugas === id) : {};
  if (!G().mapel.length) return toast('Anda belum menjadi pengampu mapel.', 'warn');
  const dl = t.deadline ? t.deadline.replace(' ', 'T').slice(0, 16) : tglKey(sekarang() + 2 * 86400e3) + 'T23:59';
  Modal.open(`${Modal.head(id ? 'Ubah tugas' : 'Tugas baru', '', 'clipboard')}<form class="modal-b col" data-f="tugas" data-id="${esc(id || '')}">
    <div class="f2"><div class="fld"><label>Mata pelajaran</label><select class="sel" name="id_mapel">${opsiMapel(G().mapel, t.id_mapel || Store.v.tg.m)}</select></div><div class="fld"><label>Tipe pengumpulan</label><select class="sel" name="tipe">${[['foto', 'Foto / dokumen'], ['tulis', 'Jawaban tertulis'], ['video', 'Video (tautan YouTube)'], ['kuis', 'Kuis / lembar kerja']].map(o => `<option value="${o[0]}" ${t.tipe === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div></div>
    <div class="fld"><label>Judul tugas</label><input class="inp" name="judul" value="${esc(t.judul || '')}" maxlength="150" required></div>
    <div class="fld"><label>Petunjuk pengerjaan</label><textarea class="ta" name="deskripsi" rows="5" maxlength="4000">${esc(t.deskripsi || '')}</textarea></div>
    <div class="f3"><div class="fld"><label>Tenggat</label><input class="inp" type="datetime-local" name="deadline" value="${esc(dl)}" required></div><div class="fld"><label>Bobot nilai (%)</label><input class="inp" type="number" name="bobot_nilai" min="1" max="100" value="${esc(t.bobot_nilai || 10)}"></div>
    <div class="fld"><label>Status</label><select class="sel" name="status"><option value="terbit">Terbit</option><option value="draf" ${t.status === 'draf' ? 'selected' : ''}>Draf</option></select></div></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('save')} Simpan tugas</button></div></form>`);
};
FRM.tugas = f => sibuk($('button.p', f), async () => { const d = formData(f); if (f.dataset.id) d.id_tugas = f.dataset.id; await API.call('tugas.simpan', d); Modal.close(); toast('Tugas tersimpan.'); await App.segarkan(); });
ACT['tugas-hapus'] = async el => { if (await Modal.konfirmasi('Hapus tugas?', 'Tugas yang sudah memiliki pengumpulan tidak dapat dihapus (ubah ke draf).', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { await API.call('tugas.hapus', { id_tugas: el.dataset.id }); toast('Tugas dihapus.'); await App.segarkan(); }); };
ACT['tugas-ingatkan'] = el => sibuk(el, async () => { const r = await API.call('tugas.ingatkan', { id_tugas: el.dataset.id, id_siswa: el.dataset.s || '' }); toast(r.antri ? r.antri + ' pengingat WA diantrikan ke wali murid.' : 'Pengingat sudah dikirim sebelumnya / wali tanpa nomor.', r.antri ? 'ok' : 'warn'); });

// ---- Bank soal
V.muatSoal = async () => {
  const m = Store.v.tg.m, el = $('#soal-list');
  const tampil = list => { if (!$('#soal-list')) return; $('#soal-list').innerHTML = `<div class="card-h"><div><h3>${esc(labelMapel(mapelById(m)))}</h3><p class="xs mut2">${list.length} soal · kuis memilih soal acak dari bank ini</p></div></div>` + (list.length ? list.map((s, i) => `<div class="card flat col" style="gap:6px;margin-bottom:10px"><div class="row sb2 top"><b class="tx">${i + 1}. ${esc(s.pertanyaan)}</b><div class="row" style="gap:4px"><span class="bd ungu">bobot ${esc(s.bobot)}</span><button class="btn ghost xs ico" data-a="soal-form" data-id="${esc(s.id_soal)}" title="Ubah">${ic('edit', 's')}</button><button class="btn ghost xs ico" data-a="soal-hapus" data-id="${esc(s.id_soal)}" title="Hapus">${ic('trash', 's')}</button></div></div>
    <div class="grid4 k2" style="gap:6px">${['a', 'b', 'c', 'd'].filter(o => s['opsi_' + o]).map(o => `<span class="sm ${String(s.kunci).toLowerCase() === o ? 'bd ok' : ''}" style="${String(s.kunci).toLowerCase() === o ? '' : 'padding:3px 10px'}">${o.toUpperCase()}. ${esc(s['opsi_' + o])}</span>`).join('')}</div></div>`).join('') : kosong('listCheck', 'Bank soal masih kosong', 'Tambah soal satu per satu atau impor dari Excel.')); Store.v.soal = list; };
  const c = API.cached('soal.list', { id_mapel: m }); if (c) tampil(c);
  try { tampil(await API.call('soal.list', { id_mapel: m })); } catch (e) { if (el) el.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
};
ACT['soal-form'] = el => {
  const id = el.dataset && el.dataset.id, s = id ? (Store.v.soal || []).find(x => x.id_soal === id) : {};
  Modal.open(`${Modal.head(id ? 'Ubah soal' : 'Soal baru', esc(labelMapel(mapelById(Store.v.tg.m))), 'listCheck')}<form class="modal-b col" data-f="soal" data-id="${esc(id || '')}">
    <div class="fld"><label>Pertanyaan</label><textarea class="ta" name="pertanyaan" rows="3" required>${esc(s.pertanyaan || '')}</textarea></div>
    <div class="f2">${['a', 'b', 'c', 'd'].map(o => `<div class="fld"><label>Opsi ${o.toUpperCase()}${o > 'b' ? ' (opsional)' : ''}</label><input class="inp" name="opsi_${o}" value="${esc(s['opsi_' + o] || '')}" ${o <= 'b' ? 'required' : ''}></div>`).join('')}</div>
    <div class="f2"><div class="fld"><label>Kunci jawaban</label><select class="sel" name="kunci">${['a', 'b', 'c', 'd'].map(o => `<option value="${o}" ${String(s.kunci || '').toLowerCase() === o ? 'selected' : ''}>${o.toUpperCase()}</option>`).join('')}</select></div><div class="fld"><label>Bobot</label><input class="inp" type="number" name="bobot" min="1" max="10" value="${esc(s.bobot || 1)}"></div></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('save')} Simpan soal</button></div></form>`);
};
FRM.soal = f => sibuk($('button.p', f), async () => { const d = formData(f); d.id_mapel = Store.v.tg.m; if (f.dataset.id) d.id_soal = f.dataset.id; await API.call('soal.simpan', d); Modal.close(); toast('Soal tersimpan.'); V.muatSoal(); App.segarkan(); });
ACT['soal-hapus'] = async el => { if (await Modal.konfirmasi('Hapus soal?', '', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { await API.call('soal.hapus', { id_soal: el.dataset.id }); V.muatSoal(); App.segarkan(); }); };
ACT['soal-impor'] = () => {
  Modal.open(`${Modal.head('Impor soal dari Excel / Google Sheets', esc(labelMapel(mapelById(Store.v.tg.m))), 'upload')}<form class="modal-b col" data-f="soal-impor">
    <p class="sm mut">Salin baris dari spreadsheet dengan urutan kolom: <b>Pertanyaan · Opsi A · Opsi B · Opsi C · Opsi D · Kunci (A–D) · Bobot</b>, lalu tempel di bawah (satu soal per baris).</p>
    <textarea class="ta" name="teks" rows="9" placeholder="Hasil dari 2 + 3 adalah …\t4\t5\t6\t7\tB\t1" required style="font-family:ui-monospace,monospace;font-size:12.5px"></textarea>
    <div id="impor-prev" class="sm mut"></div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('upload')} Impor soal</button></div></form>`, { size: 'lg' });
};
const parseSoal = teks => teks.split(/\r?\n/).map(l => l.split('\t')).filter(c => c[0] && c[0].trim()).map(c => ({ pertanyaan: c[0], a: c[1], b: c[2], c: c[3], d: c[4], kunci: (c[5] || '').trim(), bobot: c[6] || 1 }));
INP.imporPrev = () => { };
FRM['soal-impor'] = f => sibuk($('button.p', f), async () => { const rows = parseSoal(formData(f).teks); if (!rows.length) throw new Error('Tidak ada baris yang terbaca.'); const r = await API.call('soal.impor', { id_mapel: Store.v.tg.m, rows }); Modal.close(); toast(r.ditambah + ' soal diimpor.'); V.muatSoal(); App.segarkan(); });

// ---- Kuis
ACT['kuis-form'] = el => {
  const id = el.dataset && el.dataset.id, k = id ? G().kuis.find(x => x.id_kuis === id) : {}, now = sekarang();
  const v = s => s ? String(s).replace(' ', 'T').slice(0, 16) : '';
  Modal.open(`${Modal.head(id ? 'Ubah kuis' : 'Kuis baru', 'Soal diambil acak dari bank soal mapel', 'timer')}<form class="modal-b col" data-f="kuis" data-id="${esc(id || '')}">
    <div class="fld"><label>Mata pelajaran</label><select class="sel" name="id_mapel">${G().mapel.map(m => `<option value="${esc(m.id_mapel)}" ${(k.id_mapel || Store.v.tg.m) === m.id_mapel ? 'selected' : ''}>${esc(labelMapel(m))} — ${G().soal[m.id_mapel] || 0} soal di bank</option>`).join('')}</select></div>
    <div class="fld"><label>Judul kuis</label><input class="inp" name="judul" value="${esc(k.judul || '')}" required></div>
    <div class="f2"><div class="fld"><label>Jumlah soal</label><input class="inp" type="number" name="jumlah_soal" min="1" value="${esc(k.jumlah_soal || 10)}"></div><div class="fld"><label>Durasi (menit)</label><input class="inp" type="number" name="durasi_menit" min="1" max="240" value="${esc(k.durasi_menit || 20)}"></div></div>
    <div class="f2"><div class="fld"><label>Dibuka</label><input class="inp" type="datetime-local" name="waktu_buka" value="${v(k.waktu_buka) || tglKey(now) + 'T07:00'}"></div><div class="fld"><label>Ditutup</label><input class="inp" type="datetime-local" name="waktu_tutup" value="${v(k.waktu_tutup) || tglKey(now + 3 * 86400e3) + 'T23:59'}"></div></div>
    <p class="xs mut">${ic('info', 's')} Kunci jawaban & pembahasan dibuka untuk siswa setelah kuis ditutup.</p>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('save')} Simpan kuis</button></div></form>`);
};
FRM.kuis = f => sibuk($('button.p', f), async () => { const d = formData(f); if (f.dataset.id) d.id_kuis = f.dataset.id; await API.call('kuis.simpan', d); Modal.close(); toast('Kuis tersimpan.'); await App.segarkan(); });
ACT['kuis-hapus'] = async el => { if (await Modal.konfirmasi('Hapus kuis?', 'Kuis yang sudah dikerjakan siswa tidak dapat dihapus.', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { await API.call('kuis.hapus', { id_kuis: el.dataset.id }); await App.segarkan(); }); };
ACT['kuis-hasil'] = el => sibuk(el, async () => {
  const r = await API.call('kuis.hasil', { id_kuis: el.dataset.id }), sel = r.siswa.filter(s => s.skor !== null), rata = sel.length ? sel.reduce((a, s) => a + s.skor, 0) / sel.length : null;
  Store.v.kuisHasil = r;
  Modal.open(`${Modal.head('Hasil: ' + esc(r.kuis.judul), esc(labelMapel(r.mapel)) + ' · ' + sel.length + '/' + r.siswa.length + ' selesai · rata-rata ' + angka(rata), 'timer')}<div class="modal-b"><div class="tw"><table class="tbl"><thead><tr><th>Nama</th><th>NIS</th><th class="num">Skor</th><th>Selesai</th></tr></thead><tbody>${urut(r.siswa, s => s.skor === null ? -1 : s.skor, -1).map(s => `<tr><td class="b tx">${esc(s.nama)}</td><td>${esc(s.nis)}</td><td class="num b ${s.skor !== null && s.skor < KKM() ? 'err' : 'tx'}">${s.skor === null ? (s.mulai ? '<span class="bd warn">mengerjakan</span>' : '-') : angka(s.skor)}</td><td class="xs">${esc(s.selesai ? fWaktu(s.selesai) : '')}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="modal-f"><button class="btn w" data-a="kuis-hasil-xls">${ic('sheet')} Unduh Excel</button></div>`, { size: 'lg' });
});
ACT['kuis-hasil-xls'] = () => { const r = Store.v.kuisHasil; Ekspor.xlsx('Hasil ' + r.kuis.judul, [{ nama: 'Hasil', rows: [['No', 'Nama', 'NIS', 'Skor', 'Mulai', 'Selesai']].concat(r.siswa.map((s, i) => [i + 1, s.nama, s.nis, s.skor === null ? '' : s.skor, s.mulai, s.selesai])) }]); };

// ---------------------------------------------------------------- BUKU NILAI (Stitch: gradebook + panel review)
V.nilaiGuru = () => {
  const g = G(), semua = g.mapel.concat(g.mapelWali.filter(m => !g.mapel.some(x => x.id_mapel === m.id_mapel)));
  if (semua.length === 1) { R.go('#/buku/' + semua[0].id_mapel); return ''; }
  return `<div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Buku Nilai</b></div><h1>Buku Nilai Digital</h1><p class="mut mt8">Pilih mata pelajaran. Nilai otomatis terhubung ke pengumpulan tugas & hasil kuis.</p></div>
    <div class="grid3">${semua.map(m => { const gy = gayaMapel(m.nama_mapel), milik = g.mapel.some(x => x.id_mapel === m.id_mapel), tg = g.tugas.filter(t => t.id_mapel === m.id_mapel), tunggu = tg.reduce((a, t) => a + t.terkumpul - t.dinilai, 0);
      return `<a class="card row" href="#/buku/${esc(m.id_mapel)}" style="text-decoration:none"><span class="sq lg" style="background:var(--${gy.c});color:${gy.w}">${ic(gy.i, 'l')}</span><div class="grow"><b class="tx">${esc(m.nama_mapel)}</b><br><span class="sm mut">${esc(m.kelas)} · ${esc(milik ? 'Anda pengampu' : m.guru + ' (lihat saja)')}</span>${tunggu ? `<br><span class="bd warn mt8">${tunggu} menunggu dinilai</span>` : ''}</div>${ic('chevR')}</a>`; }).join('')}</div>`;
};
R.def('buku', r => {
  const id = r.id, m = mapelById(id);
  if (!m) return kosong('award', 'Mapel tidak ditemukan', '', '<a class="btn soft" href="#/nilai">Kembali</a>');
  const st = Store.v.buku && Store.v.buku.id === id ? Store.v.buku : (Store.v.buku = { id, t: r.q.t || '', edit: {}, sel: '', q: '', notif: true, data: API.cached('nilai.bukuNilai', { id_mapel: id }) });
  if (r.q.t) st.t = r.q.t;
  return { html: `<div id="buku" class="col gap24">${st.data ? V.bukuHtml() : '<div class="sk" style="height:120px"></div><div class="grid4"><div class="sk" style="height:110px"></div><div class="sk" style="height:110px"></div><div class="sk" style="height:110px"></div><div class="sk" style="height:110px"></div></div><div class="sk" style="height:360px"></div>'}</div>`,
    after: async () => { try { const d = await API.call('nilai.bukuNilai', { id_mapel: id }); if (Store.v.buku.id !== id) return; const ganti = JSON.stringify(d) !== JSON.stringify(st.data); st.data = d; if (!st.t && d.kolom.length) { const k = d.kolom.filter(x => x.jenis === 'tugas'); st.t = (k.find(x => d.siswa.some(s => s.sel[x.id].l && s.sel[x.id].n === null)) || k[k.length - 1] || d.kolom[0]).id; } if (ganti || !$('#buku-tb')) $('#buku').innerHTML = V.bukuHtml(); } catch (e) { salah(e); } } };
});
V.bukuHtml = () => {
  const st = Store.v.buku, d = st.data, m = d.mapel, milik = mapelSaya().some(x => x.id_mapel === m.id_mapel), kol = d.kolom.find(k => k.id === st.t), kkm = d.kkm;
  const nEdit = Object.keys(st.edit).length;
  const head = `<div class="crumb"><a href="#/beranda">${ic('home', 's')} Beranda</a>${ic('chevR', 's')}<a href="#/nilai">Nilai & Rapor</a>${ic('chevR', 's')}<b>Buku Nilai Digital</b></div>
  <div class="card l row w sb2"><div><div class="row w"><h1 style="font-size:22px">Buku Nilai & Penilaian Tugas Siswa</h1>${milik ? '' : '<span class="bd info">Hanya lihat</span>'}</div><p class="mut mt8 row w" style="gap:8px">${ic(gayaMapel(m.nama_mapel).i, 's')} <b class="tx">${esc(m.nama_mapel)}</b> · Kelas ${esc(m.kelas)} (${d.siswa.length} siswa) · Pengampu: <b class="tx">${esc(m.guru)}</b></p></div>
    <div class="row w"><button class="btn w sm" data-a="buku-xls">${ic('sheet', 's')} Unduh Excel</button><button class="btn w sm" data-a="buku-pdf">${ic('filePdf', 's')} Unduh PDF</button>${milik ? `<button class="btn p" data-a="buku-simpan" ${nEdit ? '' : 'disabled'}>${ic('save')} Simpan semua nilai${nEdit ? ' (' + nEdit + ')' : ''}</button>` : ''}</div></div>`;
  const toolbar = `<div class="card row w sb2" style="padding:14px"><div class="row w"><select class="sel pill" style="width:auto;max-width:340px" data-c="buku-kolom" aria-label="Komponen nilai"><option value="">📊 Rekap semua komponen</option>${d.kolom.map(k => `<option value="${esc(k.id)}" ${st.t === k.id ? 'selected' : ''}>${k.jenis === 'kuis' ? '⏱ Kuis' : '📝 Tugas'}: ${esc(k.judul)}</option>`).join('')}</select>
    ${milik && kol && kol.jenis === 'tugas' ? `<label class="row sm" style="cursor:pointer"><span class="sw"><input type="checkbox" data-c="buku-notif" ${st.notif ? 'checked' : ''}><span></span></span>Kirim notif nilai ke wali</label>` : ''}</div>
    <div class="search" style="max-width:280px">${ic('search')}<input type="search" placeholder="Cari nama atau NIS siswa…" value="${esc(st.q)}" data-i="buku-cari" style="height:40px"></div></div>`;
  if (!kol) return head + toolbar + V.bukuRekap();
  const nilaiOf = s => st.edit[s.id_siswa] && st.edit[s.id_siswa].n !== undefined ? st.edit[s.id_siswa].n : s.sel[kol.id].n;
  const kumpul = d.siswa.filter(s => s.sel[kol.id].st && !/^belum/.test(s.sel[kol.id].st)), dinilai = d.siswa.filter(s => nilaiOf(s) !== null && nilaiOf(s) !== '');
  const ns = dinilai.map(nilaiOf).map(Number), rata = ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null;
  const kpi = `<div class="grid4 k2">
    <div class="kpi"><div class="row sb2"><span class="caps mut">Total pengumpulan</span><span class="sq ungu">${ic('checkCircle', 's')}</span></div><div class="v">${kumpul.length}<small> / ${d.siswa.length} siswa</small></div><span class="bd ok" style="align-self:flex-start">${persen(kumpul.length, d.siswa.length)}% terkumpul</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Sudah dinilai</span><span class="sq I">${ic('edit', 's')}</span></div><div class="v">${dinilai.length}<small> siswa</small></div><span class="bd warn" style="align-self:flex-start">${Math.max(0, kumpul.length - dinilai.filter(s => kumpul.includes(s)).length)} perlu diperiksa</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Rata-rata nilai</span><span class="sq ungu">${ic('chart', 's')}</span></div><div class="v">${angka(rata)}<small> / 100</small></div><span class="bd ${rata === null || rata >= kkm ? 'ok' : 'bad'}" style="align-self:flex-start">${ic('trend', 's')} ${rata === null ? 'Belum ada nilai' : rata >= kkm ? 'Di atas KKM ' + kkm : 'Di bawah KKM ' + kkm}</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Tertinggi / terendah</span><span class="sq A">${ic('sparkles', 's')}</span></div><div class="v">${ns.length ? Math.max(...ns) : '-'}<small> / ${ns.length ? Math.min(...ns) : '-'}</small></div><span class="bd bad" style="align-self:flex-start">${ic('alert', 's')} ${ns.filter(n => n < kkm).length} siswa remedial</span></div></div>`;
  return head + kpi + toolbar + `<div class="cols r400"><div class="card" style="padding:0;overflow:hidden"><div class="row sb2" style="padding:16px 18px;background:var(--sf2)"><div class="row"><b class="tx">${esc(kol.judul)}</b><span class="bd ungu">KKM ${kkm}</span></div><span class="xs mut">${kol.jenis === 'tugas' ? 'Tenggat ' + esc(fWaktu(kol.batas)) + ' · bobot ' + kol.bobot + '%' : 'Skor otomatis dari kuis'}</span></div><div style="padding:0 18px 12px" id="buku-tb">${V.bukuTabel(kol, milik)}</div></div>
    <div class="stack" id="buku-panel">${V.bukuPanel(kol, milik)}</div></div>`;
};
V.bukuBaris = () => { const st = Store.v.buku, q = st.q.toLowerCase(); return st.data.siswa.filter(s => !q || (s.nama + ' ' + s.nis).toLowerCase().includes(q)); };
V.bukuTabel = (kol, milik) => {
  const st = Store.v.buku, kkm = st.data.kkm;
  const rows = V.bukuBaris().map((s, i) => {
    const c = s.sel[kol.id], e = st.edit[s.id_siswa] || {}, n = e.n !== undefined ? e.n : c.n, cat = e.c !== undefined ? e.c : (c.c || '');
    const stt = c.st === 'tepat' ? '<span class="bd tepat">Tepat waktu</span>' : c.st === 'terlambat' ? '<span class="bd terlambat">Terlambat</span>' : c.st === 'selesai' ? '<span class="bd ok">Selesai</span>' : c.st === 'mengerjakan' ? '<span class="bd warn">Mengerjakan</span>' : `<span class="bd ${c.st === 'belum-lewat' ? 'bad' : 'belum'}">${c.st === 'belum-lewat' ? 'Tidak kumpul' : 'Belum kumpul'}</span>`;
    const berkas = (c.l || []).length ? `<div class="row" style="gap:4px">${c.l.slice(0, 4).map(u => `<a class="sq ${/youtu/.test(u) ? 'A' : 'ungu'}" style="width:30px;height:30px;border-radius:9px" href="${esc(u)}" target="_blank" rel="noopener" title="${esc(labelTautan(u))}" aria-label="${esc(labelTautan(u))}">${ic(ikonTautan(u), 's')}</a>`).join('')}</div>` : c.cs ? '<span class="xs mut">Jawaban teks</span>' : '<span class="xs mut" style="font-style:italic">Belum ada berkas</span>';
    const bolehIsi = milik && kol.jenis === 'tugas';
    return `<tr class="${st.sel === s.id_siswa ? 'sel' : ''}" data-a="buku-pilih" data-s="${esc(s.id_siswa)}" style="cursor:pointer"><td><div class="row" style="gap:10px">${avatar(s.nama, 'sm')}<div style="min-width:118px"><b class="tx">${esc(s.nama)}</b><br><span class="xs mut nowrap">${p2(i + 1)} · ${esc(s.nis)}</span>${n !== null && n !== '' && Number(n) < kkm ? '<br><span class="xs err b">Perlu remedial</span>' : ''}</div></div></td><td>${stt}${c.w ? `<br><span class="xs mut">${esc(relatif(c.w))}</span>` : ''}</td><td>${berkas}</td>
      <td>${bolehIsi ? `<input class="inp nilai ${n !== null && n !== '' && Number(n) < kkm ? 'low' : ''}" type="number" min="0" max="100" step="0.5" inputmode="decimal" value="${n === null ? '' : esc(n)}" data-i="buku-n" data-s="${esc(s.id_siswa)}" aria-label="Nilai ${esc(s.nama)}">` : `<b class="tx">${n === null ? '-' : angka(n)}</b>`}</td>
      <td><span class="bd ${n === null || n === '' ? 'belum' : Number(n) >= kkm ? 'ok' : 'bad'}">${n === null || n === '' ? '-' : predikat(Number(n))}</span></td>
      <td>${bolehIsi ? `<input class="inp" style="min-width:120px" value="${esc(cat)}" placeholder="Catatan…" data-i="buku-c" data-s="${esc(s.id_siswa)}" aria-label="Catatan ${esc(s.nama)}">` : `<span class="xs">${esc(cat)}</span>`}</td>
      <td>${!c.st || /^belum/.test(c.st) ? (milik ? `<button class="btn ok xs ico" title="Ingatkan wali via WA" data-a="tugas-ingatkan" data-id="${esc(kol.id)}" data-s="${esc(s.id_siswa)}">${ic('wa', 's')}</button>` : '') : `<button class="btn soft xs ico" title="Tinjau" data-a="buku-pilih" data-s="${esc(s.id_siswa)}">${ic('eye', 's')}</button>`}</td></tr>`;
  }).join('');
  return `<div class="tw" style="margin:0 -18px;padding:0 18px"><table class="tbl"><thead><tr><th>Siswa</th><th>Status</th><th>Berkas</th><th>Nilai</th><th>Pred.</th><th>Catatan guru</th><th></th></tr></thead><tbody>${rows || `<tr><td colspan="7">${kosong('users', 'Tidak ada siswa')}</td></tr>`}</tbody></table></div>`;
};
V.bukuPanel = (kol, milik) => {
  const st = Store.v.buku, d = st.data, s = d.siswa.find(x => x.id_siswa === st.sel) || d.siswa.find(x => x.sel[kol.id].l && x.sel[kol.id].n === null) || d.siswa[0];
  if (!s) return '';
  st.sel = s.id_siswa;
  const c = s.sel[kol.id], e = st.edit[s.id_siswa] || {}, n = e.n !== undefined ? e.n : c.n, cat = e.c !== undefined ? e.c : (c.c || '');
  const rb = st.rubrik = st.rubrik || [{ l: 'Ketepatan konsep & isi', w: 40 }, { l: 'Proses / kerapian karya', w: 35 }, { l: 'Laporan & analisis', w: 25 }];
  const bolehIsi = milik && kol.jenis === 'tugas';
  return `<div class="card col gap16"><div class="row top">${avatar(s.nama, 'lg')}<div class="grow"><span class="bd ${c.st && !/^belum/.test(c.st) ? 'ungu' : 'belum'}">${ic('checkCircle', 's')} ${c.st && !/^belum/.test(c.st) ? (n === null ? 'Siap dinilai' : 'Sudah dinilai') : 'Belum mengumpulkan'}</span><h3 class="mt8">${esc(s.nama)}</h3><p class="xs mut">NIS ${esc(s.nis)} · ${esc(d.mapel.kelas)}</p></div></div>
    <div class="card flat col" style="gap:8px"><div class="row sb2"><span class="caps mut">Berkas tugas siswa</span><span class="xs ok b">${(c.l || []).length} berkas</span></div>${(c.l || []).map(u => `<a class="file-it" style="background:var(--sf)" href="${esc(u)}" target="_blank" rel="noopener"><span class="sq ${/youtu/.test(u) ? 'A' : 'ungu'}" style="width:32px;height:32px">${ic(ikonTautan(u), 's')}</span><span class="grow sm b trunc">${esc(labelTautan(u))}</span>${ic('external', 's')}</a>`).join('') || '<span class="sm mut">Tidak ada berkas.</span>'}
      ${c.cs ? `<div class="sm" style="white-space:pre-line;background:var(--sf);padding:10px;border-radius:12px"><b class="tx xs caps">Catatan / jawaban siswa</b><br>${esc(c.cs)}</div>` : ''}</div>
    ${bolehIsi ? `<div class="col" style="gap:10px"><div class="row sb2"><b class="tx">Kalkulator rubrik</b><span class="bd ungu">Bobot 100%</span></div>${rb.map((x, i) => `<div class="card flat" style="padding:12px"><div class="row sb2 sm"><span class="b tx">${i + 1}. ${esc(x.l)} (${x.w}%)</span><b class="p mono" id="rb-v${i}">${Math.round((x.v === undefined ? x.w * .8 : x.v))}/${x.w}</b></div><input type="range" min="0" max="${x.w}" value="${Math.round(x.v === undefined ? x.w * .8 : x.v)}" style="width:100%;accent-color:var(--p)" data-i="rubrik" data-r="${i}" aria-label="${esc(x.l)}"></div>`).join('')}
      <div class="card flat row sb2" style="background:var(--p-50)"><div><span class="caps p">Total rubrik</span><p class="xs mut">Predikat ${predikat(rb.reduce((a, x) => a + (x.v === undefined ? x.w * .8 : x.v), 0))}</p></div><div class="row"><b style="font-size:24px" class="p" id="rb-tot">${Math.round(rb.reduce((a, x) => a + (x.v === undefined ? x.w * .8 : x.v), 0))}</b><button class="btn soft xs" data-a="rubrik-pakai">Pakai</button></div></div></div>
    <div class="fld"><label class="row sb2">Catatan evaluasi guru <span class="xs mut">Dapat dibaca siswa</span></label><textarea class="ta" rows="3" data-i="buku-c" data-s="${esc(s.id_siswa)}" id="panel-cat">${esc(cat)}</textarea></div>
    <div class="row sb2"><label class="fld" style="flex-direction:row;align-items:center;gap:8px">Nilai <input class="inp nilai" style="width:90px;text-align:center;font-weight:800" type="number" min="0" max="100" value="${n === null ? '' : esc(n)}" data-i="buku-n" data-s="${esc(s.id_siswa)}" id="panel-n"></label><label class="row sm" style="cursor:pointer"><span class="sw"><input type="checkbox" data-c="buku-notif" ${st.notif ? 'checked' : ''}><span></span></span>Notif WA wali</label></div>
    <button class="btn p blk" data-a="buku-simpan-1">${ic('checkCircle')} Simpan nilai siswa ini</button><button class="btn warn blk" data-a="buku-revisi">${ic('refresh')} Tandai perlu revisi / perbaikan</button>` : `<p class="sm mut">${kol.jenis === 'kuis' ? 'Nilai kuis dihitung otomatis.' : 'Anda bukan pengampu mapel ini (hanya lihat).'}</p>`}</div>
    <div class="card row top"><span class="sq ungu">${ic('info')}</span><p class="sm mut">Siswa dengan nilai di bawah KKM (${d.kkm}) ditandai remedial. Nilai yang disimpan langsung tampil di rapor mini siswa & wali murid.</p></div>`;
};
V.bukuRekap = () => {
  const st = Store.v.buku, d = st.data, rows = V.bukuBaris();
  return `<div class="card"><div class="card-h"><div><h3>Rekap nilai — ${esc(d.mapel.nama_mapel)} ${esc(d.mapel.kelas)}</h3><p class="xs mut2">Nilai akhir = rata-rata berbobot (bobot tugas, kuis = ${esc(SET('BOBOT_KUIS') || 10)}) dari komponen yang sudah dinilai</p></div></div>
    <div class="tw"><table class="tbl"><thead><tr><th>No</th><th>Nama</th>${d.kolom.map(k => `<th class="num" title="${esc(k.judul)}">${k.jenis === 'kuis' ? '⏱' : '📝'} ${esc(k.judul.slice(0, 14))}${k.judul.length > 14 ? '…' : ''}<br><span class="xs mut" style="text-transform:none">bobot ${k.bobot}</span></th>`).join('')}<th class="num">Nilai akhir</th><th>Predikat</th></tr></thead>
    <tbody>${rows.map((s, i) => `<tr><td>${i + 1}</td><td class="b tx nowrap">${esc(s.nama)}</td>${d.kolom.map(k => { const c = s.sel[k.id]; return `<td class="num ${c.n !== null && c.n < d.kkm ? 'err b' : ''}">${c.n === null ? `<span class="mut2">${/^belum/.test(c.st) ? '–' : '·'}</span>` : angka(c.n)}</td>`; }).join('')}<td class="num b ${s.akhir !== null && s.akhir < d.kkm ? 'err' : 'tx'}">${angka(s.akhir)}</td><td><span class="bd ${s.akhir === null ? 'belum' : s.akhir >= d.kkm ? 'ok' : 'bad'}">${esc(s.predikat)}</span></td></tr>`).join('')}</tbody></table></div></div>`;
};
CHG['buku-kolom'] = el => { Store.v.buku.t = el.value; $('#buku').innerHTML = V.bukuHtml(); };
CHG['buku-notif'] = el => { Store.v.buku.notif = el.checked; $$('[data-c=buku-notif]').forEach(x => { x.checked = el.checked; }); };
INP['buku-cari'] = debounce(el => { Store.v.buku.q = el.value; const kol = Store.v.buku.data.kolom.find(k => k.id === Store.v.buku.t); if (kol) $('#buku-tb').innerHTML = V.bukuTabel(kol, mapelSaya().some(x => x.id_mapel === Store.v.buku.id)); else $('#buku').innerHTML = V.bukuHtml(); }, 120);
const bukuTandai = () => { const n = Object.keys(Store.v.buku.edit).length, b = $('[data-a=buku-simpan]'); if (b) { b.disabled = !n; b.innerHTML = ic('save') + ' Simpan semua nilai' + (n ? ' (' + n + ')' : ''); } };
INP['buku-n'] = el => { const st = Store.v.buku, e = st.edit[el.dataset.s] = st.edit[el.dataset.s] || {}; e.n = el.value === '' ? '' : Number(el.value); el.classList.toggle('low', el.value !== '' && Number(el.value) < st.data.kkm); $$(`[data-i=buku-n][data-s="${el.dataset.s}"]`).forEach(x => { if (x !== el) x.value = el.value; }); bukuTandai(); };
INP['buku-c'] = el => { const st = Store.v.buku, e = st.edit[el.dataset.s] = st.edit[el.dataset.s] || {}; e.c = el.value; $$(`[data-i=buku-c][data-s="${el.dataset.s}"]`).forEach(x => { if (x !== el) x.value = el.value; }); bukuTandai(); };
ACT['buku-pilih'] = (el, ev) => { if (ev.target.closest('input,a,button:not([data-a=buku-pilih])')) return; const st = Store.v.buku; st.sel = el.dataset.s; const kol = st.data.kolom.find(k => k.id === st.t), milik = mapelSaya().some(x => x.id_mapel === st.id); $$('#buku-tb tr').forEach(tr => tr.classList.toggle('sel', tr.dataset.s === st.sel)); $('#buku-panel').innerHTML = V.bukuPanel(kol, milik); if (window.innerWidth < 1280) $('#buku-panel').scrollIntoView({ behavior: 'smooth' }); };
INP.rubrik = el => { const rb = Store.v.buku.rubrik, i = Number(el.dataset.r); rb[i].v = Number(el.value); $('#rb-v' + i).textContent = el.value + '/' + rb[i].w; $('#rb-tot').textContent = Math.round(rb.reduce((a, x) => a + (x.v === undefined ? x.w * .8 : x.v), 0)); };
ACT['rubrik-pakai'] = () => { const n = $('#panel-n'); n.value = $('#rb-tot').textContent; INP['buku-n'](n); toast('Total rubrik dipakai sebagai nilai — jangan lupa simpan.'); };
async function bukuKirim(items, btn) {
  const st = Store.v.buku;
  const r = await API.call('nilai.simpanBatch', { items, notif: st.notif });
  items.forEach(it => delete st.edit[it.id_siswa]);
  toast(r.disimpan + ' nilai tersimpan' + (r.notif ? ' · ' + r.notif + ' notif WA diantrikan' : '') + '.');
  st.data = await API.call('nilai.bukuNilai', { id_mapel: st.id }); $('#buku').innerHTML = V.bukuHtml(); App.segarkan();
}
const itemEdit = (sid) => { const st = Store.v.buku, s = st.data.siswa.find(x => x.id_siswa === sid), c = s.sel[st.t], e = st.edit[sid] || {}; return { id_tugas: st.t, id_siswa: sid, nilai: e.n !== undefined ? e.n : (c.n === null ? '' : c.n), catatan: e.c !== undefined ? e.c : (c.c || '') }; };
ACT['buku-simpan'] = el => sibuk(el, () => { const st = Store.v.buku; const kol = st.data.kolom.find(k => k.id === st.t); if (!kol || kol.jenis !== 'tugas') throw new Error('Pilih komponen tugas.'); return bukuKirim(Object.keys(st.edit).map(itemEdit), el); }, 'Menyimpan…');
ACT['buku-simpan-1'] = el => sibuk(el, () => bukuKirim([itemEdit(Store.v.buku.sel)], el), 'Menyimpan…');
ACT['buku-revisi'] = el => sibuk(el, () => { const sid = Store.v.buku.sel, cat = ($('#panel-cat').value || '').trim(); return bukuKirim([{ id_tugas: Store.v.buku.t, id_siswa: sid, nilai: '', catatan: 'Perlu revisi: ' + cat.replace(/^Perlu revisi:\s*/i, '') }]); });
const bukuMatriks = () => { const d = Store.v.buku.data; return [['No', 'NIS', 'Nama'].concat(d.kolom.map(k => (k.jenis === 'kuis' ? 'Kuis: ' : '') + k.judul), ['Nilai Akhir', 'Predikat'])].concat(d.siswa.map((s, i) => [i + 1, s.nis, s.nama].concat(d.kolom.map(k => s.sel[k.id].n === null ? '' : s.sel[k.id].n), [s.akhir === null ? '' : s.akhir, s.predikat]))); };
ACT['buku-xls'] = () => { const d = Store.v.buku.data; Ekspor.xlsx('Buku Nilai ' + d.mapel.nama_mapel + ' ' + d.mapel.kelas, [{ nama: 'Buku Nilai', rows: bukuMatriks() }]); };
ACT['buku-pdf'] = () => { const d = Store.v.buku.data; Ekspor.pdf('Buku Nilai — ' + d.mapel.nama_mapel + ' ' + d.mapel.kelas, bukuMatriks()); };

// ---------------------------------------------------------------- ABSENSI PER JAM (guru / koreksi wali kelas)
const jadwalJam = () => { try { return JSON.parse(SET('JADWAL_JAM') || '[]'); } catch (e) { return []; } };
const jamSekarang = () => { const w = wib(sekarang()), hm = p2(w.h) + ':' + p2(w.mi), j = jadwalJam(); const x = j.find(r => hm >= r.mulai && hm < r.selesai) || j.filter(r => hm >= r.selesai).pop(); return x ? x.ke : 1; };
V.absensiGuru = r => {
  const g = G(), wkMapel = g.mapelWali.filter(m => !g.mapel.some(x => x.id_mapel === m.id_mapel)), semua = g.mapel.concat(wkMapel);
  if (!semua.length) return kosong('userCheck', 'Belum ada mapel', 'Minta admin menautkan Anda sebagai pengampu.');
  const st = Store.v.ab = Object.assign({ m: semua[0].id_mapel, t: hariIni(), j: jamSekarang(), data: {}, asli: {}, key: '' }, Store.v.ab || {});
  if (r.q.m && semua.some(m => m.id_mapel === r.q.m)) st.m = r.q.m;
  const m = mapelById(st.m), key = st.m + '|' + st.t + '|' + st.j, korek = !g.mapel.some(x => x.id_mapel === st.m);
  return { html: `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Absensi per jam</b></div><h1>Absensi Jam Pelajaran</h1><p class="mut mt8">Tandai H/S/I/A seluruh siswa lalu simpan sekali (1 batch). Rekap harian & notifikasi alfa ke wali dihitung otomatis.</p></div>${isWK() ? `<a class="btn w" href="#/pantauan">${ic('chart')} Rekap kelas perwalian</a>` : ''}</div>
    <div class="card row w" style="padding:14px;gap:10px"><div class="fld" style="min-width:240px;flex:1"><label class="xs">Mata pelajaran · kelas</label><select class="sel" data-c="ab-m">${opsiMapel(g.mapel, st.m)}${wkMapel.length ? `<optgroup label="Koreksi wali kelas">${opsiMapel(wkMapel, st.m)}</optgroup>` : ''}</select></div>
      <div class="fld"><label class="xs">Tanggal</label><input class="inp" type="date" value="${esc(st.t)}" max="${hariIni()}" data-c="ab-t"></div>
      <div class="fld"><label class="xs">Jam ke-</label><select class="sel" data-c="ab-j">${(jadwalJam().length ? jadwalJam() : [1, 2, 3, 4, 5, 6, 7, 8].map(k => ({ ke: k }))).map(x => `<option value="${x.ke}" ${Number(st.j) === Number(x.ke) ? 'selected' : ''}>Jam ${x.ke}${x.mulai ? ' · ' + x.mulai + '–' + x.selesai : ''}</option>`).join('')}</select></div></div>
    <div class="cols"><div class="card" id="ab-roster"><div class="sk" style="height:300px"></div></div><div class="stack" id="ab-side"></div></div>`,
    after: () => V.muatSesi(key, korek, m) };
};
V.muatSesi = async (key, korek, m) => {
  const st = Store.v.ab, q = { id_mapel: st.m, tanggal: st.t, jam_ke: Number(st.j) };
  const tampil = d => {
    if (Store.v.ab.m + '|' + Store.v.ab.t + '|' + Store.v.ab.j !== key) return;
    if (st.key !== key) { st.key = key; st.asli = {}; st.data = {}; d.siswa.forEach(s => { st.asli[s.id_siswa] = s.status; st.data[s.id_siswa] = s.status === '-' ? 'H' : s.status; }); }
    st.siswa = d.siswa; st.tercatat = d.tercatat; st.riwayat = d.riwayat;
    V.renderRoster(korek, m);
  };
  const c = API.cached('absensi.sesi', q); if (c) tampil(c);
  try { tampil(await API.call('absensi.sesi', q)); } catch (e) { const el = $('#ab-roster'); if (el) el.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
};
V.renderRoster = (korek, m) => {
  const st = Store.v.ab, c = { H: 0, S: 0, I: 0, A: 0 }, ubah = st.siswa.filter(s => st.data[s.id_siswa] !== st.asli[s.id_siswa]).length;
  st.siswa.forEach(s => c[st.data[s.id_siswa]]++);
  const el = $('#ab-roster'); if (!el) return;
  el.innerHTML = `<div class="card-h"><div><h3>${esc(m.nama_mapel)} · ${esc(m.kelas)}</h3><p class="xs mut2">${esc(fHari(st.t))} · jam ke-${st.j} · ${st.tercatat ? '<span class="ok b">sudah tercatat — perubahan akan dikoreksi</span>' : 'belum dicatat (default Hadir)'}${korek ? ' · <b class="p">mode koreksi wali kelas (tercatat di log audit)</b>' : ''}</p></div><button class="btn soft sm" data-a="ab-semua">${ic('checkCircle', 's')} Semua hadir</button></div>
    <div class="row w" style="gap:8px;margin-bottom:8px">${['H', 'S', 'I', 'A'].map(k => `<span class="bd ${k} lg">${BD_ABS[k][1]}: ${c[k]}</span>`).join('')}</div>
    <div class="roster">${st.siswa.map((s, i) => `<div class="ros"><span class="xs mut" style="width:22px">${i + 1}</span>${avatar(s.nama, 'sm')}<div class="grow"><b class="tx sm">${esc(s.nama)}</b><br><span class="xs mut">NIS ${esc(s.nis)}${st.asli[s.id_siswa] !== '-' && st.asli[s.id_siswa] !== st.data[s.id_siswa] ? ' · <span class="p b">diubah dari ' + st.asli[s.id_siswa] + '</span>' : ''}</span></div>
      <div class="hsia" role="radiogroup" aria-label="Status ${esc(s.nama)}">${['H', 'S', 'I', 'A'].map(k => `<button class="${k} ${st.data[s.id_siswa] === k ? 'on' : ''}" role="radio" aria-checked="${st.data[s.id_siswa] === k}" title="${BD_ABS[k][1]}" data-a="ab-set" data-s="${esc(s.id_siswa)}" data-k="${k}">${k}</button>`).join('')}</div></div>`).join('')}</div>
    <div class="row sb2 mt16"><span class="sm mut">${c.A ? ic('wa', 's') + ' ' + c.A + ' siswa alfa → wali menerima notifikasi WA' : 'Tidak ada alfa'}</span><button class="btn p" data-a="ab-simpan" ${!st.tercatat || ubah ? '' : 'disabled'}>${ic('save')} ${st.tercatat ? 'Simpan koreksi' + (ubah ? ' (' + ubah + ')' : '') : 'Simpan absensi'}</button></div>`;
  const side = $('#ab-side');
  if (side) side.innerHTML = `<div class="card"><div class="card-h"><h3>Riwayat sesi</h3><span class="xs mut">${esc(m.nama_mapel)}</span></div>${(st.riwayat || []).length ? st.riwayat.map(x => { const tot = x.c.H + x.c.S + x.c.I + x.c.A; return `<button class="it clk" style="width:100%;border:0;background:none;text-align:left" data-a="ab-buka" data-t="${x.t}" data-j="${x.j}"><span class="sq ungu" style="width:36px;height:36px"><b>${x.j}</b></span><div class="grow"><b class="tx sm">${esc(fHari(x.t))}</b><br><span class="xs mut">H ${x.c.H} · S ${x.c.S} · I ${x.c.I} · A ${x.c.A}</span></div><span class="bd ${x.c.A ? 'bad' : 'ok'}">${persen(x.c.H, tot)}%</span></button>`; }).join('') : kosong('history', 'Belum ada sesi tercatat')}</div>
    <div class="card">${legendaAbs()}<p class="xs mut mt12">H = Hadir · S = Sakit · I = Izin · A = Alfa (tanpa keterangan). Alfa memicu notifikasi WhatsApp ke wali (maks. 1x/hari per siswa).</p></div>`;
};
CHG['ab-m'] = el => { Store.v.ab.m = el.value; Store.v.ab.key = ''; R.go('#/absensi'); R.render(); };
CHG['ab-t'] = el => { Store.v.ab.t = el.value; Store.v.ab.key = ''; R.render(); };
CHG['ab-j'] = el => { Store.v.ab.j = Number(el.value); Store.v.ab.key = ''; R.render(); };
ACT['ab-set'] = el => { Store.v.ab.data[el.dataset.s] = el.dataset.k; const g = G(); V.renderRoster(!g.mapel.some(x => x.id_mapel === Store.v.ab.m), mapelById(Store.v.ab.m)); };
ACT['ab-semua'] = () => { const st = Store.v.ab; st.siswa.forEach(s => st.data[s.id_siswa] = 'H'); V.renderRoster(!G().mapel.some(x => x.id_mapel === st.m), mapelById(st.m)); };
ACT['ab-buka'] = el => { Store.v.ab.t = el.dataset.t; Store.v.ab.j = Number(el.dataset.j); Store.v.ab.key = ''; R.render(); };
ACT['ab-simpan'] = el => sibuk(el, async () => {
  const st = Store.v.ab, data = {}; st.siswa.forEach(s => { if (!st.tercatat || st.data[s.id_siswa] !== st.asli[s.id_siswa]) data[s.id_siswa] = st.data[s.id_siswa]; });
  const r = await API.call('absensi.simpan', { id_mapel: st.m, tanggal: st.t, jam_ke: Number(st.j), data });
  st.siswa.forEach(s => st.asli[s.id_siswa] = st.data[s.id_siswa]); st.tercatat = true;
  toast(`Absensi tersimpan (${r.baru} baru, ${r.diubah} diubah)` + (r.notif ? ` · ${r.notif} notif alfa ke wali` : '') + '.');
  V.renderRoster(!G().mapel.some(x => x.id_mapel === st.m), mapelById(st.m));
}, 'Menyimpan…');

// ---------------------------------------------------------------- PANTAUAN KELAS (wali kelas)
R.def('pantauan', r => {
  const wk = U().kelasWali || [];
  if (!wk.length && !isAdmin()) return kosong('chart', 'Panel ini khusus wali kelas');
  const st = Store.v.pk = Object.assign({ k: (wk[0] || {}).id_kelas, tab: 'semua', q: '', s: '' }, Store.v.pk || {});
  if (r.q.k) st.k = r.q.k; if (r.q.s) st.s = r.q.s;
  const c = API.cached('walikelas.panel', { id_kelas: st.k });
  return { html: `<div id="pk" class="col gap24">${c ? V.pkHtml(c) : '<div class="sk" style="height:90px"></div><div class="grid4"><div class="sk" style="height:130px"></div><div class="sk" style="height:130px"></div><div class="sk" style="height:130px"></div><div class="sk" style="height:130px"></div></div><div class="sk" style="height:320px"></div>'}</div>`,
    after: async () => { try { const d = await API.call('walikelas.panel', { id_kelas: st.k }); if (JSON.stringify(d) !== JSON.stringify(c) || !c) { $('#pk').innerHTML = V.pkHtml(d); } V.pkCatatan(); } catch (e) { salah(e); } } };
});
V.pkHtml = d => {
  const st = Store.v.pk; Store.v.pkData = d;
  const wk = U().kelasWali || [], h = d.hariIni, kkm = d.kkm;
  const rata = d.siswa.filter(s => s.rata !== null), rataK = rata.length ? rata.reduce((a, s) => a + s.rata, 0) / rata.length : null;
  const tTot = d.tertunda.reduce((a, t) => a + t.belum.length, 0), tSiswa = new Set(d.tertunda.flatMap(t => t.belum)).size;
  const dist = d.distribusi, tuntas = persen(dist.sangatBaik + dist.baik, dist.sangatBaik + dist.baik + dist.remedial);
  return `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<a href="#/kelas">Panel Wali Kelas</a>${ic('chevR', 's')}<b>Pantauan ${esc(d.kelas.nama_kelas)}</b></div>
      <div class="row w"><h1>Panel Pantauan Wali Kelas ${esc(d.kelas.nama_kelas)}</h1><span class="bd ungu caps">Aktif ${esc(SET('TAHUN_AJARAN') || '')}</span></div><p class="mut mt8">Semester ${esc(SET('SEMESTER') || '')} · Wali kelas: <b class="tx">${esc(d.kelas.wali_kelas)}</b> (${d.siswa.length} siswa)</p></div>
    <div class="row w">${wk.length > 1 ? `<select class="sel pill" style="width:auto" data-c="pk-k">${wk.map(k => `<option value="${esc(k.id_kelas)}" ${k.id_kelas === st.k ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select>` : ''}<button class="btn w" data-a="pk-unduh">${ic('download')} Unduh rekap</button><button class="btn ok" data-a="pgm-form" data-kelas="${esc(d.kelas.id_kelas)}" data-penting="1">${ic('wa')} Kirim notifikasi massal WA</button><button class="btn p" data-a="cat-form" data-k="${esc(d.kelas.id_kelas)}">${ic('plus')} Tambah catatan siswa</button></div></div>
  <div class="grid4 k2">
    <div class="kpi"><div class="row sb2 top"><span class="caps mut">Kehadiran ${d.acuan === hariIni() ? 'hari ini' : esc(fTgl(d.acuan))}</span><span class="sq H">${ic('calendar', 's')}</span></div><div class="v">${h.persen === null ? '-' : angka(h.persen) + '<small>%</small>'} <small>${h.H}/${h.total} siswa</small></div><div class="row sb2 xs"><span class="${d.deltaPekan >= 0 ? 'ok' : 'err'} b">${d.deltaPekan === null ? '' : (d.deltaPekan >= 0 ? '+' : '') + angka(d.deltaPekan) + '% dari pekan lalu'}</span><span class="mut">${h.S} sakit · ${h.I} izin · ${h.A} alfa</span></div>${prog(h.persen || 0, 'var(--h)')}</div>
    <div class="kpi"><div class="row sb2 top"><span class="caps mut">Rata-rata nilai kelas</span><span class="sq ungu">${ic('trend', 's')}</span></div><div class="v">${angka(rataK)}<small> / 100</small></div><div class="row sb2 xs"><span class="${rataK >= kkm ? 'p' : 'err'} b">${rataK === null ? 'Belum ada nilai' : (rataK >= kkm ? '+' : '') + angka(rataK - kkm) + ' poin dari KKM'}</span><span class="mut">KKM ${kkm}</span></div>${prog(rataK || 0)}</div>
    <div class="kpi"><div class="row sb2 top"><span class="caps mut">Tugas tertunda</span><span class="sq I">${ic('hourglass', 's')}</span></div><div class="v">${d.tertunda.length}<small> tugas (${tSiswa} siswa)</small></div><div class="row sb2 xs"><span class="bd warn">${tTot} pengumpulan</span><span class="mut">tenggat ≤ 24 jam / lewat</span></div></div>
    <div class="kpi"><div class="row sb2 top"><span class="caps mut">Perlu perhatian</span><span class="sq A">${ic('flag', 's')}</span></div><div class="v" style="color:var(--a-tx)">${d.perhatian.length}<small> siswa</small></div><span class="bd bad trunc" style="align-self:flex-start;max-width:100%">${esc(d.perhatian.slice(0, 2).map(s => s.nama.split(' ')[0]).join(', ') || 'Tidak ada')}</span></div></div>
  <div class="cols"><div class="card"><div class="card-h"><div><h3>Grafik kehadiran harian & distribusi jam</h3><p class="xs mut2">5 hari sekolah terakhir · rekap per jam ke-1 s/d 8</p></div>${legendaAbs()}</div>
      ${Chart.stackAbs(d.pekan.map(x => ({ label: HARI[wib(tms(x.t)).w], sub: fHari(x.t), H: x.H, S: x.S, I: x.I, A: x.A })), { aria: 'Kehadiran 5 hari terakhir' })}
      <span class="caps mut" style="display:block;margin:14px 0 8px">Rekapitulasi jam pelajaran ${d.acuan === hariIni() ? 'hari ini' : esc(fTgl(d.acuan))} (${d.jamHariIni.length} jam)</span>
      <div class="jamgrid">${d.jamHariIni.map(j => `<div><b class="sm tx trunc" style="display:block">Jam ${j.jam} · ${esc(j.mapel)}</b><span class="xs ${j.A ? 'err' : 'ok'} b">${j.H} hadir${j.S + j.I + j.A ? ' (' + [j.S && j.S + ' sakit', j.I && j.I + ' izin', j.A && j.A + ' alfa'].filter(Boolean).join(', ') + ')' : ' (100%)'}</span></div>`).join('') || '<span class="sm mut">Belum ada catatan.</span>'}</div></div>
    <div class="card"><div class="card-h"><div><h3>Sebaran nilai vs KKM (${kkm})</h3><p class="xs mut2">Ketuntasan belajar kelas ${esc(d.kelas.nama_kelas)}</p></div><span class="bd ungu">${d.siswa.length} siswa</span></div>
      <div class="row w" style="gap:18px;justify-content:center">${Chart.donut([{ l: 'Sangat baik (>85)', v: dist.sangatBaik, c: '#5B5BD6' }, { l: 'Baik (KKM–85)', v: dist.baik, c: '#9EA5FB' }, { l: 'Di bawah KKM', v: dist.remedial, c: '#EF4444' }, { l: 'Belum ada nilai', v: dist.belum, c: '#E5E7EB' }], tuntas + '%', 'tuntas')}
      <div class="col grow" style="gap:8px;min-width:170px">${[['Sangat baik (>85)', dist.sangatBaik, '#5B5BD6', ''], ['Baik (' + kkm + '–85)', dist.baik, '#9EA5FB', ''], ['Di bawah KKM', dist.remedial, '#EF4444', 'bad'], ['Belum dinilai', dist.belum, '#E5E7EB', '']].map(x => `<div class="row sb2 sm card flat" style="padding:8px 10px;${x[3] ? 'background:var(--a-bg)' : ''}"><span class="row" style="gap:8px"><i style="width:10px;height:10px;border-radius:3px;background:${x[2]}"></i><b class="${x[3] ? 'err' : 'tx'}">${x[0]}</b></span><b class="${x[3] ? 'err' : 'tx'}">${x[1]} <span class="xs mut">(${persen(x[1], d.siswa.length)}%)</span></b></div>`).join('')}</div></div>
      ${dist.remedial ? `<div class="card flat row top mt16" style="background:var(--i-bg)">${ic('calendar')}<div class="sm"><b class="tx">Bimbingan remedial</b><p class="xs mt8">${dist.remedial} siswa di bawah KKM — jadwalkan klinik remedial & catat sebagai catatan bimbingan.</p></div></div>` : ''}</div></div>
  <div class="cols"><div class="card"><div class="row w sb2" style="margin-bottom:12px"><div class="seg">${[['semua', 'Semua siswa (' + d.siswa.length + ')'], ['perhatian', 'Perlu perhatian (' + d.perhatian.length + ')'], ['prestasi', 'Prestasi unggul'], ['absen', 'Absensi bermasalah']].map(x => `<button class="${st.tab === x[0] ? 'on' : ''}" data-a="pk-tab" data-t="${x[0]}">${x[1]}</button>`).join('')}</div><div class="search" style="max-width:220px">${ic('search')}<input type="search" placeholder="Cari nama / NIS…" value="${esc(st.q)}" data-i="pk-cari" style="height:38px"></div></div><div id="pk-tabel">${V.pkTabel()}</div></div>
    <div class="stack" id="pk-laci">${V.pkLaci()}</div></div>`;
};
V.pkBaris = () => {
  const st = Store.v.pk, d = Store.v.pkData, q = st.q.toLowerCase();
  return d.siswa.filter(s => (!q || (s.nama + ' ' + s.nis).toLowerCase().includes(q)) && (st.tab === 'semua' || (st.tab === 'perhatian' && s.flags.length) || (st.tab === 'prestasi' && ((s.catatan && s.catatan.prestasi) || (s.rata !== null && s.rata >= 90))) || (st.tab === 'absen' && (s.hadirHari.A > 0 || s.hadirHari.I + s.hadirHari.S >= 3))));
};
V.pkTabel = () => {
  const st = Store.v.pk, d = Store.v.pkData, kkm = d.kkm, rows = V.pkBaris();
  const flagL = { alfa: ['bad', 'flag', 'Alfa'], nilai: ['bad', 'alert', 'Nilai < KKM'], tugas: ['warn', 'clock', 'Tugas'] };
  return `<div class="tw"><table class="tbl"><thead><tr><th>Siswa</th><th class="num">Hadir</th><th class="num">Rata-rata</th><th>Tugas</th><th>Flag</th><th></th></tr></thead><tbody>${rows.map((s, i) => `<tr class="${st.s === s.id_siswa ? 'sel' : ''}" data-a="pk-pilih" data-s="${esc(s.id_siswa)}" style="cursor:pointer"><td><div class="row" style="gap:10px">${avatar(s.nama, 'sm')}<div style="min-width:120px"><b class="tx">${esc(s.nama)}</b><br><span class="xs mut">${p2(i + 1)} · ${esc(s.nis)}</span></div></div></td>
    <td class="num"><span class="bd ${s.persenHadir === null ? 'belum' : s.persenHadir >= 95 ? 'ok' : s.persenHadir >= 85 ? 'warn' : 'bad'}">${s.persenHadir === null ? '-' : angka(s.persenHadir, 0) + '%'}</span><div style="width:56px;margin:4px 0 0 auto">${prog(s.persenHadir || 0, s.persenHadir >= 95 ? 'var(--h)' : s.persenHadir >= 85 ? 'var(--i)' : 'var(--a)')}</div></td>
    <td class="num"><b class="${s.rata !== null && s.rata < kkm ? 'err' : 'tx'}">${angka(s.rata)}</b></td>
    <td class="nowrap">${s.tugas.belum ? `<span class="bd bad">${s.tugas.belum} belum</span>` : s.tugas.terlambat ? `<span class="bd warn">${s.tugas.terlambat} telat</span>` : '<span class="bd ok">' + ic('checkCircle', 's') + 'Tuntas</span>'}</td>
    <td><div class="row w" style="gap:4px">${s.flags.map(f => `<span class="bd ${flagL[f][0]}">${ic(flagL[f][1], 's')}${flagL[f][2]}</span>`).join('')}${s.catatan && s.catatan.prestasi ? `<span class="bd ungu">${ic('award', 's')}Prestasi</span>` : ''}${!s.flags.length && !(s.catatan && s.catatan.prestasi) ? '<span class="xs mut">-</span>' : ''}</div></td>
    <td><div class="row" style="gap:4px;justify-content:flex-end">${s.no_wa_wali ? `<a class="btn ok xs ico" href="${waLink(s.no_wa_wali, 'Assalamu\'alaikum Bapak/Ibu ' + (s.nama_wali || '') + ', saya wali kelas ' + d.kelas.nama_kelas + ' ingin menyampaikan perkembangan ananda ' + s.nama + '.')}" target="_blank" rel="noopener" title="Hubungi wali">${ic('wa', 's')}</a>` : ''}</div></td></tr>`).join('') || `<tr><td colspan="6">${kosong('users', 'Tidak ada siswa pada filter ini')}</td></tr>`}</tbody></table></div>`;
};
V.pkLaci = () => {
  const st = Store.v.pk, d = Store.v.pkData, s = d.siswa.find(x => x.id_siswa === st.s) || d.siswa.find(x => x.flags.length) || d.siswa[0];
  if (!s) return '';
  st.s = s.id_siswa;
  return `<div class="card col gap16" style="position:sticky;top:20px"><div class="row top">${avatar(s.nama, 'lg')}<div class="grow"><div class="row w"><h3>${esc(s.nama)}</h3>${s.flags.length ? '<span class="bd bad">Butuh bimbingan</span>' : ''}</div><p class="xs mut">NIS ${esc(s.nis)} · ${esc(d.kelas.nama_kelas)}</p></div></div>
    <div class="grid3">${[['Hadir', s.persenHadir === null ? '-' : angka(s.persenHadir, 0) + '%'], ['Rata-rata', angka(s.rata)], ['Alfa', s.hadirHari.A + ' hari']].map(x => `<div class="card flat center" style="padding:10px"><b class="tx">${x[1]}</b><div class="xs mut">${x[0]}</div></div>`).join('')}</div>
    <div class="card flat row sb2"><div><span class="caps mut">Wali murid terdaftar</span><p class="b tx">${esc(s.nama_wali || '-')}</p><p class="xs mut">${esc(hpTampil(s.no_wa_wali))}</p></div>${s.no_wa_wali ? `<a class="btn ok sm" href="${waLink(s.no_wa_wali)}" target="_blank" rel="noopener">${ic('wa', 's')} WhatsApp</a>` : ''}</div>
    <button class="btn w sm" data-a="pk-rapor" data-s="${esc(s.id_siswa)}">${ic('award', 's')} Lihat rapor mini</button>
    <div><div class="row sb2"><h4>Riwayat catatan & pembinaan</h4><span class="xs mut" id="pk-ncat"></span></div><div class="col mt12" id="pk-cat" style="gap:10px"><div class="sk" style="height:70px"></div></div></div>
    <form class="col" data-f="pk-cat" style="border-top:1px solid var(--line2);padding-top:14px"><b class="tx sm">Tambah catatan wali kelas</b>
      <div class="seg">${[['bimbingan', 'Bimbingan'], ['pelanggaran', 'Pelanggaran'], ['prestasi', 'Prestasi']].map((x, i) => `<label><input class="sr" type="radio" name="jenis" value="${x[0]}" ${i ? '' : 'checked'}><span class="btn xs ${i ? 'ghost' : 'p'}" data-a="radio-seg">${x[1]}</span></label>`).join('')}</div>
      <textarea class="ta" name="deskripsi" rows="3" placeholder="Tuliskan catatan perkembangan belajar, kedisiplinan, atau rekomendasi…" required></textarea>
      <label class="row sb2 sm" style="cursor:pointer"><span class="row">${ic('wa', 's')} Tembuskan ke WhatsApp wali</span><span class="sw"><input type="checkbox" name="tembuskan"><span></span></span></label>
      <button class="btn p blk">${ic('save')} Simpan catatan siswa</button></form></div>`;
};
V.pkCatatan = async () => {
  const sid = Store.v.pk.s; if (!sid) return;
  const tampil = list => { const el = $('#pk-cat'); if (!el || Store.v.pk.s !== sid) return; $('#pk-ncat').textContent = list.length + ' catatan'; el.innerHTML = list.length ? list.map(c => `<div class="tl ${esc(c.jenis)}"><div class="row sb2 xs"><span class="bd ${c.jenis === 'prestasi' ? 'ok' : c.jenis === 'pelanggaran' ? 'bad' : 'warn'} caps">${esc(c.jenis)}</span><span class="mut">${esc(fTgl(c.tanggal))}</span></div><p>${esc(c.deskripsi)}</p><div class="row sb2"><span class="xs mut">Dicatat oleh: ${esc(c.pencatat)}</span><button class="btn ghost xs ico" data-a="cat-hapus" data-id="${esc(c.id_catatan)}" title="Hapus">${ic('trash', 's')}</button></div></div>`).join('') : '<p class="sm mut">Belum ada catatan.</p>'; };
  const c = API.cached('catatan.list', { id_siswa: sid }); if (c) tampil(c);
  try { tampil(await API.call('catatan.list', { id_siswa: sid })); } catch (e) { }
};
ACT['pk-tab'] = el => { Store.v.pk.tab = el.dataset.t; $$('[data-a=pk-tab]').forEach(b => b.classList.toggle('on', b === el)); $('#pk-tabel').innerHTML = V.pkTabel(); };
INP['pk-cari'] = debounce(el => { Store.v.pk.q = el.value; $('#pk-tabel').innerHTML = V.pkTabel(); }, 100);
CHG['pk-k'] = el => { Store.v.pk.k = el.value; Store.v.pk.s = ''; R.render(); };
ACT['pk-pilih'] = (el, ev) => { if (ev.target.closest('a')) return; Store.v.pk.s = el.dataset.s; $('#pk-tabel').innerHTML = V.pkTabel(); $('#pk-laci').innerHTML = V.pkLaci(); V.pkCatatan(); if (window.innerWidth < 1280) $('#pk-laci').scrollIntoView({ behavior: 'smooth' }); };
ACT['pk-rapor'] = el => sibuk(el, async () => Rapor.buka(await API.call('rapor.siswa', { id_siswa: el.dataset.s })));
FRM['pk-cat'] = f => sibuk($('button.p', f), async () => { const d = formData(f); d.id_siswa = Store.v.pk.s; const r = await API.call('catatan.simpan', d); f.reset(); toast('Catatan tersimpan' + (r.notif ? ' & diteruskan ke WA wali' : '') + '.'); V.pkCatatan(); });
ACT['cat-hapus'] = async el => { if (await Modal.konfirmasi('Hapus catatan?', '', { ok: 'Hapus', bahaya: true })) sibuk(null, async () => { await API.call('catatan.hapus', { id_catatan: el.dataset.id }); toast('Catatan dihapus.'); if ($('#pk-cat')) V.pkCatatan(); if ($('#cat-list')) R.render(); }); };
ACT['pk-unduh'] = el => sibuk(el, async () => {
  const d = Store.v.pkData, g = await API.call('absensi.kelas', { id_kelas: d.kelas.id_kelas });
  const ringkas = [['No', 'NIS', 'Nama', 'Wali', 'No WA Wali', 'Hadir (jam)', 'Sakit (jam)', 'Izin (jam)', 'Alfa (jam)', '% Hadir', 'Alfa (hari)', 'Rata-rata', 'Predikat', 'Tugas tepat', 'Terlambat', 'Belum', 'Flag']]
    .concat(d.siswa.map((s, i) => [i + 1, s.nis, s.nama, s.nama_wali, s.no_wa_wali, s.hadir.H, s.hadir.S, s.hadir.I, s.hadir.A, s.persenHadir, s.hadirHari.A, s.rata, s.predikat, s.tugas.tepat, s.tugas.terlambat, s.tugas.belum, s.flags.join(', ')]));
  const grid = [['NIS', 'Nama'].concat(g.sesi.map(x => x.t.slice(5) + ' J' + x.j + ' ' + x.nama_mapel.slice(0, 8)))].concat(g.roster.map((s, i) => [s.nis, s.nama].concat(g.sesi.map(x => x.st.charAt(i) === '-' ? '' : x.st.charAt(i)))));
  await Ekspor.xlsx('Rekap ' + d.kelas.nama_kelas + ' ' + hariIni(), [{ nama: 'Ringkasan', rows: ringkas }, { nama: 'Absensi per jam', rows: grid }]);
});

// ---------------------------------------------------------------- CATATAN SISWA (wali kelas)
V.catatanGuru = () => {
  const wk = U().kelasWali || [];
  if (!wk.length) return kosong('note', 'Menu ini khusus wali kelas');
  const st = Store.v.cat = Object.assign({ k: wk[0].id_kelas, j: '' }, Store.v.cat || {});
  return { html: `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Catatan Siswa</b></div><h1>Catatan Pelanggaran, Bimbingan & Prestasi</h1><p class="mut mt8">Riwayat pencatat & tanggal tersimpan; setiap perubahan masuk log audit.</p></div><button class="btn p" data-a="cat-form" data-k="${esc(st.k)}">${ic('plus')} Tambah catatan</button></div>
    <div class="card" id="cat-list"><div class="sk" style="height:240px"></div></div>`, after: V.muatCatatan };
};
V.muatCatatan = async () => {
  const st = Store.v.cat;
  try {
    const list = await API.call('catatan.list', { id_kelas: st.k }), nama = {}; G().siswa.forEach(s => nama[s.id_siswa] = s.nama);
    Store.v.catList = list;
    const el = $('#cat-list'); if (!el) return;
    el.innerHTML = `<div class="row w sb2" style="margin-bottom:12px"><div class="seg">${[['', 'Semua'], ['pelanggaran', 'Pelanggaran'], ['bimbingan', 'Bimbingan'], ['prestasi', 'Prestasi']].map(x => `<button class="${st.j === x[0] ? 'on' : ''}" data-a="cat-j" data-j="${x[0]}">${x[1]} (${x[0] ? list.filter(c => c.jenis === x[0]).length : list.length})</button>`).join('')}</div><div class="search" style="max-width:240px">${ic('search')}<input type="search" placeholder="Cari…" data-i="tb-cari" data-t="cat" style="height:38px"></div></div>` +
      Tabel.def('cat', { per: 12, rows: () => Store.v.catList.filter(c => !Store.v.cat.j || c.jenis === Store.v.cat.j), cari: c => nama[c.id_siswa] + ' ' + c.deskripsi, sk: 'tanggal', sd: -1,
        kolom: [{ k: 'tanggal', l: 'Tanggal', r: c => esc(fTgl(c.tanggal)), sort: c => c.tanggal }, { k: 'id_siswa', l: 'Siswa', r: c => `<b class="tx">${esc(nama[c.id_siswa] || c.id_siswa)}</b>`, sort: c => nama[c.id_siswa] },
          { k: 'jenis', l: 'Jenis', r: c => `<span class="bd ${c.jenis === 'prestasi' ? 'ok' : c.jenis === 'pelanggaran' ? 'bad' : 'warn'}">${esc(c.jenis)}</span>` }, { k: 'deskripsi', l: 'Catatan', r: c => `<span class="sm">${esc(c.deskripsi)}</span>` },
          { k: 'pencatat', l: 'Pencatat' }, { k: 'x', l: '', sort: false, r: c => `<div class="row" style="gap:4px"><button class="btn ghost xs ico" data-a="cat-form" data-id="${esc(c.id_catatan)}" data-k="${esc(st.k)}" title="Ubah">${ic('edit', 's')}</button><button class="btn ghost xs ico" data-a="cat-hapus" data-id="${esc(c.id_catatan)}" title="Hapus">${ic('trash', 's')}</button></div>` }] });
  } catch (e) { salah(e); }
};
ACT['cat-j'] = el => { Store.v.cat.j = el.dataset.j; $$('[data-a=cat-j]').forEach(b => b.classList.toggle('on', b === el)); Tabel.refresh('cat'); };
ACT['cat-form'] = el => {
  const id = el.dataset.id, c = id ? (Store.v.catList || []).find(x => x.id_catatan === id) : {}, siswa = siswaKelasG(el.dataset.k);
  Modal.open(`${Modal.head(id ? 'Ubah catatan' : 'Tambah catatan siswa', '', 'note')}<form class="modal-b col" data-f="cat" data-id="${esc(id || '')}">
    <div class="fld"><label>Siswa</label><select class="sel" name="id_siswa" ${id ? 'disabled' : ''}>${siswa.map(s => `<option value="${esc(s.id_siswa)}" ${(c.id_siswa || (Store.v.pk || {}).s) === s.id_siswa ? 'selected' : ''}>${esc(s.nama)}</option>`).join('')}</select></div>
    <div class="fld"><label>Jenis</label><select class="sel" name="jenis">${['bimbingan', 'pelanggaran', 'prestasi'].map(j => `<option ${c.jenis === j ? 'selected' : ''}>${j}</option>`).join('')}</select></div>
    <div class="fld"><label>Catatan</label><textarea class="ta" name="deskripsi" rows="4" required>${esc(c.deskripsi || '')}</textarea></div>
    <label class="chk"><input type="checkbox" name="tembuskan"><span>Tembuskan ke WhatsApp wali murid</span></label>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn ghost" data-a="tutup">Batal</button><button class="btn p">${ic('save')} Simpan</button></div></form>`);
};
FRM.cat = f => sibuk($('button.p', f), async () => { const d = formData(f); if (f.dataset.id) { d.id_catatan = f.dataset.id; d.id_siswa = (Store.v.catList.find(c => c.id_catatan === f.dataset.id) || {}).id_siswa; } await API.call('catatan.simpan', d); Modal.close(); toast('Catatan tersimpan.'); if ($('#cat-list')) V.muatCatatan(); if ($('#pk-cat')) V.pkCatatan(); });

// ---------------------------------------------------------------- LAPORAN (grafik + tabel + ekspor)
R.def('laporan', r => {
  const g = B().guru, adm = B().admin, wk = U().kelasWali || [];
  const pilihan = [];
  if (adm) pilihan.push({ v: 'sekolah', l: '🏫 Seluruh sekolah (per kelas)' });
  wk.forEach(k => pilihan.push({ v: 'k:' + k.id_kelas, l: '👥 Kelas ' + k.nama_kelas + ' (perwalian)' }));
  if (adm) adm.kelas.filter(k => !wk.some(w => w.id_kelas === k.id_kelas)).forEach(k => pilihan.push({ v: 'k:' + k.id_kelas, l: '👥 Kelas ' + k.nama_kelas }));
  (g ? g.mapel : []).forEach(m => pilihan.push({ v: 'm:' + m.id_mapel, l: '📘 ' + labelMapel(m) }));
  if (g) g.mapelWali.filter(m => !g.mapel.some(x => x.id_mapel === m.id_mapel)).forEach(m => pilihan.push({ v: 'm:' + m.id_mapel, l: '📘 ' + labelMapel(m) }));
  if (!pilihan.length) return kosong('pie', 'Belum ada data laporan');
  const st = Store.v.lap = Object.assign({ v: pilihan[0].v, f: '' }, Store.v.lap || {});
  if (r.q.m) st.v = 'm:' + r.q.m;
  if (!pilihan.some(p => p.v === st.v)) st.v = pilihan[0].v;
  const q = st.v === 'sekolah' ? {} : st.v[0] === 'k' ? { id_kelas: st.v.slice(2) } : { id_mapel: st.v.slice(2) };
  const c = API.cached('laporan.data', q);
  return { html: `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Laporan</b></div><h1>Laporan & Statistik</h1><p class="mut mt8">Tren nilai, kehadiran per jam/tanggal, status tugas, dan progres belajar — lengkap dengan tabel & unduhan.</p></div>
      <select class="sel pill" style="width:auto;min-width:260px" data-c="lap-v" aria-label="Lingkup laporan">${pilihan.map(p => `<option value="${esc(p.v)}" ${st.v === p.v ? 'selected' : ''}>${esc(p.l)}</option>`).join('')}</select></div><div id="lap" class="col gap24">${c ? V.lapHtml(c) : '<div class="grid4"><div class="sk" style="height:110px"></div><div class="sk" style="height:110px"></div><div class="sk" style="height:110px"></div><div class="sk" style="height:110px"></div></div><div class="sk mt16" style="height:300px"></div>'}</div>`,
    after: async () => { try { const d = await API.call('laporan.data', q); if (!c || JSON.stringify(c) !== JSON.stringify(d)) $('#lap').innerHTML = V.lapHtml(d); } catch (e) { salah(e); } } };
});
CHG['lap-v'] = el => { Store.v.lap.v = el.value; R.go('#/laporan'); R.render(); };
V.lapHtml = d => {
  Store.v.lapData = d;
  if (d.lingkup === 'sekolah') {
    return `<div class="cols half"><div class="card"><div class="card-h"><h3>Kehadiran per kelas</h3><span class="xs mut">% jam pelajaran hadir</span></div>${Chart.hbars(d.kelas.map(k => ({ l: k.nama_kelas, v: k.persenHadir, warna: k.persenHadir >= 95 ? 'var(--h)' : k.persenHadir >= 85 ? 'var(--i)' : 'var(--a)', ket: angka(k.persenHadir) + '% hadir · ' + k.siswa + ' siswa' })), { suf: '%' })}</div>
      <div class="card"><div class="card-h"><h3>Rata-rata nilai per kelas</h3><span class="xs mut">KKM ${esc(SET('KKM'))}</span></div>${Chart.hbars(d.kelas.map(k => ({ l: k.nama_kelas, v: k.rata, warna: k.rata >= KKM() ? 'var(--p)' : 'var(--a)', ket: 'Rata-rata ' + angka(k.rata) + ' · ' + k.remedial + ' siswa remedial' })), { d: 1 })}</div></div>
      <div class="card"><div class="card-h"><h3>Tabel per kelas</h3><div class="row"><button class="btn w sm" data-a="lap-xls">${ic('sheet', 's')} Excel</button><button class="btn w sm" data-a="lap-pdf">${ic('filePdf', 's')} PDF</button></div></div>${Tabel.def('lapk', { per: 15, rows: () => Store.v.lapData.kelas, cari: k => k.nama_kelas + ' ' + k.wali_kelas,
        kolom: [{ k: 'nama_kelas', l: 'Kelas', r: k => `<b class="tx">${esc(k.nama_kelas)}</b>` }, { k: 'wali_kelas', l: 'Wali kelas' }, { k: 'siswa', l: 'Siswa', num: true }, { k: 'persenHadir', l: '% Hadir', num: true, r: k => angka(k.persenHadir) }, { k: 'rata', l: 'Rata-rata', num: true, r: k => `<b class="${k.rata < KKM() ? 'err' : 'tx'}">${angka(k.rata)}</b>` }, { k: 'tepatWaktu', l: 'Tugas tepat waktu', num: true, r: k => angka(k.tepatWaktu) + '%' }, { k: 'remedial', l: 'Remedial', num: true }, { k: 'x', l: '', sort: false, r: k => `<button class="btn soft xs" data-a="lap-ke" data-v="k:${esc(k.id_kelas)}">Detail</button>` }] })}</div>`;
  }
  const s = d.siswa, kkm = d.kkm, adaN = s.filter(x => x.rata !== null), rata = adaN.length ? adaN.reduce((a, x) => a + x.rata, 0) / adaN.length : null;
  const adaH = s.filter(x => x.persenHadir !== null), hadir = adaH.length ? adaH.reduce((a, x) => a + x.persenHadir, 0) / adaH.length : null;
  const st = d.statusTugas, totT = st.tepat + st.terlambat + st.belum, prg = s.filter(x => x.materi.persen !== null), mp = prg.length ? prg.reduce((a, x) => a + x.materi.persen, 0) / prg.length : null;
  return `<div class="grid4 k2">
    <div class="kpi"><span class="caps mut">Rata-rata nilai</span><div class="v">${angka(rata)}<small> / 100</small></div><span class="xs ${rata >= kkm ? 'ok' : 'err'} b">${rata === null ? '-' : rata >= kkm ? 'Di atas KKM ' + kkm : 'Di bawah KKM ' + kkm}</span></div>
    <div class="kpi"><span class="caps mut">Kehadiran (jam)</span><div class="v">${angka(hadir)}<small>%</small></div>${prog(hadir || 0, 'var(--h)')}<span class="xs mut">${d.sesiTotal} sesi tercatat</span></div>
    <div class="kpi"><span class="caps mut">Tugas tepat waktu</span><div class="v">${persen(st.tepat, totT)}<small>%</small></div><span class="xs mut">${st.terlambat} terlambat · ${st.belum} belum</span></div>
    <div class="kpi"><span class="caps mut">Progres materi</span><div class="v">${angka(mp, 0)}<small>%</small></div>${prog(mp || 0)}<span class="xs mut">${d.materiTotal} materi terbit</span></div></div>
  <div class="cols"><div class="card"><div class="card-h"><div><h3>Tren nilai</h3><p class="xs mut2">Rata-rata kelas per tugas/kuis (urut tenggat)</p></div><span class="xs mut">${d.tren.length} penilaian</span></div>${Chart.line(d.tren.map(t => ({ label: fTgl(t.t).replace(/ \d{4}$/, ''), v: t.rata, sub: (t.jenis === 'kuis' ? 'Kuis: ' : '') + t.judul + (t.mapel && d.lingkup === 'kelas' ? ' (' + t.mapel + ')' : '') + ' · ' + t.n + ' siswa' })), { kkm, min: 40, aria: 'Tren nilai' })}</div>
    <div class="card col" style="align-items:center"><h3 style="align-self:flex-start">Status pengumpulan tugas</h3>${Chart.donut([{ l: 'Tepat waktu', v: st.tepat, c: STATUS_WARNA.H }, { l: 'Terlambat', v: st.terlambat, c: STATUS_WARNA.I }, { l: 'Belum (lewat tenggat)', v: st.belum, c: STATUS_WARNA.A }, { l: 'Menunggu tenggat', v: st.menunggu, c: '#C7D2FE' }], persen(st.tepat, totT) + '%', 'tepat waktu')}${legenda([['Tepat ' + st.tepat, STATUS_WARNA.H], ['Terlambat ' + st.terlambat, STATUS_WARNA.I], ['Belum ' + st.belum, STATUS_WARNA.A], ['Menunggu ' + st.menunggu, '#C7D2FE']])}</div></div>
  <div class="cols"><div class="card"><div class="card-h"><div><h3>Kehadiran per tanggal</h3><p class="xs mut2">10 hari sekolah terakhir</p></div>${legendaAbs()}</div>${Chart.stackAbs(d.hadirTanggal.slice(-10).map(x => ({ label: x.t.slice(8) + '/' + x.t.slice(5, 7), sub: fHari(x.t), H: x.H, S: x.S, I: x.I, A: x.A })), { aria: 'Kehadiran per tanggal' })}</div>
    <div class="card"><div class="card-h"><h3>Kehadiran per jam ke-</h3><span class="xs mut">% hadir</span></div>${Chart.hbars(d.hadirJam.map(j => ({ l: 'Jam ke-' + j.jam, v: j.persen, warna: j.persen >= 95 ? 'var(--h)' : j.persen >= 85 ? 'var(--i)' : 'var(--a)', ket: 'H ' + j.H + ' · S ' + j.S + ' · I ' + j.I + ' · A ' + j.A })), { suf: '%', d: 1 })}</div></div>
  <div class="card"><div class="row w sb2" style="margin-bottom:12px"><div><h3>Tabel siswa — ${esc(d.judul)}</h3><p class="xs mut2">Cari, urutkan kolom, lalu unduh</p></div><div class="row w"><div class="seg">${[['', 'Semua'], ['kkm', 'Di bawah KKM'], ['alfa', 'Pernah alfa'], ['tugas', 'Tugas belum']].map(x => `<button class="${Store.v.lap.f === x[0] ? 'on' : ''}" data-a="lap-f" data-f="${x[0]}">${x[1]}</button>`).join('')}</div><div class="search" style="max-width:220px">${ic('search')}<input type="search" placeholder="Cari siswa…" data-i="tb-cari" data-t="lap" style="height:38px"></div><button class="btn w sm" data-a="lap-xls">${ic('sheet', 's')} Excel</button><button class="btn w sm" data-a="lap-pdf">${ic('filePdf', 's')} PDF</button></div></div>
    ${Tabel.def('lap', { per: 15, sk: 'nama', rows: () => Store.v.lapData.siswa.filter(x => { const f = Store.v.lap.f; return !f || (f === 'kkm' && x.rata !== null && x.rata < kkm) || (f === 'alfa' && x.hadir.A > 0) || (f === 'tugas' && x.tugas.belum > 0); }), cari: x => x.nama + ' ' + x.nis,
      kolom: [{ k: 'nama', l: 'Nama', r: x => `<b class="tx">${esc(x.nama)}</b><br><span class="xs mut">${esc(x.nis)}</span>` }, { k: 'persenHadir', l: '% Hadir', num: true, r: x => `<span class="bd ${x.persenHadir === null ? 'belum' : x.persenHadir >= 95 ? 'ok' : x.persenHadir >= 85 ? 'warn' : 'bad'}">${angka(x.persenHadir)}</span>` },
        { k: 'abs', l: 'S / I / A (jam)', r: x => `${x.hadir.S} / ${x.hadir.I} / <b class="${x.hadir.A ? 'err' : ''}">${x.hadir.A}</b>`, sort: x => x.hadir.A }, { k: 'rata', l: 'Rata-rata', num: true, r: x => `<b class="${x.rata !== null && x.rata < kkm ? 'err' : 'tx'}">${angka(x.rata)}</b>`, sort: x => x.rata === null ? -1 : x.rata },
        { k: 'predikat', l: 'Pred.' }, { k: 'tg', l: 'Tugas tepat / telat / belum', r: x => `${x.tugas.tepat} / ${x.tugas.terlambat} / <b class="${x.tugas.belum ? 'err' : ''}">${x.tugas.belum}</b>`, sort: x => x.tugas.belum },
        { k: 'kuis', l: 'Kuis', r: x => x.kuis.selesai + '/' + x.kuis.total + (x.kuis.rata !== null ? ' · ' + angka(x.kuis.rata) : ''), sort: x => x.kuis.rata || 0 }, { k: 'materi', l: 'Materi dibuka', num: true, r: x => (x.materi.persen === null ? '-' : x.materi.persen + '%'), sort: x => x.materi.persen || 0 }] })}</div>`;
};
ACT['lap-f'] = el => { Store.v.lap.f = el.dataset.f; $$('[data-a=lap-f]').forEach(b => b.classList.toggle('on', b === el)); Tabel.cfg.lap.hal = 1; Tabel.refresh('lap'); };
ACT['lap-ke'] = el => { Store.v.lap.v = el.dataset.v; R.render(); };
const lapRows = () => { const d = Store.v.lapData; if (d.lingkup === 'sekolah') return [['Kelas', 'Wali kelas', 'Siswa', '% Hadir', 'Rata-rata', '% Tugas tepat', 'Remedial']].concat(d.kelas.map(k => [k.nama_kelas, k.wali_kelas, k.siswa, k.persenHadir, k.rata, k.tepatWaktu, k.remedial]));
  return [['No', 'NIS', 'Nama', '% Hadir', 'Hadir', 'Sakit', 'Izin', 'Alfa', 'Rata-rata', 'Predikat', 'Tugas tepat', 'Terlambat', 'Belum', 'Kuis selesai', 'Rata kuis', '% Materi dibuka']].concat(Tabel.data('lap').map((x, i) => [i + 1, x.nis, x.nama, x.persenHadir, x.hadir.H, x.hadir.S, x.hadir.I, x.hadir.A, x.rata, x.predikat, x.tugas.tepat, x.tugas.terlambat, x.tugas.belum, x.kuis.selesai, x.kuis.rata, x.materi.persen])); };
ACT['lap-xls'] = () => { const d = Store.v.lapData, sheets = [{ nama: 'Siswa', rows: lapRows() }]; if (d.tren) sheets.push({ nama: 'Tren nilai', rows: [['Tanggal', 'Penilaian', 'Jenis', 'Mapel', 'Rata-rata', 'Jumlah dinilai']].concat(d.tren.map(t => [t.t, t.judul, t.jenis, t.mapel, t.rata, t.n])) }, { nama: 'Kehadiran per tanggal', rows: [['Tanggal', 'Hadir', 'Sakit', 'Izin', 'Alfa', '% Hadir']].concat(d.hadirTanggal.map(x => [x.t, x.H, x.S, x.I, x.A, x.persen])) }); Ekspor.xlsx('Laporan ' + d.judul, sheets); };
ACT['lap-pdf'] = () => Ekspor.pdf('Laporan — ' + Store.v.lapData.judul, lapRows());
