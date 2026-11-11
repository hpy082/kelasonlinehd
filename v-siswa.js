/* =====================================================================
   Tampilan MURID & WALI MURID — beranda, kelas saya, tugas (kumpul),
   kuis bertimer, presensi (kalender per jam), nilai & rapor mini
   ===================================================================== */
'use strict';
const pilihAnak = () => {
  const w = B().wali; if (!w || w.anak.length < 2) return '';
  return `<div class="seg" role="tablist" aria-label="Pilih anak">${w.anak.map((a, i) => `<button class="${i === Math.min(Store.anak, w.anak.length - 1) ? 'on' : ''}" data-a="pilih-anak" data-i="${i}">${esc(a.profil.nama.split(' ')[0])} · ${esc(a.profil.kelas)}</button>`).join('')}</div>`;
};
ACT['pilih-anak'] = el => { Store.anak = Number(el.dataset.i); LS.set('spd_anak', Store.anak); R.render(); };
const tambahNamaMapel = (sd, x) => Object.assign({ nama_mapel: (sd.mapel.find(m => m.id_mapel === x.id_mapel) || {}).nama_mapel || '', guru: (sd.mapel.find(m => m.id_mapel === x.id_mapel) || {}).guru || '' }, x);
/** Ringkasan kehadiran dari sesi per jam: per jam & per hari (status terburuk) */
function rekapAbs(sesi) {
  const jam = { H: 0, S: 0, I: 0, A: 0 }, hari = {};
  const pr = { H: 1, I: 2, S: 3, A: 4 };
  sesi.forEach(s => { jam[s.s]++; if (!hari[s.t] || pr[s.s] > pr[hari[s.t]]) hari[s.t] = s.s; });
  const hr = { H: 0, S: 0, I: 0, A: 0 }; Object.values(hari).forEach(s => hr[s]++);
  const tot = jam.H + jam.S + jam.I + jam.A;
  return { jam, hari, hr, persen: tot ? Math.round(jam.H / tot * 1000) / 10 : null, tot };
}

// ---------------------------------------------------------------- BERANDA MURID
V.berandaMurid = () => {
  const sd = SD(), u = U(), now = sekarang();
  const materi = urut(sd.materi.map(m => tambahNamaMapel(sd, m)), m => tms(m.tanggal_terbit) || 0, -1);
  const dipelajari = materi.filter(m => m.progres === 'dipelajari').concat(materi.filter(m => m.progres === 'dibuka')).slice(0, 4);
  const mendesak = urut(sd.tugas.filter(t => !t.kumpul && tms(t.deadline) > now - 3 * 86400e3), t => tms(t.deadline)).slice(0, 5);
  const kuisAktif = sd.kuis.filter(k => !(k.hasil && k.hasil.waktu_selesai) && tms(k.waktu_buka) <= now && tms(k.waktu_tutup) >= now);
  const ab = rekapAbs(sd.absensi), tSelesai = sd.tugas.filter(t => t.kumpul).length, mSelesai = sd.materi.filter(m => m.progres === 'selesai').length;
  const lanjut = dipelajari[0];
  const cap = [['book', 'Materi selesai', mSelesai + '/' + sd.materi.length, persen(mSelesai, sd.materi.length)], ['clipboard', 'Tugas dikumpulkan', tSelesai + '/' + sd.tugas.length, persen(tSelesai, sd.tugas.length)],
    ['calendar', 'Kehadiran', ab.persen === null ? '-' : ab.persen + '%', ab.persen || 0], ['award', 'Rata-rata nilai', angka(sd.rapor.rata), sd.rapor.rata || 0]];
  const ikonT = { tulis: 'file', foto: 'image', video: 'video', kuis: 'timer' };
  return `${hero('Hi, ' + esc(u.nama), 'Perpustakaan digital dan ruang belajar cerdas untuk meraih prestasi unggul di ' + esc(SET('NAMA_SEKOLAH') || 'SMP Negeri 1 Dasuk') + '.',
    esc(sd.profil.kelas) + ' • Semester ' + esc(SET('SEMESTER') || ''),
    `<button class="btn glass" ${lanjut ? `data-a="materi" data-id="${esc(lanjut.id_materi)}"` : 'data-a="ke" data-h="#/materi"'}>Lanjutkan Belajar</button><a class="btn white" href="#/tugas">${mendesak.length ? 'Tugas Mendesak (' + mendesak.length + ')' : 'Buka Tugas & Kuis'}</a>`)}
  <div class="cols"><div class="stack">
    <section>${secH('Materi Terbaru', 'Baru diterbitkan guru mapel', '#/materi')}${materi.length ? `<div class="gridc scroll">${materi.slice(0, 3).map(m => kartuMateri(m)).join('')}</div>` : `<div class="card">${kosong('book', 'Belum ada materi')}</div>`}</section>
    <section>${secH('Sedang Dipelajari', 'Akses cepat materi yang sedang Anda pelajari', '#/materi')}${dipelajari.length ? `<div class="gridc scroll">${dipelajari.map(m => kartuMateri(m)).join('')}</div>` : `<div class="card">${kosong('bookmark', 'Belum ada materi yang ditandai', 'Buka materi lalu ketuk "Sedang dipelajari".')}</div>`}</section>
  </div><div class="stack">
    <div class="card"><div class="card-h"><div><h3>Capaian Belajar</h3><p class="xs mut2">Selesaikan tugas & materi untuk naik level</p></div><span class="bd ungu">${esc(sd.rapor.predikat || '-')}</span></div>
      <div class="col gap16">${cap.map(c => `<div class="row"><span class="sq ungu" style="width:36px;height:36px;border-radius:12px">${ic(c[0], 's')}</span><div class="grow"><div class="row sb2 sm" style="margin-bottom:5px"><b class="tx">${c[1]}</b><span class="b p">${c[2]}</span></div>${prog(c[3])}</div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Tugas Mendesak</h3><a class="see" href="#/tugas">LIHAT SEMUA</a></div>
      ${mendesak.length ? mendesak.map(t => { const lewat = tms(t.deadline) < now, dekat = tms(t.deadline) - now < 86400e3; return `<div class="it"><span class="sq ${lewat ? 'A' : dekat ? 'I' : 'ungu'}">${ic(ikonT[t.tipe] || 'clipboard')}</span><div class="grow"><b class="tx sm trunc" style="display:block">${esc(t.judul)}</b><span class="xs ${lewat ? 'err' : dekat ? 'b' : 'mut'}" style="${dekat && !lewat ? 'color:var(--i-tx)' : ''}">${esc(lewat ? 'Lewat tenggat' : relatif(t.deadline))}</span></div><a class="btn p xs" href="#/tugas/${esc(t.id_tugas)}">Kerjakan</a></div>`; }).join('') : kosong('party', 'Semua tugas beres!', 'Tidak ada tugas yang mendekati tenggat.')}
      ${kuisAktif.map(k => `<div class="it"><span class="sq A">${ic('timer')}</span><div class="grow"><b class="tx sm trunc" style="display:block">${esc(k.judul)}</b><span class="xs mut">Kuis · ditutup ${esc(relatif(k.waktu_tutup))}</span></div><a class="btn p xs" href="#/kuis/${esc(k.id_kuis)}">${k.hasil ? 'Lanjutkan' : 'Mulai'}</a></div>`).join('')}</div>
    ${(B().pengumuman || []).length ? `<div class="card"><div class="card-h"><h3>Pengumuman</h3><a class="see" href="#/pengumuman">SEMUA</a></div><div class="col">${B().pengumuman.slice(0, 2).map(kartuPengumuman).join('')}</div></div>` : ''}
  </div></div>`;
};

// ---------------------------------------------------------------- BERANDA WALI MURID (Pantau Anak)
V.berandaWali = () => {
  const sd = SD(), now = sekarang(), ab = rekapAbs(sd.absensi), r = sd.rapor;
  const tanggal = Object.keys(ab.hari).sort(), tAcuan = ab.hari[hariIni()] ? hariIni() : tanggal[tanggal.length - 1];
  const jamAcuan = sd.absensi.filter(s => s.t === tAcuan);
  const belum = urut(sd.tugas.filter(t => !t.kumpul), t => tms(t.deadline)), lewat = belum.filter(t => tms(t.deadline) < now);
  const dinilai = urut(sd.tugas.filter(t => t.kumpul && t.kumpul.nilai !== '').map(t => ({ j: t.judul, m: t.id_mapel, n: t.kumpul.nilai, w: t.kumpul.waktu_kumpul })).concat(sd.kuis.filter(k => k.hasil && k.hasil.waktu_selesai).map(k => ({ j: k.judul, m: k.id_mapel, n: k.hasil.skor, w: k.hasil.waktu_selesai }))), x => tms(x.w), -1).slice(0, 5);
  return `${pilihAnak()}${hero('Pantau ' + esc(sd.profil.nama), 'Pantau kehadiran per jam pelajaran, tugas, dan nilai ananda secara langsung.', esc(sd.profil.kelas) + (sd.profil.wali_kelas ? ' · Wali kelas: ' + esc(sd.profil.wali_kelas) : ''), `<a class="btn white" href="#/nilai">${ic('award')} Lihat Rapor</a>`, false)}
  <div class="grid4 k2">
    <div class="kpi"><div class="row sb2"><span class="caps mut">Kehadiran</span><span class="sq H">${ic('calendar', 's')}</span></div><div class="v">${ab.persen === null ? '-' : ab.persen + '<small>%</small>'}</div>${prog(ab.persen || 0, 'var(--h)')}<span class="xs mut">${ab.hr.S} sakit · ${ab.hr.I} izin · ${ab.hr.A} alfa (hari)</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Rata-rata nilai</span><span class="sq ungu">${ic('award', 's')}</span></div><div class="v">${angka(r.rata)}<small> / 100</small></div>${prog(r.rata || 0)}<span class="xs mut">Predikat ${esc(r.predikat)} · KKM ${r.kkm}</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Tugas belum</span><span class="sq ${lewat.length ? 'A' : 'I'}">${ic('clipboard', 's')}</span></div><div class="v">${belum.length}<small> tugas</small></div><span class="xs ${lewat.length ? 'err b' : 'mut'}">${lewat.length ? lewat.length + ' melewati tenggat' : 'Tidak ada yang terlewat'}</span></div>
    <div class="kpi"><div class="row sb2"><span class="caps mut">Tugas terlambat</span><span class="sq I">${ic('clock', 's')}</span></div><div class="v">${r.tugas.terlambat}<small> tugas</small></div><span class="xs mut">${r.tugas.tepat} dikumpulkan tepat waktu</span></div>
  </div>
  <div class="cols"><div class="stack">
    <div class="card"><div class="card-h"><div><h3>Kehadiran per jam pelajaran</h3><p class="xs mut2">${tAcuan ? (tAcuan === hariIni() ? 'Hari ini, ' : '') + esc(fHari(tAcuan)) : 'Belum ada catatan'}</p></div><a class="see" href="#/absensi">KALENDER</a></div>
      ${jamAcuan.length ? `<div class="jamgrid">${jamAcuan.map(s => `<div><span class="xs mut b">Jam ke-${s.j}</span><p class="sm b tx trunc">${esc(namaMapel(s.m) || '-')}</p><div class="mt8">${bdAbs(s.s)}</div></div>`).join('')}</div>` : kosong('calendar', 'Belum ada presensi tercatat')}</div>
    <div class="card"><div class="card-h"><h3>Tugas belum dikumpulkan</h3><a class="see" href="#/tugas">SEMUA</a></div>
      ${belum.length ? belum.slice(0, 6).map(t => `<div class="it"><span class="sq ${tms(t.deadline) < now ? 'A' : 'I'}">${ic('clipboard')}</span><div class="grow"><b class="tx sm trunc" style="display:block">${esc(t.judul)}</b><span class="xs mut">${esc(namaMapel(t.id_mapel))} · tenggat ${esc(fWaktu(t.deadline))}</span></div>${statusTugas(t).bd}</div>`).join('') : kosong('party', 'Semua tugas sudah dikumpulkan')}</div>
  </div><div class="stack">
    <div class="card"><div class="card-h"><h3>Nilai terbaru</h3><a class="see" href="#/nilai">RAPOR</a></div>${dinilai.length ? dinilai.map(x => `<div class="it"><span class="sq ${Number(x.n) >= r.kkm ? 'H' : 'A'}"><b>${angka(x.n, 0)}</b></span><div class="grow"><b class="tx sm trunc" style="display:block">${esc(x.j)}</b><span class="xs mut">${esc(namaMapel(x.m))} · ${esc(fTgl(x.w))}</span></div></div>`).join('') : kosong('award', 'Belum ada nilai')}</div>
    <div class="card"><div class="card-h"><h3>Pengumuman</h3><a class="see" href="#/pengumuman">SEMUA</a></div><div class="col">${(B().pengumuman || []).slice(0, 2).map(kartuPengumuman).join('') || kosong('megaphone', 'Belum ada pengumuman')}</div></div>
    <a class="card row" href="#/lainnya" style="text-decoration:none"><span class="sq ${B().wali.optout ? 'I' : 'H'}">${ic('wa')}</span><span class="grow"><b class="tx sm">Notifikasi WhatsApp ${B().wali.optout ? 'nonaktif' : 'aktif'}</b><br><span class="xs mut">Atur di menu Lainnya</span></span>${ic('chevR')}</a>
  </div></div>`;
};

// ---------------------------------------------------------------- KELAS SAYA (murid)
R.def('kelas', () => {
  if (!isMurid()) return V.kelasGuru ? V.kelasGuru() : '';
  const sd = SD(), r = sd.rapor;
  return `<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Kelas Saya</b></div><h1>Kelas ${esc(sd.profil.kelas)}</h1><p class="mut mt8">Wali kelas: <b class="tx">${esc(sd.profil.wali_kelas || '-')}</b> · ${sd.mapel.length} mata pelajaran</p></div></div>
  <div class="gridc">${sd.mapel.map(m => { const g = gayaMapel(m.nama_mapel), rm = r.mapel.find(x => x.id_mapel === m.id_mapel) || {}, nm = sd.materi.filter(x => x.id_mapel === m.id_mapel).length, tg = sd.tugas.filter(x => x.id_mapel === m.id_mapel), tk = tg.filter(x => x.kumpul).length;
    return `<div class="mcard" style="cursor:default"><div class="cover" style="background:linear-gradient(140deg,var(--${g.c}),var(--sf2))"><div class="tile"><b style="color:${g.w}">${ic(g.i)}</b><span>${nm} materi</span></div><span class="lbl">${esc(m.nama_mapel)}</span></div>
      <h4>${esc(m.nama_mapel)}</h4><span class="meta">${esc(m.guru)}</span>
      <div class="row sb2 mt12 sm"><span class="mut">Nilai</span><b class="tx">${angka(rm.akhir)} <span class="bd ${rm.akhir === null ? 'belum' : rm.akhir >= r.kkm ? 'ok' : 'bad'}" style="padding:0 7px">${esc(rm.predikat || '-')}</span></b></div>
      <div class="row sb2 xs mut mt8"><span>Tugas ${tk}/${tg.length}</span><span>${persen(tk, tg.length)}%</span></div>${prog(persen(tk, tg.length), g.w)}
      <div class="row mt12"><button class="btn soft xs grow" data-a="ke-mapel" data-h="materi" data-m="${esc(m.id_mapel)}">${ic('book', 's')} Materi</button><button class="btn soft xs grow" data-a="ke-mapel" data-h="tugas" data-m="${esc(m.id_mapel)}">${ic('clipboard', 's')} Tugas</button></div></div>`; }).join('')}</div>`;
});
ACT['ke-mapel'] = el => { if (el.dataset.h === 'materi') Store.v.materi = Object.assign(Store.v.materi || {}, { m: el.dataset.m, t: 'semua', q: '' }); else Store.v.tugas = Object.assign(Store.v.tugas || {}, { m: el.dataset.m, tab: 'semua' }); R.go('#/' + el.dataset.h); };

// ---------------------------------------------------------------- TUGAS & KUIS (murid / wali)
R.def('tugas', r => {
  if (!SD()) return V.tugasGuru ? V.tugasGuru(r) : '';
  if (r.id) return V.tugasDetail(r.id);
  const sd = SD(), st = Store.v.tugas = Object.assign({ tab: 'semua', m: '', urut: 'dekat' }, Store.v.tugas || {});
  const kat = t => { const s = statusTugas(t).k; return s === 'lewat' || s === 'belum' ? 'belum' : s; };
  const n = { semua: sd.tugas.length, belum: 0, dikumpulkan: 0, dinilai: 0, terlambat: 0 };
  sd.tugas.forEach(t => n[kat(t)]++);
  const now = sekarang();
  return `${pilihAnak()}<section class="hero sm"><span class="ring" style="width:180px;height:180px;right:-40px;top:-60px;opacity:.5"></span><span class="ring" style="width:140px;height:140px;right:140px;bottom:-60px;opacity:.4"></span><div class="txt"><span class="pill">${ic('clipboard', 's')} EVALUASI & PENUGASAN TERPADU</span><h1>Tugas & Kuis ${isWali() ? esc(sd.profil.nama.split(' ')[0]) : 'Pembelajaran'}</h1><p>${isWali() ? 'Pantau status pengumpulan tugas dan hasil kuis ananda.' : 'Kumpulkan bukti tugas & ikuti kuis berbatas waktu. Pastikan berkas terkumpul sebelum tenggat berakhir.'}</p></div></section>
  <div class="row w sb2"><div class="tabs">${[['semua', 'Semua'], ['belum', 'Belum Dikerjakan'], ['dikumpulkan', 'Dikumpulkan'], ['dinilai', 'Dinilai'], ['terlambat', 'Terlambat']].map(x => `<button class="tab ${st.tab === x[0] ? 'on' : ''}" data-a="tugas-tab" data-t="${x[0]}">${x[1]}<span class="n">${n[x[0]]}</span></button>`).join('')}</div>
    <div class="row"><select class="sel pill" style="width:auto" data-c="tugas-mapel" aria-label="Mapel"><option value="">Semua mata pelajaran</option>${sd.mapel.map(m => `<option value="${esc(m.id_mapel)}" ${st.m === m.id_mapel ? 'selected' : ''}>${esc(m.nama_mapel)}</option>`).join('')}</select>
    <select class="sel pill" style="width:auto" data-c="tugas-urut" aria-label="Urutkan">${[['dekat', 'Tenggat terdekat'], ['jauh', 'Tenggat terjauh'], ['bobot', 'Bobot tertinggi']].map(o => `<option value="${o[0]}" ${st.urut === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div></div>
  <div class="cols"><div class="stack" id="tugas-list">${V.listTugas()}</div>
  <div class="stack"><div class="card"><div class="card-h"><h3>${ic('timer')} Kuis</h3><span class="xs mut">${sd.kuis.length} kuis</span></div>${sd.kuis.length ? urut(sd.kuis, k => tms(k.waktu_tutup)).map(k => { const sel = k.hasil && k.hasil.waktu_selesai, buka = tms(k.waktu_buka) <= now, tutup = tms(k.waktu_tutup) < now;
    return `<div class="it"><span class="sq ${sel ? 'H' : buka && !tutup ? 'A' : 'ungu'}">${sel ? `<b>${angka(k.hasil.skor, 0)}</b>` : ic('timer')}</span><div class="grow"><b class="tx sm clamp2">${esc(k.judul)}</b><span class="xs mut">${esc(namaMapel(k.id_mapel))} · ${k.jumlah_soal} soal · ${k.durasi_menit} menit</span><br><span class="xs ${!sel && buka && !tutup ? 'err b' : 'mut'}">${sel ? 'Selesai ' + esc(fWaktu(k.hasil.waktu_selesai)) : tutup ? 'Ditutup' : buka ? 'Ditutup ' + esc(relatif(k.waktu_tutup)) : 'Dibuka ' + esc(fWaktu(k.waktu_buka))}</span></div>
      ${isMurid() ? (sel ? `<a class="btn soft xs" href="#/kuis/${esc(k.id_kuis)}">Hasil</a>` : buka && !tutup ? `<a class="btn p xs" href="#/kuis/${esc(k.id_kuis)}">${k.hasil ? 'Lanjut' : 'Mulai'}</a>` : '') : ''}</div>`; }).join('') : kosong('timer', 'Belum ada kuis')}</div>
    <div class="card row top"><span class="sq ungu lg">${ic('award')}</span><div><h4>Kebijakan penilaian</h4><p class="sm mut mt8">KKM ${KKM()}. Berkas bisa diganti selama belum lewat tenggat & belum dinilai. Pengumpulan setelah tenggat tercatat <b>terlambat</b>.</p></div></div></div></div>`;
});
V.listTugas = () => {
  const sd = SD(), st = Store.v.tugas, now = sekarang();
  const kat = t => { const s = statusTugas(t).k; return s === 'lewat' || s === 'belum' ? 'belum' : s; };
  let list = sd.tugas.filter(t => (st.tab === 'semua' || kat(t) === st.tab) && (!st.m || t.id_mapel === st.m));
  list = st.urut === 'bobot' ? urut(list, t => Number(t.bobot_nilai), -1) : urut(list, t => tms(t.deadline), st.urut === 'jauh' ? -1 : 1);
  if (st.urut === 'dekat') list = list.filter(t => tms(t.deadline) >= now).concat(list.filter(t => tms(t.deadline) < now).reverse());
  if (!list.length) return `<div class="card">${kosong('clipboard', 'Tidak ada tugas', 'Coba ubah filter.')}</div>`;
  return list.map(t => { const s = statusTugas(t), m = sd.mapel.find(x => x.id_mapel === t.id_mapel) || {}, g = gayaMapel(m.nama_mapel);
    return `<a class="card row" href="#/tugas/${esc(t.id_tugas)}" style="text-decoration:none;gap:14px"><span class="sq lg" style="background:var(--${g.c});color:${g.w}">${ic(g.i, 'l')}</span><div class="grow"><div class="row w" style="gap:6px"><span class="bd ungu">${esc(m.nama_mapel || '')}</span>${s.bd}</div><h3 class="mt8 clamp2">${esc(t.judul)}</h3><p class="xs mut mt8">${ic('user', 's')} ${esc(m.guru || '')} · ${ic('clock', 's')} ${esc(fWaktu(t.deadline))} · Bobot ${esc(t.bobot_nilai)}%</p></div>${ic('chevR')}</a>`; }).join('');
};
ACT['tugas-tab'] = el => { Store.v.tugas.tab = el.dataset.t; $$('[data-a=tugas-tab]').forEach(b => b.classList.toggle('on', b === el)); $('#tugas-list').innerHTML = V.listTugas(); };
CHG['tugas-mapel'] = el => { Store.v.tugas.m = el.value; $('#tugas-list').innerHTML = V.listTugas(); };
CHG['tugas-urut'] = el => { Store.v.tugas.urut = el.value; $('#tugas-list').innerHTML = V.listTugas(); };

// ---- Detail & pengumpulan tugas
const Kumpul = { files: [], tetap: null, id: '' };
V.tugasDetail = id => {
  const sd = SD(), t = sd.tugas.find(x => x.id_tugas === id);
  if (!t) return `<div class="card">${kosong('clipboard', 'Tugas tidak ditemukan', '', '<a class="btn soft" href="#/tugas">Kembali</a>')}</div>`;
  const m = sd.mapel.find(x => x.id_mapel === t.id_mapel) || {}, k = t.kumpul, s = statusTugas(t), lewat = tms(t.deadline) < sekarang();
  const dinilai = k && k.nilai !== '' && k.nilai !== null;
  const bolehUbah = isMurid() && !dinilai && !(k && lewat);
  if (Kumpul.id !== id) { const d = LS.get('spd_draf_' + id, {}); Kumpul.id = id; Kumpul.files = []; Kumpul.tetap = k ? k.tautan.slice() : []; Kumpul.yt = d.yt || ''; Kumpul.cat = d.cat !== undefined ? d.cat : (k ? k.catatan_siswa : ''); }
  const lain = urut(sd.tugas.filter(x => x.id_tugas !== id && !x.kumpul && tms(x.deadline) > sekarang()), x => tms(x.deadline)).slice(0, 3);
  return `<div class="crumb"><a href="#/beranda">${ic('home', 's')} Beranda</a>${ic('chevR', 's')}<a href="#/tugas">Tugas & Kuis</a>${ic('chevR', 's')}<b>${esc(t.judul.slice(0, 40))}</b></div>
  <div class="cols"><div class="stack"><article class="card l col gap16">
    <div class="row w sb2"><div class="row" style="gap:8px"><span class="bd ungu caps">${esc(m.nama_mapel)}</span><span class="xs mut">• Tipe: ${esc(t.tipe)}</span></div>${lewat ? '<span class="bd bad">Tenggat sudah lewat</span>' : `<span class="bd warn"><i class="dot-live" style="background:var(--i)"></i>${esc(sisaWaktu(t.deadline))}</span>`}</div>
    <div><h1 style="font-size:23px">${esc(t.judul)}</h1><div class="row w xs mut mt8" style="gap:16px"><span>${ic('user', 's')} Guru: <b class="tx">${esc(m.guru)}</b></span><span>${ic('chart', 's')} Bobot: <b class="tx">${esc(t.bobot_nilai)}%</b></span><span>${ic('clock', 's')} Tenggat: <b class="${lewat ? 'err' : 'tx'}">${esc(fWaktu(t.deadline))} WIB</b></span></div></div>
    <div class="card flat"><h4 class="row">${ic('book', 's')} Petunjuk & instruksi pengerjaan</h4><p class="mt8" style="white-space:pre-line">${esc(t.deskripsi || '-')}</p></div>
    ${dinilai ? `<div class="card flat row" style="background:var(--h-bg)"><span class="sq H lg"><b style="font-size:18px">${angka(k.nilai, 0)}</b></span><div class="grow"><b class="tx">Nilai dari guru</b><p class="sm mt8">${esc(k.catatan_guru || 'Tidak ada catatan.')}</p></div><span class="bd ${k.nilai >= KKM() ? 'ok' : 'bad'} lg">Predikat ${predikat(k.nilai)}</span></div>` : ''}
    ${bolehUbah ? `<div class="col"><div class="row sb2"><b class="tx">Unggah berkas ${t.tipe === 'video' ? '(opsional — utamakan tautan YouTube)' : 'laporan / foto karya'}</b><span class="xs mut">PDF, JPG, PNG, Word · maks ${Berkas.maksMB()} MB</span></div>
      <label class="drop" id="dropzone"><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*" class="sr" data-c="kumpul-file"><span class="sq ungu">${ic('upload', 'l')}</span><b class="tx">Seret & lepas berkas foto/dokumen di sini</b><span class="xs mut">atau ketuk untuk <u class="p">jelajahi berkas</u> · foto otomatis dikompres</span><span class="bd" style="background:var(--sf)">${ic('lock', 's')} Disimpan aman di Google Drive sekolah</span></label></div>` : ''}
    <div class="col" id="kumpul-berkas">${V.berkasKumpul(t, bolehUbah)}</div>
    ${bolehUbah ? `<div class="fld"><label class="row">${ic('play', 's')} Tautan video / dokumen (opsional)</label><input class="inp" type="url" placeholder="https://youtu.be/… (setel Unlisted / Tidak publik)" value="${esc(Kumpul.yt)}" data-i="kumpul-yt"><span class="hint">Pastikan video disetel "Unlisted" agar hanya bisa dilihat guru.</span></div>
      <div class="fld"><label>${t.tipe === 'tulis' ? 'Jawaban / catatan untuk guru' : 'Catatan untuk guru (opsional)'}</label><textarea class="ta" rows="${t.tipe === 'tulis' ? 6 : 3}" placeholder="${t.tipe === 'tulis' ? 'Tulis jawaban Anda di sini…' : 'Tulis kendala atau penjelasan singkat…'}" data-i="kumpul-cat">${esc(Kumpul.cat)}</textarea></div>
      <div class="row w sb2"><span class="bd ${k ? 'info' : 'ok'} lg">${ic('checkCircle')} ${k ? 'Sudah dikumpulkan · bisa diganti sebelum tenggat' : 'Status: siap dikumpulkan'}</span><div class="row"><button class="btn w" data-a="kumpul-draf">${ic('save')} Simpan draf</button><button class="btn p" data-a="kumpul-konfirmasi">${k ? 'Kumpulkan ulang' : 'Kumpulkan tugas sekarang'} ${ic('send')}</button></div></div>`
      : k && k.catatan_siswa ? `<div class="card flat"><b class="tx sm">Catatan / jawaban siswa</b><p class="sm mt8" style="white-space:pre-line">${esc(k.catatan_siswa)}</p></div>` : ''}
    ${!bolehUbah && !k && isMurid() ? `<div class="card flat row" style="background:var(--a-bg)">${ic('alert')}<span class="sm">Tenggat sudah lewat. Anda masih bisa mengumpulkan — akan tercatat <b>terlambat</b>.</span></div>` : ''}
  </article></div>
  <div class="stack"><div class="card"><div class="card-h"><h3>Status pengumpulan</h3>${s.bd}</div><div class="col sm">
    <div class="row sb2"><span class="mut">Dikumpulkan</span><b class="tx">${k ? esc(fWaktu(k.waktu_kumpul)) : '-'}</b></div>
    <div class="row sb2"><span class="mut">Ketepatan</span>${k ? `<span class="bd ${k.status}">${k.status === 'tepat' ? 'Tepat waktu' : 'Terlambat'}</span>` : '<span class="mut">-</span>'}</div>
    <div class="row sb2"><span class="mut">Nilai</span><b class="tx">${dinilai ? angka(k.nilai) + ' / 100' : 'Belum dinilai'}</b></div></div></div>
    ${!k && !lewat && isMurid() ? '' : ''}
    <div class="card"><div class="card-h"><h3>Tugas lainnya</h3><a class="see" href="#/tugas">SEMUA</a></div>${lain.length ? lain.map(x => `<a class="it" href="#/tugas/${esc(x.id_tugas)}" style="text-decoration:none"><span class="sq ungu">${ic('clipboard')}</span><div class="grow"><b class="tx sm trunc" style="display:block">${esc(x.judul)}</b><span class="xs mut">${esc(namaMapel(x.id_mapel))} · ${esc(relatif(x.deadline))}</span></div></a>`).join('') : kosong('party', 'Tidak ada tugas lain yang tertunda')}</div></div></div>`;
};
V.berkasKumpul = (t, boleh) => {
  const ada = (Kumpul.tetap || []).map((u, i) => `<div class="file-it"><span class="sq ungu">${ic(ikonTautan(u))}</span><a class="grow trunc sm b" href="${esc(u)}" target="_blank" rel="noopener">${esc(labelTautan(u))}</a><span class="bd ok">Terkirim</span>${boleh ? `<button class="btn ghost xs ico" data-a="kumpul-buang" data-t="tetap" data-i="${i}" aria-label="Hapus">${ic('trash', 's')}</button>` : ''}</div>`).join('');
  const baru = Kumpul.files.map((f, i) => `<div class="file-it"><span class="sq ${/pdf/.test(f.type) ? 'A' : 'ungu'}">${ic(/image/.test(f.type) ? 'image' : 'file')}</span><div class="grow"><b class="sm tx trunc" style="display:block">${esc(f.name)}</b><span class="xs mut">${Berkas.ukuran(f.size)} · siap diunggah</span></div><button class="btn ghost xs ico" data-a="kumpul-buang" data-t="baru" data-i="${i}" aria-label="Hapus">${ic('trash', 's')}</button></div>`).join('');
  return ada || baru ? `<span class="caps mut">Berkas terlampir</span>${ada}${baru}` : '';
};
CHG['kumpul-file'] = el => { Kumpul.files = Kumpul.files.concat(Array.from(el.files)).slice(0, 5); el.value = ''; $('#kumpul-berkas').innerHTML = V.berkasKumpul(null, true); };
INP['kumpul-yt'] = el => { Kumpul.yt = el.value; };
INP['kumpul-cat'] = el => { Kumpul.cat = el.value; };
ACT['kumpul-buang'] = el => { if (el.dataset.t === 'tetap') Kumpul.tetap.splice(Number(el.dataset.i), 1); else Kumpul.files.splice(Number(el.dataset.i), 1); $('#kumpul-berkas').innerHTML = V.berkasKumpul(null, true); };
ACT['kumpul-draf'] = () => { LS.set('spd_draf_' + Kumpul.id, { yt: Kumpul.yt, cat: Kumpul.cat }); toast('Draf disimpan di perangkat ini (berkas perlu dipilih ulang).'); };
document.addEventListener('dragover', e => { const d = e.target.closest && e.target.closest('#dropzone'); if (d) { e.preventDefault(); d.classList.add('on'); } });
document.addEventListener('dragleave', e => { const d = e.target.closest && e.target.closest('#dropzone'); if (d) d.classList.remove('on'); });
document.addEventListener('drop', e => { const d = e.target.closest && e.target.closest('#dropzone'); if (!d) return; e.preventDefault(); d.classList.remove('on'); Kumpul.files = Kumpul.files.concat(Array.from(e.dataTransfer.files)).slice(0, 5); $('#kumpul-berkas').innerHTML = V.berkasKumpul(null, true); });
ACT['kumpul-konfirmasi'] = () => {
  const t = SD().tugas.find(x => x.id_tugas === Kumpul.id), lewat = tms(t.deadline) < sekarang();
  const yt = Kumpul.yt.trim();
  if (!Kumpul.files.length && !Kumpul.tetap.length && !yt && !(t.tipe === 'tulis' && Kumpul.cat.trim())) return toast('Lampirkan minimal satu berkas atau tautan' + (t.tipe === 'tulis' ? ', atau tulis jawaban' : '') + '.', 'warn');
  if (yt && !/^https:\/\//.test(yt)) return toast('Tautan harus diawali https://', 'warn');
  const baris = (ikon, teks, bd) => `<div class="file-it" style="background:var(--sf)"><span class="sq ungu" style="width:32px;height:32px">${ic(ikon, 's')}</span><span class="grow sm b trunc">${esc(teks)}</span>${bd}</div>`;
  Modal.open(`<div class="modal-h"><span class="sq ungu">${ic('checkCircle')}</span><div class="grow"><h2>Kumpulkan tugas sekarang?</h2><p class="sm mut">${esc(t.judul)}</p></div><button class="btn ghost ico sm" data-a="tutup">${ic('x')}</button></div>
    <div class="modal-b col"><div class="card flat col" style="gap:8px"><span class="caps mut">${ic('checkCircle', 's')} Ringkasan unggahan</span>
      ${Kumpul.tetap.map(u => baris(ikonTautan(u), labelTautan(u), '<span class="bd ok">Tetap</span>')).join('')}${Kumpul.files.map(f => baris(/image/.test(f.type) ? 'image' : 'file', f.name, `<span class="bd ok">${Berkas.ukuran(f.size)}</span>`)).join('')}${yt ? baris('play', yt, '<span class="bd">Tautan</span>') : ''}${Kumpul.cat.trim() ? baris('note', 'Catatan/jawaban (' + Kumpul.cat.trim().length + ' karakter)', '') : ''}
      ${baris('clock', 'Status pengumpulan', lewat ? '<span class="bd terlambat">Terlambat</span>' : `<span class="bd ok">Tepat waktu (sebelum ${fJam(t.deadline)})</span>`)}</div>
      <div class="card flat row top sm" style="background:var(--i-bg)">${ic('info')}<span>Pastikan berkas sudah benar. ${lewat ? '' : 'Anda masih dapat memperbarui sebelum tenggat <b>' + esc(fWaktu(t.deadline)) + ' WIB</b>.'}</span></div>
      <div id="kumpul-prog" class="hide">${prog(10, null, true)}<p class="xs mut mt8" id="kumpul-ket">Menyiapkan berkas…</p></div></div>
    <div class="modal-f"><button class="btn ghost" data-a="tutup">Periksa kembali</button><button class="btn p" data-a="kumpul-kirim">Ya, kumpulkan ${ic('send')}</button></div>`, { kunci: true });
};
ACT['kumpul-kirim'] = el => sibuk(el, async () => {
  const pr = $('#kumpul-prog'), ket = $('#kumpul-ket'), bar = $('#kumpul-prog .prog i'); pr.classList.remove('hide');
  const files = [];
  for (let i = 0; i < Kumpul.files.length; i++) { ket.textContent = `Mengompres & membaca berkas ${i + 1}/${Kumpul.files.length}…`; bar.style.width = (10 + 50 * i / Kumpul.files.length) + '%'; files.push(await Berkas.baca(Kumpul.files[i])); }
  ket.textContent = 'Mengunggah ke server…'; bar.style.width = '75%';
  const yt = Kumpul.yt.trim();
  const res = await API.call('tugas.kumpul', { id_tugas: Kumpul.id, files, tetap: Kumpul.tetap, tautan: yt ? [yt] : [], catatan: Kumpul.cat.trim() }, { timeout: 180000 });
  bar.style.width = '100%';
  const t = SD().tugas.find(x => x.id_tugas === Kumpul.id); t.kumpul = res; LS.set('spd_boot', Store.boot); LS.del('spd_draf_' + Kumpul.id);
  Kumpul.id = ''; Modal.close(); toast(res.status === 'terlambat' ? 'Tugas terkumpul (terlambat).' : 'Tugas berhasil dikumpulkan tepat waktu! 🎉'); R.render(); App.segarkan();
}, 'Mengirim…');

// ---------------------------------------------------------------- KUIS (murid)
const Kuis = {
  st: null, timer: null,
  simpan() { if (Kuis.st) LS.set('spd_kuis_' + Kuis.st.id, { jawab: Kuis.st.jawab, i: Kuis.st.i }); },
  berhenti() { clearInterval(Kuis.timer); Kuis.timer = null; }
};
window.addEventListener('hashchange', () => { if (R.parse().path !== 'kuis') Kuis.berhenti(); });
R.def('kuis', r => {
  const sd = SD(), k = sd && sd.kuis.find(x => x.id_kuis === r.id);
  if (!k || !isMurid()) return `<div class="card">${kosong('timer', 'Kuis tidak ditemukan', '', '<a class="btn soft" href="#/tugas">Kembali</a>')}</div>`;
  const m = sd.mapel.find(x => x.id_mapel === k.id_mapel) || {}, now = sekarang();
  if (k.hasil && k.hasil.waktu_selesai) return `<div class="crumb"><a href="#/tugas">Tugas & Kuis</a>${ic('chevR', 's')}<b>${esc(k.judul)}</b></div>
    <div class="card l col center" style="align-items:center;max-width:560px;margin:0 auto">${Chart.donut([{ l: 'Skor', v: Number(k.hasil.skor), c: 'var(--p)' }, { l: 'Sisa', v: 100 - Number(k.hasil.skor), c: 'transparent' }], angka(k.hasil.skor, 0), '/ 100', 130)}
    <h2>${esc(k.judul)}</h2><p class="mut">${esc(m.nama_mapel)} · selesai ${esc(fWaktu(k.hasil.waktu_selesai))}</p><span class="bd ${k.hasil.skor >= KKM() ? 'ok' : 'bad'} lg">${k.hasil.skor >= KKM() ? ic('star') + 'Melampaui KKM (' + KKM() + ')' : 'Di bawah KKM — ikuti remedial'}</span>
    <div class="row"><button class="btn soft" data-a="kuis-review" data-id="${esc(k.id_kuis)}">${ic('listCheck')} Review pembahasan</button><a class="btn w" href="#/tugas">Kembali</a></div></div>`;
  if (!Kuis.st || Kuis.st.id !== k.id_kuis) {
    Kuis.berhenti(); Kuis.st = null;
    const buka = tms(k.waktu_buka) <= now, tutup = tms(k.waktu_tutup) < now;
    return `<div class="crumb"><a href="#/tugas">Tugas & Kuis</a>${ic('chevR', 's')}<b>${esc(k.judul)}</b></div>
      <div class="card l col" style="max-width:640px;margin:0 auto;gap:16px"><div class="row"><span class="sq ungu lg">${ic('timer', 'l')}</span><div><span class="caps mut">${esc(m.nama_mapel)} · ${esc(m.guru)}</span><h2>${esc(k.judul)}</h2></div></div>
      <div class="grid3">${[['listCheck', k.jumlah_soal + ' soal', 'pilihan ganda'], ['clock', k.durasi_menit + ' menit', 'waktu pengerjaan'], ['calendar', fWaktu(k.waktu_tutup), 'batas akhir']].map(x => `<div class="card flat center"><div class="p">${ic(x[0])}</div><b class="tx" style="display:block">${esc(x[1])}</b><span class="xs mut">${x[2]}</span></div>`).join('')}</div>
      <ul class="sm mut" style="margin:0;padding-left:18px;line-height:1.8"><li>Soal diacak untuk setiap siswa. Jawaban tersimpan otomatis di perangkat.</li><li>Waktu terus berjalan walau aplikasi ditutup; kuis terkirim otomatis saat waktu habis.</li><li>Skor langsung keluar dan diberitahukan ke wali murid.</li></ul>
      ${!buka ? `<span class="bd info lg">Kuis dibuka ${esc(fWaktu(k.waktu_buka))}</span>` : tutup ? '<span class="bd bad lg">Kuis sudah ditutup</span>' : `<button class="btn p blk" data-a="kuis-mulai" data-id="${esc(k.id_kuis)}">${ic('play')} ${k.hasil ? 'Lanjutkan kuis' : 'Mulai kuis sekarang'}</button>`}</div>`;
  }
  return { html: V.kuisUI(k, m), after: () => Kuis.jalan() };
});
ACT['kuis-mulai'] = el => sibuk(el, async () => {
  const d = await API.call('kuis.mulai', { id_kuis: el.dataset.id });
  const simpan = LS.get('spd_kuis_' + el.dataset.id, {});
  Kuis.st = { id: el.dataset.id, soal: d.soal, berakhir: d.berakhir - (d.now - Date.now()), jawab: simpan.jawab || {}, i: simpan.i || 0, mapel: d.mapel };
  const k = SD().kuis.find(x => x.id_kuis === el.dataset.id); if (!k.hasil) k.hasil = { waktu_mulai: fWaktu(d.mulai) };
  R.render();
}, 'Menyiapkan soal…');
V.kuisUI = (k, m) => {
  const st = Kuis.st, s = st.soal[st.i], dj = Object.keys(st.jawab).length;
  return `<div class="crumb"><a href="#/tugas">Tugas & Kuis</a>${ic('chevR', 's')}<b>${esc(k.judul)}</b></div>
  <div class="cols r400"><article class="card l col gap16">
    <div class="row sb2"><span class="row" style="gap:8px"><span class="bd bad"><i class="dot-live"></i>Kuis aktif</span><span class="caps mut">${esc(m.nama_mapel)}</span></span><span class="timer" id="kuis-timer">${ic('timer', 's')}<span>--:--</span></span></div>
    <div><h2>${esc(k.judul)}</h2><div class="row sb2 sm mt8"><span class="b tx">Soal ${st.i + 1} dari ${st.soal.length}</span><span class="b p">${persen(dj, st.soal.length)}% terjawab</span></div><div class="mt8">${prog(persen(dj, st.soal.length))}</div></div>
    <div class="qbox col"><span class="row xs b p"><span style="width:6px;height:14px;border-radius:9px;background:var(--p)"></span>Butir soal nomor ${st.i + 1}</span><p style="font-size:16px;font-weight:600;color:var(--tx);white-space:pre-line">${esc(s.pertanyaan)}</p>
      <div class="col" style="gap:8px" role="radiogroup">${['a', 'b', 'c', 'd'].filter(o => s.opsi[o]).map(o => `<button class="opt ${st.jawab[s.id_soal] === o ? 'on' : ''}" role="radio" aria-checked="${st.jawab[s.id_soal] === o}" data-a="kuis-jawab" data-o="${o}"><span class="k">${o.toUpperCase()}</span><span class="grow">${esc(s.opsi[o])}</span>${st.jawab[s.id_soal] === o ? ic('checkCircle') : ''}</button>`).join('')}</div></div>
    <div class="row sb2"><button class="btn w" data-a="kuis-nav" data-d="-1" ${st.i === 0 ? 'disabled' : ''}>${ic('arrowL')} Sebelumnya</button>${st.i < st.soal.length - 1 ? `<button class="btn p" data-a="kuis-nav" data-d="1">Simpan & lanjut ${ic('arrowR')}</button>` : `<button class="btn p" data-a="kuis-selesai">${ic('send')} Selesai & kirim</button>`}</div>
  </article><div class="stack"><div class="card"><div class="card-h"><span class="caps mut">Navigasi nomor soal</span><span class="xs ok b">${dj} terjawab</span></div><div class="qnav">${st.soal.map((x, i) => `<button class="${i === st.i ? 'on' : st.jawab[x.id_soal] ? 'dj' : ''}" data-a="kuis-ke" data-i="${i}" aria-label="Soal ${i + 1}">${i + 1}</button>`).join('')}</div>
    <button class="btn bad blk mt16" data-a="kuis-selesai">Selesaikan & kirim kuis</button></div>
    <div class="card sm mut">${ic('info', 's')} Jawaban tersimpan otomatis. Bila koneksi terputus, buka kembali kuis ini — waktu tetap berjalan.</div></div></div>`;
};
Kuis.jalan = () => {
  Kuis.berhenti();
  const tick = () => {
    const el = $('#kuis-timer'); if (!el || !Kuis.st) return Kuis.berhenti();
    const sisa = Math.max(0, Kuis.st.berakhir - Date.now()), mnt = Math.floor(sisa / 60000), dtk = Math.floor(sisa % 60000 / 1000);
    el.querySelector('span').textContent = p2(mnt) + ':' + p2(dtk); el.classList.toggle('low', sisa < 60000);
    if (sisa <= 0) { Kuis.berhenti(); toast('Waktu habis — jawaban dikirim otomatis.', 'warn'); Kuis.kirim(); }
  };
  tick(); Kuis.timer = setInterval(tick, 1000);
};
ACT['kuis-jawab'] = el => { const s = Kuis.st.soal[Kuis.st.i]; Kuis.st.jawab[s.id_soal] = el.dataset.o; Kuis.simpan(); R.render(); };
ACT['kuis-nav'] = el => { Kuis.st.i = Math.max(0, Math.min(Kuis.st.soal.length - 1, Kuis.st.i + Number(el.dataset.d))); Kuis.simpan(); R.render(); };
ACT['kuis-ke'] = el => { Kuis.st.i = Number(el.dataset.i); Kuis.simpan(); R.render(); };
ACT['kuis-selesai'] = async () => { const kosongN = Kuis.st.soal.length - Object.keys(Kuis.st.jawab).length; if (await Modal.konfirmasi('Kirim jawaban kuis?', kosongN ? `Masih ada <b>${kosongN} soal</b> belum dijawab. Jawaban tidak bisa diubah setelah dikirim.` : 'Semua soal sudah dijawab. Jawaban tidak bisa diubah setelah dikirim.', { ok: 'Kirim jawaban' })) Kuis.kirim(); };
Kuis.kirim = async () => {
  const st = Kuis.st; if (!st || st.mengirim) return; st.mengirim = true; Kuis.berhenti();
  try {
    const r = await API.call('kuis.kirim', { id_kuis: st.id, jawaban: st.jawab });
    LS.del('spd_kuis_' + st.id); const k = SD().kuis.find(x => x.id_kuis === st.id); k.hasil = { skor: r.skor, waktu_selesai: tglKey(sekarang()) + ' ' + fJam(sekarang()) };
    Kuis.st = null; R.render();
    Modal.open(`<div class="modal-h"><span class="caps mut grow">${ic('target', 's')} Hasil kuis</span><button class="btn ghost ico sm" data-a="tutup">${ic('x')}</button></div><div class="modal-b col center" style="align-items:center">
      <div class="card flat col" style="align-items:center;width:100%;background:linear-gradient(135deg,var(--p-50),var(--sf2))">${Chart.donut([{ l: 'Skor', v: r.skor, c: 'var(--p)' }, { l: '', v: 100 - r.skor, c: 'transparent' }], angka(r.skor, 0), '/ 100', 120)}<h3>Kuis selesai!</h3><span class="bd ${r.skor >= r.kkm ? 'ok' : 'bad'} lg">${r.skor >= r.kkm ? ic('star') + ' Melebihi KKM (' + r.kkm + ')' : 'Di bawah KKM (' + r.kkm + ')'}</span></div>
      <div class="grid3" style="width:100%">${[['H', r.benar, 'Benar'], ['A', r.salah, 'Salah'], ['belum', r.kosong, 'Dilewati']].map(x => `<div class="card flat center" style="background:var(--${x[0] === 'belum' ? 'sf2' : x[0].toLowerCase() + '-bg'})"><b style="font-size:22px;display:block" class="tx">${x[1]}</b><span class="xs b mut">${x[2]}</span></div>`).join('')}</div></div>
      <div class="modal-f"><button class="btn soft" data-a="kuis-review" data-id="${esc(st.id)}">${ic('listCheck')} Review pembahasan</button><a class="btn w" href="#/beranda">Kembali ke beranda</a></div>`, { size: 'sm' });
    App.segarkan();
  } catch (e) { st.mengirim = false; salah(e); Kuis.jalan(); }
};
ACT['kuis-review'] = el => sibuk(el, async () => {
  const r = await API.call('kuis.review', { id_kuis: el.dataset.id }); Modal.close();
  Modal.open(`${Modal.head('Pembahasan: ' + esc(r.kuis.judul), 'Skor Anda: ' + angka(r.skor), 'listCheck')}<div class="modal-b col">${r.terbuka ? r.soal.map((s, i) => `<div class="card flat col" style="gap:8px"><b class="tx">${i + 1}. ${esc(s.pertanyaan)}</b>${['a', 'b', 'c', 'd'].filter(o => s.opsi[o]).map(o => `<div class="opt ${o === s.kunci ? 'benar' : o === s.jawab ? 'salah' : ''}" style="cursor:default"><span class="k">${o.toUpperCase()}</span><span class="grow">${esc(s.opsi[o])}</span>${o === s.kunci ? '<span class="bd ok">Kunci</span>' : o === s.jawab ? '<span class="bd bad">Jawaban Anda</span>' : ''}</div>`).join('')}${!s.jawab ? '<span class="xs mut">Tidak dijawab</span>' : ''}</div>`).join('') : kosong('lock', 'Pembahasan belum dibuka', 'Kunci jawaban tampil setelah kuis ditutup (' + esc(fWaktu(r.buka_pembahasan)) + ') agar adil untuk semua siswa.')}</div>`, { size: 'lg' });
});

// ---------------------------------------------------------------- PRESENSI (murid / wali)
R.def('absensi', r => {
  if (!SD()) return V.absensiGuru ? V.absensiGuru(r) : '';
  const sd = SD(), ab = rekapAbs(sd.absensi), now = wib(sekarang());
  const st = Store.v.abs = Object.assign({ y: now.y, m: now.m, d: '' }, Store.v.abs || {});
  const hariTerpilih = st.d || (ab.hari[hariIni()] ? hariIni() : Object.keys(ab.hari).sort().pop() || '');
  const sesiHari = sd.absensi.filter(s => s.t === hariTerpilih);
  const tidakHadir = urut(sd.absensi.filter(s => s.s !== 'H'), s => s.t + p2(s.j), -1).slice(0, 8);
  return `${pilihAnak()}<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Presensi</b></div><h1>Presensi ${isWali() ? esc(sd.profil.nama) : 'Saya'}</h1><p class="mut mt8">Dicatat guru per jam pelajaran · rekap harian dihitung otomatis · sejak ${esc(fTgl(SET('SEMESTER_MULAI')))}</p></div></div>
  <div class="grid4 k2">${[['H', 'Hadir (jam)', ab.jam.H, ab.persen === null ? '-' : ab.persen + '% kehadiran'], ['S', 'Sakit', ab.hr.S, ab.jam.S + ' jam pelajaran'], ['I', 'Izin', ab.hr.I, ab.jam.I + ' jam pelajaran'], ['A', 'Alfa', ab.hr.A, ab.jam.A + ' jam pelajaran']].map(x => `<div class="kpi"><div class="row sb2"><span class="caps mut">${x[1]}</span>${bdAbs(x[0], true)}</div><div class="v">${x[2]}<small> ${x[0] === 'H' ? 'jam' : 'hari'}</small></div><span class="xs mut">${x[3]}</span></div>`).join('')}</div>
  <div class="cols"><div class="card"><div class="card-h"><div class="row"><button class="btn w sm ico" data-a="abs-bulan" data-d="-1" aria-label="Bulan sebelumnya">${ic('chevL')}</button><h3 style="min-width:150px;text-align:center">${BLN_L[st.m]} ${st.y}</h3><button class="btn w sm ico" data-a="abs-bulan" data-d="1" aria-label="Bulan berikutnya">${ic('chevR')}</button></div>${legendaAbs()}</div>${V.kalender(ab.hari, st.y, st.m, hariTerpilih)}</div>
  <div class="stack"><div class="card"><div class="card-h"><div><h3>Per jam pelajaran</h3><p class="xs mut2">${hariTerpilih ? esc(fHari(hariTerpilih)) : '-'}</p></div>${ab.hari[hariTerpilih] ? bdAbs(ab.hari[hariTerpilih]) : ''}</div>${sesiHari.length ? sesiHari.map(s => `<div class="it"><span class="sq ungu" style="width:36px;height:36px"><b>${s.j}</b></span><div class="grow"><b class="tx sm">${esc(namaMapel(s.m) || '-')}</b><br><span class="xs mut">Jam ke-${s.j}${(SET('JADWAL_JAM') ? (JSON.parse(SET('JADWAL_JAM')).find(x => x.ke === s.j) || {}).mulai || '' : '') ? ' · ' + (JSON.parse(SET('JADWAL_JAM')).find(x => x.ke === s.j) || {}).mulai : ''}</span></div>${bdAbs(s.s)}</div>`).join('') : kosong('calendar', 'Tidak ada catatan pada hari ini')}</div>
    <div class="card"><div class="card-h"><h3>Riwayat tidak hadir</h3></div>${tidakHadir.length ? tidakHadir.map(s => `<div class="it">${bdAbs(s.s, true)}<div class="grow"><b class="tx sm">${esc(fHari(s.t))}</b><br><span class="xs mut">Jam ke-${s.j} · ${esc(namaMapel(s.m))}</span></div></div>`).join('') : kosong('party', 'Selalu hadir — luar biasa!')}</div></div></div>`;
});
V.kalender = (hari, y, m, pilih) => {
  const awal = new Date(Date.UTC(y, m, 1)).getUTCDay(), n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), hi = hariIni();
  let h = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => `<div class="hd">${d}</div>`).join('');
  for (let i = 0; i < awal; i++) h += '<div></div>';
  for (let d = 1; d <= n; d++) { const k = y + '-' + p2(m + 1) + '-' + p2(d), s = hari[k]; h += `<button class="d ${s || ''} ${k === hi ? 'today' : ''}" style="${k === pilih ? 'outline:2.5px solid var(--p);outline-offset:1px' : ''}" data-a="abs-hari" data-k="${k}" aria-label="${d} ${BLN_L[m]}${s ? ', ' + BD_ABS[s][1] : ''}">${d}${s ? `<small>${s}</small>` : ''}</button>`; }
  return `<div class="cal">${h}</div>`;
};
ACT['abs-bulan'] = el => { const s = Store.v.abs; s.m += Number(el.dataset.d); if (s.m < 0) { s.m = 11; s.y--; } if (s.m > 11) { s.m = 0; s.y++; } R.render(); };
ACT['abs-hari'] = el => { Store.v.abs.d = el.dataset.k; R.render(); };

// ---------------------------------------------------------------- NILAI & RAPOR (murid / wali)
R.def('nilai', r => {
  if (!SD()) return V.nilaiGuru ? V.nilaiGuru(r) : '';
  const sd = SD(), rp = sd.rapor, kkm = rp.kkm, ab = rekapAbs(sd.absensi);
  const daftar = urut(sd.tugas.filter(t => t.kumpul && t.kumpul.nilai !== '').map(t => ({ j: t.judul, m: t.id_mapel, n: Number(t.kumpul.nilai), w: t.kumpul.waktu_kumpul, c: t.kumpul.catatan_guru, jenis: 'Tugas' }))
    .concat(sd.kuis.filter(k => k.hasil && k.hasil.waktu_selesai).map(k => ({ j: k.judul, m: k.id_mapel, n: Number(k.hasil.skor), w: k.hasil.waktu_selesai, jenis: 'Kuis' }))), x => tms(x.w), -1);
  const tot = rp.tugas.tepat + rp.tugas.terlambat + rp.tugas.belum;
  return `${pilihAnak()}<div class="page-h"><div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Nilai & Rapor</b></div><h1>Nilai & Rapor Mini</h1><p class="mut mt8">${esc(sd.profil.nama)} · ${esc(sd.profil.kelas)} · Semester ${esc(rp.semester)} ${esc(rp.tahun_ajaran)}</p></div><button class="btn p" data-a="rapor-buka">${ic('printer')} Pratinjau & cetak rapor</button></div>
  <div class="grid4 k2"><div class="kpi"><span class="caps mut">Rata-rata nilai</span><div class="v">${angka(rp.rata)}<small> / 100</small></div>${prog(rp.rata || 0)}</div>
    <div class="kpi"><span class="caps mut">Predikat</span><div class="v">${esc(rp.predikat)}</div><span class="xs mut">${esc(rp.ket)}</span></div>
    <div class="kpi"><span class="caps mut">Kehadiran</span><div class="v">${ab.persen === null ? '-' : ab.persen + '<small>%</small>'}</div>${prog(ab.persen || 0, 'var(--h)')}</div>
    <div class="kpi"><span class="caps mut">Tugas tepat waktu</span><div class="v">${persen(rp.tugas.tepat, tot)}<small>%</small></div><span class="xs mut">${rp.tugas.tepat} dari ${tot} tugas berjalan</span></div></div>
  <div class="cols"><div class="stack"><div class="card"><div class="card-h"><div><h3>Nilai akhir per mata pelajaran</h3><p class="xs mut2">Rata-rata berbobot tugas (bobot guru) & kuis yang sudah dinilai · garis KKM ${kkm}</p></div></div>
      ${Chart.hbars(rp.mapel.map(m => ({ l: m.nama_mapel, v: m.akhir, warna: m.akhir === null ? 'var(--line)' : m.akhir >= kkm ? 'var(--p)' : 'var(--a)', ket: (m.akhir === null ? 'Belum ada nilai' : angka(m.akhir) + ' · ' + m.predikat + ' (' + m.ket + ')') + ' · ' + m.guru })), { d: 1 })}
      <div class="tw mt16"><table class="tbl"><thead><tr><th>Mata pelajaran</th><th>Guru</th><th class="num">Nilai</th><th>Predikat</th><th class="num">Tugas dinilai</th><th class="num">Kuis</th></tr></thead><tbody>${rp.mapel.map(m => `<tr><td class="b tx">${esc(m.nama_mapel)}</td><td class="sm">${esc(m.guru)}</td><td class="num b ${m.akhir !== null && m.akhir < kkm ? 'err' : 'tx'}">${angka(m.akhir)}</td><td><span class="bd ${m.akhir === null ? 'belum' : m.akhir >= kkm ? 'ok' : 'bad'}">${esc(m.predikat)}</span></td><td class="num">${m.tugasDinilai}/${m.tugasTotal}</td><td class="num">${m.kuisSelesai}/${m.kuisTotal}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-h"><h3>Riwayat nilai</h3><span class="xs mut">${daftar.length} penilaian</span></div>${daftar.length ? daftar.slice(0, 12).map(x => `<div class="it"><span class="sq ${x.n >= kkm ? 'H' : 'A'}"><b>${angka(x.n, 0)}</b></span><div class="grow"><b class="tx sm trunc" style="display:block">${esc(x.j)}</b><span class="xs mut">${x.jenis} · ${esc(namaMapel(x.m))} · ${esc(fTgl(x.w))}${x.c ? ' · “' + esc(x.c) + '”' : ''}</span></div></div>`).join('') : kosong('award', 'Belum ada nilai')}</div></div>
  <div class="stack"><div class="card col" style="align-items:center"><h3 style="align-self:flex-start">Status tugas</h3>${Chart.donut([{ l: 'Tepat waktu', v: rp.tugas.tepat, c: STATUS_WARNA.H }, { l: 'Terlambat', v: rp.tugas.terlambat, c: STATUS_WARNA.I }, { l: 'Belum (lewat tenggat)', v: rp.tugas.belum, c: STATUS_WARNA.A }, { l: 'Menunggu tenggat', v: rp.tugas.menunggu, c: '#C7D2FE' }], persen(rp.tugas.tepat, tot) + '%', 'tepat waktu')}
    ${legenda([['Tepat ' + rp.tugas.tepat, STATUS_WARNA.H], ['Terlambat ' + rp.tugas.terlambat, STATUS_WARNA.I], ['Belum ' + rp.tugas.belum, STATUS_WARNA.A], ['Menunggu ' + rp.tugas.menunggu, '#C7D2FE']])}</div>
    ${rp.catatan ? `<div class="card"><div class="card-h"><h3>Catatan sekolah</h3></div><div class="col">${rp.catatan.length ? rp.catatan.map(c => `<div class="tl ${esc(c.jenis)}"><div class="row sb2 xs"><span class="bd ${c.jenis === 'prestasi' ? 'ok' : c.jenis === 'pelanggaran' ? 'bad' : 'warn'}">${esc(c.jenis)}</span><span class="mut">${esc(fTgl(c.tanggal))}</span></div><p>${esc(c.deskripsi)}</p></div>`).join('') : kosong('note', 'Tidak ada catatan')}</div></div>` : ''}</div></div>`;
});
R.def('catatan', r => {
  if (!SD()) return V.catatanGuru ? V.catatanGuru(r) : '';
  const c = SD().rapor.catatan || [];
  return `${pilihAnak()}<div><div class="crumb"><a href="#/beranda">Beranda</a>${ic('chevR', 's')}<b>Catatan sekolah</b></div><h1>Catatan Wali Kelas</h1><p class="mut mt8">Ringkasan catatan prestasi, pembinaan, dan kedisiplinan ananda.</p></div>
    <div class="card col">${c.length ? c.map(x => `<div class="tl ${esc(x.jenis)}"><div class="row sb2 xs"><span class="bd ${x.jenis === 'prestasi' ? 'ok' : x.jenis === 'pelanggaran' ? 'bad' : 'warn'}">${esc(x.jenis)}</span><span class="mut">${esc(fTgl(x.tanggal, true))}</span></div><p>${esc(x.deskripsi)}</p></div>`).join('') : kosong('note', 'Belum ada catatan')}</div>`;
});

// ---- Rapor mini: pratinjau A4 & cetak (dipakai juga oleh guru/admin)
const Rapor = {
  buka(rp) {
    const opsi = Rapor.opsi = Object.assign({ nilai: true, hadir: true, tugas: true, catatan: !!rp.catatan, ttd: true, kertas: 'A4' }, Rapor.opsi || {});
    Rapor.data = rp;
    Modal.open(`<div class="modal-h"><span class="sq ungu">${ic('printer')}</span><div class="grow"><h2>Pratinjau & Ekspor Rapor Mini</h2><p class="sm mut">${esc(SET('NAMA_SEKOLAH') || '')} · ${esc(rp.tahun_ajaran)} (Semester ${esc(rp.semester)})</p></div><button class="btn ghost ico sm" data-a="tutup">${ic('x')}</button></div>
      <div class="modal-b"><div class="cols r400" style="grid-template-columns:minmax(0,1fr) 300px"><div id="rapor-prev">${Rapor.html(rp, opsi)}</div>
      <div class="col"><div class="card flat col" style="gap:4px"><b class="tx sm">${ic('listCheck', 's')} Komponen dicetak</b>${[['nilai', 'Nilai mata pelajaran'], ['hadir', 'Rekap presensi'], ['tugas', 'Status tugas'], ['catatan', 'Catatan wali kelas'], ['ttd', 'Kolom tanda tangan']].filter(x => x[0] !== 'catatan' || rp.catatan).map(x => `<label class="chk sm"><input type="checkbox" data-c="rapor-opsi" data-k="${x[0]}" ${opsi[x[0]] ? 'checked' : ''}>${x[1]}</label>`).join('')}</div>
      <div class="card flat col" style="gap:8px"><b class="tx sm">Ukuran kertas</b><div class="seg">${['A4', 'F4'].map(k => `<button class="${opsi.kertas === k ? 'on' : ''}" data-a="rapor-kertas" data-k="${k}">${k === 'A4' ? 'A4 (210×297)' : 'F4 (215×330)'}</button>`).join('')}</div></div>
      <button class="btn p blk" data-a="rapor-cetak">${ic('printer')} Cetak / simpan PDF</button><p class="xs mut">Pada jendela cetak pilih <b>Simpan sebagai PDF</b> untuk mengunduh berkas PDF.</p></div></div></div>
      <div class="modal-f" style="justify-content:space-between"><span class="xs mut">${ic('shield', 's')} Portal Belajar Spendas · Powered by hd.dsk</span><button class="btn ghost" data-a="tutup">Tutup</button></div>`, { size: 'xl' });
  },
  html(rp, o) {
    const kab = esc(SET('KOP_BARIS1') || ''), dinas = esc(SET('KOP_BARIS2') || ''), sek = esc(SET('NAMA_SEKOLAH') || ''), kkm = rp.kkm;
    const h = rp.kehadiran;
    return `<div class="rapor" id="cetak"><div class="kop"><div class="logo" style="background:#EEF0FF">${LOGO}</div><div class="grow center"><div style="font-size:10px;letter-spacing:.12em;color:#6B7280;font-weight:700">${kab}</div><div style="font-weight:800;font-size:14px">${dinas ? dinas + ' · ' : ''}${sek.toUpperCase()}</div>${SET('ALAMAT_SEKOLAH') ? `<div style="font-size:10px;color:#6B7280">${esc(SET('ALAMAT_SEKOLAH'))}</div>` : ''}<div style="font-weight:800;margin-top:6px;color:#4338CA">RAPOR MINI CAPAIAN BELAJAR</div></div></div>
      <table style="margin-bottom:12px"><tbody><tr><td style="border:0;width:22%;color:#6B7280">Nama siswa</td><td style="border:0"><b>${esc(rp.siswa.nama)}</b></td><td style="border:0;width:18%;color:#6B7280">Kelas</td><td style="border:0"><b>${esc(rp.siswa.kelas)}</b></td></tr><tr><td style="border:0;color:#6B7280">NIS</td><td style="border:0"><b>${esc(rp.siswa.nis)}</b></td><td style="border:0;color:#6B7280">Semester</td><td style="border:0"><b>${esc(rp.semester)} ${esc(rp.tahun_ajaran)}</b></td></tr></tbody></table>
      ${o.nilai ? `<div style="font-weight:800;color:#4338CA;font-size:11px;letter-spacing:.06em;margin:8px 0 6px">CAPAIAN KOMPETENSI · KKM ${kkm}</div><table><thead><tr><th>Mata pelajaran</th><th style="text-align:center">KKM</th><th style="text-align:center">Nilai akhir</th><th style="text-align:center">Predikat</th><th>Keterangan</th></tr></thead><tbody>${rp.mapel.map(m => `<tr><td>${esc(m.nama_mapel)}</td><td style="text-align:center">${kkm}</td><td style="text-align:center;font-weight:800;${m.akhir !== null && m.akhir < kkm ? 'color:#B91C1C' : ''}">${angka(m.akhir)}</td><td style="text-align:center"><b>${esc(m.predikat)}</b></td><td>${esc(m.ket)}</td></tr>`).join('')}<tr><td colspan="2"><b>Rata-rata</b></td><td style="text-align:center;font-weight:800">${angka(rp.rata)}</td><td style="text-align:center"><b>${esc(rp.predikat)}</b></td><td>${esc(rp.ket)}</td></tr></tbody></table>` : ''}
      <div style="display:grid;grid-template-columns:${o.hadir && o.tugas ? '1fr 1fr' : '1fr'};gap:12px;margin-top:12px">${o.hadir ? `<div style="background:#F6F7FF;border-radius:10px;padding:10px"><b>Presensi semester ini</b><div style="margin-top:6px">Hadir ${h.persen === null ? '-' : h.persen + '%'} jam pelajaran</div><div style="color:#6B7280;margin-top:2px">Sakit ${h.hari.S} hari · Izin ${h.hari.I} hari · Alfa ${h.hari.A} hari</div></div>` : ''}
        ${o.tugas ? `<div style="background:#F6F7FF;border-radius:10px;padding:10px"><b>Pengumpulan tugas</b><div style="margin-top:6px">Tepat waktu ${rp.tugas.tepat} · Terlambat ${rp.tugas.terlambat}</div><div style="color:#6B7280;margin-top:2px">Belum dikumpulkan (lewat tenggat): ${rp.tugas.belum}</div></div>` : ''}</div>
      ${o.catatan && rp.catatan ? `<div style="margin-top:12px;background:#F6F7FF;border-radius:10px;padding:10px"><b>Catatan wali kelas</b>${rp.catatan.length ? rp.catatan.slice(0, 4).map(c => `<div style="margin-top:4px">• <b style="text-transform:capitalize">${esc(c.jenis)}</b> (${esc(fTgl(c.tanggal))}): ${esc(c.deskripsi)}</div>`).join('') : '<div style="margin-top:4px;color:#6B7280">Tidak ada catatan.</div>'}</div>` : ''}
      ${o.ttd ? `<div class="ttd"><div>Mengetahui,<br>Wali Kelas ${esc(rp.siswa.kelas)}<div class="sp"></div><b style="text-decoration:underline">${esc(rp.wali_kelas || '................................')}</b></div><div>${esc((SET('NAMA_SEKOLAH') || '').replace(/^SMP Negeri \d+\s*/i, '') || 'Dasuk')}, ${esc(fTgl(hariIni(), true))}<br>Kepala Sekolah<div class="sp"></div><b style="text-decoration:underline">${esc(SET('KEPALA_SEKOLAH') || '................................')}</b>${SET('NIP_KEPALA_SEKOLAH') ? `<div style="font-size:10px">NIP. ${esc(SET('NIP_KEPALA_SEKOLAH'))}</div>` : ''}</div></div>` : ''}
      <div style="margin-top:16px;font-size:9.5px;color:#9CA3AF;text-align:center">Dokumen dibuat otomatis oleh Portal Belajar Spendas · ${sek} · Powered by hd.dsk</div></div>`;
  }
};
ACT['rapor-buka'] = () => { const sd = SD(); Rapor.buka(Object.assign({}, sd.rapor, { catatan: sd.rapor.catatan })); };
CHG['rapor-opsi'] = el => { Rapor.opsi[el.dataset.k] = el.checked; $('#rapor-prev').innerHTML = Rapor.html(Rapor.data, Rapor.opsi); };
ACT['rapor-kertas'] = el => { Rapor.opsi.kertas = el.dataset.k; $$('[data-a=rapor-kertas]').forEach(b => b.classList.toggle('on', b === el)); };
/** Cetak satu / banyak rapor: salinan diletakkan langsung di <body> (bebas dari modal yang bergulir), 1 rapor = 1 halaman. */
Rapor.cetak = (list, kertas) => {
  let st = $('#page-size'); if (!st) { st = document.createElement('style'); st.id = 'page-size'; document.head.appendChild(st); }
  st.textContent = '@page{size:' + (kertas === 'F4' ? '215mm 330mm' : 'A4') + ';margin:12mm}';
  $$('#cetak-m').forEach(x => x.remove());
  const d = document.createElement('div'); d.id = 'cetak-m';
  d.innerHTML = list.map(h => `<div class="rapor-pg">${h.replace(' id="cetak"', '')}</div>`).join('');
  document.body.appendChild(d);
  let selesai = false; const bersih = () => { if (selesai) return; selesai = true; d.remove(); window.removeEventListener('afterprint', bersih); };
  window.addEventListener('afterprint', bersih);
  setTimeout(() => window.print(), 60);
  setTimeout(bersih, 120000);
};
ACT['rapor-cetak'] = () => Rapor.cetak([Rapor.html(Rapor.data, Rapor.opsi)], Rapor.opsi.kertas);
