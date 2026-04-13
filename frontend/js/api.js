/* ── Config ─────────────────────────────────────────────── */
const API = 'https://lost-and-found-production-9b86.up.railway.app/api';

/* ── Auth helpers ───────────────────────────────────────── */
const getToken = ()      => localStorage.getItem('lf_token');
const getUser  = ()      => { try { return JSON.parse(localStorage.getItem('lf_user')); } catch { return null; } };
const saveAuth = (t, u)  => { localStorage.setItem('lf_token', t); localStorage.setItem('lf_user', JSON.stringify(u)); };
const clearAuth= ()      => { localStorage.removeItem('lf_token'); localStorage.removeItem('lf_user'); };
const isLoggedIn = ()    => !!getToken();
const isAdmin    = ()    => getUser()?.role === 'admin';
const rootPath   = ()    => window.location.pathname.includes('/pages/') ? '../' : '';

/* ── Fetch wrapper ──────────────────────────────────────── */
async function apiFetch(endpoint, opts = {}) {
  const token = getToken();
  const headers = {};
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (typeof opts.body === 'object' && opts.body !== null && !(opts.body instanceof FormData)) {
    opts.body = JSON.stringify(opts.body);
  }
  try {
    const res  = await fetch(`${API}${endpoint}`, { ...opts, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  } catch (err) {
    if (err.message.includes('Failed to fetch')) throw new Error('Cannot connect to server. Is the backend running?');
    throw err;
  }
}

/* ── API modules ────────────────────────────────────────── */
const Auth = {
  login:    (email, password) => apiFetch('/auth/login',    { method:'POST', body:{ email, password } }),
  register: (data)            => apiFetch('/auth/register', { method:'POST', body: data }),
  me:       ()                => apiFetch('/auth/me'),
  profile:  (data)            => apiFetch('/auth/profile',  { method:'PUT',  body: data }),
};

const Items = {
  getAll:   (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v && v !== 'all') q.set(k,v); });
    return apiFetch(`/items?${q}`);
  },
  getOne:   (id)          => apiFetch(`/items/${id}`),
  getStats: ()            => apiFetch('/items/stats'),
  getMy:    ()            => apiFetch('/items/my'),
  create:   (formData)    => apiFetch('/items',          { method:'POST',   body: formData }),
  resolve:  (id)          => apiFetch(`/items/${id}/resolve`, { method:'PATCH' }),
  delete:   (id)          => apiFetch(`/items/${id}`,    { method:'DELETE' }),
};

const Messages = {
  send:   (itemId, message) => apiFetch('/messages',      { method:'POST', body:{ itemId, message } }),
  inbox:  ()                => apiFetch('/messages/inbox'),
  read:   (id)              => apiFetch(`/messages/${id}/read`, { method:'PATCH' }),
};

const Admin = {
  stats:       ()   => apiFetch('/admin/stats'),
  users:       ()   => apiFetch('/admin/users'),
  items:       (p)  => { const q = new URLSearchParams(p||{}); return apiFetch(`/admin/items?${q}`); },
  deleteUser:  (id) => apiFetch(`/admin/users/${id}`, { method:'DELETE' }),
};

/* ── Toast ──────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  let el = document.getElementById('__toast');
  if (!el) { el = document.createElement('div'); el.id='__toast'; el.className='toast'; document.body.appendChild(el); }
  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  el.innerHTML = `<span>${icons[type]||'✅'}</span><span>${msg}</span>`;
  el.className = `toast toast-${type}`;
  setTimeout(() => el.classList.add('show'), 10);
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3800);
}

/* ── Modal ──────────────────────────────────────────────── */
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-backdrop')) e.target.classList.remove('open'); });

/* ── Navbar ─────────────────────────────────────────────── */
function renderNavbar(active = '') {
  const user  = getUser();
  const root  = rootPath();
  const pages = [
    { id:'home',    label:'Home',     href: root + 'index.html' },
    { id:'search',  label:'Browse',   href: root + 'pages/search.html' },
    { id:'post',    label:'Post Item', href: root + 'pages/post.html' },
    { id:'contact', label:'Contact',  href: root + 'pages/contact.html' },
  ];
  if (isAdmin()) pages.push({ id:'admin', label:'Admin', href: root + 'pages/admin.html' });

  const linksEl = document.getElementById('nav-links');
  const authEl  = document.getElementById('nav-auth');

  if (linksEl) linksEl.innerHTML = pages.map(p =>
    `<li><a href="${p.href}" class="${p.id===active?'active':''}">${p.label}</a></li>`
  ).join('');

  if (authEl) {
    if (user) {
      authEl.innerHTML = `
        <div class="flex-center">
          <div class="avatar avatar-teal" style="width:34px;height:34px;font-size:12px;">${user.avatar||user.name.slice(0,2).toUpperCase()}</div>
          <span style="color:rgba(255,255,255,.7);font-size:13px;font-weight:600;">${user.name.split(' ')[0]}</span>
          <button onclick="handleLogout()" style="color:rgba(255,255,255,.4);background:none;border:none;font-size:12px;font-family:var(--font);cursor:pointer;padding:4px 8px;border-radius:6px;" onmouseenter="this.style.color='#fff'" onmouseleave="this.style.color='rgba(255,255,255,.4)'">Logout</button>
        </div>`;
    } else {
      authEl.innerHTML = `<a href="${root}pages/login.html" class="btn btn-primary btn-sm">Sign In</a>`;
    }
  }
}

function handleLogout() {
  clearAuth();
  toast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = rootPath() + 'index.html', 800);
}

/* ── Guard: require login ────────────────────────────────── */
function requireLogin(redirectBack) {
  if (!isLoggedIn()) {
    if (redirectBack) sessionStorage.setItem('lf_redirect', redirectBack);
    window.location.href = rootPath() + 'pages/login.html';
    return false;
  }
  return true;
}

/* ── Item Card HTML ─────────────────────────────────────── */
function itemCard(item, opts = {}) {
  const { canDelete = false, canResolve = false, showContact = true } = opts;
  const name   = item.postedBy?.name  || 'Unknown';
  const ava    = item.postedBy?.avatar || name.slice(0,2).toUpperCase();
  const avaBg  = item.type==='lost' ? 'avatar-red' : 'avatar-teal';
  const imgBlock = item.imageUrl
    ? `<div class="item-card-img"><img src="${item.imageUrl}" alt="${item.title}" loading="lazy"/></div>`
    : `<div class="item-card-img" style="font-size:40px;">${item.type==='lost'?'🔍':'📦'}</div>`;
  const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '';
  return `
  <article class="card item-card fade-up">
    ${imgBlock}
    <div class="item-card-body">
      <div class="flex-center" style="gap:6px;flex-wrap:wrap;">
        <span class="badge badge-${item.type}">${item.type==='lost'?'🔍':'📦'} ${item.type}</span>
        <span class="badge badge-${item.status}">${item.status}</span>
        <span style="font-size:11px;color:var(--muted);margin-left:auto;">${item.category}</span>
      </div>
      <div class="item-card-title">${item.title}</div>
      <div class="item-card-meta">📍 ${item.location} &nbsp;·&nbsp; 📅 ${dateStr}</div>
      <div class="item-card-desc">${item.description}</div>
    </div>
    <div class="item-card-footer">
      <div class="flex-center">
        <div class="avatar ${avaBg}" style="width:28px;height:28px;font-size:10px;">${ava}</div>
        <span style="font-size:12px;color:var(--muted);">${name}</span>
      </div>
      <div class="flex-center" style="gap:6px;">
        ${canResolve && item.status!=='resolved' ? `<button class="btn btn-sm" style="background:var(--teal-bg);color:var(--teal2);border:none;" onclick="doResolve('${item._id}')">✓ Resolve</button>` : ''}
        ${canDelete ? `<button class="btn btn-sm" style="background:var(--red-bg);color:var(--red);border:none;" onclick="doDelete('${item._id}')">Delete</button>` : ''}
        ${showContact ? `<button class="btn btn-primary btn-sm" onclick="openContactModal('${item._id}','${name}','${ava}')">Message</button>` : ''}
      </div>
    </div>
  </article>`;
}

/* ── Contact modal (shared) ─────────────────────────────── */
let _cItemId = null;
function openContactModal(itemId, name, ava) {
  if (!requireLogin()) return;
  _cItemId = itemId;
  const b = document.getElementById('contact-body');
  if (!b) return;
  b.innerHTML = `
    <h2 style="font-family:var(--font-serif);font-size:22px;margin-bottom:6px;">Send a Message</h2>
    <p style="color:var(--muted);font-size:13px;margin-bottom:20px;">Your message will be sent to the item owner</p>
    <div class="flex-center" style="background:var(--paper);padding:12px 16px;border-radius:var(--r);margin-bottom:20px;">
      <div class="avatar avatar-teal" style="width:38px;height:38px;font-size:14px;">${ava}</div>
      <div>
        <div style="font-weight:700;font-size:14px;">${name}</div>
        <div style="font-size:12px;color:var(--muted);">Item owner</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Your Message <span class="req">*</span></label>
      <textarea id="c-msg" class="form-control" rows="4" placeholder="Hi, I think I found your item / I lost something similar..."></textarea>
      <div class="form-hint">Be specific – mention where you are and how they can reach you</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button class="btn btn-ghost" style="flex:1;" onclick="closeModal('contact-modal')">Cancel</button>
      <button class="btn btn-dark"  style="flex:2;" onclick="doSendMessage()">Send Message →</button>
    </div>`;
  openModal('contact-modal');
}

async function doSendMessage() {
  const msg = document.getElementById('c-msg')?.value.trim();
  if (!msg) { toast('Please write a message first', 'error'); return; }
  const btn = document.querySelector('#contact-body .btn-dark');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
  try {
    await Messages.send(_cItemId, msg);
    document.getElementById('contact-body').innerHTML = `
      <div style="text-align:center;padding:28px 0;">
        <div style="font-size:52px;margin-bottom:14px;">✅</div>
        <h3 style="font-family:var(--font-serif);font-size:24px;margin-bottom:8px;">Message Sent!</h3>
        <p style="color:var(--muted);font-size:14px;line-height:1.6;">The owner has been notified and will contact you soon.</p>
        <button class="btn btn-primary" style="margin-top:24px;" onclick="closeModal('contact-modal')">Done</button>
      </div>`;
  } catch (err) {
    toast(err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Send Message →'; }
  }
}

/* ── Delete / Resolve (used by admin & my posts) ────────── */
async function doDelete(id) {
  if (!confirm('Permanently delete this post?')) return;
  try { await Items.delete(id); toast('Post deleted'); setTimeout(() => location.reload(), 900); }
  catch (err) { toast(err.message, 'error'); }
}
async function doResolve(id) {
  try { await Items.resolve(id); toast('Marked as resolved ✅'); setTimeout(() => location.reload(), 900); }
  catch (err) { toast(err.message, 'error'); }
}

/* ── Skeleton loader ────────────────────────────────────── */
function skeletonCards(n = 6) {
  return Array(n).fill('').map(() => `
    <div class="card" style="overflow:hidden;">
      <div class="skeleton" style="height:160px;border-radius:0;"></div>
      <div style="padding:18px 20px;display:flex;flex-direction:column;gap:10px;">
        <div class="skeleton" style="height:16px;width:60%;"></div>
        <div class="skeleton" style="height:20px;width:85%;"></div>
        <div class="skeleton" style="height:14px;width:45%;"></div>
        <div class="skeleton" style="height:40px;"></div>
      </div>
    </div>`).join('');
}

/* ── Input validation helper ────────────────────────────── */
function fieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('error');
  let hint = el.parentNode.querySelector('.form-error');
  if (!hint) { hint = document.createElement('div'); hint.className = 'form-error'; el.parentNode.appendChild(hint); }
  hint.textContent = msg;
}
function clearErrors() {
  document.querySelectorAll('.form-control.error').forEach(e => e.classList.remove('error'));
  document.querySelectorAll('.form-error').forEach(e => e.remove());
}
