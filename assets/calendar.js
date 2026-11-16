(function () {
  var stories = window.STORIES || [], moods = window.MOODS || {};
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
        var c = s.m && s.m.length && moods[s.m[0]] ? moods[s.m[0]].c : null;
        a._story = s;
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

  // ---- hover / tap preview card ----
  var card = el('div', 'cal-card'); card.hidden = true; document.body.appendChild(card);
  var touch = window.matchMedia('(hover: none)').matches, openFor = null, hideT;
  function showCard(a) {
    var s = a._story; if (!s) return;
    clearTimeout(hideT);
    card.innerHTML = '';
    if (s.i) { var im = el('img', 'cal-card-img'); im.src = s.i; im.alt = ''; card.appendChild(im); }
    var body = el('div', 'cal-card-body');
    body.appendChild(el('p', 'date', s.nice));
    body.appendChild(el('p', 'cal-card-title', s.t));
    if (s.m && s.m.length) {
      var chips = el('div', 'cal-card-moods');
      s.m.forEach(function (m) { if (!moods[m]) return; var c = el('span', 'cal-card-mood', moods[m].n); c.style.setProperty('--c', moods[m].c); chips.appendChild(c); });
      body.appendChild(chips);
    }
    if (s.x) body.appendChild(el('p', 'cal-card-ex', s.x));
    if (touch) { var r = el('a', 'read', 'view entry →'); r.href = s.u; body.appendChild(r); }
    card.appendChild(body);
    card.hidden = false;
    var rect = a.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
    var left = Math.min(Math.max(12, rect.left + rect.width / 2 - cw / 2), window.innerWidth - cw - 12);
    var top = rect.top - ch - 10; if (top < 12) top = rect.bottom + 10;
    card.style.left = (left + window.scrollX) + 'px'; card.style.top = (top + window.scrollY) + 'px';
    openFor = a;
  }
  function hideCard() { hideT = setTimeout(function () { card.hidden = true; openFor = null; }, 80); }
  grid.addEventListener('mouseover', function (e) { var a = e.target.closest('.cal-story'); if (a && !touch) showCard(a); });
  grid.addEventListener('mouseout', function (e) { var a = e.target.closest('.cal-story'); if (a && !touch) hideCard(); });
  grid.addEventListener('focusin', function (e) { var a = e.target.closest('.cal-story'); if (a) showCard(a); });
  grid.addEventListener('focusout', hideCard);
  grid.addEventListener('click', function (e) {
    var a = e.target.closest('.cal-story');
    if (a && touch && openFor !== a) { e.preventDefault(); showCard(a); }
  });
  document.addEventListener('click', function (e) { if (touch && !e.target.closest('.cal-story') && !e.target.closest('.cal-card')) { card.hidden = true; openFor = null; } });
  window.addEventListener('scroll', function () { if (!touch) { card.hidden = true; openFor = null; } }, { passive: true });

  // ---- calendar | list switch ----
  var tabs = document.querySelectorAll('.view-switch button');
  var vCal = document.querySelector('.view-calendar'), vList = document.querySelector('.view-list');
  function setView(v, save) {
    tabs.forEach(function (t) { var on = t.dataset.view === v; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on); });
    vCal.hidden = v !== 'calendar'; vList.hidden = v !== 'list';
    card.hidden = true;
    if (save) {
      history.replaceState(null, '', (v === 'list' ? location.pathname + '?view=list' : location.pathname) + location.hash);
    }
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { setView(t.dataset.view, true); }); });
  setView(new URLSearchParams(location.search).get('view') === 'list' ? 'list' : 'calendar', false);
})();
