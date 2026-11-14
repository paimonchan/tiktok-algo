/* Renderer untuk data/*.json — tanpa dependensi.
   Halaman menaruh wadah kosong dengan id tertentu; berkas ini mengisinya.
   Kalau fetch gagal, tampilkan pesan jelas (bukan halaman kosong). */
(function () {
  'use strict';

  var nf = new Intl.NumberFormat('id-ID');

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function num(v) { return (v == null || v === '') ? '—' : nf.format(v); }
  function compact(v) {
    if (v == null) return '—';
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.', ',') + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1).replace('.', ',').replace(',0', '') + 'K';
    return nf.format(v);
  }
  function pct(a, b) {
    if (!a || !b) return null;
    return (a / b * 100);
  }
  function pctStr(p) { return p == null ? '—' : p.toFixed(p < 1 ? 2 : 1).replace('.', ',') + '%'; }
  function tgl(iso) {
    if (!iso) return '—';
    var d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function median(arr) {
    var a = arr.filter(function (x) { return typeof x === 'number' && x > 0; }).sort(function (x, y) { return x - y; });
    if (!a.length) return null;
    var m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }
  function fetchJson(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(path + ' → HTTP ' + r.status);
      return r.json();
    });
  }
  function fail(where, err) {
    var box = typeof where === 'string' ? el(where) : where;
    if (box) box.innerHTML = '<p class="ui-quiet" style="margin:0">Data belum bisa dimuat: ' + esc(err && err.message ? err.message : err) + '</p>';
    console.error('[growth]', err);
  }

  /* ---------- dashboard ---------- */
  function renderStatus(s) {
    var t = s.accounts[0];
    var statsWrap = el('statusStats');
    if (statsWrap) {
      var cards = s.headline_stats || [
        { k: 'Follower', v: num(t.followers), s: t.handle },
        { k: 'Median views', v: '±107', s: '12 video terakhir' },
        { k: 'Like rate terakhir', v: '14,7%', s: 'video 13 Nov' }
      ];
      statsWrap.innerHTML = cards.map(function (x) {
        return '<article class="stat"><span class="stat-k">' + esc(x.k) + '</span><strong class="stat-v">' + esc(x.v) + '</strong><span class="stat-s">' + esc(x.s) + '</span></article>';
      }).join('');
    }
    if (el('headline')) el('headline').textContent = s.headline_finding;

    var targets = el('statusTargets');
    if (targets) {
      targets.innerHTML = '<table class="stack"><thead><tr><th>Metrik</th><th>Sekarang → target</th><th>Kenapa diukur</th></tr></thead><tbody>' +
        s.targets.map(function (x) {
          return '<tr><td data-label="Metrik"><strong>' + esc(x.metric) + '</strong></td><td data-label="Sekarang → target">' + esc(x.now) + ' → <strong>' + esc(x.target) + '</strong></td><td data-label="Kenapa">' + esc(x.why) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    var phases = el('statusPhases');
    if (phases) {
      phases.innerHTML = s.phases.map(function (p) {
        return '<article class="card phase"><header><h3>' + esc(p.name) + '</h3><span class="badge ' + (p.status === 'berjalan' ? 'badge-live' : 'badge-idle') + '">' + esc(p.status) + '</span></header>' +
          '<p class="ui-quiet" style="margin:.2em 0 .7em">' + esc(p.window) + '</p><ul>' +
          p.goals.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul>' +
          '<p class="ui-quiet" style="margin-bottom:0"><strong>Selesai kalau:</strong> ' + esc(p.done_when) + '</p></article>';
      }).join('');
    }

    var next = el('nextActions');
    if (next) {
      var f1 = s.phases.filter(function (p) { return p.status === 'berjalan'; })[0] || s.phases[0];
      next.innerHTML = f1.goals.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('');
    }

    var yt = el('ytCard');
    if (yt && s.accounts[1]) {
      var y = s.accounts[1];
      yt.innerHTML = '<h3>YouTube (nanti, jangan sekarang)</h3><p>' + esc(y.handle) + ' — ' + num(y.subscribers) + ' subscriber, ' + num(y.videos) + ' video.</p><p class="ui-quiet" style="margin-bottom:0">' + esc(y.note) + '</p>';
    }
  }

  function renderLatestProgress(p) {
    var box = el('latestProgress');
    if (!box || !p.entries || !p.entries.length) return;
    var e = p.entries[p.entries.length - 1];
    box.innerHTML = '<p class="ui-quiet" style="margin:0 0 .5em">Update terakhir: <strong>' + esc(tgl(e.date)) + '</strong> · ' + esc(e.type) + '</p>' +
      '<h3 style="margin-top:0">' + esc(e.title) + '</h3>' +
      '<ul>' + (e.actions || []).map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' +
      '<p><strong>Hasil:</strong> ' + esc(e.result) + '</p>' +
      '<p style="margin-bottom:0"><strong>Keputusan:</strong> ' + esc(e.decision) + '</p>';
  }

  /* ---------- audit ---------- */
  function renderAudit(a) {
    var tbl = el('auditVideos');
    if (tbl) {
      var rows = a.videos.slice().sort(function (x, y) { return (y.terbit || (y.date + y.time)).localeCompare(x.terbit || (x.date + x.time)); });
      tbl.innerHTML = '<table class="stack"><thead><tr><th>Terbit</th><th>Views</th><th>Like rate</th><th>Catatan</th></tr></thead><tbody>' +
        rows.map(function (v) {
          var lr = pct(v.likes, v.views);
          var extra = [];
          if (v.likes != null) extra.push(num(v.likes) + ' suka');
          if (v.comments != null) extra.push(num(v.comments) + ' komentar');
          if (v.shares != null) extra.push(num(v.shares) + ' share');
          if (v.saves != null) extra.push(num(v.saves) + ' simpan');
          var mode = v.mode ? ' <span class="badge badge-warn">' + esc(v.mode) + '</span>' : '';
          var tglTerbit = v.terbit || (v.date + 'T' + (v.time || '00:00') + ':00');
          var ket = tglTerbit.slice(8, 10) + ' ' + ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][parseInt(tglTerbit.slice(5, 7), 10) - 1] + ' ' + tglTerbit.slice(11, 16);
          return '<tr><td data-label="Terbit">' + ket + '</td>' +
            '<td data-label="Views"><strong>' + compact(v.views) + '</strong></td>' +
            '<td data-label="Like rate">' + (lr == null ? '—' : '<strong>' + pctStr(lr) + '</strong>') + '</td>' +
            '<td data-label="Catatan">' + (v.durasi_detik ? '<span class="ui-quiet">' + v.durasi_detik + ' dtk</span> · ' : '') + esc(v.note || '') + mode + (extra.length ? '<br><span class="ui-quiet">' + extra.join(' · ') + '</span>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    var old = el('auditOlder');
    if (old) {
      old.innerHTML = '<table class="stack"><thead><tr><th>Tanggal</th><th>Judul / tag</th><th>Likes</th><th>Sumber</th></tr></thead><tbody>' +
        a.older_sample.map(function (v) {
          return '<tr><td data-label="Tanggal">' + esc(tgl(v.date)) + '</td><td data-label="Judul">' + esc(v.title) + '</td><td data-label="Likes">' + num(v.likes) + '</td><td data-label="Sumber">' + esc(v.source) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    var pat = el('auditPatterns');
    if (pat) {
      pat.innerHTML = a.patterns.map(function (p) {
        return '<li><strong>' + esc(p.title) + '</strong> — ' + esc(p.meaning) + '</li>';
      }).join('');
    }

    var ex = el('auditExperiments');
    if (ex) {
      ex.innerHTML = '<table class="stack"><thead><tr><th>#</th><th>Yang diubah</th><th>Metrik penentu</th></tr></thead><tbody>' +
        a.experiments.map(function (e) {
          return '<tr><td data-label="Kode"><strong>' + esc(e.id) + '</strong></td><td data-label="Perubahan">' + esc(e.change) + '</td><td data-label="Metrik">' + esc(e.metric) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    var want = el('auditWanted');
    if (want) {
      want.innerHTML = a.owner_numbers_wanted.map(function (w) {
        return '<li><strong>' + esc(w.metric) + '</strong> — ' + esc(w.resolves) + '</li>';
      }).join('');
    }

    if (el('auditMethod')) el('auditMethod').textContent = a.method;
    if (el('auditDate')) el('auditDate').textContent = tgl(a.measured_at);
  }

  /* ---------- progress ---------- */
  function renderProgress(p) {
    var tl = el('progressTimeline');
    if (tl) {
      var list = (p.entries || []).slice().sort(function (a, b) { return (b.date).localeCompare(a.date); });
      tl.innerHTML = list.map(function (e) {
        return '<article class="tl-item"><div class="tl-dot" aria-hidden="true"></div><div class="tl-body">' +
          '<p class="tl-date">' + esc(tgl(e.date)) + ' <span class="badge ' + (e.status === 'berjalan' ? 'badge-live' : 'badge-idle') + '">' + esc(e.status || e.type) + '</span></p>' +
          '<h3>' + esc(e.title) + '</h3>' +
          '<ul>' + (e.actions || []).map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' +
          '<p><strong>Hasil:</strong> ' + esc(e.result) + '</p>' +
          '<p style="margin-bottom:0"><strong>Keputusan:</strong> ' + esc(e.decision) + '</p>' +
          '<p class="tl-metrics ui-quiet">Follower ' + num(e.followers) + ' · Likes ' + num(e.likes) + ' · Video ' + num(e.videos) + ' · Median views ' + num(e.median_views) + '</p>' +
          '</div></article>';
      }).join('') || '<p class="ui-quiet">Belum ada entri.</p>';
    }

    var tbl = el('progressTable');
    if (tbl) {
      var l2 = (p.entries || []).slice().sort(function (a, b) { return (b.date).localeCompare(a.date); });
      tbl.innerHTML = '<table class="stack"><thead><tr><th>Tanggal</th><th>Follower</th><th>Median views</th><th>Ringkas</th></tr></thead><tbody>' +
        l2.map(function (e) {
          return '<tr><td data-label="Tanggal">' + esc(tgl(e.date)) + '</td><td data-label="Follower"><strong>' + num(e.followers) + '</strong></td><td data-label="Median views">' + num(e.median_views) + '</td><td data-label="Ringkas">' + esc(e.result) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    var how = el('progressHow');
    if (how) {
      how.textContent = p.how_to_update;
      var wl = el('progressWhat');
      if (wl) wl.innerHTML = (p.what_is_logged || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    }

    var nc = el('nextCheckpoint');
    if (nc && p.next_checkpoint) {
      nc.innerHTML = '<summary><span class="side-title"></span></summary><div class="side-body">' +
        '<p style="margin:0 0 .45rem"><strong>' + esc(p.next_checkpoint.ask) + '</strong></p>' +
        '<p class="ui-quiet" style="margin:0">' + esc(p.next_checkpoint.why) + '</p></div>';
      nc.querySelector('.side-title').textContent = 'Checkpoint · ' + tgl(p.next_checkpoint.date);
    }

    var stamp = el('lastUpdated');
    if (stamp) stamp.textContent = tgl(p.updated_at || (p.entries && p.entries.length ? p.entries[p.entries.length - 1].date : ''));
  }

  /* ---------- daftar aksi: tampil saja (update dikirim lewat Telegram) ---------- */
  function renderActions(items) {
    var ul = el('nextActions');
    if (!ul) return;
    ul.innerHTML = items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
  }

  function renderSparkline(videos) {
    var box = el('viewTrend');
    if (!box || !videos || !videos.length) return;
    var vs = videos.slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });
    var max = Math.max.apply(null, vs.map(function (v) { return v.views; }));
    var n = vs.length, w = 100, h = 30, bw = (w / n) * 0.66;
    var bars = vs.map(function (v, i) {
      var hh = Math.max(1.6, Math.sqrt(v.views / max) * h);
      var x = i * (w / n) + (w / n) * 0.17;
      var lr = pct(v.likes, v.views);
      var cls = 'bar';
      if (v.views > 2000 && lr != null && lr >= 5) cls = 'bar-hit';
      else if (v.views > 2000) cls = 'bar-far';
      else if (lr != null && lr >= 8) cls = 'bar-good';
      var label = tgl(v.date) + ' · ' + compact(v.views) + ' views' + (lr == null ? '' : ' · like ' + pctStr(lr));
      return '<rect class="' + cls + '" x="' + x.toFixed(2) + '" y="' + (h - hh).toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + hh.toFixed(2) + '" rx="0.7"><title>' + esc(label) + '</title></rect>';
    }).join('');
    box.innerHTML = '<svg viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label="Views per video, ' + n + ' terakhir">' +
      '<g transform="translate(0,1)">' + bars + '</g></svg>' +
      '<p class="ui-quiet" style="margin:.55rem 0 0">Views ' + n + ' video terakhir, skala akar (biar 21 ribu dan 87 tetap kelihatan). ' +
      '<span class="legend"><i class="key key-hit"></i>jangkauan + resonansi <i class="key key-far"></i>jangkauan saja ' +
      '<i class="key key-good"></i>resonansi saja</span></p>';
  }

  /* ---------- sidebar: di HP dilipat, di desktop terbuka ---------- */
  function setupCollapse() {
    var blocks = document.querySelectorAll('.side-block[data-collapse="mobile"]');
    if (!blocks.length || !window.matchMedia) return;
    var mq = window.matchMedia('(min-width: 980px)');
    function apply() {
      blocks.forEach(function (d) {
        if (mq.matches) d.setAttribute('open', '');
        else if (!d.hasAttribute('data-open-mobile')) d.removeAttribute('open');
      });
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (el('statusStats') || el('headline') || el('statusTargets') || el('statusPhases') || el('nextActions') || el('ytCard')) {
      fetchJson('data/status.json').then(function (s) {
        renderStatus(s);
        var cur = s.phases.filter(function (p) { return p.status === 'berjalan'; })[0] || s.phases[0];
        renderActions(cur.goals);
      }).catch(function (e) { fail('statusStats', e); });
    }
    if (el('latestProgress') || el('lastUpdated')) {
      fetchJson('data/progress.json').then(function (p) { renderLatestProgress(p); renderProgress(p); }).catch(function (e) { fail('latestProgress', e); fail('progressTimeline', e); });
    }
    setupCollapse();
    if (el('auditVideos') || el('auditPatterns') || el('auditExperiments') || el('viewTrend')) {
      fetchJson('data/audit.json').then(function (a) {
        renderAudit(a);
        renderSparkline(a.videos);
      }).catch(function (e) { fail('auditVideos', e); });
    }
  });

  // ---- Analitik dari sisi pemilik (Studio) ----
  fetchJson('data/studio.json').then(function (st) {
    var box = el('studioCards');
    if (!box) return;
    box.innerHTML = st.videos.map(function (v) {
      function baris(judul, arr) {
        if (!arr || !arr.length) return '';
        return '<h4>' + esc(judul) + '</h4><ul class="ui-list">' + arr.map(function (x) {
          return '<li><span class="ui-quiet">' + esc(x[0]) + ':</span> <strong>' + esc(x[1]) + '</strong></li>';
        }).join('') + '</ul>';
      }
      return '<article class="side-block" style="padding:1rem;margin-bottom:.9rem">' +
        '<h3 style="margin:0 0 .2rem">' + esc(v.label) + '</h3>' +
        '<p class="ui-quiet" style="margin:0 0 .8rem">Terbit ' + esc(v.terbit) + ' · ' + esc(v.durasi_detik) + ' detik · ' + esc(v.peran) + '</p>' +
        baris('Metrik', v.metrik) + baris('Retensi', v.retention) + baris('Sumber traffic', v.traffic) +
        baris('Penonton', v.viewers) + baris('Kata yang dicari', v.cari) +
        '<h4>Yang penting dari video ini</h4><ul class="ui-list">' + v.temuan.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<p class="ui-quiet" style="margin:.6rem 0 0">' + esc(v.terbit_konfirmasi) + '</p>' +
        '</article>';
    }).join('');
  }).catch(function (e) {
    fail('studioCards', e);
  });


  // ---- tabel perbandingan antar-video ----
  fetchJson('data/studio.json').then(function (st) {
    var box = el('studioBanding');
    if (!box) return;
    if (st.kesimpulan_utama) {
      box.insertAdjacentHTML('beforebegin', '<p class="ui-quiet" style="margin:.2rem 0 .8rem">' + esc(st.kesimpulan_utama) + '</p>');
    }
    if (!st.perbandingan) { box.innerHTML = ''; return; }
    var head = ['Video', 'Views', 'Retensi', 'Tuntas', 'Like', 'Share', 'Simpan', 'Follower/1.000 views', 'Promote'];
    box.innerHTML = '<table class="stack"><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + st.perbandingan.map(function (r) {
        return '<tr>' + r.map(function (c, i) {
          return '<td data-label="' + esc(head[i]) + '">' + (i === 0 ? '<strong>' + esc(c) + '</strong>' : esc(c)) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
  }).catch(function (e) { fail('studioBanding', e); });


  // ---- tersangka, cara cek, dan sumber kebijakan ----
  fetchJson('data/studio.json').then(function (st) {
    var box = el('studioCek');
    if (!box) return;
    var h = '';
    if (st.penyelidikan) {
      h += '<h2>Kenapa jangkauannya seret: tersangka &amp; buktinya</h2><ul class="ui-list">' +
        st.penyelidikan.map(function (x) {
          return '<li><strong>' + esc(x.tersangka) + '</strong> — <em>' + esc(x.status) + '</em><br><span class="ui-quiet">' + esc(x.bukti) + '</span></li>';
        }).join('') + '</ul>';
    }

    if (st.timeline_jangkauan) {
      h += '<h2>Timeline: kapan jangkauannya jatuh</h2><ul class="ui-list">' +
        st.timeline_jangkauan.map(function (x) {
          return '<li><strong>' + esc(x[0]) + '</strong> — ' + esc(x[1]) + '</li>';
        }).join('') + '</ul>';
    }

    if (st.pelanggaran) {
      h += '<h2>Catatan pelanggaran yang terlihat di Inbox</h2><ul class="ui-list">' +
        st.pelanggaran.map(function (x) {
          return '<li><strong>' + esc(x[0]) + '</strong> — ' + esc(x[1]) + '<br><span class="ui-quiet">' + esc(x[2]) + '</span></li>';
        }).join('') + '</ul>';
      if (st.catatan_pola_pelanggaran) h += '<p class="ui-quiet">' + esc(st.catatan_pola_pelanggaran) + '</p>';
    }

    if (st.video_dipulihkan) {
      h += '<h2>Video yang ditandai lalu dipulihkan (banding menang)</h2><ul class="ui-list">' +
        st.video_dipulihkan.map(function (x) {
          return '<li><strong>' + esc(x.caption) + '</strong><br><span class="ui-quiet">Posting ' + esc(x.posted) +
            ' · banding diajukan ' + esc(x.banding_diajukan) + ' · disetujui ' + esc(x.banding_disetujui) + '</span><br><span class="ui-quiet">' + esc(x.catatan) + '</span></li>';
        }).join('') + '</ul>';
      if (st.pola_penandaan) h += '<p class="ui-quiet">' + esc(st.pola_penandaan) + '</p>';
    }

    if (st.alasan_dari_tiktok) {
      h += '<h2>Apa kata TikTok soal alasannya</h2><p>' + esc(st.alasan_dari_tiktok) + '</p>';
      if (st.catatan_metadata) h += '<p class="ui-quiet">' + esc(st.catatan_metadata) + '</p>';
    }
    if (st.elemen_berisiko) {
      h += '<h2>Elemen yang sebaiknya dihindari</h2><ul class="ui-list">' +
        st.elemen_berisiko.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    }
    if (st.cara_cek) {
      h += '<h2>Langkah cek (dari sisi akun) — ' + st.cara_cek.length + ' langkah</h2><ol>' +
        st.cara_cek.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
    }
    if (st.sumber_kebijakan) {
      h += '<h2>Sumber resmi</h2><ul class="ui-list">' +
        st.sumber_kebijakan.map(function (x) { return '<li><span class="ui-quiet">' + esc(x) + '</span></li>'; }).join('') + '</ul>';
    }
    box.innerHTML = h;
  }).catch(function (e) { fail('studioCek', e); });

})();
