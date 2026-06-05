/* ──────────────────────────────────────────────
   Pranav Sai Real Estate — Admin Panel JS
   Data stored in localStorage (no backend needed)
   Change ADMIN_PASSWORD below after first login
   ────────────────────────────────────────────── */

'use strict';

/* ─── CONFIG ─── */
const ADMIN_PASSWORD = 'Admin@2025'; /* ← CHANGE THIS */
const STORAGE_KEYS = {
  visits:    'ps_visit_logs',
  enquiries: 'ps_enquiries',
  phone:     'ps_phone_clicks',
  wa:        'ps_wa_clicks',
};

/* ─── HELPERS ─── */
function getData(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function setData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    + ' ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

function countToday(arr) {
  const t = today();
  return arr.filter(i => (i.date || i.timestamp || '').startsWith(t)).length;
}

function countThisWeek(arr) {
  const d = new Date(); d.setDate(d.getDate() - 6);
  return arr.filter(i => new Date(i.date || i.timestamp) >= d).length;
}

function countThisMonth(arr) {
  const now = new Date();
  return arr.filter(i => {
    const d = new Date(i.date || i.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

/* ─── LOGIN ─── */
const loginScreen = document.getElementById('login-screen');
const adminApp    = document.getElementById('admin-app');
const loginForm   = document.getElementById('login-form');
const loginError  = document.getElementById('login-error');
const loginPass   = document.getElementById('login-pass');
const togglePass  = document.getElementById('toggle-pass');
const logoutBtn   = document.getElementById('logout-btn');

function isLoggedIn() { return sessionStorage.getItem('ps_admin_auth') === '1'; }

function showAdmin() {
  loginScreen.classList.add('hidden');
  adminApp.classList.remove('hidden');
  loadDashboard();
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  adminApp.classList.add('hidden');
  loginPass.value = '';
  loginError.classList.remove('visible');
}

/* Check session */
if (isLoggedIn()) {
  showAdmin();
} else {
  adminApp.classList.add('hidden');
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  if (loginPass.value === ADMIN_PASSWORD) {
    sessionStorage.setItem('ps_admin_auth', '1');
    loginError.classList.remove('visible');
    showAdmin();
  } else {
    loginError.classList.add('visible');
    loginPass.value = '';
    loginPass.focus();
  }
});

togglePass.addEventListener('click', () => {
  const isText = loginPass.type === 'text';
  loginPass.type = isText ? 'password' : 'text';
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('ps_admin_auth');
  showLogin();
});

/* ─── NAV / VIEW SWITCHING ─── */
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-view]');
const views        = document.querySelectorAll('.view');

function switchView(viewId) {
  views.forEach(v => v.classList.remove('active'));
  sidebarLinks.forEach(l => l.classList.remove('active'));
  const target = document.getElementById('view-' + viewId);
  if (target) target.classList.add('active');
  const link = document.querySelector(`.sidebar-link[data-view="${viewId}"]`);
  if (link) link.classList.add('active');
  document.getElementById('topbar-title').textContent =
    viewId === 'dashboard' ? 'Dashboard' :
    viewId === 'enquiries' ? 'Enquiries' : 'Visitor Analytics';
  if (viewId === 'enquiries') renderEnquiriesTable();
  if (viewId === 'visitors')  renderVisitorsView();
  
  // Close mobile sidebar on view switch
  if (typeof closeSidebarMobile === 'function') {
    closeSidebarMobile();
  }
}

sidebarLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

/* View All button on dashboard */
document.getElementById('view-all-btn').addEventListener('click', () => switchView('enquiries'));

/* ─── SIDEBAR & MOBILE NAVIGATION ─── */
const sidebar        = document.getElementById('sidebar');
const adminMain      = document.getElementById('admin-main');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    const isOpen = sidebar.classList.toggle('open');
    sidebar.classList.remove('collapsed'); // Ensure desktop class doesn't interfere
    if (isOpen) {
      sidebarOverlay.classList.add('active');
    } else {
      sidebarOverlay.classList.remove('active');
    }
  } else {
    sidebar.classList.toggle('collapsed');
    adminMain.classList.toggle('full');
    sidebar.classList.remove('open'); // Ensure mobile class doesn't interfere
    sidebarOverlay.classList.remove('active');
  }
}

function closeSidebarMobile() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

// Toggle button click handler
sidebarToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleSidebar();
});

// Click overlay to close
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    closeSidebarMobile();
  });
}

// Click outside sidebar to close (fallback)
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
    closeSidebarMobile();
  }
});

// Close sidebar on link click (mobile)
const sidebarLinksList = sidebar.querySelectorAll('.sidebar-link');
sidebarLinksList.forEach(link => {
  link.addEventListener('click', () => {
    closeSidebarMobile();
  });
});

// Window resize listener
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  } else {
    sidebar.classList.remove('collapsed');
    adminMain.classList.remove('full');
  }
});

/* ─── DATE IN TOPBAR ─── */
document.getElementById('topbar-date').textContent =
  new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'long', year:'numeric' });

/* ─── DASHBOARD ─── */
function loadDashboard() {
  const visits    = getData(STORAGE_KEYS.visits);
  const enquiries = getData(STORAGE_KEYS.enquiries);
  const phones    = getData(STORAGE_KEYS.phone);
  const wa        = getData(STORAGE_KEYS.wa);

  /* Stat cards */
  document.getElementById('s-total-visitors').textContent  = visits.length;
  document.getElementById('s-visitors-today').textContent  = `+${countToday(visits)} today`;
  document.getElementById('s-total-enquiries').textContent = enquiries.length;
  document.getElementById('s-enquiries-today').textContent = `+${countToday(enquiries)} today`;
  document.getElementById('s-phone-clicks').textContent    = phones.length;
  document.getElementById('s-phone-today').textContent     = `+${countToday(phones)} today`;
  document.getElementById('s-wa-clicks').textContent       = wa.length;
  document.getElementById('s-wa-today').textContent        = `+${countToday(wa)} today`;

  /* Unread badge */
  const unread = enquiries.filter(e => e.status === 'new').length;
  const badge  = document.getElementById('unread-badge');
  badge.textContent = unread;
  badge.style.display = unread > 0 ? '' : 'none';

  /* Bar chart: last 7 days */
  const chart = document.getElementById('visitor-chart');
  chart.innerHTML = '';
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const maxCount = Math.max(1, ...days.map(day => visits.filter(v => v.date.startsWith(day)).length));
  days.forEach(day => {
    const count = visits.filter(v => v.date.startsWith(day)).length;
    const pct   = Math.round((count / maxCount) * 100);
    const label = new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
    const item  = document.createElement('div');
    item.className = 'bar-item';
    item.innerHTML = `
      <span class="bar-value">${count}</span>
      <div class="bar-fill" style="height:${Math.max(4, pct)}px"></div>
      <span class="bar-label">${label}</span>
    `;
    chart.appendChild(item);
  });

  /* Recent enquiries (latest 5) */
  const tbody = document.getElementById('recent-enquiries-body');
  const recent = [...enquiries].reverse().slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No enquiries yet.</td></tr>';
  } else {
    tbody.innerHTML = recent.map((e, i) => `
      <tr>
        <td>${fmtDate(e.timestamp)}</td>
        <td><strong>${esc(e.name || '—')}</strong></td>
        <td><a href="tel:${e.phone}">${esc(e.phone || '—')}</a></td>
        <td>${esc(e.type || '—')}</td>
        <td>${esc(e.budget || '—')}</td>
        <td><span class="status-badge ${e.status || 'new'}">${e.status === 'read' ? 'Read' : 'New'}</span></td>
        <td><button class="table-action-btn" onclick="openModal(${enquiries.length - 1 - i})">View</button></td>
      </tr>
    `).join('');
  }
}

/* ─── ENQUIRIES TABLE ─── */
function renderEnquiriesTable(filter = 'all', search = '') {
  const tbody = document.getElementById('all-enquiries-body');
  let enquiries = [...getData(STORAGE_KEYS.enquiries)].reverse();
  if (filter !== 'all') enquiries = enquiries.filter(e => (e.status || 'new') === filter);
  if (search) {
    const q = search.toLowerCase();
    enquiries = enquiries.filter(e =>
      (e.name || '').toLowerCase().includes(q) ||
      (e.phone || '').includes(q) ||
      (e.message || '').toLowerCase().includes(q)
    );
  }
  if (enquiries.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="9">No enquiries found.</td></tr>';
    return;
  }
  const all = getData(STORAGE_KEYS.enquiries);
  tbody.innerHTML = enquiries.map(e => {
    const idx = all.findIndex(x => x.timestamp === e.timestamp && x.name === e.name);
    return `
    <tr>
      <td>${all.length - idx}</td>
      <td style="white-space:nowrap">${fmtDate(e.timestamp)}</td>
      <td><strong>${esc(e.name || '—')}</strong></td>
      <td><a href="tel:${e.phone}" style="color:var(--gold)">${esc(e.phone || '—')}</a></td>
      <td>${esc(e.type || '—')}</td>
      <td>${esc(e.budget || '—')}</td>
      <td><div class="msg-truncate" title="${esc(e.message || '')}">${esc(e.message || '—')}</div></td>
      <td><span class="status-badge ${e.status || 'new'}">${e.status === 'read' ? 'Read' : 'New'}</span></td>
      <td><button class="table-action-btn" onclick="openModal(${idx})">View</button></td>
    </tr>
  `}).join('');
}

document.getElementById('enquiry-search').addEventListener('input', function() {
  renderEnquiriesTable(document.getElementById('enquiry-filter').value, this.value);
});
document.getElementById('enquiry-filter').addEventListener('change', function() {
  renderEnquiriesTable(this.value, document.getElementById('enquiry-search').value);
});
document.getElementById('clear-enquiries-btn').addEventListener('click', () => {
  if (confirm('Delete ALL enquiries? This cannot be undone.')) {
    localStorage.removeItem(STORAGE_KEYS.enquiries);
    renderEnquiriesTable();
    loadDashboard();
  }
});

/* ─── VISITORS VIEW ─── */
function renderVisitorsView() {
  const visits = getData(STORAGE_KEYS.visits);
  document.getElementById('v-total').textContent = visits.length;
  document.getElementById('v-today').textContent = countToday(visits);
  document.getElementById('v-week').textContent  = countThisWeek(visits);
  document.getElementById('v-month').textContent = countThisMonth(visits);

  /* Last 14 days table */
  const tbody = document.getElementById('visitor-log-body');
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const maxV = Math.max(1, ...days.map(day => visits.filter(v => v.date.startsWith(day)).length));
  tbody.innerHTML = days.reverse().map(day => {
    const count = visits.filter(v => v.date.startsWith(day)).length;
    const pct   = Math.round((count / maxV) * 100);
    const label = new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
    return `<tr>
      <td>${label}</td>
      <td><strong>${count}</strong></td>
      <td><span class="log-bar" style="width:${Math.max(4, pct)}%"></span></td>
    </tr>`;
  }).join('');
  if (visits.length === 0) tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No visit data yet.</td></tr>';
}

document.getElementById('clear-visitors-btn').addEventListener('click', () => {
  if (confirm('Clear all visitor logs?')) {
    localStorage.removeItem(STORAGE_KEYS.visits);
    renderVisitorsView();
    loadDashboard();
  }
});

/* ─── RESET ALL DATA ─── */
document.getElementById('clear-all-btn').addEventListener('click', () => {
  if (confirm('Reset ALL data (visitors, enquiries, phone & WhatsApp clicks)? This cannot be undone.')) {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    loadDashboard();
    renderEnquiriesTable();
    renderVisitorsView();
  }
});

/* ─── ENQUIRY DETAIL MODAL ─── */
const modal = document.getElementById('enquiry-modal');

window.openModal = function(idx) {
  const enquiries = getData(STORAGE_KEYS.enquiries);
  const e = enquiries[idx];
  if (!e) return;

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-field"><span class="modal-field-label">Date & Time</span><span class="modal-field-value">${fmtDate(e.timestamp)}</span></div>
    <div class="modal-field"><span class="modal-field-label">Status</span><span class="modal-field-value"><span class="status-badge ${e.status||'new'}">${e.status === 'read' ? 'Read' : 'New'}</span></span></div>
    <div class="modal-field"><span class="modal-field-label">Full Name</span><span class="modal-field-value">${esc(e.name||'—')}</span></div>
    <div class="modal-field"><span class="modal-field-label">Phone Number</span><span class="modal-field-value"><a href="tel:${e.phone}" style="color:var(--gold)">${esc(e.phone||'—')}</a></span></div>
    <div class="modal-field"><span class="modal-field-label">Property Interest</span><span class="modal-field-value">${esc(e.type||'—')}</span></div>
    <div class="modal-field"><span class="modal-field-label">Budget</span><span class="modal-field-value">${esc(e.budget||'—')}</span></div>
    <div class="modal-field full"><span class="modal-field-label">Message</span><span class="modal-field-value">${esc(e.message||'—')}</span></div>
  `;

  document.getElementById('modal-call').href = `tel:${e.phone}`;
  document.getElementById('modal-wa').href   = `https://wa.me/91${e.phone}?text=Hi%20${encodeURIComponent(e.name)}%2C%20thank%20you%20for%20your%20enquiry%20about%20${encodeURIComponent(e.type||'property')}%20at%20Pranav%20Sai%20Real%20Estate.`;

  const markReadBtn = document.getElementById('modal-mark-read');
  markReadBtn.style.display = e.status === 'read' ? 'none' : '';
  markReadBtn.onclick = () => {
    enquiries[idx].status = 'read';
    setData(STORAGE_KEYS.enquiries, enquiries);
    loadDashboard();
    renderEnquiriesTable();
    modal.classList.remove('open');
  };

  /* Mark as read automatically when viewed */
  if (e.status !== 'read') {
    enquiries[idx].status = 'read';
    setData(STORAGE_KEYS.enquiries, enquiries);
    loadDashboard();
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
};

document.getElementById('modal-close').addEventListener('click', () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
});
modal.addEventListener('click', e => {
  if (e.target === modal) modal.classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) modal.classList.remove('open');
});

/* ─── ESCAPE HELPER ─── */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
