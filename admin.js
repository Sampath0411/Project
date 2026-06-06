/* ──────────────────────────────────────────────
   Pranav Sai Real Estate — Admin Panel JS v2.0
   Data stored in localStorage (no backend needed)
   Change ADMIN_PASSWORD below after first login
   ────────────────────────────────────────────── */

'use strict';

/* ─── CONFIG ─── */
const ADMIN_PASSWORD = 'Admin@2025'; /* ← CHANGE THIS */
const STORAGE_KEYS = {
  visits:     'ps_visit_logs',
  enquiries:  'ps_enquiries',
  phone:      'ps_phone_clicks',
  wa:         'ps_wa_clicks',
  properties: 'ps_properties',
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

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const titleMap = {
    dashboard:  'Dashboard',
    enquiries:  'Enquiries',
    properties: 'Manage Properties',
    visitors:   'Visitor Analytics',
  };
  document.getElementById('topbar-title').textContent = titleMap[viewId] || viewId;
  if (viewId === 'enquiries')  renderEnquiriesTable();
  if (viewId === 'visitors')   renderVisitorsView();
  if (viewId === 'properties') renderPropertiesGrid();
  closeSidebarMobile();
}

sidebarLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

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
  const visits    = getData(STORAGE_KEYS.visits);
  const enquiries = getData(STORAGE_KEYS.enquiries);
  const phones    = getData(STORAGE_KEYS.phone);
  const wa        = getData(STORAGE_KEYS.wa);
  const props     = getData(STORAGE_KEYS.properties);

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

  /* Properties badge */
  const propBadge = document.getElementById('prop-count-badge');
  if (propBadge) {
    propBadge.textContent = props.length;
    propBadge.style.display = props.length > 0 ? '' : 'none';
  }

  /* Bar chart: last 7 days */
  const chart = document.getElementById('visitor-chart');
  chart.innerHTML = '';
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const maxCount = Math.max(1, ...days.map(day =>
    visits.filter(v => (v.date || v.timestamp || '').startsWith(day)).length
  ));
  days.forEach(day => {
    const count = visits.filter(v => (v.date || v.timestamp || '').startsWith(day)).length;
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
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No enquiries yet. They appear here once someone fills the contact form.</td></tr>';
  } else {
    tbody.innerHTML = recent.map((e, i) => `
      <tr>
        <td data-label="Date">${fmtDate(e.timestamp)}</td>
        <td data-label="Name"><strong>${esc(e.name || '—')}</strong></td>
        <td data-label="Phone"><a href="tel:${e.phone}">${esc(e.phone || '—')}</a></td>
        <td data-label="Property">${esc(e.type || '—')}</td>
        <td data-label="Budget">${esc(e.budget || '—')}</td>
        <td data-label="Status"><span class="status-badge ${e.status || 'new'}">${e.status === 'read' ? 'Read' : 'New'}</span></td>
        <td data-label="Action"><button class="table-action-btn" onclick="openModal(${enquiries.length - 1 - i})">View</button></td>
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
      <td data-label="#">${all.length - idx}</td>
      <td data-label="Date" style="white-space:nowrap">${fmtDate(e.timestamp)}</td>
      <td data-label="Name"><strong>${esc(e.name || '—')}</strong></td>
      <td data-label="Phone"><a href="tel:${e.phone}" style="color:var(--gold)">${esc(e.phone || '—')}</a></td>
      <td data-label="Property">${esc(e.type || '—')}</td>
      <td data-label="Budget">${esc(e.budget || '—')}</td>
      <td data-label="Message"><div class="msg-truncate" title="${esc(e.message || '')}">${esc(e.message || '—')}</div></td>
      <td data-label="Status"><span class="status-badge ${e.status || 'new'}">${e.status === 'read' ? 'Read' : 'New'}</span></td>
      <td data-label="Action"><button class="table-action-btn" onclick="openModal(${idx})">View</button></td>
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

  const tbody = document.getElementById('visitor-log-body');
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const maxV = Math.max(1, ...days.map(day =>
    visits.filter(v => (v.date || v.timestamp || '').startsWith(day)).length
  ));
  tbody.innerHTML = days.reverse().map(day => {
    const count = visits.filter(v => (v.date || v.timestamp || '').startsWith(day)).length;
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
    <div class="modal-field"><span class="modal-field-label">Date &amp; Time</span><span class="modal-field-value">${fmtDate(e.timestamp)}</span></div>
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

  /* Auto-mark as read when opened */
  if (e.status !== 'read') {
    enquiries[idx].status = 'read';
    setData(STORAGE_KEYS.enquiries, enquiries);
    loadDashboard();
  }
  markReadBtn.style.display = 'none'; /* Already auto-marked */

  markReadBtn.onclick = () => {
    enquiries[idx].status = 'read';
    setData(STORAGE_KEYS.enquiries, enquiries);
    loadDashboard();
    renderEnquiriesTable();
    modal.classList.remove('open');
  };

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
};

function closeEnquiryModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  renderEnquiriesTable(); /* Refresh so read status updates instantly */
}

document.getElementById('modal-close').addEventListener('click', closeEnquiryModal);
modal.addEventListener('click', e => { if (e.target === modal) closeEnquiryModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeEnquiryModal();
});

/* ══════════════════════════════════════════════
   ─── PROPERTY MANAGEMENT ───
   ══════════════════════════════════════════════ */

const propModal       = document.getElementById('property-modal');
const propForm        = document.getElementById('prop-form');
const propModalTitle  = document.getElementById('prop-modal-title');
const propPhotoInput  = document.getElementById('prop-photo-input');
const propPhotoPreview = document.getElementById('prop-photo-preview');
const uploadLabelText = document.getElementById('upload-label-text');
let currentPropFilter = 'all';

/* Photo upload: convert to base64 for localStorage */
if (propPhotoInput) {
  propPhotoInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2MB. Please compress the image and try again.');
      this.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(ev) {
      propPhotoPreview.src = ev.target.result;
      propPhotoPreview.style.display = 'block';
      uploadLabelText.textContent = 'Click to change photo';
    };
    reader.readAsDataURL(file);
  });
}

/* Open Add modal */
function openAddPropertyModal() {
  if (!propForm) return;
  propForm.reset();
  document.getElementById('prop-edit-id').value = '';
  if (propModalTitle) propModalTitle.textContent = 'Add New Property';
  if (propPhotoPreview) { propPhotoPreview.style.display = 'none'; propPhotoPreview.src = ''; }
  if (uploadLabelText) uploadLabelText.textContent = 'Click to upload property photo';
  propModal.classList.add('open');
  propModal.setAttribute('aria-hidden', 'false');
}

/* Open Edit modal */
window.openEditProperty = function(id) {
  const props = getData(STORAGE_KEYS.properties);
  const prop = props.find(p => p.id === id);
  if (!prop || !propForm) return;

  if (propModalTitle) propModalTitle.textContent = 'Edit Property';
  document.getElementById('prop-edit-id').value    = id;
  document.getElementById('prop-title').value      = prop.title || '';
  document.getElementById('prop-type').value       = prop.type || '';
  document.getElementById('prop-status-sel').value = prop.status || 'available';
  document.getElementById('prop-location').value   = prop.location || '';
  document.getElementById('prop-price').value      = prop.price || '';
  document.getElementById('prop-area').value       = prop.area || '';
  document.getElementById('prop-beds').value       = prop.beds || '';
  document.getElementById('prop-contact').value    = prop.contact || '';
  document.getElementById('prop-desc').value       = prop.desc || '';
  document.getElementById('prop-badge-text').value = prop.badgeText || '';

  if (prop.photo && propPhotoPreview) {
    propPhotoPreview.src = prop.photo;
    propPhotoPreview.style.display = 'block';
    if (uploadLabelText) uploadLabelText.textContent = 'Click to change photo';
  } else if (propPhotoPreview) {
    propPhotoPreview.style.display = 'none';
    if (uploadLabelText) uploadLabelText.textContent = 'Click to upload property photo';
  }

  propModal.classList.add('open');
  propModal.setAttribute('aria-hidden', 'false');
};

/* Delete property */
window.deleteProperty = function(id) {
  if (!confirm('Delete this property listing? This cannot be undone.')) return;
  let props = getData(STORAGE_KEYS.properties);
  props = props.filter(p => p.id !== id);
  setData(STORAGE_KEYS.properties, props);
  renderPropertiesGrid();
  loadDashboard();
};

/* Toggle Sold Out / Available */
window.toggleSoldOut = function(id) {
  const props = getData(STORAGE_KEYS.properties);
  const prop = props.find(p => p.id === id);
  if (!prop) return;
  prop.status = prop.status === 'sold' ? 'available' : 'sold';
  setData(STORAGE_KEYS.properties, props);
  renderPropertiesGrid();
  loadDashboard();
};

/* Save property form */
if (propForm) {
  propForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const title    = document.getElementById('prop-title').value.trim();
    const type     = document.getElementById('prop-type').value;
    const location = document.getElementById('prop-location').value.trim();

    if (!title)    { document.getElementById('prop-title').focus(); return; }
    if (!type)     { alert('Please select a property type.'); document.getElementById('prop-type').focus(); return; }
    if (!location) { document.getElementById('prop-location').focus(); return; }

    const editId = document.getElementById('prop-edit-id').value;
    let props = getData(STORAGE_KEYS.properties);

    /* Only save photo if it's a base64 data URL (not an external URL) */
    let photoSrc = '';
    if (propPhotoPreview && propPhotoPreview.style.display !== 'none' && propPhotoPreview.src) {
      photoSrc = propPhotoPreview.src;
    }

    const propData = {
      id:        editId || ('prop_' + Date.now()),
      title,
      type,
      status:    document.getElementById('prop-status-sel').value || 'available',
      location,
      price:     document.getElementById('prop-price').value.trim(),
      area:      document.getElementById('prop-area').value.trim(),
      beds:      document.getElementById('prop-beds').value.trim(),
      contact:   document.getElementById('prop-contact').value.trim() || '9705534038',
      desc:      document.getElementById('prop-desc').value.trim(),
      badgeText: document.getElementById('prop-badge-text').value.trim(),
      photo:     photoSrc,
      createdAt: editId
        ? (props.find(p => p.id === editId) || {}).createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    if (editId) {
      const idx = props.findIndex(p => p.id === editId);
      if (idx > -1) props[idx] = propData; else props.push(propData);
    } else {
      props.push(propData);
    }

    setData(STORAGE_KEYS.properties, props);
    closePropModal();
    renderPropertiesGrid();
    loadDashboard();
  });
}

/* Close property modal */
function closePropModal() {
  if (!propModal) return;
  propModal.classList.remove('open');
  propModal.setAttribute('aria-hidden', 'true');
}

const propModalClose = document.getElementById('prop-modal-close');
const propCancelBtn  = document.getElementById('prop-cancel-btn');
if (propModalClose) propModalClose.addEventListener('click', closePropModal);
if (propCancelBtn)  propCancelBtn.addEventListener('click', closePropModal);
if (propModal) propModal.addEventListener('click', e => { if (e.target === propModal) closePropModal(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && propModal && propModal.classList.contains('open')) closePropModal();
});

/* Add Property button */
const addPropBtn = document.getElementById('add-property-btn');
if (addPropBtn) addPropBtn.addEventListener('click', openAddPropertyModal);

/* Filter pills */
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', function() {
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    currentPropFilter = this.dataset.pfilter || 'all';
    renderPropertiesGrid();
  });
});

/* Render admin property grid */
function renderPropertiesGrid() {
  const grid = document.getElementById('prop-admin-grid');
  if (!grid) return;
  let props = getData(STORAGE_KEYS.properties);
  if (currentPropFilter !== 'all') props = props.filter(p => p.type === currentPropFilter);

  if (props.length === 0) {
    grid.innerHTML = '<div class="empty-prop-msg">No properties found. Click "Add Property" to get started.</div>';
    return;
  }

  const typeLabels = { plot:'Plot', villa:'Villa', apartment:'Apartment', house:'House', commercial:'Commercial' };
  const statusStyles = {
    available: 'background:#22c55e;color:#fff',
    sold:      'background:#ef4444;color:#fff',
    featured:  'background:#c9962b;color:#111',
    new:       'background:#3b82f6;color:#fff',
    hot:       'background:#f97316;color:#fff',
  };
  const statusLabels = { available:'Available', sold:'SOLD OUT', featured:'Featured', new:'New', hot:'Hot Deal' };

  grid.innerHTML = props.map(p => {
    const isSold = p.status === 'sold';
    const photoHtml = p.photo
      ? `<img src="${esc(p.photo)}" alt="${esc(p.title)}" loading="lazy" style="width:100%;height:160px;object-fit:cover;border-radius:8px 8px 0 0;display:block;"/>`
      : `<div style="width:100%;height:160px;background:var(--surface-2);border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:13px;">No Photo</div>`;

    return `
    <div class="prop-admin-card${isSold ? ' is-sold' : ''}">
      <div style="position:relative;overflow:hidden;border-radius:8px 8px 0 0;">
        ${photoHtml}
        ${isSold ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;"><span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:2px;border:3px solid #fff;padding:6px 20px;transform:rotate(-15deg);">SOLD OUT</span></div>` : ''}
        <span style="position:absolute;top:10px;right:10px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;${statusStyles[p.status]||'background:#888;color:#fff'}">${statusLabels[p.status]||p.status}</span>
        <span style="position:absolute;top:10px;left:10px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(0,0,0,.55);color:#fff;">${typeLabels[p.type]||p.type}</span>
      </div>
      <div class="prop-admin-body">
        <h4 class="prop-admin-title">${esc(p.title)}</h4>
        <div class="prop-admin-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${esc(p.location)}
        </div>
        ${p.price ? `<div class="prop-admin-price">${esc(p.price)}</div>` : ''}
        ${p.desc ? `<p class="prop-admin-desc">${esc(p.desc.slice(0, 90))}${p.desc.length>90?'&hellip;':''}</p>` : ''}
        <div class="prop-admin-actions">
          <button class="table-action-btn" onclick="openEditProperty('${esc(p.id)}')">&#9998; Edit</button>
          <button class="table-action-btn" style="background:${isSold?'rgba(34,197,94,.15);color:#22c55e':'rgba(239,68,68,.15);color:#ef4444'}" onclick="toggleSoldOut('${esc(p.id)}')">${isSold ? '&#10003; Mark Available' : '&#10005; Mark Sold Out'}</button>
          <button class="table-action-btn" style="background:rgba(239,68,68,.15);color:#ef4444" onclick="deleteProperty('${esc(p.id)}')">&#128465; Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
