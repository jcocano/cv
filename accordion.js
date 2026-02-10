(function () {
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
})();
