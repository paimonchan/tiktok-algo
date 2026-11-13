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
    var order = ['index.html', 'bedah.html', 'playbook.html', 'sumber.html'];
    var here = location.pathname.split('/').pop() || 'index.html';
    var i = order.indexOf(here);
    if (i < 0) return;
    if (e.key === 'ArrowRight' && i < order.length - 1) location.href = order[i + 1];
    if (e.key === 'ArrowLeft' && i > 0) location.href = order[i - 1];
  });
})();
