(function () {
  var box = document.getElementById('thoughts'); if (!box) return;
  var api = box.dataset.api, post = box.dataset.post;
  var form = box.querySelector('.thoughts-form'), list = box.querySelector('.thoughts-list');
  var status = box.querySelector('.thoughts-status'), btn = box.querySelector('.thoughts-send');
  var sideSlot = document.querySelector('.thoughts-slot-side'), endSlot = document.querySelector('.thoughts-slot-end');
  var widgetId = null, token = '';

  // desktop: sidebar scroll box · phones: end of the post
  var wide = window.matchMedia('(min-width: 821px)');
  function place() { var slot = wide.matches ? sideSlot : endSlot; if (slot && box.parentNode !== slot) slot.appendChild(box); if (window.fitSide) window.fitSide(); }
  place(); (wide.addEventListener ? wide.addEventListener('change', place) : wide.addListener(place));
  box.hidden = false;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function nice(d) {
    var dt = new Date(String(d).replace(' ', 'T') + 'Z');
    return isNaN(dt) ? '' : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function load() {
    fetch(api + '/api/comments?post=' + encodeURIComponent(post))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        list.innerHTML = '';
        var cs = (d && d.comments) || [];
        if (!cs.length) { list.appendChild(el('li', 'thoughts-empty', box.dataset.empty)); return; }
        cs.slice().reverse().forEach(function (c) {
          var li = el('li', 'thought');
          var head = el('p', 'thought-meta'); head.appendChild(el('span', 'thought-name', c.name)); head.appendChild(el('span', 'thought-date', nice(c.created_at)));
          li.appendChild(head);
          li.appendChild(el('p', 'thought-msg', c.message));
          if (c.reply) { var r = el('div', 'thought-reply'); r.appendChild(el('span', 'thought-name', 'Annatasha')); r.appendChild(el('p', 'thought-msg', c.reply)); li.appendChild(r); }
          list.appendChild(li);
        });
      })
      .catch(function () {});
  }

  // Turnstile, loaded only when someone starts writing
  var tsLoading = false;
  function loadTurnstile() {
    if (tsLoading) return; tsLoading = true;
    window.onThoughtsTurnstile = function () {
      widgetId = window.turnstile.render(box.querySelector('.thoughts-captcha'), {
        sitekey: box.dataset.sitekey, appearance: 'interaction-only', theme: 'light', size: 'flexible',
        callback: function (t) { token = t; }, 'expired-callback': function () { token = ''; }
      });
    };
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onThoughtsTurnstile';
    s.async = true; document.head.appendChild(s);
  }
  form.addEventListener('focusin', loadTurnstile);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim(), message = form.message.value.trim();
    if (!name || !message) { status.textContent = 'Add your name and a thought first.'; return; }
    if (!token) { status.textContent = 'One sec, checking you are human…'; loadTurnstile(); return; }
    btn.disabled = true; status.textContent = 'Sending…';
    fetch(api + '/api/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: post, title: box.dataset.title, name: name, message: message, token: token })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok) { form.message.value = ''; status.textContent = box.dataset.thanks; }
      else status.textContent = (d && d.error) || 'That did not send. Try again?';
    }).catch(function () { status.textContent = 'That did not send. Try again?'; })
      .finally(function () { btn.disabled = false; token = ''; if (window.turnstile && widgetId !== null) window.turnstile.reset(widgetId); });
  });

  load();
})();
