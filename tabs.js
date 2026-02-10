(function () {
  var tabs = document.querySelectorAll('.tabs button[role="tab"]');
  var panels = document.querySelectorAll('.panel[role="tabpanel"]');

  function switchTab(selectedButton) {
    var targetId = selectedButton.getAttribute('aria-controls');

    tabs.forEach(function (btn) {
      btn.setAttribute('aria-selected', btn === selectedButton ? 'true' : 'false');
    });

    panels.forEach(function (panel) {
      var isSelected = panel.id === targetId;
      panel.setAttribute('aria-hidden', isSelected ? 'false' : 'true');
    });
  }

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn);
    });

    btn.addEventListener('keydown', function (e) {
      var index = Array.prototype.indexOf.call(tabs, btn);
      var next, prev;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next = tabs[index + 1] || tabs[0];
        next.focus();
        switchTab(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev = tabs[index - 1] || tabs[tabs.length - 1];
        prev.focus();
        switchTab(prev);
      } else if (e.key === 'Home') {
        e.preventDefault();
        tabs[0].focus();
        switchTab(tabs[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        tabs[tabs.length - 1].focus();
        switchTab(tabs[tabs.length - 1]);
      }
    });
  });
})();
