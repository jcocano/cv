(function () {
  var STORAGE_KEY = 'cv-theme';
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  function getPreferred() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.querySelector('.icon-sun').style.display = theme === 'dark' ? 'block' : 'none';
    toggle.querySelector('.icon-moon').style.display = theme === 'dark' ? 'none' : 'block';
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  apply(getPreferred());

  toggle.addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    apply(current === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem(STORAGE_KEY)) apply(e.matches ? 'dark' : 'light');
  });
})();
