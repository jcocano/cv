(function () {
  function initAccordion() {
    var jobHeaders = document.querySelectorAll('.job-header');

    jobHeaders.forEach(function (header, index) {
      var job = header.closest('.job');
      if (!job) return;
      var body = job.querySelector('.job-body');
      if (!body) return;

      if (index === 0) {
        header.setAttribute('aria-expanded', 'true');
        body.hidden = false;
      }

      header.addEventListener('click', function () {
        if (header.getAttribute('aria-expanded') === 'true') return;

        jobHeaders.forEach(function (otherHeader) {
          var otherJob = otherHeader.closest('.job');
          if (!otherJob) return;
          var otherBody = otherJob.querySelector('.job-body');
          if (!otherBody) return;
          otherHeader.setAttribute('aria-expanded', 'false');
          otherBody.hidden = true;
        });

        header.setAttribute('aria-expanded', 'true');
        body.hidden = false;
      });
    });
  }

  // Run on initial load
  initAccordion();

  // Re-init when panels become visible (for tabs)
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      if (m.attributeName === 'aria-hidden' && m.target.getAttribute('aria-hidden') === 'false') {
        // Re-query in case DOM was hidden
        initAccordion();
      }
    });
  });

  document.querySelectorAll('.panel[role="tabpanel"]').forEach(function (panel) {
    observer.observe(panel, { attributes: true });
  });
})();
