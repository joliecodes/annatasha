(function () {
  var stories = window.STORIES || [], colours = window.MOOD_COLOURS || {};
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var grid = document.querySelector('.cal-grid'), label = document.querySelector('.cal-month');
  var list = document.querySelector('.cal-month-list'), btns = document.querySelectorAll('.cal-btn');

  var byDay = {}, months = [];
  stories.forEach(function (s) {
    (byDay[s.d] = byDay[s.d] || []).push(s);
    var key = s.d.slice(0, 7);
    if (months.indexOf(key) < 0) months.push(key);
  });
  months.sort(); // oldest → newest
  var today = new Date();
  var cur = months.length ? months[months.length - 1] : today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  var fromHash = location.hash.slice(1);
  if (/^\d{4}-\d{2}$/.test(fromHash)) cur = fromHash;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function shift(key, n) {
    var y = +key.slice(0, 4), m = +key.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return y + '-' + String(m + 1).padStart(2, '0');
  }

  function render() {
    var y = +cur.slice(0, 4), m = +cur.slice(5, 7) - 1;
    label.textContent = MONTHS[m] + ' ' + y;
    grid.innerHTML = '';
    DAYS.forEach(function (d) { grid.appendChild(el('div', 'cal-dow', d)); });
    var first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < first; i++) grid.appendChild(el('div', 'cal-cell is-blank'));
    for (var d = 1; d <= days; d++) {
      var key = cur + '-' + String(d).padStart(2, '0'), cell = el('div', 'cal-cell');
      cell.appendChild(el('span', 'cal-day', String(d)));
      (byDay[key] || []).forEach(function (s) {
        var a = el('a', 'cal-story', s.t); a.href = s.u; a.title = s.t;
        var c = s.m && s.m.length ? colours[s.m[0]] : null;
        if (c) a.style.setProperty('--c', c);
        cell.appendChild(a); cell.classList.add('has-story');
      });
      grid.appendChild(cell);
    }
    btns[0].disabled = months.length && cur <= months[0];
    btns[1].disabled = months.length && cur >= months[months.length - 1];
    list.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', b.dataset.month === cur); });
    history.replaceState(null, '', '#' + cur);
  }

  months.slice().reverse().forEach(function (k) {
    var b = el('button', 'chip', MONTHS[+k.slice(5, 7) - 1].slice(0, 3) + ' ' + k.slice(0, 4));
    b.type = 'button'; b.dataset.month = k;
    b.addEventListener('click', function () { cur = k; render(); });
    list.appendChild(b);
  });
  btns.forEach(function (b) { b.addEventListener('click', function () { cur = shift(cur, +b.dataset.step); render(); }); });
  render();
})();
