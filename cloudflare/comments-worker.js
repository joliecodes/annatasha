// annatasha-comments — the "Thoughts?" box for annatasha.com
// Bindings (Cloudflare → Worker → Settings):
//   DB               D1 database "annatasha-comments"
//   TURNSTILE_SECRET secret  (Turnstile widget → secret key)
//   ADMIN_PASSWORD   secret  (your approval-page password)
//   NTFY_TOPIC       variable (ntfy topic for phone alerts; leave empty to turn alerts off)

const SITE = 'https://annatasha.com';
const ALLOWED_ORIGINS = [SITE, 'https://www.annatasha.com', 'https://blog.annatasha.com', 'http://localhost:4000', 'http://127.0.0.1:4000'];
const MAX_NAME = 60, MAX_MESSAGE = 2000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : SITE,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      // ---------- public ----------
      if (url.pathname === '/api/comments' && request.method === 'GET') {
        const post = cleanPath(url.searchParams.get('post'));
        if (!post) return json({ error: 'missing post' }, 400, cors);
        const { results } = await env.DB.prepare(
          `SELECT id, name, message, created_at, reply, reply_at FROM comments
           WHERE post = ? AND status = 'approved' ORDER BY created_at ASC`
        ).bind(post).all();
        return json({ comments: results }, 200, { ...cors, 'Cache-Control': 'no-store' });
      }

      if (url.pathname === '/api/comments' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const post = cleanPath(body.post);
        const name = String(body.name || '').trim().slice(0, MAX_NAME);
        const message = String(body.message || '').trim().slice(0, MAX_MESSAGE);
        const title = String(body.title || '').trim().slice(0, 200);
        if (!post || !name || !message) return json({ error: 'Please add your name and a message.' }, 400, cors);

        const ip = request.headers.get('CF-Connecting-IP') || '';
        const ok = await verifyTurnstile(env, body.token, ip);
        if (!ok) return json({ error: 'Could not confirm you are human. Please try again.' }, 400, cors);

        const ipHash = await sha256(ip + '|annatasha');
        const recent = await env.DB.prepare(
          `SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ? AND created_at > datetime('now', '-10 minutes')`
        ).bind(ipHash).first();
        if (recent && recent.n >= 5) return json({ error: 'Slow down a little and try again soon.' }, 429, cors);

        await env.DB.prepare(
          `INSERT INTO comments (post, post_title, name, message, ip_hash) VALUES (?, ?, ?, ?, ?)`
        ).bind(post, title, name, message, ipHash).run();

        if (env.NTFY_TOPIC) ctx.waitUntil(notify(env, url, { post, title, name, message }));
        return json({ ok: true }, 200, cors);
      }

      // ---------- private approval page ----------
      if (url.pathname === '/admin' || url.pathname === '/admin/') {
        return new Response(ADMIN_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
      }

      if (url.pathname.startsWith('/api/admin/')) {
        if (!(await isAdmin(request, env))) return json({ error: 'wrong password' }, 401, cors);

        if (url.pathname === '/api/admin/comments' && request.method === 'GET') {
          const status = url.searchParams.get('status') === 'approved' ? 'approved' : 'pending';
          const { results } = await env.DB.prepare(
            `SELECT id, post, post_title, name, message, status, reply, created_at FROM comments
             WHERE status = ? ORDER BY created_at DESC LIMIT 200`
          ).bind(status).all();
          return json({ comments: results }, 200, cors);
        }

        const m = url.pathname.match(/^\/api\/admin\/comments\/(\d+)\/(approve|delete|reply)$/);
        if (m && request.method === 'POST') {
          const id = Number(m[1]), action = m[2];
          if (action === 'approve') await env.DB.prepare(`UPDATE comments SET status = 'approved' WHERE id = ?`).bind(id).run();
          if (action === 'delete') await env.DB.prepare(`DELETE FROM comments WHERE id = ?`).bind(id).run();
          if (action === 'reply') {
            const body = await request.json().catch(() => ({}));
            const reply = String(body.reply || '').trim().slice(0, MAX_MESSAGE);
            await env.DB.prepare(
              `UPDATE comments SET reply = ?, reply_at = CASE WHEN ? = '' THEN NULL ELSE datetime('now') END, status = 'approved' WHERE id = ?`
            ).bind(reply || null, reply, id).run();
          }
          return json({ ok: true }, 200, cors);
        }
      }

      return json({ error: 'not found' }, 404, cors);
    } catch (err) {
      return json({ error: 'Something went wrong. Please try again.' }, 500, cors);
    }
  },
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function cleanPath(p) {
  p = String(p || '').trim();
  return /^\/[A-Za-z0-9/_\-.%]{1,300}$/.test(p) ? p : '';
}

async function verifyTurnstile(env, token, ip) {
  if (!token || !env.TURNSTILE_SECRET) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const data = await r.json().catch(() => ({}));
  return data.success === true;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function isAdmin(request, env) {
  const given = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.ADMIN_PASSWORD || !given) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(env.ADMIN_PASSWORD)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function notify(env, url, c) {
  // JSON publishing keeps titles with emoji or curly quotes intact
  await fetch('https://ntfy.sh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: env.NTFY_TOPIC,
      title: `New thought on "${(c.title || c.post).slice(0, 80)}"`,
      message: `${c.name}: ${c.message}`.slice(0, 400),
      click: `${url.origin}/admin`,
      tags: ['crescent_moon'],
    }),
  }).catch(() => {});
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Thoughts · approvals</title>
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,500;1,7..72,400&display=swap" rel="stylesheet">
<style>
:root{--paper:#f8f4ec;--card:#fffdf8;--ink:#2f2a26;--soft:#5b534c;--muted:#8c8279;--line:#e6ddcf;--rose:#b07c78;--moss:#6c8660}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Literata,Georgia,serif;font-size:15px;line-height:1.6}
.wrap{max-width:720px;margin:0 auto;padding:2.5rem 1.25rem 5rem}
h1{font-weight:500;font-size:1.9rem;margin:0 0 .2rem}.sub{color:var(--muted);font-style:italic;margin:0 0 1.6rem}
.tabs{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--line);border-radius:999px;background:var(--card);margin-bottom:1.4rem}
.tabs button{font:inherit;font-size:.85rem;border:0;background:none;color:var(--soft);padding:.35rem .9rem;border-radius:999px;cursor:pointer}
.tabs button.on{background:var(--ink);color:var(--paper)}
.c{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:1rem 1.1rem;margin-bottom:.9rem}
.meta{font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.meta a{color:var(--rose)}
.name{font-weight:500;margin:.35rem 0 .15rem}.msg{white-space:pre-wrap;margin:0 0 .8rem;color:var(--soft)}
.reply{border-left:2px solid var(--rose);padding-left:.7rem;margin:.2rem 0 .8rem;color:var(--soft);font-style:italic;white-space:pre-wrap}
textarea,input{width:100%;font:inherit;font-size:.9rem;padding:.55rem .7rem;border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink)}
textarea{min-height:70px;resize:vertical;margin-bottom:.5rem}
.row{display:flex;flex-wrap:wrap;gap:.4rem}
.btn{font:inherit;font-size:.82rem;border:1px solid var(--line);background:var(--card);color:var(--soft);padding:.35rem .85rem;border-radius:999px;cursor:pointer}
.btn.go{background:var(--moss);border-color:var(--moss);color:#fff}.btn.del{color:#a14b45;border-color:#e2c3bf}
.empty{color:var(--muted);font-style:italic}
.login{max-width:320px}.login .btn{margin-top:.6rem}
.err{color:#a14b45;font-size:.85rem;margin-top:.5rem}
</style></head><body><div class="wrap">
<h1>Thoughts?</h1><p class="sub">approve, reply or delete notes from readers</p>
<div id="login" class="login" hidden>
  <input id="pw" type="password" placeholder="your password" autocomplete="current-password">
  <button class="btn go" id="enter">Open</button><div class="err" id="lerr"></div>
</div>
<div id="app" hidden>
  <div class="tabs"><button data-s="pending" class="on">Waiting</button><button data-s="approved">Published</button></div>
  <div id="list"></div>
</div>
</div>
<script>
const $=s=>document.querySelector(s);let pw=localStorage.getItem('thoughts-pw')||'',status='pending';
const api=(p,o={})=>fetch(p,{...o,headers:{'Content-Type':'application/json','Authorization':'Bearer '+pw}}).then(async r=>{if(r.status===401)throw 401;return r.json()});
function esc(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
async function load(){
  try{const d=await api('/api/admin/comments?status='+status);$('#login').hidden=true;$('#app').hidden=false;render(d.comments)}
  catch(e){localStorage.removeItem('thoughts-pw');$('#app').hidden=true;$('#login').hidden=false;if(pw)$('#lerr').textContent='That password did not work.'}
}
function render(list){
  if(!list.length){$('#list').innerHTML='<p class="empty">'+(status==='pending'?'Nothing waiting. All caught up.':'Nothing published yet.')+'</p>';return}
  $('#list').innerHTML=list.map(c=>'<div class="c" data-id="'+c.id+'">'+
    '<div class="meta">'+esc(c.created_at)+' UTC · <a href="${SITE}'+esc(c.post)+'" target="_blank">'+esc(c.post_title||c.post)+'</a></div>'+
    '<p class="name">'+esc(c.name)+'</p><p class="msg">'+esc(c.message)+'</p>'+
    (c.reply?'<p class="reply">'+esc(c.reply)+'</p>':'')+
    '<textarea placeholder="Reply as Annatasha (optional)">'+esc(c.reply||'')+'</textarea>'+
    '<div class="row">'+(c.status==='pending'?'<button class="btn go" data-a="approve">Approve</button>':'')+
    '<button class="btn" data-a="reply">'+(c.status==='pending'?'Reply and approve':'Save reply')+'</button>'+
    '<button class="btn del" data-a="delete">Delete</button></div></div>').join('');
}
$('#list').addEventListener('click',async e=>{
  const b=e.target.closest('button[data-a]');if(!b)return;const card=b.closest('.c'),id=card.dataset.id,a=b.dataset.a;
  if(a==='delete'&&!confirm('Delete this note for good?'))return;
  b.disabled=true;
  await api('/api/admin/comments/'+id+'/'+a,{method:'POST',body:JSON.stringify({reply:card.querySelector('textarea').value})});
  load();
});
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{status=b.dataset.s;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));load()});
$('#enter').onclick=()=>{pw=$('#pw').value;localStorage.setItem('thoughts-pw',pw);load()};
$('#pw').addEventListener('keydown',e=>{if(e.key==='Enter')$('#enter').click()});
if(pw)load();else $('#login').hidden=false;
</script></body></html>`;
