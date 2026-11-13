/* Ganti tema + penanda halaman aktif. Tanpa dependensi. */
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  var KEY = 'theme';

  function currentEffective() {
    var set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    if (btn) {
      btn.textContent = mode === 'dark' ? '☀' : '◐';
      btn.setAttribute('aria-label', mode === 'dark' ? 'Aktifkan tema terang' : 'Aktifkan tema gelap');
    }
  }

  if (btn) {
    btn.textContent = currentEffective() === 'dark' ? '☀' : '◐';
    btn.addEventListener('click', function () {
      apply(currentEffective() === 'dark' ? 'light' : 'dark');
    });
  }

  // Panah kiri/kanan untuk pindah halaman (kenyamanan desktop).
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var order = ['mudah.html', 'index.html', 'audit.html', 'progress.html', 'playbook.html', 'bedah.html', 'sumber.html'];
    var here = location.pathname.split('/').pop() || 'index.html';
    var i = order.indexOf(here);
    if (i < 0) return;
    if (e.key === 'ArrowRight' && i < order.length - 1) location.href = order[i + 1];
    if (e.key === 'ArrowLeft' && i > 0) location.href = order[i - 1];
  });

  /* ---------- menu samping (drawer) untuk layar kecil ---------- */
  (function drawerNav() {
    var openBtn = document.getElementById('menuBtn');
    var drawer = document.getElementById('drawer');
    var backdrop = document.getElementById('drawerBackdrop');
    var closeBtn = document.getElementById('drawerClose');
    if (!openBtn || !drawer || !backdrop) return;
    var lastFocus = null;

    function isOpen() { return document.body.classList.contains('drawer-open'); }

    function open() {
      lastFocus = document.activeElement;
      document.body.classList.add('drawer-open');
      drawer.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      var first = drawer.querySelector('a, button');
      if (first) first.focus();
    }

    function close(returnFocus) {
      document.body.classList.remove('drawer-open');
      drawer.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      if (returnFocus !== false) {
        var back = (lastFocus && lastFocus.focus) ? lastFocus : openBtn;
        back.focus();
      }
    }

    openBtn.addEventListener('click', function () { isOpen() ? close() : open(); });
    if (closeBtn) closeBtn.addEventListener('click', function () { close(); });
    backdrop.addEventListener('click', function () { close(); });
    drawer.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (a) close(false);
    });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        var items = drawer.querySelectorAll('a[href], button');
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', function () {
      if (isOpen() && window.matchMedia('(min-width: 980px)').matches) close(false);
    });
  })();
})();
