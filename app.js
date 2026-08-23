'use strict';
// ============================================================
//  # Cloud Salah — Supabase Application Logic
// ============================================================

const { createClient } = window.supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ============================================================
//  PASSWORD HASHING  (SHA-256 via Web Crypto API)
// ============================================================

async function hashPw(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
//  AUTH
// ============================================================

async function login(email, password) {
  const hash = await hashPw(password);
  const { data, error } = await supa
    .from('profiles')
    .select('*')
    .eq('username', email.toLowerCase().trim())
    .eq('password_hash', hash)
    .maybeSingle();
  if (error || !data) return false;
  currentUser = data;
  sessionStorage.setItem('cPro_uid', data.id);
  return true;
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('cPro_uid');
  showPage('loginPage');
}

async function restoreSession() {
  const id = sessionStorage.getItem('cPro_uid');
  if (!id) return false;
  const { data } = await supa.from('profiles').select('*').eq('id', id).maybeSingle();
  if (!data) return false;
  currentUser = data;
  return true;
}

// ============================================================
//  PAGE / PANEL NAVIGATION
// ============================================================

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.panel === id)
  );
}

async function navigate(panelId) {
  showPanel(panelId);
  await renderPanel(panelId);
}

async function renderPanel(id) {
  const map = {
    'sa-dashboard':     renderSADashboard,
    'sa-sites':         renderSASites,
    'sa-admins':        renderSAAdmins,
    'sa-users':         renderSAUsers,
    'sa-reports':           renderSAReports,
    'sa-ranges':            renderSARanges,
    'sa-rangeadmins':       renderSARangeAdmins,
    'sa-roles':             renderSARoles,
    'rangeadmin-dashboard': renderRangeAdminDashboard,
    'ra-sites':              renderRASites,
    'ra-admins':             renderRAAdmins,
    'admin-dashboard':       renderAdminDashboard,
    'admin-users':      renderAdminUsers,
    'admin-members':    renderAdminMembers,
    'admin-dependents': renderAdminDependents,
    'admin-activities': renderAdminActivities,
    'admin-fees':       renderAdminFees,
    'admin-data':       renderAdminData,
    'admin-reports':    renderAdminReports,
    'user-dashboard':   renderUserDashboard,
    'user-fees':        renderUserFees,
    'user-data':        renderUserData,
    'user-history':     renderUserHistory,
  };
  if (map[id]) await map[id]();
}

// ============================================================
//  SIDEBAR & BOOT
// ============================================================

function renderSidebar() {
  const { role, name } = currentUser;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('sidebarUserAvatar').textContent = initials;
  document.getElementById('sidebarUserName').textContent   = name;
  const roleEl = document.getElementById('sidebarUserRole');
  roleEl.textContent = role === 'superadmin' ? 'Super Admin' : role === 'siteadmin' ? 'Site Admin' : role === 'rangeadmin' ? 'Range Admin' : 'Field User';
  roleEl.className   = 'role-badge role-' + role;

  const nav = document.getElementById('sidebarNav');
  if (role === 'superadmin') {
    nav.innerHTML = `
      <div class="nav-section">Overview</div>
      <div class="nav-item" data-panel="sa-dashboard" onclick="navigate('sa-dashboard')"><span class="nav-icon">📊</span>Dashboard</div>
      <div class="nav-section">Management</div>
      <div class="nav-item" data-panel="sa-sites"       onclick="navigate('sa-sites')"><span class="nav-icon">🏘️</span>Sites</div>
      <div class="nav-item" data-panel="sa-ranges"      onclick="navigate('sa-ranges')"><span class="nav-icon">🗺️</span>Ranges</div>
      <div class="nav-item" data-panel="sa-admins"      onclick="navigate('sa-admins')"><span class="nav-icon">👤</span>Site Admins</div>
      <div class="nav-item" data-panel="sa-rangeadmins" onclick="navigate('sa-rangeadmins')"><span class="nav-icon">👤</span>Range Admins</div>
      <div class="nav-item" data-panel="sa-roles"       onclick="navigate('sa-roles')"><span class="nav-icon">🏷️</span>Roles</div>
      <div class="nav-item" data-panel="sa-users"       onclick="navigate('sa-users')"><span class="nav-icon">👥</span>All Users</div>
      <div class="nav-section">Reports</div>
      <div class="nav-item" data-panel="sa-reports" onclick="navigate('sa-reports')"><span class="nav-icon">📈</span>Reports</div>`;
  } else if (role === 'siteadmin') {
    nav.innerHTML = `
      <div class="nav-section">Overview</div>
      <div class="nav-item" data-panel="admin-dashboard"  onclick="navigate('admin-dashboard')"><span class="nav-icon">📊</span>Dashboard</div>
      <div class="nav-section">Management</div>
      <div class="nav-item" data-panel="admin-users"      onclick="navigate('admin-users')"><span class="nav-icon">👥</span>Profile Users</div>
      <div class="nav-item" data-panel="admin-members"    onclick="navigate('admin-members')"><span class="nav-icon">👨‍👩‍👧‍👦</span>Members</div>
      <div class="nav-item" data-panel="admin-dependents"  onclick="navigate('admin-dependents')"><span class="nav-icon">👶</span>Dependents</div>
      <div class="nav-item" data-panel="admin-activities" onclick="navigate('admin-activities')"><span class="nav-icon">📋</span>Manage Events</div>
      <div class="nav-section">Collections</div>
      <div class="nav-item" data-panel="admin-fees"       onclick="navigate('admin-fees')"><span class="nav-icon">💰</span>Payment Collections</div>
      <div class="nav-item" data-panel="admin-data"       onclick="navigate('admin-data')"><span class="nav-icon">📁</span>Data Records</div>
      <div class="nav-section">Reports</div>
      <div class="nav-item" data-panel="admin-reports"    onclick="navigate('admin-reports')"><span class="nav-icon">📈</span>Reports</div>`;
  } else if (role === 'rangeadmin') {
    nav.innerHTML = `
      <div class="nav-section">Overview</div>
      <div class="nav-item" data-panel="rangeadmin-dashboard" onclick="navigate('rangeadmin-dashboard')"><span class="nav-icon">📊</span>Dashboard</div>
      <div class="nav-section">Management</div>
      <div class="nav-item" data-panel="ra-sites"  onclick="navigate('ra-sites')"><span class="nav-icon">🏘️</span>Sites</div>
      <div class="nav-item" data-panel="ra-admins" onclick="navigate('ra-admins')"><span class="nav-icon">👤</span>Site Admins</div>`;
  } else {
    nav.innerHTML = `
      <div class="nav-section">Overview</div>
      <div class="nav-item" data-panel="user-dashboard" onclick="navigate('user-dashboard')"><span class="nav-icon">🏠</span>Dashboard</div>
      <div class="nav-section">My Work</div>
      <div class="nav-item" data-panel="user-fees"    onclick="navigate('user-fees')"><span class="nav-icon">💰</span>Fee Collection</div>
      <div class="nav-item" data-panel="user-data"    onclick="navigate('user-data')"><span class="nav-icon">📁</span>Data Collection</div>
      <div class="nav-item" data-panel="user-history" onclick="navigate('user-history')"><span class="nav-icon">🕑</span>My History</div>`;
  }
}

async function bootApp() {
  renderSidebar();
  showPage('appShell');
  const def = { superadmin: 'sa-dashboard', siteadmin: 'admin-dashboard', rangeadmin: 'rangeadmin-dashboard', user: 'user-dashboard' };
  await navigate(def[currentUser.role]);
}

// ============================================================
//  SUPER ADMIN — DASHBOARD
// ============================================================

async function renderSADashboard() {
  const el = document.getElementById('sa-dashboard');
  setLoading(el);
  try {
    const [
      { count: sitesCount },
      { count: adminsCount },
      { count: usersCount },
      { count: actsCount },
      { data: feeAmts },
      { data: sites },
      { data: recentActs },
      { data: allSiteUsers },
    ] = await Promise.all([
      supa.from('sites').select('*', { count: 'exact', head: true }),
      supa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'siteadmin'),
      supa.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
      supa.from('activities').select('*', { count: 'exact', head: true }),
      supa.from('fee_records').select('amount'),
      supa.from('sites').select('id, name, admin_id, admin:profiles!admin_id(name)').order('created_at', { ascending: false }).limit(6),
      supa.from('activities').select('id, name, type, site:sites!site_id(name)').order('created_at', { ascending: false }).limit(6),
      supa.from('profiles').select('site_id').eq('role', 'user').not('site_id', 'is', null),
    ]);
    const totalFees = (feeAmts || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const userCounts = {};
    (allSiteUsers || []).forEach(u => { userCounts[u.site_id] = (userCounts[u.site_id] || 0) + 1; });

    el.innerHTML = `
      <div class="panel-header"><div><h2>Super Admin Dashboard</h2><p>System-wide overview</p></div></div>
      <div class="stats-grid">
        ${statCard('🏘️', 'si-blue',   sitesCount  || 0,           'Total Sites')}
        ${statCard('👤', 'si-purple', adminsCount || 0,           'Site Admins')}
        ${statCard('👥', 'si-green',  usersCount  || 0,           'Field Users')}
        ${statCard('📋', 'si-yellow', actsCount   || 0,           'Activities')}
        ${statCard('💰', 'si-teal',   '₹' + totalFees.toFixed(2), 'Total Fees Collected')}
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-header"><h3>Sites Overview</h3></div>
          <div class="card-body">
            ${!(sites || []).length ? emptyState('🏘️', 'No sites yet', 'Create sites from the Sites panel') :
              sites.map(s => `<div class="summary-row">
                <strong class="f-13">${esc(s.name)}</strong>
                <div class="meta-row">Admin: ${s.admin?.name ? esc(s.admin.name) : '<span class="badge badge-warning">Unassigned</span>'} &bull; ${userCounts[s.id] || 0} users</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Recent Activities</h3></div>
          <div class="card-body">
            ${!(recentActs || []).length ? emptyState('📋', 'No activities yet', '') :
              recentActs.map(a => `<div class="summary-row">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <strong class="f-13">${esc(a.name)}</strong>
                  <span class="badge ${a.type === 'fee' ? 'badge-success' : 'badge-info'}">${a.type}</span>
                </div>
                <div class="meta-row">${a.site?.name ? esc(a.site.name) : 'Unknown site'}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// ============================================================
//  SUPER ADMIN — SITES
// ============================================================

async function renderSASites() {
  const el = document.getElementById('sa-sites');
  setLoading(el);
  try {
    const [
      { data: sites, error },
      { data: allUsers },
    ] = await Promise.all([
      supa.from('sites').select('id, name, range, area, city, district, pin_code, state, country, description, created_at, admin_id, admin:profiles!admin_id(id,name)').order('created_at', { ascending: false }),
      supa.from('profiles').select('id, site_id').eq('role', 'user'),
    ]);
    if (error) throw error;
    const userCounts = {};
    (allUsers || []).forEach(u => { if (u.site_id) userCounts[u.site_id] = (userCounts[u.site_id] || 0) + 1; });

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Sites Management</h2><p>Create and manage community sites</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddSiteModal()">+ Add Site</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(sites || []).length ? emptyState('🏘️', 'No sites yet', 'Click "Add Site" to create your first community site') : `
            <table>
              <thead><tr><th>Jamath (Mahall)</th><th>Area</th><th>City</th><th>District</th><th>State</th><th>Site Admin</th><th>Users</th><th>Actions</th></tr></thead>
              <tbody>
                ${sites.map(s => `<tr>
                  <td><strong>${esc(s.name)}</strong>${s.description ? `<div class="meta-row">${esc(s.description)}</div>` : ''}</td>
                  <td>${esc(s.area || '—')}</td>
                  <td>${esc(s.city || '—')}</td>
                  <td>${esc(s.district || '—')}</td>
                  <td>${esc(s.state || '—')}</td>
                  <td>${s.admin?.name ? esc(s.admin.name) : '<span class="badge badge-warning">Unassigned</span>'}</td>
                  <td>${userCounts[s.id] || 0}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditSiteModal('${s.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteSite('${s.id}')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function showAddSiteModal() {
  const opts = await rangeSelectOpts('');
  showModal('Add New Site', `
    <div class="form-group"><label>Range *</label>
      <select id="mSiteRangeId"><option value="">— Select Range —</option>${opts}</select>
    </div>
    <div class="form-group"><label>Jamath (Mahall) *</label><input id="mSiteName"     type="text" placeholder="Jamath or Mahall name"></div>
    <div class="form-group"><label>Area</label>             <input id="mSiteArea"     type="text" placeholder="Area"></div>
    <div class="form-group"><label>City</label>             <input id="mSiteCity"     type="text" placeholder="City"></div>
    <div class="form-group"><label>District</label>         <input id="mSiteDistrict" type="text" placeholder="District"></div>
    <div class="form-group"><label>Pin Code</label>         <input id="mSitePinCode"  type="text" placeholder="Pin code"></div>
    <div class="form-group"><label>State</label>            <input id="mSiteState"    type="text" placeholder="State"></div>
    <div class="form-group"><label>Country</label>          <input id="mSiteCountry"  type="text" placeholder="Country"></div>
    <div class="form-group"><label>Description</label>      <textarea id="mSiteDesc" placeholder="Brief description..."></textarea></div>`,
  async () => {
    const rangeId = val('mSiteRangeId'), name = val('mSiteName');
    if (!rangeId) return toast('Range is required', 'error'), false;
    if (!name)    return toast('Jamath (Mahall) name is required', 'error'), false;
    const { error } = await supa.from('sites').insert({
      name, range_id: rangeId,
      area: val('mSiteArea')||null, city: val('mSiteCity')||null,
      district: val('mSiteDistrict')||null, pin_code: val('mSitePinCode')||null,
      state: val('mSiteState')||null, country: val('mSiteCountry')||null,
      description: val('mSiteDesc')||null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Site created', 'success'); await navigate('sa-sites'); return true;
  });
}

async function showEditSiteModal(siteId) {
  const [{ data: s }, opts] = await Promise.all([
    supa.from('sites').select('*').eq('id', siteId).single(),
    rangeSelectOpts(''),
  ]);
  if (!s) return;
  const rangeOpts = await rangeSelectOpts(s.range_id || '');
  showModal('Edit Site', `
    <div class="form-group"><label>Range *</label>
      <select id="mSiteRangeId"><option value="">— Select Range —</option>${rangeOpts}</select>
    </div>
    <div class="form-group"><label>Jamath (Mahall) *</label><input id="mSiteName"     type="text" value="${esc(s.name)}"></div>
    <div class="form-group"><label>Area</label>             <input id="mSiteArea"     type="text" value="${esc(s.area     ||'')}"></div>
    <div class="form-group"><label>City</label>             <input id="mSiteCity"     type="text" value="${esc(s.city     ||'')}"></div>
    <div class="form-group"><label>District</label>         <input id="mSiteDistrict" type="text" value="${esc(s.district ||'')}"></div>
    <div class="form-group"><label>Pin Code</label>         <input id="mSitePinCode"  type="text" value="${esc(s.pin_code ||'')}"></div>
    <div class="form-group"><label>State</label>            <input id="mSiteState"    type="text" value="${esc(s.state    ||'')}"></div>
    <div class="form-group"><label>Country</label>          <input id="mSiteCountry"  type="text" value="${esc(s.country  ||'')}"></div>
    <div class="form-group"><label>Description</label>      <textarea id="mSiteDesc">${esc(s.description||'')}</textarea></div>`,
  async () => {
    const rangeId = val('mSiteRangeId'), name = val('mSiteName');
    if (!rangeId) return toast('Range is required', 'error'), false;
    if (!name)    return toast('Jamath (Mahall) name is required', 'error'), false;
    const { error } = await supa.from('sites').update({
      name, range_id: rangeId,
      area: val('mSiteArea')||null, city: val('mSiteCity')||null,
      district: val('mSiteDistrict')||null, pin_code: val('mSitePinCode')||null,
      state: val('mSiteState')||null, country: val('mSiteCountry')||null,
      description: val('mSiteDesc')||null,
    }).eq('id', siteId);
    if (error) return toast(error.message, 'error'), false;
    toast('Site updated', 'success'); await navigate('sa-sites'); return true;
  });
}

function deleteSite(siteId) {
  confirmAction('Delete this site? All activities, fee records and data records will be removed.', async () => {
    const { error } = await supa.from('sites').delete().eq('id', siteId);
    if (error) return toast(error.message, 'error');
    toast('Site deleted', 'success'); await navigate('sa-sites');
  });
}

// ============================================================
//  SUPER ADMIN — SITE ADMINS
// ============================================================

async function renderSAAdmins() {
  const el = document.getElementById('sa-admins');
  setLoading(el);
  try {
    const { data: admins, error } = await supa
      .from('profiles')
      .select('id, name, username, phone, site_id, site:sites!site_id(id,name)')
      .eq('role', 'siteadmin')
      .order('name');
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Site Admins</h2><p>Manage and assign site administrators</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddAdminModal()">+ Add Site Admin</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(admins || []).length ? emptyState('👤', 'No site admins yet', 'Add site admins and assign them to sites') : `
            <table>
              <thead><tr><th>Name</th><th>User Name</th><th>Phone</th><th>Assigned Site</th><th>Actions</th></tr></thead>
              <tbody>
                ${admins.map(u => `<tr>
                  <td><strong>${esc(u.name)}</strong></td>
                  <td>${esc(u.username)}</td>
                  <td>${esc(u.phone || '—')}</td>
                  <td>${u.site?.name ? esc(u.site.name) : '<span class="badge badge-warning">Unassigned</span>'}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditAdminModal('${u.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteProfileFn('${u.id}','sa-admins')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function siteSelectOpts(selectedId) {
  const { data: sites } = await supa.from('sites').select('id, name').order('name');
  return (sites || []).map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
}

async function showAddAdminModal() {
  const opts = await siteSelectOpts('');
  showModal('Add Site Admin', `
    <div class="form-group"><label>Full Name *</label><input id="mName"     type="text"     placeholder="Admin's full name"></div>
    <div class="form-group"><label>User Name *</label>     <input id="mEmail"    type="text"    placeholder="user name"></div>
    <div class="form-group"><label>Phone</label>       <input id="mPhone"    type="tel"      placeholder="Phone number"></div>
    <div class="form-group"><label>Password *</label>  <input id="mPassword" type="password" placeholder="Min 6 characters"></div>
    <div class="form-group"><label>Assign to Site</label>
      <select id="mSiteId"><option value="">— No Site —</option>${opts}</select>
    </div>`,
  async () => {
    const name = val('mName'), email = val('mEmail'), password = val('mPassword'), siteId = val('mSiteId');
    if (!name || !email || !password) return toast('Name, email and password are required', 'error'), false;
    if (password.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const password_hash = await hashPw(password);
    const { data: newAdmin, error } = await supa.from('profiles')
      .insert({ name, username: email.toLowerCase(), password_hash, phone: val('mPhone') || null, role: 'siteadmin', site_id: siteId || null })
      .select().single();
    if (error) return toast(error.message, 'error'), false;
    if (siteId) await assignAdminToSite(newAdmin.id, siteId);
    toast('Site admin created', 'success'); await navigate('sa-admins'); return true;
  });
}

async function showEditAdminModal(userId) {
  const { data: u } = await supa.from('profiles').select('*').eq('id', userId).single();
  if (!u) return;
  const opts = await siteSelectOpts(u.site_id || '');
  showModal('Edit Site Admin', `
    <div class="form-group"><label>Full Name *</label><input id="mName"     type="text"     value="${esc(u.name)}"></div>
    <div class="form-group"><label>User Name *</label>     <input id="mEmail"    type="text"    value="${esc(u.username)}"></div>
    <div class="form-group"><label>Phone</label>       <input id="mPhone"    type="tel"      value="${esc(u.phone || '')}"></div>
    <div class="form-group"><label>New Password <span style="font-weight:400;color:#9ca3af">(leave blank to keep)</span></label>
      <input id="mPassword" type="password" placeholder="New password"></div>
    <div class="form-group"><label>Assigned Site</label>
      <select id="mSiteId"><option value="">— No Site —</option>${opts}</select>
    </div>`,
  async () => {
    const name = val('mName'), email = val('mEmail'), siteId = val('mSiteId'), pw = val('mPassword');
    if (!name || !email) return toast('Name and user name are required', 'error'), false;
    if (pw && pw.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const updates = { name, username: email.toLowerCase(), phone: val('mPhone') || null, site_id: siteId || null };
    if (pw) updates.password_hash = await hashPw(pw);
    const { error } = await supa.from('profiles').update(updates).eq('id', userId);
    if (error) return toast(error.message, 'error'), false;
    if (u.site_id && u.site_id !== siteId) {
      await supa.from('sites').update({ admin_id: null }).eq('id', u.site_id).eq('admin_id', userId);
    }
    if (siteId) await assignAdminToSite(userId, siteId);
    toast('Site admin updated', 'success'); await navigate('sa-admins'); return true;
  });
}

async function assignAdminToSite(adminId, siteId) {
  const { data: site } = await supa.from('sites').select('admin_id').eq('id', siteId).single();
  if (site?.admin_id && site.admin_id !== adminId) {
    await supa.from('profiles').update({ site_id: null }).eq('id', site.admin_id);
  }
  await supa.from('sites').update({ admin_id: adminId }).eq('id', siteId);
}

// ============================================================
//  SUPER ADMIN — ALL USERS
// ============================================================

async function renderSAUsers() {
  const el = document.getElementById('sa-users');
  setLoading(el);
  try {
    const [{ data: allUsers, error }, { data: sites }] = await Promise.all([
      supa.from('profiles').select('id, name, username, role, site_id, created_at').neq('role', 'superadmin').order('name'),
      supa.from('sites').select('id, name'),
    ]);
    if (error) throw error;
    const siteMap = {};
    (sites || []).forEach(s => { siteMap[s.id] = s.name; });

    el.innerHTML = `
      <div class="panel-header"><div><h2>All Users</h2><p>View all users across all sites</p></div></div>
      <div class="card">
        <div class="card-body">
          <div class="filters">
            <input  class="filter-grow" id="saUSearch" type="text" placeholder="🔍 Search users..." oninput="filterSAUsers()">
            <select id="saURoleF" onchange="filterSAUsers()">
              <option value="">All Roles</option>
              <option value="siteadmin">Site Admins</option>
              <option value="rangeadmin">Range Admins</option>
              <option value="user">Field Users</option>
            </select>
            <select id="saUSiteF" onchange="filterSAUsers()">
              <option value="">All Sites</option>
              ${(sites || []).map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="table-wrapper">
            <table id="saUsersTable">
              <thead><tr><th>Name</th><th>User Name</th><th>Role</th><th>Site</th><th>Joined</th></tr></thead>
              <tbody>
                ${!(allUsers || []).length ? `<tr><td colspan="5">${emptyState('👥', 'No users yet', '')}</td></tr>` :
                  allUsers.map(u => `<tr data-role="${u.role}" data-site="${u.site_id || ''}">
                    <td><strong>${esc(u.name)}</strong></td>
                    <td>${esc(u.username)}</td>
                    <td><span class="role-badge role-${u.role}">${u.role === 'siteadmin' ? 'Site Admin' : 'Field User'}</span></td>
                    <td>${u.site_id ? esc(siteMap[u.site_id] || '—') : '—'}</td>
                    <td>${fmtDate(u.created_at)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function filterSAUsers() {
  const search = document.getElementById('saUSearch')?.value.toLowerCase() || '';
  const role   = document.getElementById('saURoleF')?.value || '';
  const site   = document.getElementById('saUSiteF')?.value || '';
  document.querySelectorAll('#saUsersTable tbody tr').forEach(row => {
    row.style.display = (
      (!search || row.textContent.toLowerCase().includes(search)) &&
      (!role   || row.dataset.role === role) &&
      (!site   || row.dataset.site === site)
    ) ? '' : 'none';
  });
}

// ============================================================
//  SUPER ADMIN — REPORTS
// ============================================================

async function renderSAReports() {
  const el = document.getElementById('sa-reports');
  setLoading(el);
  try {
    const [{ data: sites }, { data: feeRecs }, { count: dataCount }, { data: siteUsers }, { data: siteActs }, { data: siteDataRecs }] = await Promise.all([
      supa.from('sites').select('id, name'),
      supa.from('fee_records').select('site_id, amount'),
      supa.from('data_records').select('*', { count: 'exact', head: true }),
      supa.from('profiles').select('site_id').eq('role', 'user').not('site_id', 'is', null),
      supa.from('activities').select('site_id'),
      supa.from('data_records').select('site_id'),
    ]);
    const totalFees = (feeRecs || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const siteFeeMap = {}, userCounts = {}, actCounts = {}, dataCountMap = {};
    (feeRecs || []).forEach(r => {
      if (!siteFeeMap[r.site_id]) siteFeeMap[r.site_id] = { total: 0, count: 0 };
      siteFeeMap[r.site_id].total += parseFloat(r.amount || 0);
      siteFeeMap[r.site_id].count++;
    });
    (siteUsers    || []).forEach(u => { userCounts[u.site_id]   = (userCounts[u.site_id]   || 0) + 1; });
    (siteActs     || []).forEach(a => { actCounts[a.site_id]    = (actCounts[a.site_id]    || 0) + 1; });
    (siteDataRecs || []).forEach(r => { dataCountMap[r.site_id] = (dataCountMap[r.site_id] || 0) + 1; });

    el.innerHTML = `
      <div class="panel-header"><div><h2>System Reports</h2><p>Aggregated data across all sites</p></div></div>
      <div class="stats-grid">
        ${statCard('💰', 'si-green',  '₹' + totalFees.toFixed(2), 'Total Fees Collected')}
        ${statCard('📝', 'si-blue',   (feeRecs || []).length,      'Fee Transactions')}
        ${statCard('📁', 'si-purple', dataCount || 0,              'Data Records')}
      </div>
      <div class="card">
        <div class="card-header"><h3>Site-wise Summary</h3></div>
        <div class="card-body table-wrapper">
          ${!(sites || []).length ? emptyState('🏘️', 'No sites yet', '') : `
            <table>
              <thead><tr><th>Site</th><th>Users</th><th>Activities</th><th>Fee Transactions</th><th>Data Records</th><th>Total Collected</th></tr></thead>
              <tbody>
                ${sites.map(s => `<tr>
                  <td><strong>${esc(s.name)}</strong></td>
                  <td>${userCounts[s.id]   || 0}</td>
                  <td>${actCounts[s.id]    || 0}</td>
                  <td>${(siteFeeMap[s.id] || {}).count || 0}</td>
                  <td>${dataCountMap[s.id] || 0}</td>
                  <td><strong class="text-green">₹${((siteFeeMap[s.id] || {}).total || 0).toFixed(2)}</strong></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// ============================================================
//  SHARED — DELETE PROFILE
// ============================================================

function deleteProfileFn(userId, returnPanel) {
  confirmAction('Delete this user? This cannot be undone.', async () => {
    await supa.from('sites').update({ admin_id: null }).eq('admin_id', userId);
    await supa.from('ranges').update({ admin_id: null }).eq('admin_id', userId);
    const { error } = await supa.from('profiles').delete().eq('id', userId);
    if (error) return toast(error.message, 'error');
    toast('User deleted', 'success'); await navigate(returnPanel);
  });
}

// ============================================================
//  SUPER ADMIN — RANGES
// ============================================================

async function renderSARanges() {
  const el = document.getElementById('sa-ranges');
  setLoading(el);
  try {
    const { data: ranges, error } = await supa
      .from('ranges')
      .select('id, name, area, city, district, state, country, description, created_at, admin_id, admin:profiles!admin_id(id,name)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Ranges Management</h2><p>Create and manage community ranges</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddRangeModal()">+ Add Range</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(ranges || []).length ? emptyState('🗺️', 'No ranges yet', 'Click "Add Range" to create your first range') : `
            <table>
              <thead><tr><th>Range Name</th><th>Area</th><th>City</th><th>District</th><th>State</th><th>Range Admin</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                ${ranges.map(r => `<tr>
                  <td><strong>${esc(r.name)}</strong>${r.description ? `<div class="meta-row">${esc(r.description)}</div>` : ''}</td>
                  <td>${esc(r.area     || '—')}</td>
                  <td>${esc(r.city     || '—')}</td>
                  <td>${esc(r.district || '—')}</td>
                  <td>${esc(r.state    || '—')}</td>
                  <td>${r.admin?.name ? esc(r.admin.name) : '<span class="badge badge-warning">Unassigned</span>'}</td>
                  <td>${fmtDate(r.created_at)}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditRangeModal('${r.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteRange('${r.id}')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function rangeFormHTML(r) {
  return `
    <div class="form-group"><label>Range Name *</label><input id="mRangeName"     type="text" value="${r ? esc(r.name)        : ''}" placeholder="Range name"></div>
    <div class="form-group"><label>Area</label>          <input id="mRangeArea"     type="text" value="${r ? esc(r.area     ||'') : ''}" placeholder="Area"></div>
    <div class="form-group"><label>City</label>          <input id="mRangeCity"     type="text" value="${r ? esc(r.city     ||'') : ''}" placeholder="City"></div>
    <div class="form-group"><label>District</label>      <input id="mRangeDistrict" type="text" value="${r ? esc(r.district ||'') : ''}" placeholder="District"></div>
    <div class="form-group"><label>Pin Code</label>      <input id="mRangePinCode"  type="text" value="${r ? esc(r.pin_code ||'') : ''}" placeholder="Pin code"></div>
    <div class="form-group"><label>State</label>         <input id="mRangeState"    type="text" value="${r ? esc(r.state    ||'') : ''}" placeholder="State"></div>
    <div class="form-group"><label>Country</label>       <input id="mRangeCountry"  type="text" value="${r ? esc(r.country  ||'') : ''}" placeholder="Country"></div>
    <div class="form-group"><label>Description</label>   <textarea id="mRangeDesc" placeholder="Brief description...">${r ? esc(r.description || '') : ''}</textarea></div>`;
}

async function showAddRangeModal() {
  showModal('Add New Range', rangeFormHTML(null), async () => {
    const name = val('mRangeName');
    if (!name) return toast('Range name is required', 'error'), false;
    const { error } = await supa.from('ranges').insert({
      name, area: val('mRangeArea')||null, city: val('mRangeCity')||null,
      district: val('mRangeDistrict')||null, pin_code: val('mRangePinCode')||null,
      state: val('mRangeState')||null, country: val('mRangeCountry')||null,
      description: val('mRangeDesc')||null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Range created', 'success'); await navigate('sa-ranges'); return true;
  });
}

async function showEditRangeModal(rangeId) {
  const { data: r } = await supa.from('ranges').select('*').eq('id', rangeId).single();
  if (!r) return;
  showModal('Edit Range', rangeFormHTML(r), async () => {
    const name = val('mRangeName');
    if (!name) return toast('Range name is required', 'error'), false;
    const { error } = await supa.from('ranges').update({
      name, area: val('mRangeArea')||null, city: val('mRangeCity')||null,
      district: val('mRangeDistrict')||null, pin_code: val('mRangePinCode')||null,
      state: val('mRangeState')||null, country: val('mRangeCountry')||null,
      description: val('mRangeDesc')||null,
    }).eq('id', rangeId);
    if (error) return toast(error.message, 'error'), false;
    toast('Range updated', 'success'); await navigate('sa-ranges'); return true;
  });
}

function deleteRange(rangeId) {
  confirmAction('Delete this range? This cannot be undone.', async () => {
    await supa.from('profiles').update({ range_id: null }).eq('range_id', rangeId);
    const { error } = await supa.from('ranges').delete().eq('id', rangeId);
    if (error) return toast(error.message, 'error');
    toast('Range deleted', 'success'); await navigate('sa-ranges');
  });
}

// ============================================================
//  SUPER ADMIN — RANGE ADMINS
// ============================================================

async function renderSARangeAdmins() {
  const el = document.getElementById('sa-rangeadmins');
  setLoading(el);
  try {
    const { data: admins, error } = await supa
      .from('profiles')
      .select('id, name, username, phone, range_id, range:ranges!range_id(id,name)')
      .eq('role', 'rangeadmin')
      .order('name');
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Range Admins</h2><p>Manage and assign range administrators</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddRangeAdminModal()">+ Add Range Admin</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(admins || []).length ? emptyState('👤', 'No range admins yet', 'Add range admins and assign them to ranges') : `
            <table>
              <thead><tr><th>Name</th><th>User Name</th><th>Phone</th><th>Assigned Range</th><th>Actions</th></tr></thead>
              <tbody>
                ${admins.map(u => `<tr>
                  <td><strong>${esc(u.name)}</strong></td>
                  <td>${esc(u.username)}</td>
                  <td>${esc(u.phone || '—')}</td>
                  <td>${u.range?.name ? esc(u.range.name) : '<span class="badge badge-warning">Unassigned</span>'}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditRangeAdminModal('${u.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteProfileFn('${u.id}','sa-rangeadmins')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function rangeSelectOpts(selectedId) {
  const { data: ranges } = await supa.from('ranges').select('id, name').order('name');
  return (ranges || []).map(r => `<option value="${r.id}" ${r.id === selectedId ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
}

async function showAddRangeAdminModal() {
  const opts = await rangeSelectOpts('');
  showModal('Add Range Admin', `
    <div class="form-group"><label>Full Name *</label><input id="mName"     type="text"     placeholder="Admin's full name"></div>
    <div class="form-group"><label>User Name *</label>     <input id="mEmail"    type="text"    placeholder="user name"></div>
    <div class="form-group"><label>Phone</label>       <input id="mPhone"    type="tel"      placeholder="Phone number"></div>
    <div class="form-group"><label>Password *</label>  <input id="mPassword" type="password" placeholder="Min 6 characters"></div>
    <div class="form-group"><label>Assign to Range</label>
      <select id="mRangeId"><option value="">— No Range —</option>${opts}</select>
    </div>`,
  async () => {
    const name = val('mName'), email = val('mEmail'), password = val('mPassword'), rangeId = val('mRangeId');
    if (!name || !email || !password) return toast('Name, user name and password are required', 'error'), false;
    if (password.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const password_hash = await hashPw(password);
    const { data: newAdmin, error } = await supa.from('profiles')
      .insert({ name, username: email.toLowerCase(), password_hash, phone: val('mPhone')||null, role: 'rangeadmin', range_id: rangeId||null })
      .select().single();
    if (error) return toast(error.message, 'error'), false;
    if (rangeId) await assignRangeAdminToRange(newAdmin.id, rangeId);
    toast('Range admin created', 'success'); await navigate('sa-rangeadmins'); return true;
  });
}

async function showEditRangeAdminModal(userId) {
  const { data: u } = await supa.from('profiles').select('*').eq('id', userId).single();
  if (!u) return;
  const opts = await rangeSelectOpts(u.range_id || '');
  showModal('Edit Range Admin', `
    <div class="form-group"><label>Full Name *</label><input id="mName"     type="text"     value="${esc(u.name)}"></div>
    <div class="form-group"><label>User Name *</label>     <input id="mEmail"    type="text"    value="${esc(u.username)}"></div>
    <div class="form-group"><label>Phone</label>       <input id="mPhone"    type="tel"      value="${esc(u.phone || '')}"></div>
    <div class="form-group"><label>New Password <span style="font-weight:400;color:#9ca3af">(leave blank to keep)</span></label>
      <input id="mPassword" type="password" placeholder="New password"></div>
    <div class="form-group"><label>Assigned Range</label>
      <select id="mRangeId"><option value="">— No Range —</option>${opts}</select>
    </div>`,
  async () => {
    const name = val('mName'), email = val('mEmail'), rangeId = val('mRangeId'), pw = val('mPassword');
    if (!name || !email) return toast('Name and user name are required', 'error'), false;
    if (pw && pw.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const updates = { name, username: email.toLowerCase(), phone: val('mPhone')||null, range_id: rangeId||null };
    if (pw) updates.password_hash = await hashPw(pw);
    const { error } = await supa.from('profiles').update(updates).eq('id', userId);
    if (error) return toast(error.message, 'error'), false;
    if (u.range_id && u.range_id !== rangeId) {
      await supa.from('ranges').update({ admin_id: null }).eq('id', u.range_id).eq('admin_id', userId);
    }
    if (rangeId) await assignRangeAdminToRange(userId, rangeId);
    toast('Range admin updated', 'success'); await navigate('sa-rangeadmins'); return true;
  });
}

async function assignRangeAdminToRange(adminId, rangeId) {
  const { data: range } = await supa.from('ranges').select('admin_id').eq('id', rangeId).single();
  if (range?.admin_id && range.admin_id !== adminId) {
    await supa.from('profiles').update({ range_id: null }).eq('id', range.admin_id);
  }
  await supa.from('ranges').update({ admin_id: adminId }).eq('id', rangeId);
}

// ============================================================
//  SUPER ADMIN — ROLES
// ============================================================

function permBadge(val) {
  return val
    ? '<span class="badge badge-success">✓ Yes</span>'
    : '<span class="badge badge-secondary">— No</span>';
}

function roleFormHTML(r) {
  const chk = v => v ? 'checked' : '';
  const perm = (id, icon, label, val) =>
    `<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;font-size:13px">
      <input type="checkbox" id="${id}" ${chk(val)}> ${icon} ${label}
    </label>`;
  return `
    <div class="form-group"><label>Role Name *</label>
      <input id="mRoleName" type="text" value="${r ? esc(r.name) : ''}" placeholder="e.g., Field Collector">
    </div>
    <div class="form-group">
      <label style="display:block;margin-bottom:10px">Permissions</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${perm('pFee',      '💰', 'Fee Collection',       r?.fee_collection)}
        ${perm('pData',     '📁', 'Data Collection',      r?.data_collection)}
        ${perm('pReports',  '📈', 'View Reports',         r?.view_reports)}
        ${perm('pNoLogin',  '🚫', 'Restrict Login Access', r?.restrict_login)}
      </div>
    </div>`;
}

async function renderSARoles() {
  const el = document.getElementById('sa-roles');
  setLoading(el);
  try {
    const { data: roles, error } = await supa
      .from('roles')
      .select('*')
      .order('name');
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Roles</h2><p>Define activity permissions for user roles</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddRoleModal()">+ Add Role</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(roles || []).length ? emptyState('🏷️', 'No roles yet', 'Click "Add Role" to create your first role') : `
            <table>
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Fee Collection</th>
                  <th>Data Collection</th>
                  <th>View Reports</th>
                  <th>Restrict Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${roles.map(r => `<tr>
                  <td><strong>${esc(r.name)}</strong></td>
                  <td>${permBadge(r.fee_collection)}</td>
                  <td>${permBadge(r.data_collection)}</td>
                  <td>${permBadge(r.view_reports)}</td>
                  <td>${permBadge(r.restrict_login)}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditRoleModal('${r.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteRole('${r.id}')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function showAddRoleModal() {
  showModal('Add New Role', roleFormHTML(null), async () => {
    const name = val('mRoleName');
    if (!name) return toast('Role name is required', 'error'), false;
    const { error } = await supa.from('roles').insert({
      name,
      fee_collection:  document.getElementById('pFee')?.checked     || false,
      data_collection: document.getElementById('pData')?.checked    || false,
      view_reports:    document.getElementById('pReports')?.checked || false,
      restrict_login:  document.getElementById('pNoLogin')?.checked || false,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Role created', 'success'); await navigate('sa-roles'); return true;
  });
}

async function showEditRoleModal(roleId) {
  const { data: r } = await supa.from('roles').select('*').eq('id', roleId).single();
  if (!r) return;
  showModal('Edit Role', roleFormHTML(r), async () => {
    const name = val('mRoleName');
    if (!name) return toast('Role name is required', 'error'), false;
    const { error } = await supa.from('roles').update({
      name,
      fee_collection:  document.getElementById('pFee')?.checked     || false,
      data_collection: document.getElementById('pData')?.checked    || false,
      view_reports:    document.getElementById('pReports')?.checked || false,
      restrict_login:  document.getElementById('pNoLogin')?.checked || false,
    }).eq('id', roleId);
    if (error) return toast(error.message, 'error'), false;
    toast('Role updated', 'success'); await navigate('sa-roles'); return true;
  });
}

function deleteRole(roleId) {
  confirmAction('Delete this role? This cannot be undone.', async () => {
    const { error } = await supa.from('roles').delete().eq('id', roleId);
    if (error) return toast(error.message, 'error');
    toast('Role deleted', 'success'); await navigate('sa-roles');
  });
}

// ============================================================
//  RANGE ADMIN — DASHBOARD
// ============================================================

async function renderRangeAdminDashboard() {
  const el = document.getElementById('rangeadmin-dashboard');
  setLoading(el);
  try {
    const { data: myRange } = await supa.from('ranges').select('*').eq('admin_id', currentUser.id).maybeSingle();
    el.innerHTML = `
      <div class="panel-header">
        <div><h2>${myRange ? esc(myRange.name) : 'Range Admin Dashboard'}</h2><p>Range Admin Overview</p></div>
      </div>
      ${!myRange ? emptyState('⚠️', 'Not assigned to a range', 'Contact the super admin to assign you to a range') : `
        <div class="stats-grid">
          ${statCard('🗺️', 'si-blue',   esc(myRange.name),           'Range Name')}
          ${statCard('📍', 'si-green',  esc(myRange.city     || '—'), 'City')}
          ${statCard('🏙️', 'si-yellow', esc(myRange.district || '—'), 'District')}
          ${statCard('🌏', 'si-purple', esc(myRange.state    || '—'), 'State')}
        </div>
        <div class="card">
          <div class="card-header"><h3>Range Details</h3></div>
          <div class="card-body">
            ${[['Area', myRange.area],['City', myRange.city],['District', myRange.district],['Pin Code', myRange.pin_code],['State', myRange.state],['Country', myRange.country],['Description', myRange.description]]
              .filter(([,v]) => v)
              .map(([k,v]) => `<div class="summary-row" style="display:flex;gap:16px;padding:8px 0;border-bottom:1px solid #f3f4f6">
                <span style="min-width:120px;font-weight:600;color:#6b7280">${k}</span>
                <span>${esc(v)}</span></div>`).join('')}
          </div>
        </div>`}`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// ============================================================
//  RANGE ADMIN — SITES
// ============================================================

function noRangeMsg() {
  return `<div class="panel-header"><div><h2>Not Available</h2></div></div>${emptyState('⚠️', 'Not assigned to a range', 'Contact the super admin to assign you to a range')}`;
}

async function renderRASites() {
  const el = document.getElementById('ra-sites');
  const rangeId = currentUser.range_id;
  if (!rangeId) { el.innerHTML = noRangeMsg(); return; }
  setLoading(el);
  try {
    const [{ data: sites, error }, { data: allUsers }] = await Promise.all([
      supa.from('sites').select('id, name, area, city, district, state, description, created_at, admin_id, admin:profiles!admin_id(id,name)').eq('range_id', rangeId).order('created_at', { ascending: false }),
      supa.from('profiles').select('id, site_id').eq('role', 'user'),
    ]);
    if (error) throw error;
    const userCounts = {};
    (allUsers || []).forEach(u => { if (u.site_id) userCounts[u.site_id] = (userCounts[u.site_id] || 0) + 1; });

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Sites Management</h2><p>Manage Jamath/Mahall sites in your range</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddRASiteModal()">+ Add Site</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(sites || []).length ? emptyState('🏘️', 'No sites yet', 'Click "Add Site" to create your first site') : `
            <table>
              <thead><tr><th>Jamath (Mahall)</th><th>Area</th><th>City</th><th>District</th><th>State</th><th>Site Admin</th><th>Users</th><th>Actions</th></tr></thead>
              <tbody>
                ${sites.map(s => `<tr>
                  <td><strong>${esc(s.name)}</strong>${s.description ? `<div class="meta-row">${esc(s.description)}</div>` : ''}</td>
                  <td>${esc(s.area     || '—')}</td>
                  <td>${esc(s.city     || '—')}</td>
                  <td>${esc(s.district || '—')}</td>
                  <td>${esc(s.state    || '—')}</td>
                  <td>${s.admin?.name ? esc(s.admin.name) : '<span class="badge badge-warning">Unassigned</span>'}</td>
                  <td>${userCounts[s.id] || 0}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditRASiteModal('${s.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteRASite('${s.id}')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function showAddRASiteModal() {
  const { data: myRange } = await supa.from('ranges').select('id, name').eq('id', currentUser.range_id).single();
  showModal('Add New Site', `
    <div class="form-group"><label>Range</label>
      <input type="text" value="${myRange ? esc(myRange.name) : ''}" disabled style="background:#f3f4f6;color:#6b7280">
    </div>
    <div class="form-group"><label>Jamath (Mahall) *</label><input id="mSiteName"     type="text" placeholder="Jamath or Mahall name"></div>
    <div class="form-group"><label>Area</label>             <input id="mSiteArea"     type="text" placeholder="Area"></div>
    <div class="form-group"><label>City</label>             <input id="mSiteCity"     type="text" placeholder="City"></div>
    <div class="form-group"><label>District</label>         <input id="mSiteDistrict" type="text" placeholder="District"></div>
    <div class="form-group"><label>Pin Code</label>         <input id="mSitePinCode"  type="text" placeholder="Pin code"></div>
    <div class="form-group"><label>State</label>            <input id="mSiteState"    type="text" placeholder="State"></div>
    <div class="form-group"><label>Country</label>          <input id="mSiteCountry"  type="text" placeholder="Country"></div>
    <div class="form-group"><label>Description</label>      <textarea id="mSiteDesc" placeholder="Brief description..."></textarea></div>`,
  async () => {
    const name = val('mSiteName');
    if (!name) return toast('Jamath (Mahall) name is required', 'error'), false;
    const { error } = await supa.from('sites').insert({
      name, range_id: currentUser.range_id,
      area: val('mSiteArea')||null, city: val('mSiteCity')||null,
      district: val('mSiteDistrict')||null, pin_code: val('mSitePinCode')||null,
      state: val('mSiteState')||null, country: val('mSiteCountry')||null, description: val('mSiteDesc')||null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Site created', 'success'); await navigate('ra-sites'); return true;
  });
}

async function showEditRASiteModal(siteId) {
  const [{ data: s }, { data: myRange }] = await Promise.all([
    supa.from('sites').select('*').eq('id', siteId).single(),
    supa.from('ranges').select('id, name').eq('id', currentUser.range_id).single(),
  ]);
  if (!s) return;
  showModal('Edit Site', `
    <div class="form-group"><label>Range</label>
      <input type="text" value="${myRange ? esc(myRange.name) : ''}" disabled style="background:#f3f4f6;color:#6b7280">
    </div>
    <div class="form-group"><label>Jamath (Mahall) *</label><input id="mSiteName"     type="text" value="${esc(s.name)}"></div>
    <div class="form-group"><label>Area</label>             <input id="mSiteArea"     type="text" value="${esc(s.area     ||'')}"></div>
    <div class="form-group"><label>City</label>             <input id="mSiteCity"     type="text" value="${esc(s.city     ||'')}"></div>
    <div class="form-group"><label>District</label>         <input id="mSiteDistrict" type="text" value="${esc(s.district ||'')}"></div>
    <div class="form-group"><label>Pin Code</label>         <input id="mSitePinCode"  type="text" value="${esc(s.pin_code ||'')}"></div>
    <div class="form-group"><label>State</label>            <input id="mSiteState"    type="text" value="${esc(s.state    ||'')}"></div>
    <div class="form-group"><label>Country</label>          <input id="mSiteCountry"  type="text" value="${esc(s.country  ||'')}"></div>
    <div class="form-group"><label>Description</label>      <textarea id="mSiteDesc">${esc(s.description||'')}</textarea></div>`,
  async () => {
    const name = val('mSiteName');
    if (!name) return toast('Jamath (Mahall) name is required', 'error'), false;
    const { error } = await supa.from('sites').update({
      name, area: val('mSiteArea')||null, city: val('mSiteCity')||null,
      district: val('mSiteDistrict')||null, pin_code: val('mSitePinCode')||null,
      state: val('mSiteState')||null, country: val('mSiteCountry')||null, description: val('mSiteDesc')||null,
    }).eq('id', siteId);
    if (error) return toast(error.message, 'error'), false;
    toast('Site updated', 'success'); await navigate('ra-sites'); return true;
  });
}

function deleteRASite(siteId) {
  confirmAction('Delete this site? All associated data will be removed.', async () => {
    const { error } = await supa.from('sites').delete().eq('id', siteId);
    if (error) return toast(error.message, 'error');
    toast('Site deleted', 'success'); await navigate('ra-sites');
  });
}

// ============================================================
//  RANGE ADMIN — SITE ADMINS
// ============================================================

async function renderRAAdmins() {
  const el = document.getElementById('ra-admins');
  const rangeId = currentUser.range_id;
  if (!rangeId) { el.innerHTML = noRangeMsg(); return; }
  setLoading(el);
  try {
    const { data: rangeSites } = await supa.from('sites').select('id, name').eq('range_id', rangeId);
    const siteIds = (rangeSites || []).map(s => s.id);
    const { data: admins, error } = await supa
      .from('profiles')
      .select('id, name, username, phone, site_id, site:sites!site_id(id,name)')
      .eq('role', 'siteadmin')
      .in('site_id', siteIds.length ? siteIds : ['00000000-0000-0000-0000-000000000000']);
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Site Admins</h2><p>Manage site administrators for your range</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddRAAdminModal()">+ Add Site Admin</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(admins || []).length ? emptyState('👤', 'No site admins yet', 'Add site admins for the sites in your range') : `
            <table>
              <thead><tr><th>Name</th><th>User Name</th><th>Phone</th><th>Assigned Site</th><th>Actions</th></tr></thead>
              <tbody>
                ${admins.map(u => `<tr>
                  <td><strong>${esc(u.name)}</strong></td>
                  <td>${esc(u.username)}</td>
                  <td>${esc(u.phone || '—')}</td>
                  <td>${u.site?.name ? esc(u.site.name) : '<span class="badge badge-warning">Unassigned</span>'}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditRAAdminModal('${u.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteProfileFn('${u.id}','ra-admins')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function rangeSiteSelectOpts(rangeId, selectedId) {
  const { data: sites } = await supa.from('sites').select('id, name').eq('range_id', rangeId).order('name');
  return (sites || []).map(s => `<option value="${s.id}" ${s.id === selectedId ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
}

async function showAddRAAdminModal() {
  const opts = await rangeSiteSelectOpts(currentUser.range_id, '');
  showModal('Add Site Admin', `
    <div class="form-group"><label>Full Name *</label><input id="mName"     type="text"     placeholder="Admin's full name"></div>
    <div class="form-group"><label>User Name *</label>     <input id="mEmail"    type="text"    placeholder="user name"></div>
    <div class="form-group"><label>Phone</label>       <input id="mPhone"    type="tel"      placeholder="Phone number"></div>
    <div class="form-group"><label>Password *</label>  <input id="mPassword" type="password" placeholder="Min 6 characters"></div>
    <div class="form-group"><label>Assign to Site</label>
      <select id="mSiteId"><option value="">— No Site —</option>${opts}</select>
    </div>`,
  async () => {
    const name = val('mName'), email = val('mEmail'), password = val('mPassword'), siteId = val('mSiteId');
    if (!name || !email || !password) return toast('Name, email and password are required', 'error'), false;
    if (password.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const password_hash = await hashPw(password);
    const { data: newAdmin, error } = await supa.from('profiles')
      .insert({ name, username: email.toLowerCase(), password_hash, phone: val('mPhone')||null, role: 'siteadmin', site_id: siteId||null })
      .select().single();
    if (error) return toast(error.message, 'error'), false;
    if (siteId) await assignAdminToSite(newAdmin.id, siteId);
    toast('Site admin created', 'success'); await navigate('ra-admins'); return true;
  });
}

async function showEditRAAdminModal(userId) {
  const { data: u } = await supa.from('profiles').select('*').eq('id', userId).single();
  if (!u) return;
  const opts = await rangeSiteSelectOpts(currentUser.range_id, u.site_id || '');
  showModal('Edit Site Admin', `
    <div class="form-group"><label>Full Name *</label><input id="mName"     type="text"     value="${esc(u.name)}"></div>
    <div class="form-group"><label>User Name *</label>     <input id="mEmail"    type="text"    value="${esc(u.username)}"></div>
    <div class="form-group"><label>Phone</label>       <input id="mPhone"    type="tel"      value="${esc(u.phone || '')}"></div>
    <div class="form-group"><label>New Password <span style="font-weight:400;color:#9ca3af">(leave blank to keep)</span></label>
      <input id="mPassword" type="password" placeholder="New password"></div>
    <div class="form-group"><label>Assigned Site</label>
      <select id="mSiteId"><option value="">— No Site —</option>${opts}</select>
    </div>`,
  async () => {
    const name = val('mName'), email = val('mEmail'), siteId = val('mSiteId'), pw = val('mPassword');
    if (!name || !email) return toast('Name and user name are required', 'error'), false;
    if (pw && pw.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const updates = { name, username: email.toLowerCase(), phone: val('mPhone')||null, site_id: siteId||null };
    if (pw) updates.password_hash = await hashPw(pw);
    const { error } = await supa.from('profiles').update(updates).eq('id', userId);
    if (error) return toast(error.message, 'error'), false;
    if (u.site_id && u.site_id !== siteId) {
      await supa.from('sites').update({ admin_id: null }).eq('id', u.site_id).eq('admin_id', userId);
    }
    if (siteId) await assignAdminToSite(userId, siteId);
    toast('Site admin updated', 'success'); await navigate('ra-admins'); return true;
  });
}

// ============================================================
//  SITE ADMIN — DASHBOARD
// ============================================================

async function renderAdminDashboard() {
  const el = document.getElementById('admin-dashboard');
  const siteId = currentUser.site_id;
  if (!siteId) {
    el.innerHTML = `<div class="panel-header"><div><h2>Dashboard</h2></div></div>${emptyState('⚠️', 'Not assigned to a site', 'Contact the super admin to assign you to a site')}`;
    return;
  }
  setLoading(el);
  try {
    const [{ data: site }, { count: usersCount }, { count: actsCount }, { data: feeRecs }, { count: dataCount }, { data: recentFees }, { data: recentActs }] = await Promise.all([
      supa.from('sites').select('name, address').eq('id', siteId).single(),
      supa.from('profiles').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('role', 'user'),
      supa.from('activities').select('*', { count: 'exact', head: true }).eq('site_id', siteId),
      supa.from('fee_records').select('amount').eq('site_id', siteId),
      supa.from('data_records').select('*', { count: 'exact', head: true }).eq('site_id', siteId),
      supa.from('fee_records').select('id, amount, date, member_id, member:members!member_id(name), collector:profiles!collected_by(name)').eq('site_id', siteId).order('date', { ascending: false }).limit(5),
      supa.from('activities').select('id, name, type, assigned_users, due_date').eq('site_id', siteId).order('created_at', { ascending: false }).limit(5),
    ]);
    const totalFees = (feeRecs || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    el.innerHTML = `
      <div class="panel-header"><div><h2>${esc(site?.name || 'Site')}</h2><p>Site Admin Dashboard${site?.address ? ' &bull; ' + esc(site.address) : ''}</p></div></div>
      <div class="stats-grid">
        ${statCard('👥', 'si-blue',   usersCount || 0,            'Users')}
        ${statCard('📋', 'si-yellow', actsCount  || 0,            'Activities')}
        ${statCard('💰', 'si-green',  '₹' + totalFees.toFixed(2), 'Fees Collected')}
        ${statCard('📝', 'si-teal',   (feeRecs || []).length,     'Fee Transactions')}
        ${statCard('📁', 'si-purple', dataCount  || 0,            'Data Records')}
      </div>
      <div class="two-col">
        <div class="card">
          <div class="card-header"><h3>Recent Activities</h3><button class="btn btn-secondary btn-sm" onclick="navigate('admin-activities')">View All</button></div>
          <div class="card-body">
            ${!(recentActs || []).length ? emptyState('📋', 'No activities yet', '') :
              recentActs.map(a => `<div class="summary-row">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <strong class="f-13">${esc(a.name)}</strong>
                  <span class="badge ${a.type === 'fee' ? 'badge-success' : 'badge-info'}">${a.type}</span>
                </div>
                <div class="meta-row">${(a.assigned_users || []).length} users &bull; Due: ${a.due_date ? fmtDate(a.due_date) : 'No deadline'}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>Recent Fee Collections</h3><button class="btn btn-secondary btn-sm" onclick="navigate('admin-fees')">View All</button></div>
          <div class="card-body">
            ${!(recentFees || []).length ? emptyState('💰', 'No fee records yet', '') :
              recentFees.map(r => `<div class="summary-row">
                <div style="display:flex;justify-content:space-between">
                  <span class="f-13 fw-bold">${esc(r.member?.name || '—')}</span>
                  <span class="fw-bold text-green">₹${parseFloat(r.amount).toFixed(2)}</span>
                </div>
                <div class="meta-row">By ${r.collector?.name ? esc(r.collector.name) : 'Unknown'} &bull; ${fmtDate(r.date)}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// ============================================================
//  SITE ADMIN — USERS
// ============================================================

async function renderAdminUsers() {
  const el = document.getElementById('admin-users');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: users, error }, { data: actData }, { data: feeData }, { data: dataData }] = await Promise.all([
      supa.from('profiles').select('id, name, username, phone, role_id, is_community_member, designation, created_at, memberRole:roles!role_id(name)').eq('site_id', siteId).eq('role', 'user').order('name'),
      supa.from('activities').select('id, assigned_users').eq('site_id', siteId),
      supa.from('fee_records').select('collected_by').eq('site_id', siteId),
      supa.from('data_records').select('collected_by').eq('site_id', siteId),
    ]);
    if (error) throw error;
    const actCounts = {}, feeCountMap = {}, dataCountMap = {};
    (actData  || []).forEach(a => (a.assigned_users || []).forEach(uid => { actCounts[uid]      = (actCounts[uid]      || 0) + 1; }));
    (feeData  || []).forEach(r => { feeCountMap[r.collected_by]  = (feeCountMap[r.collected_by]  || 0) + 1; });
    (dataData || []).forEach(r => { dataCountMap[r.collected_by] = (dataCountMap[r.collected_by] || 0) + 1; });

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Profile Users</h2><p>Manage Committee members for your Jamath (Mahallu)</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddUserModal()">+ Add Member</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(users || []).length ? emptyState('👥', 'No members yet', 'Add members to assign them to activities') : `
            <table>
              <thead><tr><th>Name</th><th>User Name</th><th>Phone</th><th>Role</th><th>Actions</th></tr></thead>
              <tbody>
                ${users.map(u => `<tr>
                  <td><strong>${esc(u.name)}</strong></td>
                  <td>${esc(u.username || '—')}</td>
                  <td>${esc(u.phone || '—')}</td>
                  <td>${u.memberRole?.name ? `<span class="badge badge-info">${esc(u.memberRole.name)}</span>` : '—'}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditUserModal('${u.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteProfileFn('${u.id}','admin-users')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// Dynamic form helpers for member modal
function toggleMemberRoleFields() {
  const sel = document.getElementById('mRoleId');
  const restrict = sel?.options[sel.selectedIndex]?.dataset?.restrict === 'true';
  const grey = 'background:#f3f4f6;color:#9ca3af;';
  const em = document.getElementById('mEmail');
  const pw = document.getElementById('mPassword');
  if (em) { em.disabled = restrict; em.style.cssText = restrict ? grey : ''; }
  if (pw) { pw.disabled = restrict; pw.style.cssText = restrict ? grey : ''; }
}

function toggleMemberCommittee() {
  const checked = document.getElementById('mIsCommittee')?.checked;
  const dg = document.getElementById('designationGroup');
  const og = document.getElementById('othersGroup');
  if (dg) dg.style.display = checked ? '' : 'none';
  if (!checked) {
    const ds = document.getElementById('mDesignation');
    if (ds) ds.value = '';
    if (og) og.style.display = 'none';
  }
}

function toggleMemberOthers() {
  const v = document.getElementById('mDesignation')?.value;
  const og = document.getElementById('othersGroup');
  if (og) og.style.display = v === 'Others' ? '' : 'none';
  if (v !== 'Others' && document.getElementById('mDesignationOther'))
    document.getElementById('mDesignationOther').value = '';
}

function memberFormBody(roles, u) {
  const roleOpts = (roles || []).map(r =>
    `<option value="${r.id}" data-restrict="${r.restrict_login}" ${u?.role_id === r.id ? 'selected' : ''}>${esc(r.name)}</option>`
  ).join('');

  const currentRole  = (roles || []).find(r => r.id === u?.role_id);
  const restrictLogin = currentRole?.restrict_login || false;
  const grey          = 'background:#f3f4f6;color:#9ca3af;';

  const isCommittee  = u?.is_community_member || false;
  const rawDesig     = u?.designation || '';
  const stdDesig     = ['President','Secretary','Treasurer','Committee Member'];
  const isOthers     = rawDesig && !stdDesig.includes(rawDesig);
  const selectDesig  = isOthers ? 'Others' : rawDesig;

  const desigOpts = ['President','Secretary','Treasurer','Committee Member','Others']
    .map(d => `<option value="${d}" ${selectDesig === d ? 'selected' : ''}>${d}</option>`).join('');

  return `
    <div class="form-group"><label>Role</label>
      <select id="mRoleId" onchange="toggleMemberRoleFields()">
        <option value="">— Select Role —</option>${roleOpts}
      </select>
    </div>
    <div class="form-group"><label>Full Name *</label>
      <input id="mName" type="text" value="${u ? esc(u.name) : ''}" placeholder="Member's full name">
    </div>
    <div class="form-group"><label>User Name</label>
      <input id="mEmail" type="text" value="${u ? esc(u.username || '') : ''}" placeholder="user name"
        ${restrictLogin ? `disabled style="${grey}"` : ''}>
    </div>
    <div class="form-group">
      <label>${u ? 'New Password <span style="font-weight:400;color:#9ca3af">(leave blank to keep)</span>' : 'Password'}</label>
      <input id="mPassword" type="password" placeholder="${u ? 'New password' : 'Min 6 characters'}"
        ${restrictLogin ? `disabled style="${grey}"` : ''}>
    </div>
    <div class="form-group"><label>Phone</label>
      <input id="mPhone" type="tel" value="${u ? esc(u.phone || '') : ''}" placeholder="Phone number">
    </div>`;
}

async function showAddUserModal() {
  const { data: roles } = await supa.from('roles').select('id, name, restrict_login').order('name');
  const noLoginRole = (roles || []).find(r => r.name.toLowerCase() === 'no login users');
  const defaultU = noLoginRole ? { role_id: noLoginRole.id } : null;
  showModal('Add New Member', memberFormBody(roles, defaultU), async () => {
    const name = val('mName');
    if (!name) return toast('Full name is required', 'error'), false;

    const sel = document.getElementById('mRoleId');
    const restrictLogin = sel?.options[sel.selectedIndex]?.dataset?.restrict === 'true';
    const username = val('mEmail'), password = val('mPassword');

    if (!restrictLogin && !username)  return toast('User name is required', 'error'), false;
    if (!restrictLogin && !password)  return toast('Password is required', 'error'), false;
    if (!restrictLogin && password.length < 6) return toast('Password must be at least 6 characters', 'error'), false;

    const password_hash = restrictLogin ? null : await hashPw(password);
    const { error } = await supa.from('profiles').insert({
      name,
      username:  restrictLogin ? null : username.toLowerCase(),
      password_hash,
      phone:     val('mPhone') || null,
      role:      'user',
      site_id:   currentUser.site_id,
      role_id:   val('mRoleId') || null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Member added', 'success'); await navigate('admin-users'); return true;
  });
}

async function showEditUserModal(userId) {
  const [{ data: u }, { data: roles }] = await Promise.all([
    supa.from('profiles').select('*').eq('id', userId).single(),
    supa.from('roles').select('id, name, restrict_login').order('name'),
  ]);
  if (!u) return;

  showModal('Edit Member', memberFormBody(roles, u), async () => {
    const name = val('mName');
    if (!name) return toast('Full name is required', 'error'), false;

    const sel = document.getElementById('mRoleId');
    const restrictLogin = sel?.options[sel.selectedIndex]?.dataset?.restrict === 'true';
    const pw = val('mPassword');

    if (pw && !restrictLogin && pw.length < 6) return toast('Password must be at least 6 characters', 'error'), false;

    const isCommittee = document.getElementById('mIsCommittee')?.checked || false;
    if (isCommittee && !val('mDesignation')) return toast('Please select a designation', 'error'), false;
    const desig = val('mDesignation');
    if (desig === 'Others' && !val('mDesignationOther')) return toast('Please enter the custom designation', 'error'), false;
    const designation = desig === 'Others' ? val('mDesignationOther') : desig;

    const updates = {
      name,
      username:  restrictLogin ? null : (val('mEmail').toLowerCase() || null),
      phone:     val('mPhone') || null,
      role_id:   val('mRoleId') || null,
    };
    if (pw && !restrictLogin) updates.password_hash = await hashPw(pw);
    const { error } = await supa.from('profiles').update(updates).eq('id', userId);
    if (error) return toast(error.message, 'error'), false;
    toast('Member updated', 'success'); await navigate('admin-users'); return true;
  });
}


// ============================================================
//  SITE ADMIN — MEMBERS
// ============================================================

async function renderAdminMembers() {
  const el = document.getElementById('admin-members');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const { data: members, error } = await supa
      .from('members')
      .select('*')
      .eq('site_id', siteId)
      .order('name');
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Members</h2><p>Jamath member details for your site</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddMemberRecordModal()">+ Add Member</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(members || []).length ? emptyState('👨‍👩‍👧‍👦', 'No members yet', 'Click "Add Member" to register a Jamath member') : `
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Community Member</th><th>Designation</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                ${members.map(m => `<tr>
                  <td><strong>${esc(m.name)}</strong></td>
                  <td>${esc(m.phone || '—')}</td>
                  <td>${m.is_community_member ? '<span class="badge badge-success">✓ Yes</span>' : '<span class="badge badge-secondary">— No</span>'}</td>
                  <td>${m.designation ? esc(m.designation) : '—'}</td>
                  <td>${esc(m.notes || '—')}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditMemberRecordModal('${m.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteMemberRecord('${m.id}')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function memberRecordFormHTML(m) {
  const isCommittee = m?.is_community_member || false;
  const rawDesig    = m?.designation || '';
  const stdDesig    = ['President','Secretary','Treasurer','Committee Member'];
  const isOthers    = rawDesig && !stdDesig.includes(rawDesig);
  const selectDesig = isOthers ? 'Others' : rawDesig;
  const desigOpts   = ['President','Secretary','Treasurer','Committee Member','Others']
    .map(d => `<option value="${d}" ${selectDesig === d ? 'selected' : ''}>${d}</option>`).join('');
  return `
    <div class="form-group"><label>Full Name *</label>
      <input id="mMemberName" type="text" value="${m ? esc(m.name) : ''}" placeholder="Member's full name">
    </div>
    <div class="form-group"><label>Phone</label>
      <input id="mMemberPhone" type="tel" value="${m ? esc(m.phone || '') : ''}" placeholder="Phone number">
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600">
        <input type="checkbox" id="mMemberIsCommittee" onchange="toggleMemberRecordCommittee()" ${isCommittee ? 'checked' : ''}>
        Is Committee Member?
      </label>
    </div>
    <div id="memberDesignationGroup" class="form-group" style="${isCommittee ? '' : 'display:none'}">
      <label>Designation *</label>
      <select id="mMemberDesignation" onchange="toggleMemberRecordOthers()">
        <option value="">— Select Designation —</option>${desigOpts}
      </select>
    </div>
    <div id="memberOthersGroup" class="form-group" style="${isOthers ? '' : 'display:none'}">
      <label>Custom Designation *</label>
      <input id="mMemberDesignationOther" type="text" value="${isOthers ? esc(rawDesig) : ''}" placeholder="Enter designation manually">
    </div>
    <div class="form-group"><label>Notes</label>
      <textarea id="mMemberNotes" placeholder="Any additional notes...">${m ? esc(m.notes || '') : ''}</textarea>
    </div>`;
}

function toggleMemberRecordCommittee() {
  const checked = document.getElementById('mMemberIsCommittee')?.checked;
  const dg = document.getElementById('memberDesignationGroup');
  const og = document.getElementById('memberOthersGroup');
  if (dg) dg.style.display = checked ? '' : 'none';
  if (!checked) {
    const ds = document.getElementById('mMemberDesignation');
    if (ds) ds.value = '';
    if (og) og.style.display = 'none';
  }
}

function toggleMemberRecordOthers() {
  const v  = document.getElementById('mMemberDesignation')?.value;
  const og = document.getElementById('memberOthersGroup');
  if (og) og.style.display = v === 'Others' ? '' : 'none';
  if (v !== 'Others' && document.getElementById('mMemberDesignationOther'))
    document.getElementById('mMemberDesignationOther').value = '';
}

async function showAddMemberRecordModal() {
  showModal('Add Member', memberRecordFormHTML(null), async () => {
    const name = val('mMemberName');
    if (!name) return toast('Full name is required', 'error'), false;
    const isCommittee = document.getElementById('mMemberIsCommittee')?.checked || false;
    if (isCommittee && !val('mMemberDesignation')) return toast('Please select a designation', 'error'), false;
    const desig = val('mMemberDesignation');
    if (desig === 'Others' && !val('mMemberDesignationOther')) return toast('Please enter the custom designation', 'error'), false;
    const designation = desig === 'Others' ? val('mMemberDesignationOther') : desig;
    const { error } = await supa.from('members').insert({
      site_id: currentUser.site_id,
      name,
      phone:               val('mMemberPhone') || null,
      is_community_member: isCommittee,
      designation:         isCommittee ? designation || null : null,
      notes:               val('mMemberNotes') || null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Member added', 'success'); await navigate('admin-members'); return true;
  });
}

async function showEditMemberRecordModal(memberId) {
  const { data: m } = await supa.from('members').select('*').eq('id', memberId).single();
  if (!m) return;
  showModal('Edit Member', memberRecordFormHTML(m), async () => {
    const name = val('mMemberName');
    if (!name) return toast('Full name is required', 'error'), false;
    const isCommittee = document.getElementById('mMemberIsCommittee')?.checked || false;
    if (isCommittee && !val('mMemberDesignation')) return toast('Please select a designation', 'error'), false;
    const desig = val('mMemberDesignation');
    if (desig === 'Others' && !val('mMemberDesignationOther')) return toast('Please enter the custom designation', 'error'), false;
    const designation = desig === 'Others' ? val('mMemberDesignationOther') : desig;
    const { error } = await supa.from('members').update({
      name,
      phone:               val('mMemberPhone') || null,
      is_community_member: isCommittee,
      designation:         isCommittee ? designation || null : null,
      notes:               val('mMemberNotes') || null,
    }).eq('id', memberId);
    if (error) return toast(error.message, 'error'), false;
    toast('Member updated', 'success'); await navigate('admin-members'); return true;
  });
}

function deleteMemberRecord(memberId) {
  confirmAction('Delete this member record? This cannot be undone.', async () => {
    const { error } = await supa.from('members').delete().eq('id', memberId);
    if (error) return toast(error.message, 'error');
    toast('Member deleted', 'success'); await navigate('admin-members');
  });
}

// ============================================================
//  SITE ADMIN — DEPENDENTS
// ============================================================

async function renderAdminDependents() {
  const el = document.getElementById('admin-dependents');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const { data: dependents, error } = await supa
      .from('dependents')
      .select('*, guardian:members!guardian_id(id,name)')
      .eq('site_id', siteId)
      .order('name');
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Dependents</h2><p>Dependent member details for your Jamath (Mahallu)</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddDependentModal()">+ Add Dependent</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(dependents || []).length ? emptyState('👶', 'No dependents yet', 'Click "Add Dependent" to register a dependent') : `
            <table>
              <thead><tr><th>Name</th><th>Guardian</th><th>Phone</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                ${dependents.map(d => `<tr>
                  <td><strong>${esc(d.name)}</strong></td>
                  <td>${d.guardian?.name ? esc(d.guardian.name) : '<span class="badge badge-warning">Unassigned</span>'}</td>
                  <td>${esc(d.phone || '—')}</td>
                  <td>${esc(d.notes || '—')}</td>
                  <td><div class="table-actions">
                    <button class="btn btn-secondary btn-sm" onclick="showEditDependentModal('${d.id}')">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm"    onclick="deleteDependent('${d.id}')">🗑️</button>
                  </div></td>
                </tr>`).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function guardianSelectOpts(siteId, selectedId) {
  const { data: members } = await supa.from('members').select('id, name').eq('site_id', siteId).order('name');
  return (members || []).map(m =>
    `<option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>${esc(m.name)}</option>`
  ).join('');
}

function dependentFormHTML(guardianOpts, d) {
  return `
    <div class="form-group"><label>Guardian *</label>
      <select id="mGuardianId">
        <option value="">— Select Guardian —</option>${guardianOpts}
      </select>
    </div>
    <div class="form-group"><label>Full Name *</label>
      <input id="mDepName" type="text" value="${d ? esc(d.name) : ''}" placeholder="Dependent's full name">
    </div>
    <div class="form-group"><label>Phone</label>
      <input id="mDepPhone" type="tel" value="${d ? esc(d.phone || '') : ''}" placeholder="Phone number">
    </div>
    <div class="form-group"><label>Notes</label>
      <textarea id="mDepNotes" placeholder="Any additional notes...">${d ? esc(d.notes || '') : ''}</textarea>
    </div>`;
}

async function showAddDependentModal() {
  const opts = await guardianSelectOpts(currentUser.site_id, '');
  showModal('Add Dependent', dependentFormHTML(opts, null), async () => {
    const name = val('mDepName');
    if (!name) return toast('Full name is required', 'error'), false;
    const { error } = await supa.from('dependents').insert({
      site_id:     currentUser.site_id,
      guardian_id: val('mGuardianId') || null,
      name,
      phone:       val('mDepPhone') || null,
      notes:       val('mDepNotes') || null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Dependent added', 'success'); await navigate('admin-dependents'); return true;
  });
}

async function showEditDependentModal(depId) {
  const [{ data: d }, opts] = await Promise.all([
    supa.from('dependents').select('*').eq('id', depId).single(),
    guardianSelectOpts(currentUser.site_id, ''),
  ]);
  if (!d) return;
  const guardianOpts = await guardianSelectOpts(currentUser.site_id, d.guardian_id || '');
  showModal('Edit Dependent', dependentFormHTML(guardianOpts, d), async () => {
    const name = val('mDepName');
    if (!name) return toast('Full name is required', 'error'), false;
    const { error } = await supa.from('dependents').update({
      guardian_id: val('mGuardianId') || null,
      name,
      phone:       val('mDepPhone') || null,
      notes:       val('mDepNotes') || null,
    }).eq('id', depId);
    if (error) return toast(error.message, 'error'), false;
    toast('Dependent updated', 'success'); await navigate('admin-dependents'); return true;
  });
}

function deleteDependent(depId) {
  confirmAction('Delete this dependent record? This cannot be undone.', async () => {
    const { error } = await supa.from('dependents').delete().eq('id', depId);
    if (error) return toast(error.message, 'error');
    toast('Dependent deleted', 'success'); await navigate('admin-dependents');
  });
}

// ============================================================
//  SITE ADMIN — ACTIVITIES
// ============================================================

async function renderAdminActivities() {
  const el = document.getElementById('admin-activities');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: activities, error }, { count: siteUsersCount }, { data: feeAmts }, { data: feeCounts }, { data: dataCounts }] = await Promise.all([
      supa.from('activities').select('*').eq('site_id', siteId).order('created_at', { ascending: false }),
      supa.from('profiles').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('role', 'user'),
      supa.from('fee_records').select('activity_id, amount').eq('site_id', siteId),
      supa.from('fee_records').select('activity_id').eq('site_id', siteId),
      supa.from('data_records').select('activity_id').eq('site_id', siteId),
    ]);
    if (error) throw error;
    const feeAmtMap = {}, feeCountMap = {}, dataCountMap = {};
    (feeAmts   || []).forEach(r => { feeAmtMap[r.activity_id]   = (feeAmtMap[r.activity_id]   || 0) + parseFloat(r.amount || 0); });
    (feeCounts || []).forEach(r => { feeCountMap[r.activity_id]  = (feeCountMap[r.activity_id]  || 0) + 1; });
    (dataCounts|| []).forEach(r => { dataCountMap[r.activity_id] = (dataCountMap[r.activity_id] || 0) + 1; });

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Manage Events</h2><p>Create and assign payment and data collection events</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddActivityModal()">+ Create Activity</button></div>
      </div>
      ${!(activities || []).length ? emptyState('📋', 'No activities yet', 'Create fee collection or data collection activities and assign them to users') : `
        <div class="activity-grid">
          ${activities.map(a => {
            const assigned  = (a.assigned_users || []).length;
            const records   = a.type === 'fee' ? (feeCountMap[a.id] || 0) : (dataCountMap[a.id] || 0);
            const collected = a.type === 'fee' ? (feeAmtMap[a.id]   || 0) : null;
            const overdue   = a.due_date && new Date(a.due_date) < new Date();
            return `<div class="activity-card ${a.type} ${overdue ? 'overdue' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <h4>${esc(a.name)}</h4>
                <span class="badge ${a.type === 'fee' ? 'badge-success' : 'badge-info'}">${a.type === 'fee' ? '💰 Fee' : '📁 Data'}</span>
              </div>
              <div class="activity-meta">
                ${a.type === 'fee' ? `<div>Target: <strong>₹${parseFloat(a.target_amount || 0).toFixed(2)}</strong>/person</div>` : ''}
                ${a.description ? `<div>${esc(a.description)}</div>` : ''}
                <div>Due: ${a.due_date ? fmtDate(a.due_date) : 'No deadline'} ${overdue ? '<span class="badge badge-danger">Overdue</span>' : ''}</div>
              </div>
              <div class="activity-stats">
                <span>👥 ${assigned}/${siteUsersCount || 0} assigned</span>
                <span>📝 ${records} records</span>
                ${collected !== null ? `<span class="text-green">💰 ₹${collected.toFixed(2)}</span>` : ''}
              </div>
              <div class="activity-actions">
                <button class="btn btn-secondary btn-sm" onclick="showEditActivityModal('${a.id}')">✏️ Edit</button>
                <button class="btn btn-primary btn-sm"   onclick="showAssignModal('${a.id}')">👥 Assign</button>
                <button class="btn btn-danger btn-sm"    onclick="deleteActivity('${a.id}')">🗑️</button>
              </div>
            </div>`;
          }).join('')}
        </div>`}`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function activityFormHTML(a) {
  const isFee = !a || a.type === 'fee';
  return `
    <div class="form-group"><label>Activity Name *</label>
      <input id="mActName" type="text" value="${a ? esc(a.name) : ''}" placeholder="e.g., Monthly Maintenance Fee"></div>
    <div class="form-group"><label>Type *</label>
      <select id="mActType" onchange="toggleFeeField()">
        <option value="fee"  ${isFee ? 'selected' : ''}>💰 Fee Collection</option>
        <option value="data" ${!isFee ? 'selected' : ''}>📁 Data Collection</option>
      </select></div>
    <div id="feeAmountField" class="form-group" ${!isFee ? 'style="display:none"' : ''}>
      <label>Target Amount per Person ($)</label>
      <input id="mActAmount" type="number" min="0" step="0.01" value="${a && a.target_amount ? a.target_amount : ''}" placeholder="0.00"></div>
    <div id="feeAllowEditField" class="form-group" ${!isFee ? 'style="display:none"' : ''}>
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="mAllowTargetEdit" ${a?.allow_target_edit ? 'checked' : ''}>
        Allow target amount update in Payment Edit
      </label></div>
    <div class="form-group"><label>Due Date</label>
      <input id="mActDue" type="date" value="${a && a.due_date ? a.due_date : ''}"></div>
    <div class="form-group"><label>Description</label>
      <textarea id="mActDesc" placeholder="Activity description...">${a ? esc(a.description || '') : ''}</textarea></div>`;
}

async function showAddActivityModal() {
  showModal('Create Activity', activityFormHTML(null), async () => {
    const name = val('mActName'), type = val('mActType');
    if (!name) return toast('Activity name is required', 'error'), false;
    const { error } = await supa.from('activities').insert({
      name, type, site_id: currentUser.site_id,
      target_amount:    type === 'fee' ? parseFloat(val('mActAmount') || 0) : null,
      allow_target_edit: type === 'fee' ? (document.getElementById('mAllowTargetEdit')?.checked || false) : false,
      due_date:         val('mActDue') || null,
      description:      val('mActDesc') || null,
      assigned_users:   [],
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Activity created', 'success'); await navigate('admin-activities'); return true;
  });
}

async function showEditActivityModal(actId) {
  const { data: a } = await supa.from('activities').select('*').eq('id', actId).single();
  if (!a) return;
  showModal('Edit Activity', activityFormHTML(a), async () => {
    const name = val('mActName'), type = val('mActType');
    if (!name) return toast('Activity name is required', 'error'), false;
    const { error } = await supa.from('activities').update({
      name, type,
      target_amount:    type === 'fee' ? parseFloat(val('mActAmount') || 0) : null,
      allow_target_edit: type === 'fee' ? (document.getElementById('mAllowTargetEdit')?.checked || false) : false,
      due_date:         val('mActDue') || null,
      description:      val('mActDesc') || null,
    }).eq('id', actId);
    if (error) return toast(error.message, 'error'), false;
    toast('Activity updated', 'success'); await navigate('admin-activities'); return true;
  });
}

function toggleFeeField() {
  const field      = document.getElementById('feeAmountField');
  const editField  = document.getElementById('feeAllowEditField');
  const type       = document.getElementById('mActType');
  const isFee      = type?.value === 'fee';
  if (field)     field.style.display     = isFee ? '' : 'none';
  if (editField) editField.style.display = isFee ? '' : 'none';
}

async function showAssignModal(actId) {
  const [{ data: act }, { data: siteMembers }] = await Promise.all([
    supa.from('activities').select('id, name, assigned_users').eq('id', actId).single(),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).order('name'),
  ]);
  if (!act) return;

  const listHTML = !(siteMembers || []).length
    ? '<p style="color:#6b7280;font-size:13px">No members in this site. Add members first.</p>'
    : `
      <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#f9fafb;border-radius:8px;margin-bottom:8px;font-weight:600;font-size:13px;cursor:pointer">
        <input type="checkbox" id="selectAllMembers" onchange="toggleSelectAllMembers()"> Select All
      </label>
      <div class="checkbox-group">
        ${siteMembers.map(m => `<label>
          <input type="checkbox" class="memberCheck" value="${m.id}" ${(act.assigned_users || []).includes(m.id) ? 'checked' : ''}>
          ${esc(m.name)}
        </label>`).join('')}
      </div>`;

  showModal(`Assign Members — ${esc(act.name)}`,
    `<p class="f-12" style="color:#6b7280;margin-bottom:10px">Select members to assign to this activity:</p>${listHTML}`,
  async () => {
    const selected = [...document.querySelectorAll('.memberCheck:checked')].map(c => c.value);
    const { error } = await supa.from('activities').update({ assigned_users: selected }).eq('id', actId);
    if (error) return toast(error.message, 'error'), false;
    toast(`${selected.length} member(s) assigned`, 'success'); await navigate('admin-activities'); return true;
  });
}

function toggleSelectAllMembers() {
  const checked = document.getElementById('selectAllMembers')?.checked;
  document.querySelectorAll('.memberCheck').forEach(cb => cb.checked = checked);
}

function deleteActivity(actId) {
  confirmAction('Delete this activity? All associated records will be removed.', async () => {
    const { error } = await supa.from('activities').delete().eq('id', actId);
    if (error) return toast(error.message, 'error');
    toast('Activity deleted', 'success'); await navigate('admin-activities');
  });
}

// ============================================================
//  SITE ADMIN — FEE RECORDS
// ============================================================

async function renderAdminFees() {
  const el = document.getElementById('admin-fees');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: feeActs, error }, { data: feeRecords }] = await Promise.all([
      supa.from('activities').select('id, name, target_amount, assigned_users').eq('site_id', siteId).eq('type', 'fee').order('name'),
      supa.from('fee_records').select('id, member_id, activity_id, amount, date, target_amount').eq('site_id', siteId).not('member_id', 'is', null).limit(10000),
    ]);
    if (error) throw error;

    // Collect all assigned member IDs across all fee activities
    const allMemberIds = [...new Set((feeActs || []).flatMap(a => a.assigned_users || []))];
    const { data: allMembers } = allMemberIds.length
      ? await supa.from('members').select('id, name').in('id', allMemberIds).order('name')
      : { data: [] };
    const memberMap = {};
    (allMembers || []).forEach(m => { memberMap[m.id] = m; });

    // Build one row per member per activity
    const rows = [];
    (feeActs || []).forEach(act => {
      (act.assigned_users || []).forEach(mId => {
        const member = memberMap[mId];
        if (!member) return;
        const payments  = (feeRecords || []).filter(r => r.activity_id === act.id && r.member_id === mId);
        const totalPaid = payments.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
        // Use saved target_amount from the latest record if customised, else fall back to activity target
        const latestRec = payments.length ? payments.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
        const target    = parseFloat(latestRec?.target_amount || act.target_amount || 0);
        const status    = target > 0
          ? (totalPaid >= target ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid')
          : (payments.length > 0 ? 'paid' : 'unpaid');
        const latestPayment = latestRec || null;
        rows.push({ member, act, payments, totalPaid, target, status, latestPayment });
      });
    });

    const totalCollected = rows.reduce((s, r) => s + r.totalPaid, 0);
    const paidCount      = rows.filter(r => r.status === 'paid').length;
    const unpaidCount    = rows.filter(r => r.status !== 'paid').length;

    const statusBadge = s => s === 'paid'
      ? '<span class="badge badge-success">✓ Paid</span>'
      : s === 'partial'
      ? '<span class="badge badge-warning">~ Partial</span>'
      : '<span class="badge badge-danger">✗ Unpaid</span>';

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Payment Collections</h2><p>Member-wise payment status for all events</p></div>
        <div class="panel-header-actions"><button class="btn btn-secondary" onclick="exportFeeCSV()">⬇️ Export CSV</button></div>
      </div>
      <div class="stats-grid">
        ${statCard('💰', 'si-green',  '₹' + totalCollected.toFixed(2), 'Total Collected')}
        ${statCard('✅', 'si-teal',   paidCount,                        'Paid')}
        ${statCard('⏳', 'si-yellow', unpaidCount,                      'Pending')}
        ${statCard('👥', 'si-blue',   rows.length,                      'Total Assignments')}
      </div>
      <div class="card">
        <div class="card-body">
          <div class="filters">
            <input class="filter-grow" id="feeSearch" type="text" placeholder="🔍 Search member or event..." oninput="filterFeeTableFull()">
            <select id="feeActF" onchange="filterFeeTableFull()">
              <option value="">All Events</option>
              ${(feeActs || []).map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}
            </select>
            <select id="feeStatusF" onchange="filterFeeTableFull()">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div class="table-wrapper">
            <table id="feeTable">
              <thead><tr><th>Member</th><th>Event</th><th>Target Amt</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${!rows.length ? `<tr><td colspan="7">${emptyState('💰', 'No members assigned to fee events', 'Assign members to events in Manage Events')}</td></tr>` :
                  rows.map(r => `<tr data-act="${r.act.id}" data-status="${r.status}" data-search="${esc(r.member.name + ' ' + r.act.name).toLowerCase()}">
                    <td><strong>${esc(r.member.name)}</strong></td>
                    <td>${esc(r.act.name)}</td>
                    <td>${r.target > 0 ? '₹' + r.target.toFixed(2) : '—'}</td>
                    <td><strong class="text-green">₹${r.totalPaid.toFixed(2)}</strong>${r.payments.length > 1 ? `<div class="f-12" style="color:#9ca3af">${r.payments.length} payments</div>` : ''}</td>
                    <td>${r.target > 0 ? '₹' + Math.max(0, r.target - r.totalPaid).toFixed(2) : '—'}</td>
                    <td>${statusBadge(r.status)}</td>
                    <td>
                      <div class="table-actions">
                        ${r.status !== 'paid'
                          ? `<button class="btn btn-success btn-sm" onclick="showRecordFeeForMember('${r.act.id}','${r.member.id}','${esc(r.member.name)}',${r.totalPaid})">💰 Record</button>`
                          : ''}
                        ${r.latestPayment
                          ? `<button class="btn btn-secondary btn-sm" onclick="showEditFeeRecord('${r.latestPayment.id}',${r.target})">✏️ Edit</button>`
                          : ''}
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// Opens record payment modal pre-filled with specific member from admin view
async function showRecordFeeForMember(actId, memberId, memberName, totalPaid = 0) {
  const { data: act } = await supa.from('activities').select('*').eq('id', actId).single();
  if (!act) return;
  const target  = parseFloat(act.target_amount || 0);
  const balance = target > 0 ? Math.max(0, target - totalPaid) : 0;
  showModal(`Record Payment — ${esc(act.name)}`, `
    <div class="form-group"><label>Member</label>
      <input type="text" value="${esc(memberName)}" disabled style="background:#f3f4f6;color:#6b7280">
    </div>
    <div class="form-group"><label>Target Amount</label>
      <input type="text" value="${target > 0 ? '₹' + target.toFixed(2) : '—'}" disabled style="background:#f3f4f6;color:#6b7280">
    </div>
    ${totalPaid > 0 ? `<div class="form-group"><label>Already Paid</label>
      <input type="text" value="₹${parseFloat(totalPaid).toFixed(2)}" disabled style="background:#f3f4f6;color:#6b7280">
    </div>` : ''}
    <div class="form-group"><label>Amount ($) *</label>
      <input id="mAmount" type="number" min="0.01" step="0.01" max="${balance || target || ''}" value="${(balance || target) || ''}" placeholder="0.00">
      ${balance > 0 ? `<div class="f-12" style="color:#6b7280;margin-top:4px">Maximum (balance): ₹${balance.toFixed(2)}</div>` : ''}
    </div>
    <div class="form-group"><label>Date *</label>
      <input id="mDate" type="date" value="${new Date().toISOString().slice(0, 10)}">
    </div>
    <div class="form-group"><label>Notes</label>
      <textarea id="mNotes" placeholder="Additional notes..."></textarea>
    </div>`,
  async () => {
    const amount = parseFloat(val('mAmount')), date = val('mDate');
    if (!amount || amount <= 0)                   return toast('Valid amount is required', 'error'), false;
    if (balance > 0 && amount > balance)           return toast(`Amount cannot exceed balance of ₹${balance.toFixed(2)}`, 'error'), false;
    if (!balance && target > 0 && amount > target) return toast(`Amount cannot exceed target of ₹${target.toFixed(2)}`, 'error'), false;
    if (!date)                                     return toast('Date is required', 'error'), false;
    const { error } = await supa.from('fee_records').insert({
      activity_id: actId, site_id: currentUser.site_id,
      collected_by: currentUser.id, member_id: memberId,
      amount, date, notes: val('mNotes') || null,
      target_amount: target > 0 ? target : null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Payment recorded!', 'success'); await navigate('admin-fees'); return true;
  });
}

async function showEditFeeRecord(recordId, targetAmt) {
  const { data: r } = await supa.from('fee_records')
    .select('*, member:members!member_id(name), activity:activities!activity_id(name,allow_target_edit,target_amount)')
    .eq('id', recordId).single();
  if (!r) return;

  // Sum all payments for this member+activity to show accurate total paid
  const { data: allPayments } = await supa.from('fee_records')
    .select('amount')
    .eq('member_id', r.member_id)
    .eq('activity_id', r.activity_id);
  const totalPaid = (allPayments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const canEditTarget = r.activity?.allow_target_edit || false;
  // Prefer the record's own saved target_amount over the activity default
  const target = parseFloat(r.target_amount || targetAmt || r.activity?.target_amount || 0);
  const grey   = 'background:#f3f4f6;color:#6b7280';
  showModal(`Edit Payment — ${esc(r.activity?.name || '')}`, `
    <div class="form-group"><label>Member</label>
      <input type="text" value="${esc(r.member?.name || '—')}" disabled style="${grey}">
    </div>
    <div class="form-group"><label>Total Paid Amount</label>
      <input type="text" value="₹${totalPaid.toFixed(2)}" disabled style="${grey}">
    </div>
    <div class="form-group"><label>Target Amount ($)</label>
      <input id="mTargetAmount" type="number" min="0.01" step="0.01"
        value="${target > 0 ? target : ''}" placeholder="0.00"
        ${!canEditTarget ? `disabled style="${grey}"` : ''}>
      ${!canEditTarget ? '<div class="f-12" style="color:#9ca3af;margin-top:4px">Target amount editing is disabled for this event</div>' : ''}
    </div>
    <div class="form-group"><label>Date</label>
      <input id="mDate" type="date" value="${r.date}">
    </div>
    <div class="form-group"><label>Notes</label>
      <textarea id="mNotes" placeholder="Additional notes...">${esc(r.notes || '')}</textarea>
    </div>`,
  async () => {
    const date = val('mDate');
    if (!date) return toast('Date is required', 'error'), false;
    const newTarget = canEditTarget ? parseFloat(val('mTargetAmount') || 0) : null;
    if (canEditTarget && newTarget > 0 && newTarget < totalPaid)
      return toast(`Target amount must be at least the total paid (₹${totalPaid.toFixed(2)})`, 'error'), false;
    // Only update target_amount on the latest record; never touch amount
    const updates = { date, notes: val('mNotes') || null };
    if (canEditTarget) updates.target_amount = newTarget > 0 ? newTarget : null;
    const { error } = await supa.from('fee_records').update(updates).eq('id', recordId);
    if (error) return toast(error.message, 'error'), false;
    toast('Payment updated!', 'success'); await navigate('admin-fees'); return true;
  });
}

async function exportFeeCSV() {
  const { data: records } = await supa.from('fee_records')
    .select('payer_phone, amount, date, notes, activity:activities!activity_id(name), member:members!member_id(name), collector:profiles!collected_by(name)')
    .eq('site_id', currentUser.site_id).order('date', { ascending: false });
  if (!(records || []).length) return toast('No records to export', 'warning');
  const rows = records.map(r => [r.member?.name || '', r.payer_phone || '', r.amount, r.activity?.name || '', r.collector?.name || '', r.date, r.notes || '']);
  downloadCSV(['Member', 'Payer Name', 'Phone', 'Amount', 'Activity', 'Collector', 'Date', 'Notes'], rows, 'payment-collections.csv');
}

function deleteFeeRecord(id) {
  confirmAction('Delete this fee record?', async () => {
    const { error } = await supa.from('fee_records').delete().eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Record deleted', 'success'); await navigate('admin-fees');
  });
}

// ============================================================
//  SITE ADMIN — DATA RECORDS
// ============================================================

async function renderAdminData() {
  const el = document.getElementById('admin-data');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: records, error }, { data: dataActs }] = await Promise.all([
      supa.from('data_records')
        .select('id, person_name, address, phone, date, activity_id, activity:activities!activity_id(id,name), collector:profiles!collected_by(name)')
        .eq('site_id', siteId).order('date', { ascending: false }),
      supa.from('activities').select('id, name').eq('site_id', siteId).eq('type', 'data'),
    ]);
    if (error) throw error;

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Data Records</h2><p>All data collection records for your site</p></div>
        <div class="panel-header-actions"><button class="btn btn-secondary" onclick="exportDataCSV()">⬇️ Export CSV</button></div>
      </div>
      <div class="card">
        <div class="card-body">
          <div class="filters">
            <input  class="filter-grow" id="dataSearch" type="text" placeholder="🔍 Search..." oninput="filterTable('dataTable','dataSearch','dataActF')">
            <select id="dataActF" onchange="filterTable('dataTable','dataSearch','dataActF')">
              <option value="">All Activities</option>
              ${(dataActs || []).map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}
            </select>
          </div>
          <div class="table-wrapper">
            <table id="dataTable">
              <thead><tr><th>Person Name</th><th>Address</th><th>Phone</th><th>Activity</th><th>Collector</th><th>Date</th><th>Del</th></tr></thead>
              <tbody>
                ${!(records || []).length ? `<tr><td colspan="7">${emptyState('📁', 'No data records yet', '')}</td></tr>` :
                  records.map(r => `<tr data-act="${r.activity_id || ''}">
                    <td><strong>${esc(r.person_name)}</strong></td>
                    <td>${esc(r.address || '—')}</td>
                    <td>${esc(r.phone || '—')}</td>
                    <td>${r.activity?.name ? esc(r.activity.name) : '—'}</td>
                    <td>${r.collector?.name ? esc(r.collector.name) : '—'}</td>
                    <td>${fmtDate(r.date)}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteDataRecord('${r.id}')">🗑️</button></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function exportDataCSV() {
  const { data: records } = await supa.from('data_records')
    .select('person_name, address, phone, email, date, notes, activity:activities!activity_id(name), collector:profiles!collected_by(name)')
    .eq('site_id', currentUser.site_id).order('date', { ascending: false });
  if (!(records || []).length) return toast('No records to export', 'warning');
  const rows = records.map(r => [r.person_name, r.address || '', r.phone || '', r.email || '', r.activity?.name || '', r.collector?.name || '', r.date, r.notes || '']);
  downloadCSV(['Person Name', 'Address', 'Phone', 'Email', 'Activity', 'Collector', 'Date', 'Notes'], rows, 'data-records.csv');
}

function deleteDataRecord(id) {
  confirmAction('Delete this data record?', async () => {
    const { error } = await supa.from('data_records').delete().eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Record deleted', 'success'); await navigate('admin-data');
  });
}

// ============================================================
//  SITE ADMIN — REPORTS
// ============================================================

async function renderAdminReports() {
  const el = document.getElementById('admin-reports');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: feeActs, error }, { data: allMembers }, { data: feeRecords }] = await Promise.all([
      supa.from('activities').select('id, name, target_amount, assigned_users, due_date, created_at').eq('site_id', siteId).eq('type', 'fee').order('created_at'),
      supa.from('members').select('id, name').eq('site_id', siteId).order('name'),
      supa.from('fee_records').select('member_id, activity_id, amount, date, target_amount').eq('site_id', siteId).not('member_id', 'is', null).limit(10000),
    ]);
    if (error) throw error;

    // Unique years from activity due_date or created_at for year filter
    const years = [...new Set((feeActs || []).map(a => {
      const d = a.due_date || a.created_at;
      return d ? new Date(d).getFullYear().toString() : null;
    }).filter(Boolean))].sort().reverse();

    // Store data for filter-driven re-render without extra network calls
    window._rptData = { feeActs: feeActs || [], allMembers: allMembers || [], feeRecords: feeRecords || [] };

    el.innerHTML = `
      <div class="panel-header"><div><h2>Reports</h2><p>Member-wise payment report across all events</p></div></div>
      <div class="card">
        <div class="card-header">
          <h3>Payment Report</h3>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <select id="rptYear" onchange="refreshAdminReport()" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
              <option value="">All Years</option>
              ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
            </select>
            <select id="rptStatus" onchange="refreshAdminReport()" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
              <option value="">All Status</option>
              <option value="paid">✓ Paid</option>
              <option value="partial">~ Partial</option>
              <option value="unpaid">✗ Unpaid</option>
            </select>
          </div>
        </div>
        <div class="card-body" id="reportTableBody" style="padding:0">
          ${buildReportTable('', '')}
        </div>
      </div>
      <div style="padding:12px 18px;font-size:11px;color:#9ca3af">
        Legend: &nbsp;
        <span class="badge badge-success">$X.XX</span> Paid &nbsp;
        <span style="color:#059669;font-weight:700">$X.XX</span> <span style="color:#ef4444;font-size:11px">($Y.YY)</span> Partial (outstanding in red) &nbsp;
        <span class="badge badge-secondary">—</span> Not assigned
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function buildReportTable(yearFilter, statusFilter) {
  const { feeActs, allMembers, feeRecords } = window._rptData || { feeActs: [], allMembers: [], feeRecords: [] };

  // Filter activities by year
  const visibleActs = feeActs.filter(a => {
    if (!yearFilter) return true;
    const d = a.due_date || a.created_at;
    return d && new Date(d).getFullYear().toString() === yearFilter;
  });
  if (!visibleActs.length) return `<div style="padding:20px">${emptyState('📋', 'No events found for this year', '')}</div>`;

  // Only members assigned to at least one visible activity
  const assignedIds = new Set(visibleActs.flatMap(a => a.assigned_users || []));
  const visibleMembers = allMembers.filter(m => assignedIds.has(m.id));
  if (!visibleMembers.length) return `<div style="padding:20px">${emptyState('👥', 'No members assigned to these events', '')}</div>`;

  // Payment map: payMap[memberId][actId] = totalPaid
  const payMap = {};
  feeRecords.forEach(r => {
    if (!r.member_id) return;
    if (!payMap[r.member_id]) payMap[r.member_id] = {};
    payMap[r.member_id][r.activity_id] = (payMap[r.member_id][r.activity_id] || 0) + parseFloat(r.amount || 0);
  });

  // Build rows
  const rows = visibleMembers.map(m => {
    let totalPaid = 0, totalOutstanding = 0;
    const cells = visibleActs.map(a => {
      if (!(a.assigned_users || []).includes(m.id)) return null;
      const memberPayments = feeRecords.filter(r => r.activity_id === a.id && r.member_id === m.id);
      const paid    = memberPayments.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      const latest  = memberPayments.length ? memberPayments.sort((x, y) => new Date(y.date) - new Date(x.date))[0] : null;
      const target  = parseFloat(latest?.target_amount || a.target_amount || 0);
      const outstanding = target > 0 ? Math.max(0, target - paid) : 0;
      totalPaid       += paid;
      totalOutstanding += outstanding;
      return { paid, target, outstanding };
    });
    const anyAssigned = cells.some(c => c !== null);
    const status = !anyAssigned ? 'unpaid'
      : totalOutstanding === 0 && totalPaid > 0 ? 'paid'
      : totalPaid > 0 ? 'partial' : 'unpaid';
    return { m, cells, totalPaid, totalOutstanding, status };
  }).filter(r => !statusFilter || r.status === statusFilter);

  if (!rows.length) return `<div style="padding:20px">${emptyState('📋', 'No members match the selected filter', '')}</div>`;

  const cellHTML = c => {
    if (c === null) return `<td style="background:#f9fafb;text-align:center;color:#d1d5db">\u2014</td>`;
    if (c.paid === 0 && c.target === 0) return `<td style="text-align:center">\u2014</td>`;
    if (c.outstanding > 0 && c.paid === 0) return `<td style="text-align:center"><span class="badge badge-danger">₹${c.outstanding.toFixed(2)}</span></td>`;
    if (c.outstanding > 0) return `<td style="text-align:center"><span class="text-green fw-bold">₹${c.paid.toFixed(2)}</span><br><span style="color:#ef4444;font-size:11px">(₹${c.outstanding.toFixed(2)})</span></td>`;
    return `<td style="text-align:center"><span class="badge badge-success">₹${c.paid.toFixed(2)}</span></td>`;
  };

  const statusBadge = s => s === 'paid'
    ? '<span class="badge badge-success">\u2713 Paid</span>'
    : s === 'partial' ? '<span class="badge badge-warning">~ Partial</span>'
    : '<span class="badge badge-danger">\u2717 Unpaid</span>';

  return `<div style="overflow-x:auto">
    <table style="min-width:max-content">
      <thead>
        <tr>
          <th style="position:sticky;left:0;background:#f9fafb;z-index:2;min-width:160px">Member</th>
          ${visibleActs.map(a => `<th style="text-align:center;min-width:130px">
            ${esc(a.name)}
            ${a.target_amount ? `<div style="font-weight:400;font-size:10px;color:#9ca3af">Target: ₹${parseFloat(a.target_amount).toFixed(2)}</div>` : ''}
          </th>`).join('')}
          <th style="text-align:center;min-width:100px">Total Paid</th>
          <th style="text-align:center;min-width:120px">Outstanding</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `<tr>
          <td style="position:sticky;left:0;background:white;border-right:1px solid #e5e7eb;min-width:160px">
            <strong>${esc(row.m.name)}</strong>
            <div class="meta-row" style="margin-top:3px">${statusBadge(row.status)}</div>
          </td>
          ${row.cells.map(c => cellHTML(c)).join('')}
          <td style="text-align:center"><strong class="text-green">₹${row.totalPaid.toFixed(2)}</strong></td>
          <td style="text-align:center">${row.totalOutstanding > 0
            ? `<span style="color:#ef4444;font-weight:700">₹${row.totalOutstanding.toFixed(2)}</span>`
            : '<span class="badge badge-success">Nil</span>'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function refreshAdminReport() {
  const year   = document.getElementById('rptYear')?.value   || '';
  const status = document.getElementById('rptStatus')?.value || '';
  const body   = document.getElementById('reportTableBody');
  if (body) body.innerHTML = buildReportTable(year, status);
}

// ============================================================
//  USER — DASHBOARD
// ============================================================

async function renderUserDashboard() {
  const el = document.getElementById('user-dashboard');
  setLoading(el);
  try {
    const userId = currentUser.id;
    const [{ data: myActs }, { data: myFees }, { data: myDatas }, { data: site }] = await Promise.all([
      supa.from('activities').select('*').contains('assigned_users', [userId]),
      supa.from('fee_records').select('amount').eq('collected_by', userId),
      supa.from('data_records').select('id').eq('collected_by', userId),
      currentUser.site_id ? supa.from('sites').select('name').eq('id', currentUser.site_id).single() : Promise.resolve({ data: null }),
    ]);
    const totalFees = (myFees || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    el.innerHTML = `
      <div class="panel-header"><div><h2>My Dashboard</h2><p>${site?.name ? esc(site.name) : 'Not assigned to a site'}</p></div></div>
      <div class="stats-grid">
        ${statCard('📋', 'si-yellow', (myActs  || []).length,      'My Activities')}
        ${statCard('💰', 'si-green',  '₹' + totalFees.toFixed(2),  'Fees Collected')}
        ${statCard('📝', 'si-blue',   (myFees  || []).length,      'Fee Transactions')}
        ${statCard('📁', 'si-purple', (myDatas || []).length,      'Data Records')}
      </div>
      <div class="card">
        <div class="card-header"><h3>My Assigned Activities</h3></div>
        <div class="card-body">
          ${!(myActs || []).length
            ? emptyState('📋', 'No activities assigned yet', 'Your site admin will assign activities to you')
            : `<div class="activity-grid">
                ${myActs.map(a => {
                  const overdue = a.due_date && new Date(a.due_date) < new Date();
                  const panel   = a.type === 'fee' ? 'user-fees' : 'user-data';
                  return `<div class="activity-card ${a.type} ${overdue ? 'overdue' : ''}">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                      <h4>${esc(a.name)}</h4>
                      <span class="badge ${a.type === 'fee' ? 'badge-success' : 'badge-info'}">${a.type === 'fee' ? '💰 Fee' : '📁 Data'}</span>
                    </div>
                    <div class="activity-meta">
                      ${a.type === 'fee' ? `<div>Amount: <strong>₹${parseFloat(a.target_amount || 0).toFixed(2)}</strong>/person</div>` : ''}
                      <div>Due: ${a.due_date ? fmtDate(a.due_date) : 'No deadline'} ${overdue ? '<span class="badge badge-danger">Overdue</span>' : ''}</div>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="navigate('${panel}')">
                      ${a.type === 'fee' ? '💰 Collect Fee' : '📁 Record Data'}
                    </button>
                  </div>`;
                }).join('')}
              </div>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// ============================================================
//  USER — FEE COLLECTION
// ============================================================

async function renderUserFees() {
  const el = document.getElementById('user-fees');
  setLoading(el);
  try {
    const userId = currentUser.id;
    const [{ data: myFeeActs }, { data: myFeeRecs }] = await Promise.all([
      supa.from('activities').select('*').eq('type', 'fee').contains('assigned_users', [userId]),
      supa.from('fee_records').select('*, activity:activities!activity_id(name), member:members!member_id(name)').eq('collected_by', userId).order('date', { ascending: false }),
    ]);
    const actFeeMap = {};
    (myFeeRecs || []).forEach(r => {
      if (!actFeeMap[r.activity_id]) actFeeMap[r.activity_id] = { total: 0, count: 0 };
      actFeeMap[r.activity_id].total += parseFloat(r.amount || 0);
      actFeeMap[r.activity_id].count++;
    });

    el.innerHTML = `
      <div class="panel-header"><div><h2>Fee Collection</h2><p>Record fee payments from community members</p></div></div>
      ${!(myFeeActs || []).length ? emptyState('💰', 'No fee activities assigned', 'Your site admin will assign fee collection activities to you') : `
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><h3>My Fee Activities</h3></div>
          <div class="card-body">
            <div class="activity-grid">
              ${myFeeActs.map(a => {
                const m = actFeeMap[a.id] || { total: 0, count: 0 };
                return `<div class="activity-card fee">
                  <h4>${esc(a.name)}</h4>
                  <div class="activity-meta">
                    <div>Amount: <strong>₹${parseFloat(a.target_amount || 0).toFixed(2)}</strong>/person</div>
                    <div>Due: ${a.due_date ? fmtDate(a.due_date) : 'No deadline'}</div>
                  </div>
                  <div class="activity-stats">
                    <span>📝 ${m.count} records</span>
                    <span class="text-green fw-bold">₹${m.total.toFixed(2)} collected</span>
                  </div>
                  <button class="btn btn-success btn-sm" onclick="showRecordFeeModal('${a.id}')">+ Record Payment</button>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>My Recent Collections</h3></div>
          <div class="card-body table-wrapper">
            <table>
              <thead><tr><th>Payer</th><th>Amount</th><th>Activity</th><th>Date</th><th>Notes</th></tr></thead>
              <tbody>
                ${!(myFeeRecs || []).length ? `<tr><td colspan="5">${emptyState('📝', 'No records yet', '')}</td></tr>` :
                  myFeeRecs.map(r => `<tr>
                    <td><strong>${esc(r.member?.name || r.payer_name || "�")}</strong></td>
                    <td><strong class="text-green">₹${parseFloat(r.amount).toFixed(2)}</strong></td>
                    <td>${r.activity?.name ? esc(r.activity.name) : '—'}</td>
                    <td>${fmtDate(r.date)}</td>
                    <td>${esc(r.notes || '—')}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`}`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function showRecordFeeModal(actId) {
  const { data: act } = await supa.from('activities').select('*').eq('id', actId).single();
  if (!act) return;

  // Load members assigned to this activity for the member dropdown
  const assignedIds = act.assigned_users || [];
  let memberOpts = '<option value="">— Select Member (optional) —</option>';
  if (assignedIds.length) {
    const { data: assignedMembers } = await supa.from('members').select('id, name').in('id', assignedIds).order('name');
    memberOpts += (assignedMembers || []).map(m =>
      `<option value="${m.id}" data-name="${esc(m.name)}">${esc(m.name)}</option>`
    ).join('');
  }

  showModal(`Record Payment — ${esc(act.name)}`, `
    <div class="form-group"><label>Select Member</label>
      <select id="mMemberSelect" onchange="fillPayerFromMember()">${memberOpts}</select>
    </div>
    <div class="form-group"><label>Payer Name *</label><input id="mPayerName" type="text" placeholder="Full name of person paying"></div>
    <div class="form-group"><label>Amount ($) *</label><input id="mAmount" type="number" min="0.01" step="0.01" value="${act.target_amount || ''}" placeholder="0.00"></div>
    <div class="form-group"><label>Date *</label><input id="mDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
    <div class="form-group"><label>Payer Phone</label><input id="mPayerPhone" type="tel" placeholder="Optional"></div>
    <div class="form-group"><label>Notes</label><textarea id="mNotes" placeholder="Additional notes..."></textarea></div>`,
  async () => {
    const payerName = val('mPayerName'), amount = parseFloat(val('mAmount')), date = val('mDate');
    if (!payerName)             return toast('Payer name is required', 'error'), false;
    if (!amount || amount <= 0) return toast('Valid amount is required', 'error'), false;
    if (!date)                  return toast('Date is required', 'error'), false;
    const memberId = document.getElementById('mMemberSelect')?.value || null;
    const { error } = await supa.from('fee_records').insert({
      activity_id: actId, site_id: currentUser.site_id, collected_by: currentUser.id,
      member_id: memberId || null,
      payer_name: payerName, payer_phone: val('mPayerPhone') || null, amount, date, notes: val('mNotes') || null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Payment recorded!', 'success'); await navigate('user-fees'); return true;
  });
}

function fillPayerFromMember() {
  const sel = document.getElementById('mMemberSelect');
  const name = sel?.options[sel.selectedIndex]?.dataset?.name;
  const payer = document.getElementById('mPayerName');
  if (payer && name) payer.value = name;
}

// ============================================================
//  USER — DATA COLLECTION
// ============================================================

async function renderUserData() {
  const el = document.getElementById('user-data');
  setLoading(el);
  try {
    const userId = currentUser.id;
    const [{ data: myDataActs }, { data: myDataRecs }] = await Promise.all([
      supa.from('activities').select('*').eq('type', 'data').contains('assigned_users', [userId]),
      supa.from('data_records').select('*, activity:activities!activity_id(name), member:members!member_id(name)').eq('collected_by', userId).order('date', { ascending: false }),
    ]);
    const actDataMap = {};
    (myDataRecs || []).forEach(r => { actDataMap[r.activity_id] = (actDataMap[r.activity_id] || 0) + 1; });

    el.innerHTML = `
      <div class="panel-header"><div><h2>Data Collection</h2><p>Record community member information</p></div></div>
      ${!(myDataActs || []).length ? emptyState('📁', 'No data activities assigned', 'Your site admin will assign data collection activities to you') : `
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><h3>My Data Activities</h3></div>
          <div class="card-body">
            <div class="activity-grid">
              ${myDataActs.map(a => `<div class="activity-card data">
                <h4>${esc(a.name)}</h4>
                <div class="activity-meta">
                  ${a.description ? `<div>${esc(a.description)}</div>` : ''}
                  <div>Due: ${a.due_date ? fmtDate(a.due_date) : 'No deadline'}</div>
                </div>
                <div class="activity-stats"><span>📝 ${actDataMap[a.id] || 0} records</span></div>
                <button class="btn btn-primary btn-sm" onclick="showRecordDataModal('${a.id}')">+ Record Data</button>
              </div>`).join('')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>My Data Records</h3></div>
          <div class="card-body table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Address</th><th>Phone</th><th>Activity</th><th>Date</th><th>Notes</th></tr></thead>
              <tbody>
                ${!(myDataRecs || []).length ? `<tr><td colspan="6">${emptyState('📝', 'No records yet', '')}</td></tr>` :
                  myDataRecs.map(r => `<tr>
                    <td><strong>${esc(r.person_name)}</strong></td>
                    <td>${esc(r.address || '—')}</td>
                    <td>${esc(r.phone || '—')}</td>
                    <td>${r.activity?.name ? esc(r.activity.name) : '—'}</td>
                    <td>${fmtDate(r.date)}</td>
                    <td>${esc(r.notes || '—')}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`}`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function showRecordDataModal(actId) {
  const { data: act } = await supa.from('activities').select('*').eq('id', actId).single();
  if (!act) return;
  showModal(`Record Data — ${esc(act.name)}`, `
    <div class="form-group"><label>Person Name *</label>  <input id="mPersonName" type="text"  placeholder="Full name"></div>
    <div class="form-group"><label>Address</label>        <input id="mAddress"    type="text"  placeholder="Home address"></div>
    <div class="form-group"><label>Phone</label>          <input id="mPhone"      type="tel"   placeholder="Phone number"></div>
    <div class="form-group"><label>Email (optional)</label><input id="mEmail" type="email" placeholder="Email address (optional)"></div>
    <div class="form-group"><label>Date *</label>         <input id="mDate"       type="date"  value="${new Date().toISOString().slice(0, 10)}"></div>
    <div class="form-group"><label>Notes</label>          <textarea id="mNotes" placeholder="Additional information..."></textarea></div>`,
  async () => {
    const personName = val('mPersonName'), date = val('mDate');
    if (!personName) return toast('Person name is required', 'error'), false;
    if (!date)       return toast('Date is required', 'error'), false;
    const { error } = await supa.from('data_records').insert({
      activity_id: actId, site_id: currentUser.site_id, collected_by: currentUser.id,
      person_name: personName, address: val('mAddress') || null, phone: val('mPhone') || null,
      email: val('mEmail') || null, date, notes: val('mNotes') || null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Data recorded!', 'success'); await navigate('user-data'); return true;
  });
}

// ============================================================
//  USER — HISTORY
// ============================================================

async function renderUserHistory() {
  const el = document.getElementById('user-history');
  setLoading(el);
  try {
    const userId = currentUser.id;
    const [{ data: feeRecs }, { data: dataRecs }] = await Promise.all([
      supa.from('fee_records').select('*, activity:activities!activity_id(name), member:members!member_id(name)').eq('collected_by', userId).order('date', { ascending: false }),
      supa.from('data_records').select('*, activity:activities!activity_id(name), member:members!member_id(name)').eq('collected_by', userId).order('date', { ascending: false }),
    ]);
    const total = (feeRecs || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    el.innerHTML = `
      <div class="panel-header"><div><h2>My History</h2><p>All your collection records</p></div></div>
      <div class="stats-grid">
        ${statCard('💰', 'si-green',  '₹' + total.toFixed(2),   'Total Fees Collected')}
        ${statCard('📝', 'si-blue',   (feeRecs  || []).length,  'Fee Transactions')}
        ${statCard('📁', 'si-purple', (dataRecs || []).length,  'Data Records')}
      </div>
      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3>Fee Collection History</h3></div>
        <div class="card-body table-wrapper">
          <table>
            <thead><tr><th>Payer</th><th>Amount</th><th>Activity</th><th>Date</th><th>Notes</th></tr></thead>
            <tbody>
              ${!(feeRecs || []).length ? `<tr><td colspan="5">${emptyState('💰', 'No fee records', '')}</td></tr>` :
                feeRecs.map(r => `<tr>
                  <td><strong>${esc(r.member?.name || r.payer_name || "�")}</strong></td>
                  <td><strong class="text-green">₹${parseFloat(r.amount).toFixed(2)}</strong></td>
                  <td>${r.activity?.name ? esc(r.activity.name) : '—'}</td>
                  <td>${fmtDate(r.date)}</td>
                  <td>${esc(r.notes || '—')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Data Collection History</h3></div>
        <div class="card-body table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Address</th><th>Phone</th><th>Activity</th><th>Date</th></tr></thead>
            <tbody>
              ${!(dataRecs || []).length ? `<tr><td colspan="5">${emptyState('📁', 'No data records', '')}</td></tr>` :
                dataRecs.map(r => `<tr>
                  <td><strong>${esc(r.person_name)}</strong></td>
                  <td>${esc(r.address || '—')}</td>
                  <td>${esc(r.phone || '—')}</td>
                  <td>${r.activity?.name ? esc(r.activity.name) : '—'}</td>
                  <td>${fmtDate(r.date)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// ============================================================
//  MODAL & TOAST
// ============================================================

let _modalSaveCb = null;

function showModal(title, bodyHTML, onSave) {
  _modalSaveCb = onSave;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML    = bodyHTML;
  const btn = document.getElementById('modalSaveBtn');
  btn.textContent = 'Save'; btn.className = 'btn btn-primary'; btn.disabled = false;
  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
  _modalSaveCb = null;
}

async function saveModal() {
  if (!_modalSaveCb) return;
  const btn  = document.getElementById('modalSaveBtn');
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    const result = await Promise.resolve(_modalSaveCb());
    if (result !== false) closeModal();
  } catch (err) {
    toast(err.message || 'An error occurred', 'error');
  } finally {
    btn.disabled = false; btn.textContent = orig;
  }
}

function confirmAction(message, onConfirm) {
  showModal('Confirm', `
    <div style="text-align:center;padding:8px 0">
      <div style="font-size:44px;margin-bottom:14px">⚠️</div>
      <p style="font-size:14px;color:#374151;line-height:1.6">${message}</p>
    </div>`, onConfirm);
  const btn = document.getElementById('modalSaveBtn');
  btn.textContent = 'Confirm'; btn.className = 'btn btn-danger';
}

function toast(message, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ============================================================
//  TABLE FILTER
// ============================================================

function filterTable(tableId, searchId, actFilterId) {
  const search = document.getElementById(searchId)?.value.toLowerCase() || '';
  const act    = document.getElementById(actFilterId)?.value || '';
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
    row.style.display = (
      (!search || row.textContent.toLowerCase().includes(search)) &&
      (!act    || (row.dataset.act || '') === act)
    ) ? '' : 'none';
  });
}

// Filters fee table by search, activity AND status
function filterFeeTableFull() {
  const search = document.getElementById('feeSearch')?.value.toLowerCase() || '';
  const act    = document.getElementById('feeActF')?.value || '';
  const status = document.getElementById('feeStatusF')?.value || '';
  document.querySelectorAll('#feeTable tbody tr').forEach(row => {
    row.style.display = (
      (!search || (row.dataset.search || row.textContent.toLowerCase()).includes(search)) &&
      (!act    || (row.dataset.act    || '') === act) &&
      (!status || (row.dataset.status || '') === status)
    ) ? '' : 'none';
  });
}

// Repopulates member filter dropdown when activity changes
function updateMemberFilter(memberOptsByAct) {
  const actId  = document.getElementById('feeActF')?.value || '';
  const sel    = document.getElementById('feeMemberF');
  if (!sel) return;
  const members = actId && memberOptsByAct[actId] ? memberOptsByAct[actId] : [];
  sel.innerHTML = '<option value="">All Members</option>' +
    members.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
  filterFeeTableFull();
}

// ============================================================
//  UTILITIES
// ============================================================

function setLoading(el) {
  el.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>`;
}

function errHTML(msg) {
  return `<div class="empty-state"><div class="empty-icon">❌</div><h3>Something went wrong</h3><p>${esc(msg)}</p></div>`;
}

function val(id)    { return (document.getElementById(id)?.value || '').trim(); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function statCard(icon, cls, value, label) {
  return `<div class="stat-card"><div class="stat-icon ${cls}">${icon}</div><div class="stat-info"><strong>${value}</strong><span>${label}</span></div></div>`;
}

function emptyState(icon, title, sub) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>`;
}

function noSiteMsg() {
  return `<div class="panel-header"><div><h2>Not Available</h2></div></div>${emptyState('⚠️', 'Not assigned to a site', 'Contact the super admin to assign you to a site')}`;
}

function downloadCSV(headers, rows, filename) {
  const e     = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map(r => r.map(e).join(','))];
  const blob  = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
//  INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });

  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pw    = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn   = document.getElementById('loginForm').querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Signing in...';
    try {
      if (await login(email, pw)) {
        errEl.textContent = '';
        await bootApp();
      } else {
        errEl.textContent = '✕ Invalid email or password';
      }
    } catch (err) {
      errEl.textContent = '✕ Error: ' + err.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Sign In →';
    }
  });

  document.getElementById('setupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = val('setupName'), email = val('setupEmail'), password = val('setupPassword'), confirm = val('setupConfirm');
    const errEl = document.getElementById('setupError');
    const btn   = e.submitter;
    if (!name || !email || !password) { errEl.textContent = 'All fields are required'; return; }
    if (password !== confirm)         { errEl.textContent = 'Passwords do not match'; return; }
    if (password.length < 6)          { errEl.textContent = 'Password must be at least 6 characters'; return; }
    btn.disabled = true; btn.textContent = 'Setting up...';
    const password_hash = await hashPw(password);
    const { error } = await supa.from('profiles').insert({ name, username: email.toLowerCase(), password_hash, role: 'superadmin' });
    if (error) { errEl.textContent = error.message; btn.disabled = false; btn.textContent = 'Create Super Admin →'; return; }
    if (await login(email, password)) {
      await bootApp();
    } else {
      showPage('loginPage');
    }
  });

  // Start: validate config → first-run check → session restore → login screen
  try {
    const { count, error } = await supa.from('profiles').select('*', { count: 'exact', head: true });
    if (error) throw error;
    if (count === 0) {
      showPage('setupPage');
    } else if (await restoreSession()) {
      await bootApp();
    } else {
      showPage('loginPage');
    }
  } catch (err) {
    // If Supabase is misconfigured show the config error, otherwise fall back to login
    if (SUPABASE_URL.includes('YOUR_PROJECT') || SUPABASE_ANON_KEY.includes('YOUR_ANON')) {
      document.body.innerHTML = `
        <div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:sans-serif;background:#f0f2f5">
          <div style="background:white;padding:40px;border-radius:16px;max-width:480px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1)">
            <div style="font-size:48px;margin-bottom:16px">⚙️</div>
            <h2 style="margin-bottom:8px">Supabase Not Configured</h2>
            <p style="color:#6b7280;font-size:14px;line-height:1.6">Open <strong>config.js</strong> and fill in your <strong>SUPABASE_URL</strong> and <strong>SUPABASE_ANON_KEY</strong>.</p>
            <p style="margin-top:16px;padding:10px;background:#fee2e2;border-radius:8px;font-size:12px;color:#991b1b;word-break:break-all">${esc(err.message)}</p>
          </div>
        </div>`;
    } else {
      showPage('loginPage');
    }
  }
});
