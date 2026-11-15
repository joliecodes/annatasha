(function () {
  var buttons = document.querySelectorAll('.mood-bar .chip');
  var cards = document.querySelectorAll('.post-card');
  var empty = document.querySelector('.empty');
  var now = document.querySelector('.mood-now');

  function apply() {
    var mood = decodeURIComponent(location.hash.slice(1));
    var found = false, shown = 0;
    buttons.forEach(function (b) {
      var on = b.dataset.mood === mood;
      if (on) found = true;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
    if (!found) { mood = ''; buttons[0].classList.add('is-on'); }
    cards.forEach(function (c) {
      var show = !mood || (' ' + c.dataset.moods + ' ').indexOf(' ' + mood + ' ') > -1;
      c.hidden = !show;
      if (show) shown++;
    });
    empty.hidden = shown > 0;
    var active = document.querySelector('.mood-bar .chip.is-on');
    now.textContent = mood && active ? 'feeling ' + active.dataset.caption : '';
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.dataset.mood;
      var current = decodeURIComponent(location.hash.slice(1));
      if (!m || m === current) {
        history.replaceState(null, '', location.pathname);
      } else {
        history.replaceState(null, '', '#' + m);
      }
      apply();
    });
  });
  window.addEventListener('hashchange', apply);
  apply();
})();
