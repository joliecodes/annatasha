(function () {
  var allBtn = document.querySelector('.mood-bar .chip-all');
  var buttons = document.querySelectorAll('.mood-bar .chip[data-mood]:not(.chip-all)');
  var cards = document.querySelectorAll('.post-card');
  var empty = document.querySelector('.empty');

  function selected() {
    var h = decodeURIComponent(location.hash.slice(1));
    return h ? h.split(',').filter(Boolean) : [];
  }
  function save(list) {
    history.replaceState(null, '', list.length ? '#' + list.join(',') : location.pathname);
    apply();
  }

  function apply() {
    var picked = selected(), shown = 0;
    buttons.forEach(function (b) {
      var on = picked.indexOf(b.dataset.mood) > -1;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
    allBtn.classList.toggle('is-on', picked.length === 0);
    cards.forEach(function (c) {
      var moods = (c.dataset.moods || '').split(' ');
      var show = !picked.length || picked.some(function (m) { return moods.indexOf(m) > -1; });
      c.hidden = !show;
      c.classList.toggle('first-visible', show && shown === 0);
      if (show) shown++;
    });
    empty.hidden = shown > 0;
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var list = selected(), m = b.dataset.mood, i = list.indexOf(m);
      if (i > -1) list.splice(i, 1); else list.push(m);
      save(list);
    });
  });
  allBtn.addEventListener('click', function () { save([]); });
  window.addEventListener('hashchange', apply);
  apply();
})();
