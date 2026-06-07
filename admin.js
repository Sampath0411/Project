/* ──────────────────────────────────────────────
   Pranav Sai Real Estate — Admin Panel JS
   Simplified: Visitor Analytics Only
   Data stored in localStorage (no backend needed)
   Change ADMIN_PASSWORD below after first login
   ────────────────────────────────────────────── */

'use strict';

/* ─── CONFIG ─── */
const ADMIN_PASSWORD = 'Admin@2025'; /* ← CHANGE THIS */
const STORAGE_KEYS = {
  visits: 'ps_visit_logs',
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
  return new Date().toISOString().slice(0, 10);
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

/* ─── SIDEBAR & MOBILE NAVIGATION ─── */
const sidebar        = document.getElementById('sidebar');
const adminMain      = document.getElementById('admin-main');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    const isOpen = sidebar.classList.toggle('open');
    sidebar.classList.remove('collapsed');
    sidebarOverlay.classList.toggle('active', isOpen);
  } else {
    sidebar.classList.toggle('collapsed');
    adminMain.classList.toggle('full');
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  }
}

function closeSidebarMobile() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
}

sidebarToggle.addEventListener('click', e => { e.stopPropagation(); toggleSidebar(); });
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebarMobile);

document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) closeSidebarMobile();
});

sidebar.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', closeSidebarMobile);
});

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
  const visits = getData(STORAGE_KEYS.visits);

  document.getElementById('v-total').textContent = visits.length;
  document.getElementById('v-today').textContent = countToday(visits);
  document.getElementById('v-week').textContent  = countThisWeek(visits);
  document.getElementById('v-month').textContent = countThisMonth(visits);

  renderVisitorsView();
}

/* ─── VISITORS VIEW ─── */
function renderVisitorsView() {
  const visits = getData(STORAGE_KEYS.visits);
  const tbody = document.getElementById('visitor-log-body');
  tbody.innerHTML = '';

  /* Group by date (last 14 days) */
  const days = {};
  const today_str = today();
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const day_key = d.toISOString().slice(0, 10);
    days[day_key] = 0;
  }

  visits.forEach(v => {
    const date_key = (v.date || v.timestamp || '').slice(0, 10);
    if (date_key in days) {
      days[date_key]++;
    }
  });

  const maxCount = Math.max(1, ...Object.values(days));
  
  Object.keys(days).sort().reverse().forEach(day => {
    const count = days[day];
    const d = new Date(day + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    const pct = Math.round((count / maxCount) * 100);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${dateStr}</td>
      <td>${count}</td>
      <td>
        <div class="bar-cell">
          <div class="bar-fill" style="width: ${pct}%"></div>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (Object.values(days).every(v => v === 0)) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="3">No visit data yet.</td></tr>';
  }
}

/* ─── CLEAR DATA ─── */
document.getElementById('clear-all-btn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all visitor data? This cannot be undone.')) {
    setData(STORAGE_KEYS.visits, []);
    loadDashboard();
    alert('All data has been cleared.');
  }
});

document.getElementById('clear-visitors-btn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all visitor data? This cannot be undone.')) {
    setData(STORAGE_KEYS.visits, []);
    loadDashboard();
    alert('Visitor log has been cleared.');
  }
});

/* ─── INITIAL LOAD ─── */
if (isLoggedIn()) {
  loadDashboard();
}
