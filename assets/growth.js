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
      var rows = a.videos.slice().sort(function (x, y) { return (y.date + y.time).localeCompare(x.date + x.time); });
      tbl.innerHTML = '<table class="stack"><thead><tr><th>Tanggal</th><th>Views</th><th>Like rate</th><th>Catatan</th></tr></thead><tbody>' +
        rows.map(function (v) {
          var lr = pct(v.likes, v.views);
          var extra = [];
          if (v.likes != null) extra.push(num(v.likes) + ' suka');
          if (v.comments != null) extra.push(num(v.comments) + ' komentar');
          if (v.shares != null) extra.push(num(v.shares) + ' share');
          var mode = v.mode ? ' <span class="badge badge-warn">' + esc(v.mode) + '</span>' : '';
          return '<tr><td data-label="Tanggal">' + esc(tgl(v.date)) + ' <span class="ui-quiet">' + esc(v.time || '') + '</span></td>' +
            '<td data-label="Views"><strong>' + compact(v.views) + '</strong></td>' +
            '<td data-label="Like rate">' + (lr == null ? '—' : '<strong>' + pctStr(lr) + '</strong>') + '</td>' +
            '<td data-label="Catatan">' + esc(v.note || '') + mode + (extra.length ? '<br><span class="ui-quiet">' + extra.join(' · ') + '</span>' : '') + '</td></tr>';
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
      var h2 = nc.querySelector('h2');
      nc.innerHTML = (h2 ? h2.outerHTML : '') +
        '<p style="margin:0 0 .45rem"><strong>' + esc(p.next_checkpoint.ask) + '</strong></p>' +
        '<p class="ui-quiet" style="margin:0">' + esc(p.next_checkpoint.why) + '</p>';
      if (h2) nc.querySelector('h2').textContent = 'Checkpoint · ' + tgl(p.next_checkpoint.date);
    }

    var stamp = el('lastUpdated');
    if (stamp) stamp.textContent = tgl(p.updated_at || (p.entries && p.entries.length ? p.entries[p.entries.length - 1].date : ''));
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (el('statusStats') || el('headline') || el('statusTargets') || el('statusPhases') || el('nextActions') || el('ytCard')) {
      fetchJson('data/status.json').then(renderStatus).catch(function (e) { fail('statusStats', e); });
    }
    if (el('latestProgress') || el('lastUpdated')) {
      fetchJson('data/progress.json').then(function (p) { renderLatestProgress(p); renderProgress(p); }).catch(function (e) { fail('latestProgress', e); fail('progressTimeline', e); });
    }
    if (el('auditVideos') || el('auditPatterns') || el('auditExperiments')) {
      fetchJson('data/audit.json').then(renderAudit).catch(function (e) { fail('auditVideos', e); });
    }
  });
})();
