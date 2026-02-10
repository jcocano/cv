(function () {
  var page = document.getElementById('page-wrap');
  var langBtns = document.querySelectorAll('.lang-switcher button[data-lang]');

  function setLang(lang) {
    page.classList.remove('lang-es', 'lang-en');
    page.classList.add('lang-' + lang);
    document.documentElement.lang = lang;
    document.title = 'Jesús Cocaño · Senior Backend & Platform Engineer';
    var tablist = document.getElementById('tablist-wrap');
    if (tablist) tablist.setAttribute('aria-label', lang === 'es' ? 'Secciones del CV' : 'CV sections');
    langBtns.forEach(function (btn) {
      var on = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem('cv-lang', lang); } catch (e) {}
  }

  langBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang')); });
  });

  var saved = localStorage.getItem('cv-lang');
  setLang((saved === 'es' || saved === 'en') ? saved : 'en');
})();
