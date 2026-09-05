'use strict';
// ============================================================
//  Cloud Salah — Supabase Application Logic
// ============================================================

const { createClient } = window.supabase;
const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let eventTypesCache = null;

async function getEventTypeId(type) {
  if (!eventTypesCache) {
    const { data, error } = await supa.from('event_types').select('id, type').order('id');
    if (error) throw error;
    eventTypesCache = data || [];
  }
  return eventTypesCache.find(eventType => eventType.type.toLowerCase() === type)?.id || null;
}

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
    .select('*, roleData:roles!role_id(*)')
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
  const { data } = await supa.from('profiles').select('*, roleData:roles!role_id(*)').eq('id', id).maybeSingle();
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
    'sa-committee':         renderSACommittee,
    'sa-locations':         renderSALocations,
    'sa-designations':      renderSADesignations,
    'sa-relationships':     renderSARelationships,
    'rangeadmin-dashboard': renderRangeAdminDashboard,
    'ra-sites':              renderRASites,
    'ra-admins':             renderRAAdmins,
    'admin-dashboard':       renderAdminDashboard,
    'admin-users':      renderAdminUsers,
    'admin-members':    renderAdminMembers,
    'admin-dependents': renderAdminDependents,
    'admin-activities': renderAdminActivities,
    'admin-fees':       renderAdminFees,
    'admin-donations':  renderAdminDonations,
    'admin-data':       renderAdminData,
    'admin-reports':    renderAdminReports,
    'admin-association-report': renderAdminAssociationReport,
    'admin-expense-report': renderAdminExpenseReport,
    'admin-balance-sheet':  renderAdminBalanceSheet,
    'user-dashboard':   renderUserDashboard,
    'user-fees':        renderUserFees,
    'user-donations':   renderUserDonations,
    'user-data':        renderUserData,
    'user-history':     renderUserHistory,
    'user-events':      renderUserEvents,
    'admin-expenses':   renderAdminExpenses,
    'user-expenses':    renderUserExpenses,
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
      <div class="nav-item" data-panel="sa-committee"   onclick="navigate('sa-committee')"><span class="nav-icon">🧑‍⚖️</span>State Committee</div>
      <div class="nav-item" data-panel="sa-locations"   onclick="navigate('sa-locations')"><span class="nav-icon">📍</span>Location Setup</div>
      <div class="nav-item" data-panel="sa-designations" onclick="navigate('sa-designations')"><span class="nav-icon">🏷️</span>Designation Setup</div>
      <div class="nav-item" data-panel="sa-relationships" onclick="navigate('sa-relationships')"><span class="nav-icon">👨‍👩‍👧‍👦</span>Relationship Setup</div>
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
      <div class="nav-section">Finance</div>
      <div class="nav-item" data-panel="admin-fees"       onclick="navigate('admin-fees')"><span class="nav-icon">💰</span>Payment Collections</div>
      <div class="nav-item" data-panel="admin-donations"  onclick="navigate('admin-donations')"><span class="nav-icon">🤲</span>Donations</div>
      <div class="nav-item" data-panel="admin-expenses"   onclick="navigate('admin-expenses')"><span class="nav-icon">💸</span>Expenses</div>
      <div class="nav-section">Reports</div>
      <div class="nav-item" data-panel="admin-reports"    onclick="navigate('admin-reports')"><span class="nav-icon">📈</span>Collection Report</div>
      <div class="nav-item" data-panel="admin-association-report" onclick="navigate('admin-association-report')"><span class="nav-icon">📋</span>Association Report</div>
      <div class="nav-item" data-panel="admin-expense-report" onclick="navigate('admin-expense-report')"><span class="nav-icon">📊</span>Expense Report</div>
      <div class="nav-item" data-panel="admin-balance-sheet"  onclick="navigate('admin-balance-sheet')"><span class="nav-icon">⚖️</span>Balance Sheet</div>
      <div class="nav-section">Collections</div>
      <div class="nav-item" data-panel="admin-data"       onclick="navigate('admin-data')"><span class="nav-icon">📁</span>Data Records</div>`;
  } else if (role === 'rangeadmin') {
    nav.innerHTML = `
      <div class="nav-section">Overview</div>
      <div class="nav-item" data-panel="rangeadmin-dashboard" onclick="navigate('rangeadmin-dashboard')"><span class="nav-icon">📊</span>Dashboard</div>
      <div class="nav-section">Management</div>
      <div class="nav-item" data-panel="ra-sites"  onclick="navigate('ra-sites')"><span class="nav-icon">🏘️</span>Sites</div>
      <div class="nav-item" data-panel="ra-admins" onclick="navigate('ra-admins')"><span class="nav-icon">👤</span>Site Admins</div>`;
  } else {
    // When no role is assigned show everything; when a role exists enforce its permissions
    const rd = currentUser.roleData;

    // Full site admin access — render the complete admin sidebar
    if (rd?.site_admin_access) {
      nav.innerHTML = `
        <div class="nav-section">Overview</div>
        <div class="nav-item" data-panel="admin-dashboard"  onclick="navigate('admin-dashboard')"><span class="nav-icon">📊</span>Dashboard</div>
        <div class="nav-section">Management</div>
        <div class="nav-item" data-panel="admin-users"      onclick="navigate('admin-users')"><span class="nav-icon">👥</span>Profile Users</div>
        <div class="nav-item" data-panel="admin-members"    onclick="navigate('admin-members')"><span class="nav-icon">👨‍👩‍👧‍👦</span>Members</div>
        <div class="nav-item" data-panel="admin-dependents"  onclick="navigate('admin-dependents')"><span class="nav-icon">👶</span>Dependents</div>
        <div class="nav-item" data-panel="admin-activities" onclick="navigate('admin-activities')"><span class="nav-icon">📋</span>Manage Events</div>
        <div class="nav-section">Finance</div>
        <div class="nav-item" data-panel="admin-fees"       onclick="navigate('admin-fees')"><span class="nav-icon">💰</span>Payment Collections</div>
        <div class="nav-item" data-panel="admin-donations"  onclick="navigate('admin-donations')"><span class="nav-icon">🤲</span>Donations</div>
        <div class="nav-item" data-panel="admin-expenses"   onclick="navigate('admin-expenses')"><span class="nav-icon">💸</span>Expenses</div>
        <div class="nav-section">Reports</div>
        <div class="nav-item" data-panel="admin-reports"    onclick="navigate('admin-reports')"><span class="nav-icon">📈</span>Collection Report</div>
        <div class="nav-item" data-panel="admin-expense-report" onclick="navigate('admin-expense-report')"><span class="nav-icon">📊</span>Expense Report</div>
        <div class="nav-item" data-panel="admin-balance-sheet"  onclick="navigate('admin-balance-sheet')"><span class="nav-icon">⚖️</span>Balance Sheet</div>
        <div class="nav-section">Collections</div>
        <div class="nav-item" data-panel="admin-data"       onclick="navigate('admin-data')"><span class="nav-icon">📁</span>Data Records</div>`;
      return;
    }

    const showFee      = !rd || rd.fee_collection;
    const showData     = !rd || rd.data_collection;
    const showEvents   = rd?.manage_events;
    const showExpenses = rd?.expenses;
    const showMembers  = rd?.create_members;
    const showDeps     = rd?.create_dependents;
    const showUsers    = rd?.create_users;
    nav.innerHTML = `
      <div class="nav-section">Overview</div>
      <div class="nav-item" data-panel="user-dashboard" onclick="navigate('user-dashboard')"><span class="nav-icon">🏠</span>Dashboard</div>
      ${(showMembers || showDeps || showUsers) ? `<div class="nav-section">Management</div>` : ''}
      ${showUsers   ? `<div class="nav-item" data-panel="admin-users"      onclick="navigate('admin-users')"><span class="nav-icon">👥</span>Profile Users</div>` : ''}
      ${showMembers ? `<div class="nav-item" data-panel="admin-members"    onclick="navigate('admin-members')"><span class="nav-icon">👨‍👩‍👧‍👦</span>Members</div>` : ''}
      ${showDeps    ? `<div class="nav-item" data-panel="admin-dependents" onclick="navigate('admin-dependents')"><span class="nav-icon">👶</span>Dependents</div>` : ''}
      <div class="nav-section">My Work</div>
      ${showFee    ? `<div class="nav-item" data-panel="user-fees"    onclick="navigate('user-fees')"><span class="nav-icon">💰</span>Payment Collections</div>` : ''}
      ${showFee    ? `<div class="nav-item" data-panel="user-donations" onclick="navigate('user-donations')"><span class="nav-icon">🤲</span>Donations</div>` : ''}
      ${showData   ? `<div class="nav-item" data-panel="user-data"    onclick="navigate('user-data')"><span class="nav-icon">📁</span>Data Collection</div>` : ''}
      <div class="nav-item" data-panel="user-history" onclick="navigate('user-history')"><span class="nav-icon">🕑</span>My History</div>
      ${showEvents   ? `<div class="nav-item" data-panel="user-events"  onclick="navigate('user-events')"><span class="nav-icon">📋</span>Manage Events</div>` : ''}
      ${showExpenses ? `<div class="nav-item" data-panel="user-expenses" onclick="navigate('user-expenses')"><span class="nav-icon">💸</span>Expenses</div>` : ''}`;
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
//  LOCATION LOOKUP (lookup_country / lookup_state / lookup_district / lookup_city / lookup_pincode)
// ============================================================

// Fetches rows from a lookup_* table, ordered by its "order" column (falling back to the name column).
async function lookupRows(table, filters = {}, nameCol) {
  const run = orderCol => {
    let q = supa.from(table).select('*');
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    return orderCol ? q.order('order').order(nameCol) : q.order(nameCol);
  };
  let { data, error } = await run(true);
  if (error && /column .*order.* does not exist|42703/i.test(error.message || '')) {
    ({ data, error } = await run(false));
  }
  if (error) throw error;
  return data || [];
}

// Builds <option> tags (value = name, data-id = row id); keeps a saved value selectable even if missing from the lookup list.
function lookupOptsHTML(rows, nameCol, selected) {
  const idCol = `${nameCol}_id`;
  const seen = new Set(), out = [];
  rows.forEach(r => {
    const v = String(r[nameCol] ?? '').trim();
    if (v && !seen.has(v)) { seen.add(v); out.push(`<option value="${esc(v)}" data-id="${r[idCol] ?? ''}" ${v === selected ? 'selected' : ''}>${esc(v)}</option>`); }
  });
  if (selected && !seen.has(selected)) out.unshift(`<option value="${esc(selected)}" selected>${esc(selected)}</option>`);
  return out.join('');
}

async function findOrCreateLookupRow(table, nameCol, value, parentFilter = {}) {
  let query = supa.from(table).select('*').eq(nameCol, value).limit(1);
  Object.entries(parentFilter).forEach(([column, parentValue]) => { query = query.eq(column, parentValue); });
  const { data: existing, error: findError } = await query;
  if (findError) throw findError;
  if (existing?.[0]) return existing[0];
  const { data: created, error: createError } = await supa.from(table)
    .insert({ [nameCol]: value, ...parentFilter }).select('*').single();
  if (createError) throw createError;
  return created;
}

async function renderSALocations() {
  const el = document.getElementById('sa-locations');
  setLoading(el);
  try {
    const [{ count: countryCount }, { count: stateCount }, { count: districtCount }, { count: cityCount }, { count: pinCount }] = await Promise.all([
      supa.from('lookup_country').select('*', { count: 'exact', head: true }),
      supa.from('lookup_state').select('*', { count: 'exact', head: true }),
      supa.from('lookup_district').select('*', { count: 'exact', head: true }),
      supa.from('lookup_city').select('*', { count: 'exact', head: true }),
      supa.from('lookup_pincode').select('*', { count: 'exact', head: true }),
    ]);
    el.innerHTML = `
      <div class="panel-header"><div><h2>Location Setup</h2><p>Manage country, state, district, city, and pin code lookup values</p></div><button class="btn btn-primary" onclick="showAddLocationModal()">+ Add Location</button></div>
      <div class="stats-grid">
        ${statCard('🌐', 'si-blue', countryCount || 0, 'Countries')}
        ${statCard('🗺️', 'si-teal', stateCount || 0, 'States')}
        ${statCard('📍', 'si-yellow', districtCount || 0, 'Districts')}
        ${statCard('🏙️', 'si-purple', cityCount || 0, 'Cities')}
        ${statCard('📮', 'si-green', pinCount || 0, 'Pin Codes')}
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function renderSADesignations() {
  const el = document.getElementById('sa-designations');
  setLoading(el);
  try {
    const { data: designations, error } = await supa.from('lookup_designation').select('id, designation, order').order('order').order('designation');
    if (error) throw error;
    el.innerHTML = `
      <div class="panel-header"><div><h2>Designation Setup</h2><p>Manage designations for association committee members</p></div><button class="btn btn-primary" onclick="showAddDesignationModal()">+ Add Designation</button></div>
      <div class="card"><div class="card-body table-wrapper">
        ${!(designations || []).length ? emptyState('🏷️', 'No designations yet', 'Add a designation to use it in association events') : `<table>
          <thead><tr><th>Designation</th><th>Order</th></tr></thead>
          <tbody>${designations.map(item => `<tr><td><strong>${esc(item.designation || '—')}</strong></td><td>${item.order ?? '—'}</td></tr>`).join('')}</tbody>
        </table>`}
      </div></div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function showAddDesignationModal() {
  showModal('Add Designation', `
    <div class="form-group"><label>Designation *</label><input id="mDesignationName" type="text" placeholder="e.g., President"></div>
    <div class="form-group"><label>Display Order</label><input id="mDesignationOrder" type="number" min="1" step="1" placeholder="e.g., 1"></div>`,
  async () => {
    const designation = val('mDesignationName');
    const orderValue = val('mDesignationOrder');
    if (!designation) return toast('Designation is required', 'error'), false;
    const { error } = await supa.from('lookup_designation').insert({
      designation,
      order: orderValue === '' ? null : parseInt(orderValue, 10),
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Designation added', 'success'); await navigate('sa-designations'); return true;
  });
}

async function renderSARelationships() {
  const el = document.getElementById('sa-relationships');
  setLoading(el);
  try {
    const { data: relationships, error } = await supa.from('lookup_relationship').select('id, relation, order').order('order').order('relation');
    if (error) throw error;
    el.innerHTML = `
      <div class="panel-header"><div><h2>Relationship Setup</h2><p>Manage guardian relationships for dependent members</p></div><button class="btn btn-primary" onclick="showAddRelationshipModal()">+ Add Relationship</button></div>
      <div class="card"><div class="card-body table-wrapper">
        ${!(relationships || []).length ? emptyState('👨‍👩‍👧‍👦', 'No relationships yet', 'Add a relationship to use it for dependents') : `<table>
          <thead><tr><th>Relationship</th><th>Order</th></tr></thead>
          <tbody>${relationships.map(item => `<tr><td><strong>${esc(item.relation || '—')}</strong></td><td>${item.order ?? '—'}</td></tr>`).join('')}</tbody>
        </table>`}
      </div></div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function showAddRelationshipModal() {
  showModal('Add Relationship', `
    <div class="form-group"><label>Relationship *</label><input id="mRelationshipName" type="text" placeholder="e.g., Father"></div>
    <div class="form-group"><label>Display Order</label><input id="mRelationshipOrder" type="number" min="1" step="1" placeholder="e.g., 1"></div>`,
  async () => {
    const relation = val('mRelationshipName');
    const orderValue = val('mRelationshipOrder');
    if (!relation) return toast('Relationship is required', 'error'), false;
    const { error } = await supa.from('lookup_relationship').insert({
      relation,
      order: orderValue === '' ? null : parseInt(orderValue, 10),
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Relationship added', 'success'); await navigate('sa-relationships'); return true;
  });
}

async function showAddLocationModal() {
  let countries;
  try { countries = await lookupRows('lookup_country', {}, 'country'); }
  catch (err) { return toast(err.message, 'error'); }
  showModal('Add Location', `
    <div class="form-group"><label>Add *</label><select id="mLocationType" onchange="toggleLocationSetupFields()"><option value="country">Country</option><option value="state">State</option><option value="district">District</option><option value="city">City</option><option value="pincode">Pin Code</option></select></div>
    <div id="locationCountryGroup" class="form-group" style="display:none"><label>Country *</label><select id="mLocationCountry" data-ph="— Select Country —"><option value="">— Select Country —</option>${lookupOptsHTML(countries, 'country', '')}</select></div>
    <div id="locationStateGroup" class="form-group" style="display:none"><label>State *</label><select id="mLocationState" data-ph="— Select State —" disabled><option value="">— Select Country first —</option></select></div>
    <div id="locationDistrictGroup" class="form-group" style="display:none"><label>District *</label><select id="mLocationDistrict" data-ph="— Select District —" disabled><option value="">— Select State first —</option></select></div>
    <div id="locationCityGroup" class="form-group" style="display:none"><label>City *</label><select id="mLocationCity" data-ph="— Select City —" disabled><option value="">— Select District first —</option></select></div>
    <div class="form-group"><label id="mLocationValueLabel">Country *</label><input id="mLocationValue" type="text" placeholder="e.g., India"></div>`,
  async () => {
    const type = val('mLocationType'), value = val('mLocationValue');
    const countryId = document.getElementById('mLocationCountry')?.selectedOptions[0]?.dataset.id || '';
    const stateId = document.getElementById('mLocationState')?.selectedOptions[0]?.dataset.id || '';
    const districtId = document.getElementById('mLocationDistrict')?.selectedOptions[0]?.dataset.id || '';
    const cityId = document.getElementById('mLocationCity')?.selectedOptions[0]?.dataset.id || '';
    if (!value) return toast('Location value is required', 'error'), false;
    if (type === 'state' && !countryId) return toast('Country is required', 'error'), false;
    if (type === 'district' && !stateId) return toast('State is required', 'error'), false;
    if (type === 'city' && !districtId) return toast('District is required', 'error'), false;
    if (type === 'pincode' && !cityId) return toast('City is required', 'error'), false;
    const configs = {
      country: ['lookup_country', 'country', {}],
      state: ['lookup_state', 'state', { country_id: countryId }],
      district: ['lookup_district', 'district', { state_id: stateId }],
      city: ['lookup_city', 'city', { district_id: districtId }],
      pincode: ['lookup_pincode', 'pincode', { city_id: cityId }],
    };
    try {
      const [table, nameCol, parentFilter] = configs[type];
      await findOrCreateLookupRow(table, nameCol, value, parentFilter);
    }
    catch (err) { return toast(err.message, 'error'), false; }
    toast('Location saved', 'success'); await navigate('sa-locations'); return true;
  });
  wireLocationSetupCascade();
}

function toggleLocationSetupFields() {
  const type = val('mLocationType');
  const levels = ['Country', 'State', 'District', 'City'];
  const labels = { country: 'Country', state: 'State', district: 'District', city: 'City', pincode: 'Pin Code' };
  levels.forEach((level, index) => {
    const group = document.getElementById(`location${level}Group`);
    if (group) group.style.display = index < ['country', 'state', 'district', 'city', 'pincode'].indexOf(type) ? '' : 'none';
  });
  const valueLabel = document.getElementById('mLocationValueLabel');
  const valueInput = document.getElementById('mLocationValue');
  if (valueLabel) valueLabel.textContent = `${labels[type]} *`;
  if (valueInput) valueInput.placeholder = `Enter ${labels[type].toLowerCase()}`;
}

function wireLocationSetupCascade() {
  const countrySel = document.getElementById('mLocationCountry');
  const stateSel = document.getElementById('mLocationState');
  const districtSel = document.getElementById('mLocationDistrict');
  const citySel = document.getElementById('mLocationCity');
  if (!countrySel || !stateSel || !districtSel || !citySel) return;
  const block = (select, placeholder) => { select.innerHTML = `<option value="">${placeholder}</option>`; select.disabled = true; };
  const fill = (select, rows, nameCol) => { select.innerHTML = `<option value="">${select.dataset.ph}</option>` + lookupOptsHTML(rows, nameCol, ''); select.disabled = false; };
  countrySel.addEventListener('change', async () => {
    const countryId = countrySel.selectedOptions[0]?.dataset.id || '';
    block(stateSel, countryId ? 'Loading…' : '— Select Country first —'); block(districtSel, '— Select State first —'); block(citySel, '— Select District first —');
    if (!countryId) return;
    try { fill(stateSel, await lookupRows('lookup_state', { country_id: countryId }, 'state'), 'state'); } catch (err) { toast(err.message, 'error'); }
  });
  stateSel.addEventListener('change', async () => {
    const stateId = stateSel.selectedOptions[0]?.dataset.id || '';
    block(districtSel, stateId ? 'Loading…' : '— Select State first —'); block(citySel, '— Select District first —');
    if (!stateId) return;
    try { fill(districtSel, await lookupRows('lookup_district', { state_id: stateId }, 'district'), 'district'); } catch (err) { toast(err.message, 'error'); }
  });
  districtSel.addEventListener('change', async () => {
    const districtId = districtSel.selectedOptions[0]?.dataset.id || '';
    block(citySel, districtId ? 'Loading…' : '— Select District first —');
    if (!districtId) return;
    try { fill(citySel, await lookupRows('lookup_city', { district_id: districtId }, 'city'), 'city'); } catch (err) { toast(err.message, 'error'); }
  });
}

// Wires the cascading Country → State → District → City/Pin Code dropdowns in the site modal.
function wireSiteLocationCascade() {
  const countrySel  = document.getElementById('mSiteCountry');
  const stateSel    = document.getElementById('mSiteState');
  const districtSel = document.getElementById('mSiteDistrict');
  const citySel     = document.getElementById('mSiteCity');
  const pinSel      = document.getElementById('mSitePinCode');
  if (!countrySel) return;

  const fill = (sel, rows, nameCol) => {
    sel.innerHTML = `<option value="">${sel.dataset.ph}</option>` + lookupOptsHTML(rows, nameCol, '');
    sel.disabled  = false;
  };
  const block = (sel, ph) => {
    sel.innerHTML = `<option value="">${ph}</option>`;
    sel.disabled  = true;
  };

  countrySel.addEventListener('change', async () => {
    const countryId = countrySel.selectedOptions[0]?.dataset.id || '';
    block(stateSel,    countryId ? 'Loading…' : '— Select Country first —');
    block(districtSel, '— Select State first —');
    block(citySel,     '— Select District first —');
    block(pinSel,      '— Select District first —');
    if (!countryId) return;
    try { fill(stateSel, await lookupRows('lookup_state', { country_id: countryId }, 'state'), 'state'); }
    catch (err) { block(stateSel, '— Select Country first —'); toast(err.message, 'error'); }
  });

  stateSel.addEventListener('change', async () => {
    const stateId = stateSel.selectedOptions[0]?.dataset.id || '';
    block(districtSel, stateId ? 'Loading…' : '— Select State first —');
    block(citySel,     '— Select District first —');
    block(pinSel,      '— Select District first —');
    if (!stateId) return;
    try { fill(districtSel, await lookupRows('lookup_district', { state_id: stateId }, 'district'), 'district'); }
    catch (err) { block(districtSel, '— Select State first —'); toast(err.message, 'error'); }
  });

  districtSel.addEventListener('change', async () => {
    const districtId = districtSel.selectedOptions[0]?.dataset.id || '';
    block(citySel, districtId ? 'Loading…' : '— Select District first —');
    block(pinSel,  '— Select City first —');
    if (!districtId) return;
    try { fill(citySel, await lookupRows('lookup_city', { district_id: districtId }, 'city'), 'city'); }
    catch (err) { block(citySel, '— Select District first —'); toast(err.message, 'error'); }
  });

  citySel.addEventListener('change', async () => {
    const cityId = citySel.selectedOptions[0]?.dataset.id || '';
    block(pinSel, cityId ? 'Loading…' : '— Select City first —');
    if (!cityId) return;
    try { fill(pinSel, await lookupRows('lookup_pincode', { city_id: cityId }, 'pincode'), 'pincode'); }
    catch (err) { block(pinSel, '— Select City first —'); toast(err.message, 'error'); }
  });
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
  let countries;
  try { countries = await lookupRows('lookup_country', {}, 'country'); }
  catch (err) { return toast('Could not load country lookup: ' + err.message, 'error'); }
  if (!countries.length) return toast('No records in lookup_country table. Please add lookup data first.', 'error');
  showModal('Add New Site', `
    <div class="form-group"><label>Range *</label>
      <select id="mSiteRangeId"><option value="">— Select Range —</option>${opts}</select>
    </div>
    <div class="form-group"><label>Jamath (Mahall) *</label><input id="mSiteName"     type="text" placeholder="Jamath or Mahall name"></div>
    <div class="form-group"><label>Area</label>             <input id="mSiteArea"     type="text" placeholder="Area"></div>
    <div class="form-group"><label>Country *</label>
      <select id="mSiteCountry" data-ph="— Select Country —"><option value="">— Select Country —</option>${lookupOptsHTML(countries, 'country', '')}</select>
    </div>
    <div class="form-group"><label>State *</label>
      <select id="mSiteState" data-ph="— Select State —" disabled><option value="">— Select Country first —</option></select>
    </div>
    <div class="form-group"><label>District *</label>
      <select id="mSiteDistrict" data-ph="— Select District —" disabled><option value="">— Select State first —</option></select>
    </div>
    <div class="form-group"><label>City *</label>
      <select id="mSiteCity" data-ph="— Select City —" disabled><option value="">— Select District first —</option></select>
    </div>
    <div class="form-group"><label>Pin Code *</label>
      <select id="mSitePinCode" data-ph="— Select Pin Code —" disabled><option value="">— Select District first —</option></select>
    </div>
    <div class="form-group"><label>Description</label>      <textarea id="mSiteDesc" placeholder="Brief description..."></textarea></div>`,
  async () => {
    const rangeId = val('mSiteRangeId'), name = val('mSiteName');
    if (!rangeId) return toast('Range is required', 'error'), false;
    if (!name)    return toast('Jamath (Mahall) name is required', 'error'), false;
    const country = val('mSiteCountry'), state = val('mSiteState'), district = val('mSiteDistrict');
    const city = val('mSiteCity'), pinCode = val('mSitePinCode');
    if (!country)  return toast('Country is required', 'error'), false;
    if (!state)    return toast('State is required', 'error'), false;
    if (!district) return toast('District is required', 'error'), false;
    if (!city)     return toast('City is required', 'error'), false;
    if (!pinCode)  return toast('Pin Code is required', 'error'), false;
    const { error } = await supa.from('sites').insert({
      name, range_id: rangeId,
      area: val('mSiteArea')||null, city, district, pin_code: pinCode,
      state, country,
      description: val('mSiteDesc')||null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Site created', 'success'); await navigate('sa-sites'); return true;
  });
  wireSiteLocationCascade();
}

async function showEditSiteModal(siteId) {
  const { data: s } = await supa.from('sites').select('*').eq('id', siteId).single();
  if (!s) return;
  let countries = [], states = [], districts = [], cities = [], zips = [];
  try {
    countries = await lookupRows('lookup_country', {}, 'country');
    const countryRow  = countries.find(r => r.country === s.country);
    if (countryRow) {
      states = await lookupRows('lookup_state', { country_id: countryRow.country_id }, 'state');
      const stateRow = states.find(r => r.state === s.state);
      if (stateRow) {
        districts = await lookupRows('lookup_district', { state_id: stateRow.state_id }, 'district');
        const districtRow = districts.find(r => r.district === s.district);
        if (districtRow) {
          cities = await lookupRows('lookup_city', { district_id: districtRow.district_id }, 'city');
          const cityRow = cities.find(r => r.city === s.city);
          if (cityRow) zips = await lookupRows('lookup_pincode', { city_id: cityRow.city_id }, 'pincode');
        }
      }
    }
  } catch (err) { return toast('Could not load location lookup: ' + err.message, 'error'); }
  const rangeOpts = await rangeSelectOpts(s.range_id || '');
  showModal('Edit Site', `
    <div class="form-group"><label>Range *</label>
      <select id="mSiteRangeId"><option value="">— Select Range —</option>${rangeOpts}</select>
    </div>
    <div class="form-group"><label>Jamath (Mahall) *</label><input id="mSiteName"     type="text" value="${esc(s.name)}"></div>
    <div class="form-group"><label>Area</label>             <input id="mSiteArea"     type="text" value="${esc(s.area     ||'')}"></div>
    <div class="form-group"><label>Country *</label>
      <select id="mSiteCountry" data-ph="— Select Country —"><option value="">— Select Country —</option>${lookupOptsHTML(countries, 'country', s.country || '')}</select>
    </div>
    <div class="form-group"><label>State *</label>
      <select id="mSiteState" data-ph="— Select State —"><option value="">— Select State —</option>${lookupOptsHTML(states, 'state', s.state || '')}</select>
    </div>
    <div class="form-group"><label>District *</label>
      <select id="mSiteDistrict" data-ph="— Select District —"><option value="">— Select District —</option>${lookupOptsHTML(districts, 'district', s.district || '')}</select>
    </div>
    <div class="form-group"><label>City *</label>
      <select id="mSiteCity" data-ph="— Select City —"><option value="">— Select City —</option>${lookupOptsHTML(cities, 'city', s.city || '')}</select>
    </div>
    <div class="form-group"><label>Pin Code *</label>
      <select id="mSitePinCode" data-ph="— Select Pin Code —"><option value="">— Select Pin Code —</option>${lookupOptsHTML(zips, 'pincode', s.pin_code || '')}</select>
    </div>
    <div class="form-group"><label>Description</label>      <textarea id="mSiteDesc">${esc(s.description||'')}</textarea></div>`,
  async () => {
    const rangeId = val('mSiteRangeId'), name = val('mSiteName');
    if (!rangeId) return toast('Range is required', 'error'), false;
    if (!name)    return toast('Jamath (Mahall) name is required', 'error'), false;
    const country = val('mSiteCountry'), state = val('mSiteState'), district = val('mSiteDistrict');
    const city = val('mSiteCity'), pinCode = val('mSitePinCode');
    if (!country)  return toast('Country is required', 'error'), false;
    if (!state)    return toast('State is required', 'error'), false;
    if (!district) return toast('District is required', 'error'), false;
    if (!city)     return toast('City is required', 'error'), false;
    if (!pinCode)  return toast('Pin Code is required', 'error'), false;
    const { error } = await supa.from('sites').update({
      name, range_id: rangeId,
      area: val('mSiteArea')||null, city, district, pin_code: pinCode,
      state, country,
      description: val('mSiteDesc')||null,
    }).eq('id', siteId);
    if (error) return toast(error.message, 'error'), false;
    toast('Site updated', 'success'); await navigate('sa-sites'); return true;
  });
  wireSiteLocationCascade();
}

function deleteSite(siteId) {
  confirmAction('Delete this site? All activities, fee records and data records will be removed.', async () => {
    const { error } = await supa.from('sites').delete().eq('id', siteId);
    if (error) return toast(error.message, 'error');
    toast('Site deleted', 'success'); await navigate('sa-sites');
  });
}

// ============================================================
//  SUPER ADMIN — STATE COMMITTEE (board_committee_list)
// ============================================================

async function renderSACommittee() {
  const el = document.getElementById('sa-committee');
  setLoading(el);
  try {
    const [{ data: rows, error }, { data: countries }, { data: states }] = await Promise.all([
      supa.from('board_committee_list').select('*').order('list_order'),
      supa.from('lookup_country').select('country_id, country'),
      supa.from('lookup_state').select('state_id, state'),
    ]);
    if (error) throw error;
    const countryMap = Object.fromEntries((countries || []).map(r => [r.country_id, r.country]));
    const stateMap   = Object.fromEntries((states    || []).map(r => [r.state_id,   r.state]));

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>State Committee</h2><p>Manage state-wide committee board members</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddCommitteeModal()">+ Add Member</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(rows || []).length ? emptyState('🧑‍⚖️', 'No committee members yet', 'Click "Add Member" to create your first state committee member') : `
            <table>
              <thead><tr><th>Photo</th><th>Name</th><th>Designation</th><th>Country</th><th>State</th><th>Order</th><th>Actions</th></tr></thead>
              <tbody>
                ${rows.map(m => {
                  const photo = profilePicUrl(m.profile_picture_path);
                  const initials = (m.Name || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
                  return `<tr>
                    <td>${photo ? `<img src="${esc(photo)}" alt="" style="width:34px;height:42px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">` : `<div class="stamp-photo-placeholder" style="width:34px;height:42px;font-size:12px;border-radius:4px">${initials}</div>`}</td>
                    <td><strong>${esc(m.Name || '—')}</strong></td>
                    <td>${esc(m.Designation || '—')}</td>
                    <td>${esc(countryMap[m.country_id] || '—')}</td>
                    <td>${esc(stateMap[m.state_id] || '—')}</td>
                    <td>${m.list_order ?? '—'}</td>
                    <td><div class="table-actions">
                      <button class="btn btn-secondary btn-sm" onclick="showEditCommitteeModal(${m.id})">✏️ Edit</button>
                      <button class="btn btn-danger btn-sm"    onclick="deleteCommitteeMember(${m.id})">🗑️</button>
                    </div></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`}
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// Committee member form: country → state cascading selects, name, designation, order, photo.
async function committeeFormHTML(m) {
  let countries = [], states = [];
  try {
    countries = await lookupRows('lookup_country', {}, 'country');
    if (m && m.country_id) states = await lookupRows('lookup_state', { country_id: m.country_id }, 'state');
  } catch (err) { toast('Could not load location lookup: ' + err.message, 'error'); }
  const stdDesig = ['President','Vice President','Secretary','Treasurer','Committee Member','Others'];
  const rawDesig = m?.Designation || '';
  const isOthers = rawDesig && !stdDesig.includes(rawDesig);
  const selectDesig = isOthers ? 'Others' : rawDesig;
  const desigOpts = stdDesig.map(d => `<option value="${d}" ${selectDesig === d ? 'selected' : ''}>${d}</option>`).join('');
  const countryOpts = countries.map(r => `<option value="${r.country_id}" ${m && m.country_id === r.country_id ? 'selected' : ''}>${esc(r.country)}</option>`).join('');
  const stateOpts   = states.map(r => `<option value="${r.state_id}" ${m && m.state_id === r.state_id ? 'selected' : ''}>${esc(r.state)}</option>`).join('');
  const photo = m && m.profile_picture_path ? profilePicUrl(m.profile_picture_path) : null;
  return `
    <div class="form-group"><label>Country *</label>
      <select id="mCommCountry" onchange="onCommitteeCountryChange()"><option value="">— Select Country —</option>${countryOpts}</select>
    </div>
    <div class="form-group"><label>State *</label>
      <select id="mCommState" ${m && m.country_id ? '' : 'disabled'}><option value="">${m && m.country_id ? '— Select State —' : '— Select Country first —'}</option>${stateOpts}</select>
    </div>
    <div class="form-group"><label>Full Name *</label>
      <input id="mCommName" type="text" value="${m ? esc(m.Name || '') : ''}" placeholder="Member's full name">
    </div>
    <div class="form-group"><label>Designation *</label>
      <select id="mCommDesignation" onchange="toggleCommitteeOthers()"><option value="">— Select Designation —</option>${desigOpts}</select>
    </div>
    <div id="commOthersGroup" class="form-group" style="${isOthers ? '' : 'display:none'}">
      <label>Custom Designation *</label>
      <input id="mCommDesignationOther" type="text" value="${isOthers ? esc(rawDesig) : ''}" placeholder="Enter designation manually">
    </div>
    <div class="form-group"><label>List Order (Optional)</label>
      <input id="mCommOrder" type="number" min="1" step="1" value="${m && m.list_order !== null && m.list_order !== undefined ? m.list_order : ''}" placeholder="e.g. 1, 2, 3...">
    </div>
    <div class="form-group"><label>Profile Picture</label>
      ${photo ? `<div style="margin-bottom:8px"><img src="${esc(photo)}" alt="Profile" style="width:64px;height:76px;object-fit:cover;border-radius:6px;border:1px solid var(--border)"></div>` : ''}
      <input id="mCommPhoto" type="file" accept="image/*">
      <div style="font-size:11px;color:var(--text-light);margin-top:4px">${photo ? 'Choose a new image to replace the current one.' : 'Optional — JPG/PNG, shown on the dashboard.'}</div>
    </div>`;
}

// Populate states when a country is chosen in the committee form.
async function onCommitteeCountryChange() {
  const countrySel = document.getElementById('mCommCountry');
  const stateSel   = document.getElementById('mCommState');
  if (!countrySel || !stateSel) return;
  const countryId = countrySel.value;
  stateSel.innerHTML = `<option value="">${countryId ? 'Loading…' : '— Select Country first —'}</option>`;
  stateSel.disabled = true;
  if (!countryId) return;
  try {
    const states = await lookupRows('lookup_state', { country_id: countryId }, 'state');
    stateSel.innerHTML = '<option value="">— Select State —</option>' + states.map(r => `<option value="${r.state_id}">${esc(r.state)}</option>`).join('');
    stateSel.disabled = false;
  } catch (err) { stateSel.innerHTML = '<option value="">— Select Country first —</option>'; toast(err.message, 'error'); }
}

function toggleCommitteeOthers() {
  const v  = document.getElementById('mCommDesignation')?.value;
  const og = document.getElementById('commOthersGroup');
  if (og) og.style.display = v === 'Others' ? '' : 'none';
  if (v !== 'Others' && document.getElementById('mCommDesignationOther'))
    document.getElementById('mCommDesignationOther').value = '';
}

// Reads + validates the committee form; returns the row payload and chosen photo file, or null if invalid.
function readCommitteeForm() {
  const countryId = val('mCommCountry');
  const stateId   = val('mCommState');
  const name      = val('mCommName');
  if (!countryId) return toast('Country is required', 'error'), null;
  if (!stateId)   return toast('State is required', 'error'), null;
  if (!name)      return toast('Full name is required', 'error'), null;
  const desig = val('mCommDesignation');
  if (!desig) return toast('Please select a designation', 'error'), null;
  if (desig === 'Others' && !val('mCommDesignationOther')) return toast('Please enter the custom designation', 'error'), null;
  const designation = desig === 'Others' ? val('mCommDesignationOther') : desig;
  const orderVal = val('mCommOrder');
  const list_order = orderVal !== '' && !isNaN(orderVal) ? parseInt(orderVal, 10) : null;
  const photoFile = document.getElementById('mCommPhoto')?.files?.[0] || null;
  return {
    payload: { Name: name, Designation: designation, country_id: parseInt(countryId, 10), state_id: parseInt(stateId, 10), list_order, is_state_committee: true, is_country_committee: false },
    photoFile,
  };
}

async function showAddCommitteeModal() {
  const body = await committeeFormHTML(null);
  showModal('Add Committee Member', body, async () => {
    const form = readCommitteeForm();
    if (!form) return false;
    const { data: newRow, error } = await supa.from('board_committee_list').insert(form.payload).select('id').single();
    if (error) return toast(error.message, 'error'), false;
    if (form.photoFile) {
      try {
        const picPath = await uploadProfilePic('committee_' + newRow.id, form.photoFile);
        const { error: picErr } = await supa.from('board_committee_list').update({ profile_picture_path: picPath }).eq('id', newRow.id);
        if (picErr) throw picErr;
      } catch (e) { toast('Member added, but photo upload failed: ' + e.message, 'error'); }
    }
    toast('Committee member added', 'success'); await navigate('sa-committee'); return true;
  });
}

async function showEditCommitteeModal(id) {
  const { data: m } = await supa.from('board_committee_list').select('*').eq('id', id).single();
  if (!m) return;
  const body = await committeeFormHTML(m);
  showModal('Edit Committee Member', body, async () => {
    const form = readCommitteeForm();
    if (!form) return false;
    const { error } = await supa.from('board_committee_list').update(form.payload).eq('id', id);
    if (error) return toast(error.message, 'error'), false;
    if (form.photoFile) {
      try {
        const picPath = await uploadProfilePic('committee_' + id, form.photoFile);
        const { error: picErr } = await supa.from('board_committee_list').update({ profile_picture_path: picPath }).eq('id', id);
        if (picErr) throw picErr;
      } catch (e) { toast('Member updated, but photo upload failed: ' + e.message, 'error'); }
    }
    toast('Committee member updated', 'success'); await navigate('sa-committee'); return true;
  });
}

function deleteCommitteeMember(id) {
  confirmAction('Delete this committee member? This cannot be undone.', async () => {
    const { error } = await supa.from('board_committee_list').delete().eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Committee member deleted', 'success'); await navigate('sa-committee');
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
      supa.from('profiles').select('id, name, username, role, site_id, created_at').in('role', ['siteadmin', 'rangeadmin']).order('name'),
      supa.from('sites').select('id, name'),
    ]);
    if (error) throw error;
    const siteMap = {};
    (sites || []).forEach(s => { siteMap[s.id] = s.name; });

    el.innerHTML = `
      <div class="panel-header"><div><h2>All Users</h2><p>View site and range administrators across all sites</p></div></div>
      <div class="card">
        <div class="card-body">
          <div class="filters">
            <input  class="filter-grow" id="saUSearch" type="text" placeholder="🔍 Search users..." oninput="filterSAUsers()">
            <select id="saURoleF" onchange="filterSAUsers()">
              <option value="">All Roles</option>
              <option value="siteadmin">Site Admins</option>
              <option value="rangeadmin">Range Admins</option>
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
                    <td><span class="role-badge role-${u.role}">${u.role === 'siteadmin' ? 'Site Admin' : u.role === 'rangeadmin' ? 'Range Admin' : 'Field User'}</span></td>
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
        ${statCard('⚖️', netBalance >= 0 ? 'si-teal' : 'si-red', '₹' + Math.abs(netBalance).toFixed(2), netBalance >= 0 ? 'Surplus' : 'Deficit')}
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
      <label style="display:block;margin-bottom:10px">Field Permissions</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${perm('pFee',      '💰', 'Fee Collection',        r?.fee_collection)}
        ${perm('pData',     '📁', 'Data Collection',       r?.data_collection)}
        ${perm('pReports',  '📈', 'View Reports',          r?.view_reports)}
        ${perm('pEvents',   '📋', 'Manage Events',         r?.manage_events)}
        ${perm('pExpenses', '💸', 'Expenses',              r?.expenses)}
        ${perm('pNoLogin',  '🚫', 'Restrict Login Access',  r?.restrict_login)}
      </div>
    </div>
    <div class="form-group">
      <label style="display:block;margin-bottom:10px">Management Access</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${perm('pSiteAdmin',     '🔑', 'Full Site Admin Access', r?.site_admin_access)}
        ${perm('pCreateMembers', '👨‍👩‍👧‍👦', 'Member Creation',        r?.create_members)}
        ${perm('pCreateDeps',    '👶', 'Dependent Creation',      r?.create_dependents)}
        ${perm('pCreateUsers',   '👥', 'Profile User Creation',   r?.create_users)}
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
                  <th>Manage Events</th>
                  <th>Expenses</th>
                  <th>Restrict Login</th>
                  <th>Site Admin Access</th>
                  <th>Member Creation</th>
                  <th>Dependent Creation</th>
                  <th>User Creation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${roles.map(r => `<tr>
                  <td><strong>${esc(r.name)}</strong></td>
                  <td>${permBadge(r.fee_collection)}</td>
                  <td>${permBadge(r.data_collection)}</td>
                  <td>${permBadge(r.view_reports)}</td>
                  <td>${permBadge(r.manage_events)}</td>
                  <td>${permBadge(r.expenses)}</td>
                  <td>${permBadge(r.restrict_login)}</td>
                  <td>${permBadge(r.site_admin_access)}</td>
                  <td>${permBadge(r.create_members)}</td>
                  <td>${permBadge(r.create_dependents)}</td>
                  <td>${permBadge(r.create_users)}</td>
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
      fee_collection:    document.getElementById('pFee')?.checked          || false,
      data_collection:   document.getElementById('pData')?.checked         || false,
      view_reports:      document.getElementById('pReports')?.checked      || false,
      manage_events:     document.getElementById('pEvents')?.checked       || false,
      expenses:          document.getElementById('pExpenses')?.checked     || false,
      restrict_login:    document.getElementById('pNoLogin')?.checked      || false,
      site_admin_access: document.getElementById('pSiteAdmin')?.checked    || false,
      create_members:    document.getElementById('pCreateMembers')?.checked || false,
      create_dependents: document.getElementById('pCreateDeps')?.checked   || false,
      create_users:      document.getElementById('pCreateUsers')?.checked  || false,
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
      fee_collection:    document.getElementById('pFee')?.checked          || false,
      data_collection:   document.getElementById('pData')?.checked         || false,
      view_reports:      document.getElementById('pReports')?.checked      || false,
      manage_events:     document.getElementById('pEvents')?.checked       || false,
      expenses:          document.getElementById('pExpenses')?.checked     || false,
      restrict_login:    document.getElementById('pNoLogin')?.checked      || false,
      site_admin_access: document.getElementById('pSiteAdmin')?.checked    || false,
      create_members:    document.getElementById('pCreateMembers')?.checked || false,
      create_dependents: document.getElementById('pCreateDeps')?.checked   || false,
      create_users:      document.getElementById('pCreateUsers')?.checked  || false,
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

  async function renderUserDonations() {
    const source = document.getElementById('admin-donations');
    const target = document.getElementById('user-donations');
    if (!source || !target) return;
    await renderAdminDonations();
    target.innerHTML = source.innerHTML;
    source.innerHTML = '';
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
//  PROFILE PICTURE STORAGE (Supabase Storage bucket)
// ============================================================

const PROFILE_PIC_BUCKET = 'profile-pictures';

// Resolves a stored profile_picture_path to a public URL (returns null if no path).
function profilePicUrl(path) {
  if (!path) return null;
  try {
    const { data } = supa.storage.from(PROFILE_PIC_BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch { return null; }
}

// Uploads a profile picture with the member/record UUID as the path prefix.
async function uploadProfilePic(recordId, file) {
  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${recordId}/profile_${Date.now()}.${ext}`;
  const { error } = await supa.storage.from(PROFILE_PIC_BUCKET).upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  return path;
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
    const [{ data: site }, { count: usersCount }, { count: actsCount }, { data: feeRecs }, { count: dataCount }, { data: expRecs }, { data: committeeMembers }, { data: lookupStates }, { data: lookupCountries }] = await Promise.all([
      supa.from('sites').select('name, address, country, state').eq('id', siteId).single(),
      supa.from('profiles').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('role', 'user'),
      supa.from('activities').select('*', { count: 'exact', head: true }).eq('site_id', siteId),
      supa.from('fee_records').select('amount').eq('site_id', siteId),
      supa.from('data_records').select('*', { count: 'exact', head: true }).eq('site_id', siteId),
      supa.from('expenses').select('amount').eq('site_id', siteId),
      supa.from('members').select('*').eq('site_id', siteId).eq('is_community_member', true),
      supa.from('lookup_state').select('state_id, state, country_id'),
      supa.from('lookup_country').select('country_id, country'),
    ]);
    // Resolve this site's state_id from its stored state name, then pull its state committee board.
    const stateRow = (lookupStates || []).find(r => r.state === site?.state);
    let boardList = [];
    if (stateRow) {
      const { data } = await supa.from('board_committee_list').select('*')
        .eq('is_state_committee', true).eq('state_id', stateRow.state_id).order('list_order');
      boardList = data || [];
    } else {
      const { data } = await supa.from('board_committee_list').select('*')
        .eq('is_state_committee', true).order('list_order');
      boardList = data || [];
    }
    const totalFees = (feeRecs || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalExp  = (expRecs || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    const getInitials = n => (n || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

    const renderBoardCards = (items) => {
      if (!items || !items.length) return `<p style="color:var(--text-light);font-size:13px;text-align:center;padding:10px;width:100%">No board members listed</p>`;
      return items.map(item => {
        const name = item.Name || item.name || item.member_name || item.person_name || '—';
        const roleTitle = item.Designation || item.designation || 'Board Member';
        const photoUrl = profilePicUrl(item.profile_picture_path);
        const initials = getInitials(name);
        const photoContent = photoUrl
          ? `<img src="${esc(photoUrl)}" alt="${esc(name)}" class="stamp-photo-img" onerror="this.outerHTML='<div class=\'stamp-photo-placeholder\'>${initials}</div>'">`
          : `<div class="stamp-photo-placeholder">${initials}</div>`;
        return `
          <div class="committee-stamp-card">
            <div class="stamp-photo-frame">${photoContent}</div>
            <div class="member-name">${esc(name)}</div>
            <div class="member-role">${esc(roleTitle)}</div>
          </div>`;
      }).join('');
    };

    const boardItems = (boardList || []).slice();
    boardItems.sort((a, b) => {
      const ordA = a.list_order !== null && a.list_order !== undefined ? parseInt(a.list_order, 10) : 9999;
      const ordB = b.list_order !== null && b.list_order !== undefined ? parseInt(b.list_order, 10) : 9999;
      return ordA - ordB;
    });

    // The board table now only holds the state committee; the Mahallu board always comes from site members.
    const mahalluBoardItems = [];
    const stateBoardItems   = boardItems;

    let mahalluBoardHTML = '';
    if (mahalluBoardItems.length > 0) {
      mahalluBoardHTML = renderBoardCards(mahalluBoardItems);
    } else {
      const validCommitteeMembers = (committeeMembers || []).filter(m => Boolean(m.is_community_member));
      const orderedMembers = validCommitteeMembers.filter(m => m.dashboard_view_order !== null && m.dashboard_view_order !== undefined && !isNaN(m.dashboard_view_order));
      
      let membersToDisplay = [];
      if (orderedMembers.length > 0) {
        orderedMembers.sort((a, b) => parseInt(a.dashboard_view_order, 10) - parseInt(b.dashboard_view_order, 10));
        membersToDisplay = orderedMembers.map(m => ({ member: m, roleTitle: m.designation || 'Committee Member' }));
      } else {
        const defaultRoles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Committee Member'];
        const assignedMembers = validCommitteeMembers.map(m => ({ ...m, _used: false }));
        membersToDisplay = defaultRoles.map((defaultRole) => {
          let member = assignedMembers.find(m => !m._used && String(m.designation || '').toLowerCase() === defaultRole.toLowerCase());
          if (!member) member = assignedMembers.find(m => !m._used);
          if (member) member._used = true;
          return { member: member || null, roleTitle: member?.designation || defaultRole };
        });
      }

      mahalluBoardHTML = membersToDisplay.map(slot => {
        const m = slot.member;
        const roleTitle = slot.roleTitle;
        if (m) {
          const initials = getInitials(m.name);
          const memberPhotoUrl = profilePicUrl(m.profile_picture_path);
          const photoContent = memberPhotoUrl
            ? `<img src="${esc(memberPhotoUrl)}" alt="${esc(m.name)}" class="stamp-photo-img" onerror="this.outerHTML='<div class=\'stamp-photo-placeholder\'>${initials}</div>'">`
            : `<div class="stamp-photo-placeholder">${initials}</div>`;
          return `
            <div class="committee-stamp-card">
              <div class="stamp-photo-frame">${photoContent}</div>
              <div class="member-name">${esc(m.name)}</div>
              <div class="member-role">${esc(roleTitle)}</div>
            </div>`;
        } else {
          return `
            <div class="committee-stamp-card">
              <div class="stamp-photo-frame">
                <div class="stamp-photo-empty">👤</div>
              </div>
              <div class="member-name" style="color:#9ca3af;font-style:italic">Vacant</div>
              <div class="member-role">${esc(roleTitle)}</div>
            </div>`;
        }
      }).join('');
    }

    const stateBoardHTML = renderBoardCards(stateBoardItems);

    el.innerHTML = `
      <div class="panel-header"><div><h2>${esc(site?.name || 'Site')}</h2><p>Site Admin Dashboard${site?.address ? ' &bull; ' + esc(site.address) : ''}</p></div></div>
      
      <div class="committee-dashboard-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:15px;font-weight:600;color:var(--text);margin:0">State Committee Board</h3>
        </div>
        <div class="committee-stamp-grid">
          ${stateBoardHTML}
        </div>
      </div>

      <div class="committee-dashboard-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="font-size:15px;font-weight:600;color:var(--text);margin:0">Mahallu Jamaath Committee Board</h3>
        </div>
        <div class="committee-stamp-grid">
          ${mahalluBoardHTML}
        </div>
      </div>

      <div class="stats-grid">
        ${statCard('👥', 'si-blue',   usersCount || 0,            'Users')}
        ${statCard('📋', 'si-yellow', actsCount  || 0,            'Activities')}
        ${statCard('💰', 'si-green',  '₹' + totalFees.toFixed(2), 'Fees Collected')}
        ${statCard('💸', 'si-yellow', '₹' + totalExp.toFixed(2),  'Total Expenses')}
        ${statCard('📝', 'si-teal',   (feeRecs || []).length,     'Fee Transactions')}
        ${statCard('📁', 'si-purple', dataCount  || 0,            'Data Records')}
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
      supa.from('profiles').select('id, username, role_id, created_at, member:members!mem_id(name,phone), memberRole:roles!role_id(name)').eq('site_id', siteId).eq('role', 'user').order('created_at', { ascending: false }),
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
        <div><h2>Profile Users</h2><p>Manage login profiles for your Jamath</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showCreateProfileModal()">+ Create Profile</button></div>
      </div>
      <div class="card">
        <div class="card-body table-wrapper">
          ${!(users || []).length ? emptyState('👥', 'No members yet', 'Add members to assign them to activities') : `
            <table>
              <thead><tr><th>Member</th><th>User Name</th><th>Phone</th><th>Role</th><th>Actions</th></tr></thead>
              <tbody>
                ${users.map(u => `<tr>
                  <td><strong>${esc(u.member?.name || '—')}</strong></td>
                  <td>${esc(u.username || '—')}</td>
                  <td>${esc(u.member?.phone || '—')}</td>
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

function profileFormBody(roles, members, u = null) {
  const roleOpts = (roles || []).map(r =>
    `<option value="${r.id}" data-restrict="${r.restrict_login}" ${u?.role_id === r.id ? 'selected' : ''}>${esc(r.name)}</option>`
  ).join('');

  const defaultRole = (roles || []).find(r => r.name.toLowerCase() === 'user');

  return `
    <div class="form-group"><label>Role</label>
      <select id="mRoleId" onchange="toggleMemberRoleFields()">
        ${defaultRole ? `<option value="${defaultRole.id}" ${!u?.role_id || u.role_id === defaultRole.id ? 'selected' : ''}>${esc(defaultRole.name)}</option>` : '<option value="">— Select Role —</option>'}${roleOpts}
      </select>
    </div>
    <div class="form-group"><label>Member *</label>
      <select id="mMemberId"><option value="">— Select Member —</option>${(members || []).map(member => `<option value="${member.id}" ${u?.mem_id === member.id ? 'selected' : ''}>${esc(member.name)}${member.phone ? ` (${esc(member.phone)})` : ''}</option>`).join('')}</select>
    </div>
    <div class="form-group"><label>User Name</label>
      <input id="mEmail" type="text" value="${u ? esc(u.username || '') : ''}" placeholder="user name">
    </div>
    <div class="form-group">
      <label>${u ? 'New Password <span style="font-weight:400;color:#9ca3af">(leave blank to keep)</span>' : 'Password'}</label>
      <input id="mPassword" type="password" placeholder="${u ? 'New password' : 'Min 6 characters'}">
    </div>`;
}

async function showCreateProfileModal() {
  const [{ data: roles }, { data: members }] = await Promise.all([
    supa.from('roles').select('id, name, restrict_login').order('name'),
    supa.from('members').select('id, name, phone').eq('site_id', currentUser.site_id).order('name'),
  ]);
  showModal('Create Profile', profileFormBody(roles, members), async () => {
    const memberId = val('mMemberId'), username = val('mEmail'), password = val('mPassword');
    const selectedMember = (members || []).find(member => member.id === memberId);
    if (!memberId) return toast('Member is required', 'error'), false;
    if (!selectedMember) return toast('Invalid member selected', 'error'), false;
    if (!username) return toast('User name is required', 'error'), false;
    if (!password || password.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const { error } = await supa.from('profiles').insert({
      mem_id: memberId,
      name: selectedMember.name,
      phone: selectedMember.phone || null,
      username: username.toLowerCase(),
      password_hash: await hashPw(password),
      role:      'user',
      site_id:   currentUser.site_id,
      role_id:   val('mRoleId') || null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Profile created', 'success'); await navigate('admin-users'); return true;
  });
}

async function showEditUserModal(userId) {
  const [{ data: u }, { data: roles }, { data: members }] = await Promise.all([
    supa.from('profiles').select('*').eq('id', userId).single(),
    supa.from('roles').select('id, name, restrict_login').order('name'),
    supa.from('members').select('id, name, phone').eq('site_id', currentUser.site_id).order('name'),
  ]);
  if (!u) return;

  showModal('Edit Profile', profileFormBody(roles, members, u), async () => {
    const username = val('mEmail'), memberId = val('mMemberId');
    const selectedMember = (members || []).find(member => member.id === memberId);
    const pw = val('mPassword');
    if (!memberId) return toast('Member is required', 'error'), false;
    if (!selectedMember) return toast('Invalid member selected', 'error'), false;
    if (!username) return toast('User name is required', 'error'), false;
    if (pw && pw.length < 6) return toast('Password must be at least 6 characters', 'error'), false;
    const updates = {
      mem_id: memberId,
      name: selectedMember.name,
      phone: selectedMember.phone || null,
      username: username.toLowerCase(),
      role_id:   val('mRoleId') || null,
    };
    if (pw) updates.password_hash = await hashPw(pw);
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
      .eq('is_dependant', false)
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

function memberRecordFormHTML(m, guardianOpts = '', relationshipOpts = '', allowDependent = false) {
  const isCommittee = m?.is_community_member || false;
  const rawDesig    = m?.designation || '';
  const stdDesig    = ['President','Vice President','Secretary','Treasurer','Committee Member'];
  const isOthers    = rawDesig && !stdDesig.includes(rawDesig);
  const selectDesig = isOthers ? 'Others' : rawDesig;
  const desigOpts   = ['President','Vice President','Secretary','Treasurer','Committee Member','Others']
    .map(d => `<option value="${d}" ${selectDesig === d ? 'selected' : ''}>${d}</option>`).join('');
  return `
    <div class="form-group"><label>Full Name *</label>
      <input id="mMemberName" type="text" value="${m ? esc(m.name) : ''}" placeholder="Member's full name">
    </div>
    <div class="form-group"><label>Phone *</label>
      <input id="mMemberPhone" type="tel" value="${m ? esc(m.phone || '') : ''}" placeholder="10-digit phone number" maxlength="10">
    </div>
    <div class="form-group form-group-checkbox">
      <label class="checkbox-label" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;margin:0;font-size:13px;font-weight:600;user-select:none"><input type="checkbox" id="mMemberIsCommittee" style="width:16px;height:16px;min-width:16px;margin:0;cursor:pointer" onchange="toggleMemberRecordCommittee()" ${isCommittee ? 'checked' : ''}> Is Committee Member?</label>
    </div>
    ${allowDependent ? `<div class="form-group form-group-checkbox">
      <label class="checkbox-label" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;margin:0;font-size:13px;font-weight:600;user-select:none"><input type="checkbox" id="mMemberIsDependent" style="width:16px;height:16px;min-width:16px;margin:0;cursor:pointer" onchange="toggleMemberDependent()"> Is Dependant</label>
    </div>
    <div id="memberDependentFields" style="display:none">
      <div class="form-group"><label>Guardian *</label><select id="mMemberGuardianId"><option value="">— Select Guardian —</option>${guardianOpts}</select></div>
      <div class="form-group"><label>Relationship with Guardian *</label><select id="mMemberRelationshipId"><option value="">— Select Relationship —</option>${relationshipOpts}</select></div>
    </div>` : ''}
    <div id="memberDesignationGroup" class="form-group" style="${isCommittee ? '' : 'display:none'}">
      <label>Designation *</label>
      <select id="mMemberDesignation" onchange="toggleMemberRecordOthers()">
        <option value="">— Select Designation —</option>${desigOpts}
      </select>
    </div>
    <div id="memberPhotoGroup" class="form-group" style="${isCommittee ? '' : 'display:none'}">
      <label>Profile Picture</label>
      ${m && m.profile_picture_path && profilePicUrl(m.profile_picture_path) ? `<div style="margin-bottom:8px"><img src="${esc(profilePicUrl(m.profile_picture_path))}" alt="Profile" style="width:64px;height:76px;object-fit:cover;border-radius:6px;border:1px solid var(--border)"></div>` : ''}
      <input id="mMemberPhoto" type="file" accept="image/*">
      <div style="font-size:11px;color:var(--text-light);margin-top:4px">${m && m.profile_picture_path ? 'Choose a new image to replace the current one.' : 'Optional — JPG/PNG, shown on the dashboard.'}</div>
    </div>
    <div id="memberOthersGroup" class="form-group" style="${isOthers ? '' : 'display:none'}">
      <label>Custom Designation *</label>
      <input id="mMemberDesignationOther" type="text" value="${isOthers ? esc(rawDesig) : ''}" placeholder="Enter designation manually">
    </div>
    <div id="memberDashboardOrderGroup" class="form-group" style="${isCommittee ? '' : 'display:none'}"><label>Dashboard View Order (Optional)</label>
      <input id="mMemberDashboardOrder" type="number" min="1" step="1" value="${m && m.dashboard_view_order !== null && m.dashboard_view_order !== undefined ? m.dashboard_view_order : ''}" placeholder="e.g. 1, 2, 3...">
    </div>
    <div class="form-group"><label>Notes</label>
      <textarea id="mMemberNotes" placeholder="Any additional notes...">${m ? esc(m.notes || '') : ''}</textarea>
    </div>`;
}

function toggleMemberRecordCommittee() {
  const checked = document.getElementById('mMemberIsCommittee')?.checked;
  const dg = document.getElementById('memberDesignationGroup');
  const og = document.getElementById('memberOthersGroup');
  const pg = document.getElementById('memberPhotoGroup');
  const dog = document.getElementById('memberDashboardOrderGroup');
  if (dg) dg.style.display = checked ? '' : 'none';
  if (pg) pg.style.display = checked ? '' : 'none';
  if (dog) dog.style.display = checked ? '' : 'none';
  if (!checked) {
    const ds = document.getElementById('mMemberDesignation');
    if (ds) ds.value = '';
    if (og) og.style.display = 'none';
  }
}

function toggleMemberDependent() {
  const isDependent = document.getElementById('mMemberIsDependent')?.checked;
  const dependentFields = document.getElementById('memberDependentFields');
  const committeeGroup = document.getElementById('mMemberIsCommittee')?.closest('.form-group');
  const committee = document.getElementById('mMemberIsCommittee');
  if (dependentFields) dependentFields.style.display = isDependent ? '' : 'none';
  if (committeeGroup) committeeGroup.style.display = isDependent ? 'none' : '';
  if (committee && isDependent) {
    committee.checked = false;
    toggleMemberRecordCommittee();
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
  const [{ data: guardians, error: guardiansError }, { data: relationships, error: relationshipsError }] = await Promise.all([
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).order('name'),
    supa.from('lookup_relationship').select('id, relation').order('order'),
  ]);
  if (guardiansError || relationshipsError) return toast((guardiansError || relationshipsError).message, 'error');
  const guardianOpts = (guardians || []).map(member => `<option value="${member.id}">${esc(member.name)}</option>`).join('');
  const relationshipOpts = (relationships || []).map(relationship => `<option value="${relationship.id}">${esc(relationship.relation)}</option>`).join('');
  showModal('Add Member', memberRecordFormHTML(null, guardianOpts, relationshipOpts, true), async () => {
    const name = val('mMemberName');
    if (!name) return toast('Full name is required', 'error'), false;
    const phone = val('mMemberPhone').trim();
    const isDependent = document.getElementById('mMemberIsDependent')?.checked || false;
    if (!phone) return toast('Phone number is required', 'error'), false;
    if (!/^\d{10}$/.test(phone)) return toast('Phone number must be exactly 10 digits', 'error'), false;
    if (isDependent) {
      const guardianId = val('mMemberGuardianId');
      const relationshipId = val('mMemberRelationshipId');
      if (!guardianId) return toast('Please select a member', 'error'), false;
      if (!relationshipId) return toast('Please select a relationship', 'error'), false;
      const { error } = await supa.from('members').insert({
        site_id: currentUser.site_id, guardian_id: guardianId,
        is_dependant: true, dep_relation_to_guardian: Number(relationshipId),
        name, phone, is_community_member: false,
        notes: val('mMemberNotes') || null,
      });
      if (error) return toast(error.message, 'error'), false;
      toast('Dependent member added', 'success'); await navigate('admin-members'); return true;
    }
    const isCommittee = document.getElementById('mMemberIsCommittee')?.checked || false;
    if (isCommittee && !val('mMemberDesignation')) return toast('Please select a designation', 'error'), false;
    const desig = val('mMemberDesignation');
    if (desig === 'Others' && !val('mMemberDesignationOther')) return toast('Please enter the custom designation', 'error'), false;
    const designation = desig === 'Others' ? val('mMemberDesignationOther') : desig;
    const dashOrderVal = val('mMemberDashboardOrder');
    const dashboard_view_order = dashOrderVal !== '' && !isNaN(dashOrderVal) ? parseInt(dashOrderVal, 10) : null;
    const photoFile = isCommittee ? (document.getElementById('mMemberPhoto')?.files?.[0] || null) : null;
    const { data: newMember, error } = await supa.from('members').insert({
      site_id: currentUser.site_id,
      name,
      phone,
      is_community_member: isCommittee,
      designation:         isCommittee ? designation || null : null,
      dashboard_view_order: isCommittee ? dashboard_view_order : null,
      notes:               val('mMemberNotes') || null,
    }).select('id').single();
    if (error) return toast(error.message, 'error'), false;
    if (photoFile) {
      try {
        const picPath = await uploadProfilePic(newMember.id, photoFile);
        const { error: picErr } = await supa.from('members').update({ profile_picture_path: picPath }).eq('id', newMember.id);
        if (picErr) throw picErr;
      } catch (e) { toast('Member added, but photo upload failed: ' + e.message, 'error'); }
    }
    toast('Member added', 'success'); await navigate('admin-members'); return true;
  });
}

async function showEditMemberRecordModal(memberId) {
  const { data: m } = await supa.from('members').select('*').eq('id', memberId).single();
  if (!m) return;
  showModal('Edit Member', memberRecordFormHTML(m), async () => {
    const name = val('mMemberName');
    if (!name) return toast('Full name is required', 'error'), false;
    const phone = val('mMemberPhone').trim();
    if (!phone) return toast('Phone number is required', 'error'), false;
    if (!/^\d{10}$/.test(phone)) return toast('Phone number must be exactly 10 digits', 'error'), false;
    const isCommittee = document.getElementById('mMemberIsCommittee')?.checked || false;
    if (isCommittee && !val('mMemberDesignation')) return toast('Please select a designation', 'error'), false;
    const desig = val('mMemberDesignation');
    if (desig === 'Others' && !val('mMemberDesignationOther')) return toast('Please enter the custom designation', 'error'), false;
    const designation = desig === 'Others' ? val('mMemberDesignationOther') : desig;
    const dashOrderVal = val('mMemberDashboardOrder');
    const dashboard_view_order = dashOrderVal !== '' && !isNaN(dashOrderVal) ? parseInt(dashOrderVal, 10) : null;
    const photoFile = isCommittee ? (document.getElementById('mMemberPhoto')?.files?.[0] || null) : null;
    const { error } = await supa.from('members').update({
      name,
      phone,
      is_community_member: isCommittee,
      designation:         isCommittee ? designation || null : null,
      dashboard_view_order,
      notes:               val('mMemberNotes') || null,
    }).eq('id', memberId);
    if (error) return toast(error.message, 'error'), false;
    if (photoFile) {
      try {
        const picPath = await uploadProfilePic(memberId, photoFile);
        const { error: picErr } = await supa.from('members').update({ profile_picture_path: picPath }).eq('id', memberId);
        if (picErr) throw picErr;
      } catch (e) { toast('Member updated, but photo upload failed: ' + e.message, 'error'); }
    }
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
      .from('members')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_dependant', true)
      .order('name');
    if (error) throw error;
    const guardianIds = [...new Set((dependents || []).map(dependent => dependent.guardian_id).filter(Boolean))];
    const { data: guardians, error: guardiansError } = guardianIds.length
      ? await supa.from('members').select('id, name').in('id', guardianIds)
      : { data: [], error: null };
    if (guardiansError) throw guardiansError;
    const guardianMap = Object.fromEntries((guardians || []).map(guardian => [guardian.id, guardian.name]));

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
                  <td>${d.guardian_id && guardianMap[d.guardian_id] ? esc(guardianMap[d.guardian_id]) : '<span class="badge badge-warning">Unassigned</span>'}</td>
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
  const { data: members } = await supa.from('members').select('id, name').eq('site_id', siteId).eq('is_dependant', false).order('name');
  return (members || []).map(m =>
    `<option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>${esc(m.name)}</option>`
  ).join('');
}

async function relationshipSelectOpts(selectedId) {
  const { data: relationships, error } = await supa.from('lookup_relationship').select('id, relation').order('order');
  if (error) throw error;
  return (relationships || []).map(relationship =>
    `<option value="${relationship.id}" ${String(relationship.id) === String(selectedId) ? 'selected' : ''}>${esc(relationship.relation)}</option>`
  ).join('');
}

function dependentFormHTML(guardianOpts, relationshipOpts, d) {
  return `
    <div class="form-group"><label>Full Name *</label>
      <input id="mDepName" type="text" value="${d ? esc(d.name) : ''}" placeholder="Dependent's full name">
    </div>
    <div class="form-group"><label>Phone</label>
      <input id="mDepPhone" type="tel" value="${d ? esc(d.phone || '') : ''}" placeholder="Phone number">
    </div>
    <div class="form-group"><label>Guardian *</label>
      <select id="mGuardianId"><option value="">— Select Guardian —</option>${guardianOpts}</select>
    </div>
    <div class="form-group"><label>Relationship with Guardian *</label>
      <select id="mDepRelationshipId"><option value="">— Select Relationship —</option>${relationshipOpts}</select>
    </div>
    <div class="form-group"><label>Notes</label>
      <textarea id="mDepNotes" placeholder="Any additional notes...">${d ? esc(d.notes || '') : ''}</textarea>
    </div>`;
}

async function showAddDependentModal() {
  let guardianOpts, relationshipOpts;
  try {
    [guardianOpts, relationshipOpts] = await Promise.all([
      guardianSelectOpts(currentUser.site_id, ''),
      relationshipSelectOpts(''),
    ]);
  } catch (err) { return toast(err.message, 'error'); }
  showModal('Add Dependent', dependentFormHTML(guardianOpts, relationshipOpts, null), async () => {
    const name = val('mDepName');
    if (!name) return toast('Full name is required', 'error'), false;
    const phone = val('mDepPhone').trim();
    if (!phone) return toast('Phone number is required', 'error'), false;
    if (!/^\d{10}$/.test(phone)) return toast('Phone number must be exactly 10 digits', 'error'), false;
    const guardianId = val('mGuardianId');
    const relationshipId = val('mDepRelationshipId');
    if (!guardianId) return toast('Guardian is required', 'error'), false;
    if (!relationshipId) return toast('Relationship with guardian is required', 'error'), false;
    const { error } = await supa.from('members').insert({
      site_id: currentUser.site_id, name, phone,
      guardian_id: guardianId, is_dependant: true, dep_relation_to_guardian: Number(relationshipId),
      is_community_member: false, notes: val('mDepNotes') || null,
    });
    if (error) return toast(error.message, 'error'), false;
    toast('Dependent added', 'success'); await navigate('admin-dependents'); return true;
  });
}

async function showEditDependentModal(depId) {
  const [{ data: d }, guardianOpts, relationshipOpts] = await Promise.all([
    supa.from('members').select('*').eq('id', depId).eq('is_dependant', true).single(),
    guardianSelectOpts(currentUser.site_id, ''),
    relationshipSelectOpts(''),
  ]);
  if (!d) return;
  const selectedGuardianOpts = await guardianSelectOpts(currentUser.site_id, d.guardian_id || '');
  const selectedRelationshipOpts = await relationshipSelectOpts(d.dep_relation_to_guardian || '');
  showModal('Edit Dependent', dependentFormHTML(selectedGuardianOpts, selectedRelationshipOpts, d), async () => {
    const name = val('mDepName');
    if (!name) return toast('Full name is required', 'error'), false;
    const phone = val('mDepPhone').trim();
    if (!phone) return toast('Phone number is required', 'error'), false;
    if (!/^\d{10}$/.test(phone)) return toast('Phone number must be exactly 10 digits', 'error'), false;
    const guardianId = val('mGuardianId');
    const relationshipId = val('mDepRelationshipId');
    if (!guardianId) return toast('Guardian is required', 'error'), false;
    if (!relationshipId) return toast('Relationship with guardian is required', 'error'), false;
    const { error } = await supa.from('members').update({
      guardian_id: guardianId, dep_relation_to_guardian: Number(relationshipId),
      name, phone, notes: val('mDepNotes') || null,
    }).eq('id', depId);
    if (error) return toast(error.message, 'error'), false;
    toast('Dependent updated', 'success'); await navigate('admin-dependents'); return true;
  });
}

function deleteDependent(depId) {
  confirmAction('Delete this dependent record? This cannot be undone.', async () => {
    const { error } = await supa.from('members').delete().eq('id', depId).eq('is_dependant', true);
    if (error) return toast(error.message, 'error');
    toast('Dependent deleted', 'success'); await navigate('admin-dependents');
  });
}

// ============================================================
//  SITE ADMIN — ACTIVITIES
// ============================================================

async function renderUserEvents() {
  window._actNavTarget = 'user-events';
  await renderAdminActivities('user-events');
}

async function renderAdminActivities(elId = 'admin-activities') {
  window._actNavTarget = elId;
  const el = document.getElementById(elId);
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: activities, error }, { count: siteUsersCount }, { data: feeAmts }, { data: feeCounts }, { data: dataCounts }, { data: eventTypes, error: eventTypesError }] = await Promise.all([
      supa.from('activities').select('*').eq('site_id', siteId).order('created_at', { ascending: false }),
      supa.from('profiles').select('*', { count: 'exact', head: true }).eq('site_id', siteId).eq('role', 'user'),
      supa.from('fee_records').select('activity_id, amount').eq('site_id', siteId),
      supa.from('fee_records').select('activity_id').eq('site_id', siteId),
      supa.from('data_records').select('activity_id').eq('site_id', siteId),
      supa.from('event_types').select('id, type'),
    ]);
    if (error) throw error;
    if (eventTypesError) throw eventTypesError;
    const feeAmtMap = {}, feeCountMap = {}, dataCountMap = {};
    const eventTypeMap = Object.fromEntries((eventTypes || []).map(eventType => [eventType.id, eventType.type]));
    (feeAmts   || []).forEach(r => { feeAmtMap[r.activity_id]   = (feeAmtMap[r.activity_id]   || 0) + parseFloat(r.amount || 0); });
    (feeCounts || []).forEach(r => { feeCountMap[r.activity_id]  = (feeCountMap[r.activity_id]  || 0) + 1; });
    (dataCounts|| []).forEach(r => { dataCountMap[r.activity_id] = (dataCountMap[r.activity_id] || 0) + 1; });

    const allActs = activities || [];
    let archivedCount = 0;
    let activeCount = 0;
    allActs.forEach(a => {
      const isArchived = Boolean(a.due_date && new Date(a.due_date) < new Date());
      if (isArchived) archivedCount++;
      else activeCount++;
    });

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Manage Events</h2><p>Create and assign payment and data collection events</p></div>
        <div class="panel-header-actions"><button class="btn btn-primary" onclick="showAddActivityModal()">+ Create Activity</button></div>
      </div>
      ${!allActs.length ? emptyState('📋', 'No activities yet', 'Create fee collection or data collection activities and assign them to users') : `
        <div class="filters">
          <input class="filter-grow" id="actSearch_${elId}" type="text" placeholder="🔍 Search events..." oninput="filterActivities('${elId}')">
          <select id="actStatusFilter_${elId}" onchange="filterActivities('${elId}')">
            <option value="active" selected>Active Events (${activeCount})</option>
            <option value="archived">📦 Archived / Due Passed (${archivedCount})</option>
            <option value="all">All Events (${allActs.length})</option>
          </select>
          <select id="actTypeFilter_${elId}" onchange="filterActivities('${elId}')">
            <option value="all">All Event Types</option>
            ${(eventTypes || []).map(t => `<option value="${t.id}">${esc(t.type)}</option>`).join('')}
          </select>
        </div>
        <div class="act-no-match" style="display:none;text-align:center;padding:40px 20px;color:var(--text-light)">
          <h3>No matching events found</h3>
          <p id="actNoMatchHint_${elId}">Try changing your search query or filter options.</p>
        </div>
        <div class="activity-grid">
          ${allActs.map(a => {
            const typeStr = String(eventTypeMap[a.type] || a.type).toLowerCase();
            const isFee = typeStr === 'fee' || Number(a.type) === 1;
            const isDonationEvent = a.is_donation_event || Number(a.type) === 3;
            const assigned  = (a.assigned_users || []).length;
            const records   = isFee ? (feeCountMap[a.id] || 0) : (dataCountMap[a.id] || 0);
            const collected = isFee ? (feeAmtMap[a.id]   || 0) : null;
            const isArchived = Boolean(a.due_date && new Date(a.due_date) < new Date());
            return `<div class="activity-card ${typeStr} ${isArchived ? 'archived overdue' : ''}"
                        data-name="${esc(a.name).toLowerCase()}"
                        data-type="${a.type}"
                        data-archived="${isArchived}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <h4>${esc(a.name)}</h4>
                <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
                  ${isArchived ? `<span class="badge badge-warning" title="Due date passed">📦 Archived</span>` : ''}
                  <span class="badge ${isFee ? 'badge-success' : 'badge-info'}">${isFee ? '💰 Fee' : `📁 ${esc(typeStr)}`}</span>
                </div>
              </div>
              <div class="activity-meta">
                ${isFee ? `<div>Target: <strong>₹${parseFloat(a.target_amount || 0).toFixed(2)}</strong>/person</div>` : ''}
                ${a.description ? `<div>${esc(a.description)}</div>` : ''}
                <div>Due: ${a.due_date ? fmtDate(a.due_date) : 'No deadline'} ${isArchived ? '<span class="badge badge-danger">Due Passed</span>' : ''}</div>
              </div>
              <div class="activity-stats">
                ${!isDonationEvent ? `<span>👥 ${assigned}/${siteUsersCount || 0} assigned</span>` : ''}
                <span>📝 ${records} records</span>
                ${collected !== null ? `<span class="text-green">💰 ₹${collected.toFixed(2)}</span>` : ''}
              </div>
              <div class="activity-actions">
                <button class="btn btn-secondary btn-sm" onclick="showEditActivityModal('${a.id}')">✏️ Edit</button>
                ${!isDonationEvent ? `<button class="btn btn-primary btn-sm" onclick="showAssignModal('${a.id}')">👥 Assign</button>` : ''}
                <button class="btn btn-info btn-sm"      onclick="showAssignCollectorsModal('${a.id}')">👤 Collectors</button>
                <button class="btn btn-danger btn-sm"    onclick="deleteActivity('${a.id}')">🗑️</button>
              </div>
            </div>`;
          }).join('')}
        </div>`}`;

    if (allActs.length) {
      filterActivities(elId);
    }
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function filterActivities(elId = window._actNavTarget || 'admin-activities') {
  const container = document.getElementById(elId);
  if (!container) return;

  const searchInput  = container.querySelector(`[id^="actSearch"]`);
  const statusSelect = container.querySelector(`[id^="actStatusFilter"]`);
  const typeSelect   = container.querySelector(`[id^="actTypeFilter"]`);

  const query        = (searchInput?.value || '').toLowerCase().trim();
  const statusFilter = statusSelect?.value || 'active';
  const typeFilter   = typeSelect?.value || 'all';

  const cards = container.querySelectorAll('.activity-card');
  let visibleCount = 0;
  let archivedCount = 0;

  cards.forEach(card => {
    const name       = card.dataset.name || '';
    const type       = card.dataset.type || '';
    const isArchived = card.dataset.archived === 'true';

    if (isArchived) archivedCount++;

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = !isArchived;
    } else if (statusFilter === 'archived') {
      matchesStatus = isArchived;
    }

    let matchesType = true;
    if (typeFilter !== 'all') {
      matchesType = String(type) === String(typeFilter);
    }

    let matchesSearch = true;
    if (query) {
      matchesSearch = name.includes(query);
    }

    const show = matchesStatus && matchesType && matchesSearch;
    card.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  const noMatchEl = container.querySelector('.act-no-match');
  const hintEl    = container.querySelector(`[id^="actNoMatchHint"]`);
  if (noMatchEl) {
    if (visibleCount === 0 && cards.length > 0) {
      noMatchEl.style.display = '';
      if (statusFilter === 'active' && archivedCount > 0) {
        if (hintEl) {
          hintEl.innerHTML = `All active events are completed or their due dates have passed (${archivedCount} archived event${archivedCount > 1 ? 's' : ''} available). <a href="#" onclick="event.preventDefault();setActStatusFilter('${elId}', 'archived')" style="color:var(--primary);font-weight:600">View Archived Events →</a>`;
        }
      } else {
        if (hintEl) {
          hintEl.textContent = 'Try changing your search query or filter options.';
        }
      }
    } else {
      noMatchEl.style.display = 'none';
    }
  }
}

function setActStatusFilter(elId, status) {
  const container = document.getElementById(elId);
  if (!container) return;
  const select = container.querySelector(`[id^="actStatusFilter"]`);
  if (select) {
    select.value = status;
    filterActivities(elId);
  }
}

function associationSetupHTML(members = [], dependents = [], designations = [], records = []) {
  const participantOptions = `
    <option value="">— Select person —</option>
    <optgroup label="Members">${members.map(member => `<option value="${member.id}">${esc(member.name)}</option>`).join('')}</optgroup>
    <optgroup label="Dependents">${dependents.map(dependent => `<option value="${dependent.id}">${esc(dependent.name)}</option>`).join('')}</optgroup>`;
  const designationOptions = `<option value="">— Select designation —</option>${designations.map(designation => `<option value="${designation.id}">${esc(designation.designation)}</option>`).join('')}`;
  return `<div id="associationSetupFields" style="display:none">
    <div class="form-group" style="margin-bottom:8px"><label>Association Members</label>
      <div class="f-12" style="color:#6b7280">Select up to three members or dependents and assign their designations.</div>
    </div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:4px">
      <label style="font-size:12px;font-weight:600">Association Member</label>
      <label style="font-size:12px;font-weight:600">Designation</label>
    </div>
    ${[1, 2, 3].map(index => {
      const record = records[index - 1] || {};
      const selectedPerson = String(record.association_member_id || '');
      const selectedDesignation = String(record.designation_id || '');
      const selectedPeopleOptions = participantOptions.replace(`value="${selectedPerson}"`, `value="${selectedPerson}" selected`);
      const selectedDesignationOptions = designationOptions.replace(`value="${selectedDesignation}"`, `value="${selectedDesignation}" selected`);
      return `<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:10px">
      <div class="form-group" style="margin:0"><select id="mAssociationPerson${index}" aria-label="Association Member ${index}">${selectedPeopleOptions}</select></div>
      <div class="form-group" style="margin:0"><select id="mAssociationDesignation${index}" aria-label="Designation ${index}">${selectedDesignationOptions}</select></div>
    </div>`}).join('')}
  </div>`;
}

function activityFormHTML(a, eventTypes = null, associationData = {}) {
  const isFee = eventTypes
    ? (a ? [1, 4].includes(Number(a.type)) : true)
    : String(a?.type || '').toLowerCase() === 'fee';
  const typeOptions = eventTypes
    ? `<option value="" ${a ? '' : 'selected'} disabled>Select type</option>${eventTypes.map(eventType => `<option value="${eventType.id}" ${String(eventType.id) === String(a?.type) ? 'selected' : ''}>${esc(eventType.type)}</option>`).join('')}`
    : `<option value="fee" ${isFee ? 'selected' : ''}>💰 Fee Collection</option>
        <option value="data" ${!isFee ? 'selected' : ''}>📁 Data Collection</option>`;
  return `
    <div class="form-group"><label>Activity Name *</label>
      <input id="mActName" type="text" value="${a ? esc(a.name) : ''}" placeholder="e.g., Monthly Maintenance Fee"></div>
    <div class="form-group"><label>Type *</label>
      <select id="mActType" onchange="toggleActivityTypeFields()">
        ${typeOptions}
      </select></div>
    <div id="feeAmountField" class="form-group" ${!isFee ? 'style="display:none"' : ''}>
      <label>Target Amount per Person ($)</label>
      <input id="mActAmount" type="number" min="0" step="0.01" value="${a && a.target_amount ? a.target_amount : ''}" placeholder="0.00"></div>
    <div id="feeAllowEditField" class="form-group form-group-checkbox" ${!isFee ? 'style="display:none"' : ''}>
      <label class="checkbox-label" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;margin:0;font-size:13px;font-weight:500;user-select:none"><input type="checkbox" id="mAllowTargetEdit" style="width:16px;height:16px;min-width:16px;margin:0;cursor:pointer" ${a?.allow_target_edit ? 'checked' : ''}> Allow target amount update in Payment Edit</label></div>
    ${associationSetupHTML(associationData.members, associationData.dependents, associationData.designations, associationData.records)}
    <div class="form-group"><label>Due Date</label>
      <input id="mActDue" type="date" value="${a && a.due_date ? a.due_date : ''}"></div>
    <div class="form-group"><label>Description</label>
      <textarea id="mActDesc" placeholder="Activity description...">${a ? esc(a.description || '') : ''}</textarea></div>`;
}

async function showAddActivityModal() {
  const [{ data: eventTypes, error }, { data: members, error: membersError }, { data: dependents, error: dependentsError }, { data: designations, error: designationsError }] = await Promise.all([
    supa.from('event_types').select('id, type').order('id'),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).eq('is_dependant', false).order('name'),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).eq('is_dependant', true).order('name'),
    supa.from('lookup_designation').select('id, designation').order('order'),
  ]);
  if (error || membersError || dependentsError || designationsError) return toast((error || membersError || dependentsError || designationsError).message, 'error');
  showModal('Create Activity', activityFormHTML(null, eventTypes || [], { members: members || [], dependents: dependents || [], designations: designations || [] }), async () => {
    const name = val('mActName'), typeId = Number(val('mActType'));
    const isFee = [1, 4].includes(typeId);
    if (!typeId) return toast('Activity type is required', 'error'), false;
    const selectedEventType = eventTypes.find(eventType => Number(eventType.id) === typeId);
    if (!typeId) return toast('Invalid activity type selected', 'error'), false;
    if (!name) return toast('Activity name is required', 'error'), false;
    const { data: activity, error } = await supa.from('activities').insert({
      name, type: typeId, site_id: currentUser.site_id,
      is_donation_event: Number(typeId) === 3,
      is_association_event: Number(typeId) === 4,
      target_amount:    isFee && val('mActAmount') ? parseFloat(val('mActAmount')) : null,
      allow_target_edit: isFee && (document.getElementById('mAllowTargetEdit')?.checked || false),
      due_date:         val('mActDue') || null,
      description:      val('mActDesc') || null,
      assigned_users:   [],
    }).select('id').single();
    if (error) return toast(error.message, 'error'), false;
    if (typeId === 4) {
      const associationMembers = [1, 2, 3].map(index => ({
        member_id: val(`mAssociationPerson${index}`),
        designation_id: Number(val(`mAssociationDesignation${index}`)) || null,
      })).filter(record => record.member_id || record.designation_id);
      if (!associationMembers.length) return toast('Select at least one association member or dependent', 'error'), false;
      if (associationMembers.some(record => !record.member_id || !record.designation_id)) return toast('Each selected association person needs a designation', 'error'), false;
      if (new Set(associationMembers.map(record => record.member_id)).size !== associationMembers.length) return toast('Each association person can only be selected once', 'error'), false;
      const { error: associationError } = await supa.from('association_members').insert(associationMembers.map(record => ({
        activity_id: activity.id,
        association_member_id: record.member_id,
        designation_id: record.designation_id,
      })));
      if (associationError) {
        await supa.from('activities').delete().eq('id', activity.id);
        return toast(associationError.message, 'error'), false;
      }
    }
    toast('Activity created', 'success'); await navigate(window._actNavTarget || 'admin-activities'); return true;
  });
}

async function showEditActivityModal(actId) {
  const [{ data: a }, { data: eventTypes, error: eventTypesError }, { data: members, error: membersError }, { data: dependents, error: dependentsError }, { data: designations, error: designationsError }, { data: associationRecords, error: associationRecordsError }] = await Promise.all([
    supa.from('activities').select('*').eq('id', actId).single(),
    supa.from('event_types').select('id, type').order('id'),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).eq('is_dependant', false).order('name'),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).eq('is_dependant', true).order('name'),
    supa.from('lookup_designation').select('id, designation').order('order'),
    supa.from('association_members').select('association_member_id, designation_id').eq('activity_id', actId).order('created_at'),
  ]);
  if (!a) return;
  if (eventTypesError || membersError || dependentsError || designationsError) return toast((eventTypesError || membersError || dependentsError || designationsError).message, 'error');
  if (associationRecordsError) toast('Association members could not be loaded: ' + associationRecordsError.message, 'error');
  showModal('Edit Activity', activityFormHTML(a, eventTypes || [], { members: members || [], dependents: dependents || [], designations: designations || [], records: associationRecords || [] }), async () => {
    const name = val('mActName'), typeId = Number(val('mActType'));
    const isFee = [1, 4].includes(typeId);
    if (!name) return toast('Activity name is required', 'error'), false;
    if (!typeId) return toast('Invalid activity type selected', 'error'), false;
    const { error } = await supa.from('activities').update({
      name, type: typeId,
      target_amount:    isFee && val('mActAmount') ? parseFloat(val('mActAmount')) : null,
      allow_target_edit: isFee && (document.getElementById('mAllowTargetEdit')?.checked || false),
      due_date:         val('mActDue') || null,
      description:      val('mActDesc') || null,
    }).eq('id', actId);
    if (error) return toast(error.message, 'error'), false;
    if (typeId === 4) {
      const associationMembers = [1, 2, 3].map(index => ({
        member_id: val(`mAssociationPerson${index}`),
        designation_id: Number(val(`mAssociationDesignation${index}`)) || null,
      })).filter(record => record.member_id || record.designation_id);
      if (!associationMembers.length) return toast('Select at least one association member or dependent', 'error'), false;
      if (associationMembers.some(record => !record.member_id || !record.designation_id)) return toast('Each selected association person needs a designation', 'error'), false;
      if (new Set(associationMembers.map(record => record.member_id)).size !== associationMembers.length) return toast('Each association person can only be selected once', 'error'), false;
      const { error: deleteError } = await supa.from('association_members').delete().eq('activity_id', actId);
      if (deleteError) return toast(deleteError.message, 'error'), false;
      const { error: associationError } = await supa.from('association_members').insert(associationMembers.map(record => ({
        activity_id: actId, association_member_id: record.member_id, designation_id: record.designation_id,
      })));
      if (associationError) return toast(associationError.message, 'error'), false;
    } else if (Number(a.type) === 4) {
      const { error: associationDeleteError } = await supa.from('association_members').delete().eq('activity_id', actId);
      if (associationDeleteError) return toast(associationDeleteError.message, 'error'), false;
    }
    toast('Activity updated', 'success'); await navigate(window._actNavTarget || 'admin-activities'); return true;
  });
  toggleActivityTypeFields();
}

function toggleActivityTypeFields() {
  const field      = document.getElementById('feeAmountField');
  const editField  = document.getElementById('feeAllowEditField');
  const type       = document.getElementById('mActType');
  const isFee      = [1, 4].includes(Number(type?.value)) || type?.value.toLowerCase() === 'fee';
  if (field)     field.style.display     = isFee ? '' : 'none';
  if (editField) editField.style.display = isFee ? '' : 'none';
  const associationFields = document.getElementById('associationSetupFields');
  if (associationFields) associationFields.style.display = Number(type?.value) === 4 ? '' : 'none';
}

function toggleFeeField() {
  toggleActivityTypeFields();
}

async function showAssignModal(actId) {
  const [{ data: act }, { data: siteMembers }, { data: dependents }, { data: activityMembers, error: activityMembersError }] = await Promise.all([
    supa.from('activities').select('id, name, type, assigned_users').eq('id', actId).single(),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).eq('is_dependant', false).order('name'),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).eq('is_dependant', true).order('name'),
    supa.from('activity_members').select('member_id').eq('activity_id', actId),
  ]);
  if (!act) return;
  if (activityMembersError) return toast(activityMembersError.message, 'error');
  const assignedMemberIds = new Set((activityMembers || []).map(assignment => assignment.member_id));

  const people = [
    ...(siteMembers || []).map(member => ({ ...member, personType: 'member' })),
    ...(dependents || []).map(dependent => ({ ...dependent, personType: 'dependent' })),
  ];
  const listHTML = !people.length
    ? '<p style="color:#6b7280;font-size:13px">No members or dependents in this site. Add them first.</p>'
    : `
      <div class="form-group form-group-checkbox" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:8px">
        <label class="checkbox-label" style="gap:6px"><input type="checkbox" id="showMembers" checked onchange="filterAssignablePeople()">Members</label>
        <label class="checkbox-label" style="gap:6px"><input type="checkbox" id="showDependents" onchange="filterAssignablePeople()">Dependents</label>
        <label class="checkbox-label" style="gap:6px"><input type="checkbox" id="selectAllMembers" onchange="toggleSelectAllMembers()">Select All</label>
      </div>
      <div class="checkbox-group">
        ${people.map(person => `<label class="assignablePerson" data-person-type="${person.personType}">
          <input type="checkbox" class="memberCheck personCheck" value="${person.id}" ${assignedMemberIds.has(person.id) ? 'checked' : ''}>
          ${esc(person.name)}${person.personType === 'dependent' ? ' <span class="f-12" style="color:#6b7280">(Dependent)</span>' : ''}
        </label>`).join('')}
      </div>`;

  showModal(`Assign Members — ${act.name}`,
    `<p class="f-12" style="color:#6b7280;margin-bottom:10px">Select members to assign to this activity:</p>${listHTML}`,
  async () => {
    const selected = [...document.querySelectorAll('.personCheck:checked')].map(c => c.value);
    const { data: existingAssignments, error: assignmentError } = await supa
      .from('activity_members').select('member_id').eq('activity_id', actId);
    if (assignmentError) return toast(assignmentError.message, 'error'), false;
    const existingIds = (existingAssignments || []).map(assignment => assignment.member_id);
    const releasedIds = existingIds.filter(memberId => !selected.includes(memberId));
    if (releasedIds.length) {
      const { error } = await supa.from('activity_members')
        .delete().eq('activity_id', actId).in('member_id', releasedIds);
      if (error) return toast(error.message, 'error'), false;
    }
    const newIds = selected.filter(memberId => !existingIds.includes(memberId));
    const assignedAt = new Date().toISOString();
    if (existingIds.some(memberId => selected.includes(memberId))) {
      const { error } = await supa.from('activity_members').update({ assigned_at: assignedAt })
        .eq('activity_id', actId).in('member_id', selected);
      if (error) return toast(error.message, 'error'), false;
    }
    if (newIds.length) {
      const { error } = await supa.from('activity_members').insert(
        newIds.map(memberId => ({ activity_id: actId, member_id: memberId, assigned_at: assignedAt })),
      );
      if (error) return toast(error.message, 'error'), false;
    }
    const memberIdSet = new Set((siteMembers || []).map(member => member.id));
    const collectorAssignments = (act.assigned_users || []).filter(id => !memberIdSet.has(id));
    const { error } = await supa.from('activities')
      .update({ assigned_users: [...new Set([...selected.filter(id => memberIdSet.has(id)), ...collectorAssignments])] }).eq('id', actId);
    if (error) return toast(error.message, 'error'), false;
    toast(`${selected.length} person(s) assigned`, 'success'); await navigate(window._actNavTarget || 'admin-activities'); return true;
  });
  filterAssignablePeople();
}

function toggleSelectAllMembers() {
  const checked = document.getElementById('selectAllMembers')?.checked;
  document.querySelectorAll('.assignablePerson').forEach(label => {
    if (label.style.display !== 'none') label.querySelector('.personCheck').checked = checked;
  });
}

function filterAssignablePeople() {
  const showMembers = document.getElementById('showMembers')?.checked;
  const showDependents = document.getElementById('showDependents')?.checked;
  document.querySelectorAll('.assignablePerson').forEach(label => {
    const isMember = label.dataset.personType === 'member';
    label.style.display = (isMember ? showMembers : showDependents) ? '' : 'none';
  });
}

async function showAssignCollectorsModal(actId) {
  const [{ data: act }, { data: fieldUsers }, { data: siteMembers }] = await Promise.all([
    supa.from('activities').select('id, name, assigned_users').eq('id', actId).single(),
    supa.from('profiles').select('id, name').eq('site_id', currentUser.site_id).eq('role', 'user').order('name'),
    supa.from('members').select('id').eq('site_id', currentUser.site_id),
  ]);
  if (!act) return;

  // Separate member IDs from collector IDs in assigned_users
  const memberIdSet = new Set((siteMembers || []).map(m => m.id));
  const collectorIds = (act.assigned_users || []).filter(id => !memberIdSet.has(id));

  const listHTML = !(fieldUsers || []).length
    ? '<p style="color:#6b7280;font-size:13px">No field users found for this site.</p>'
    : `<div class="checkbox-group">
        ${fieldUsers.map(u => `<label>
          <input type="checkbox" class="collectorCheck" value="${u.id}" ${collectorIds.includes(u.id) ? 'checked' : ''}>
          ${esc(u.name)}
        </label>`).join('')}
      </div>`;

  showModal(`Assign Collectors — ${esc(act.name)}`,
    `<p class="f-12" style="color:#6b7280;margin-bottom:10px">Select field users who can collect for this activity:</p>${listHTML}`,
  async () => {
    const selectedCollectors = [...document.querySelectorAll('.collectorCheck:checked')].map(c => c.value);
    // Preserve existing member assignments, replace only collector assignments
    const memberAssignments = (act.assigned_users || []).filter(id => memberIdSet.has(id));
    const merged = [...new Set([...memberAssignments, ...selectedCollectors])];
    const { error } = await supa.from('activities').update({ assigned_users: merged }).eq('id', actId);
    if (error) return toast(error.message, 'error'), false;
    toast(`${selectedCollectors.length} collector(s) assigned`, 'success'); await navigate(window._actNavTarget || 'admin-activities'); return true;
  });
}

function deleteActivity(actId) {
  confirmAction('Delete this activity? All associated records will be removed.', async () => {
    const dependentDeletes = await Promise.all([
      supa.from('au_fee_records').delete().eq('activity_id', actId),
      supa.from('fee_records').delete().eq('activity_id', actId),
      supa.from('activity_members').delete().eq('activity_id', actId),
      supa.from('association_members').delete().eq('activity_id', actId),
    ]);
    const deleteError = dependentDeletes.find(result => result.error)?.error;
    if (deleteError) return toast(deleteError.message, 'error');
    const { error } = await supa.from('activities').delete().eq('id', actId);
    if (error) return toast(error.message, 'error');
    toast('Activity deleted', 'success'); await navigate(window._actNavTarget || 'admin-activities');
  });
}

// ============================================================
//  SITE ADMIN — FEE RECORDS
// ============================================================

async function renderAdminFees() {
  const el = document.getElementById('admin-fees');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  const activeFilters = {
    search: document.getElementById('feeSearch')?.value || '',
    activity: document.getElementById('feeActF')?.value || '',
    status: document.getElementById('feeStatusF')?.value || '',
  };
  setLoading(el);
  try {
    const feeTypeId = await getEventTypeId('fee');
    const { data: feeActs, error } = await supa.from('activities')
      .select('id, name, target_amount, type').eq('site_id', siteId).in('type', [feeTypeId, 4]).order('name');
    if (error) throw error;

    const feeActivityIds = (feeActs || []).map(activity => activity.id);
    const [{ data: activityMembers, error: activityMembersError }, { data: feeRecords }] = await Promise.all([
      feeActivityIds.length
        ? supa.from('activity_members').select('activity_id, member_id').in('activity_id', feeActivityIds)
        : Promise.resolve({ data: [] }),
      supa.from('fee_records').select('id, member_id, activity_id, amount, date, target_amount, collected_by').eq('site_id', siteId).not('member_id', 'is', null).limit(10000),
    ]);
    if (activityMembersError) throw activityMembersError;

    const allMemberIds = [...new Set((activityMembers || []).map(assignment => assignment.member_id))];
    const { data: allMembers } = allMemberIds.length
      ? await supa.from('members').select('id, name').in('id', allMemberIds).order('name')
      : { data: [] };
    const memberMap = {};
    (allMembers || []).forEach(m => { memberMap[m.id] = m; });

    // Build collector name map from fee records
    const collectorIds = [...new Set((feeRecords || []).map(r => r.collected_by).filter(Boolean))];
    const { data: collectors } = collectorIds.length
      ? await supa.from('profiles').select('id, name').in('id', collectorIds)
      : { data: [] };
    const collectorMap = {};
    (collectors || []).forEach(c => { collectorMap[c.id] = c.name; });

    // Build one row per member per activity
    const rows = [];
    const assignmentsByActivity = {};
    (activityMembers || []).forEach(assignment => {
      (assignmentsByActivity[assignment.activity_id] ||= []).push(assignment.member_id);
    });
    (feeActs || []).forEach(act => {
      (assignmentsByActivity[act.id] || []).forEach(mId => {
        const member = memberMap[mId];
        if (!member) return;
        const payments  = (feeRecords || []).filter(r => r.activity_id === act.id && r.member_id === mId);
        const totalPaid = payments.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
        // Use saved target_amount from the latest record if customised, else fall back to activity target
        const latestRec = payments.length ? payments.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
        const collector  = latestRec?.collected_by ? (collectorMap[latestRec.collected_by] || '—') : '—';
        const target    = parseFloat(latestRec?.target_amount || act.target_amount || 0);
        const status    = target > 0
          ? (totalPaid >= target ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid')
          : (payments.length > 0 ? 'paid' : 'unpaid');
        const latestPayment = latestRec || null;
        rows.push({ member, act, payments, totalPaid, target, status, latestPayment, collector });
      });
    });
    window._feeRows = rows; // cache for export

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
            <input class="filter-grow" id="feeSearch" type="text" value="${esc(activeFilters.search)}" placeholder="🔍 Search member or event..." oninput="filterFeeTableFull()">
            <select id="feeActF" onchange="filterFeeTableFull()">
              <option value="">All Events</option>
              ${(feeActs || []).map(a => `<option value="${a.id}" ${a.id === activeFilters.activity ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}
            </select>
            <select id="feeStatusF" onchange="filterFeeTableFull()">
              <option value="">All Status</option>
              <option value="paid" ${activeFilters.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="partial" ${activeFilters.status === 'partial' ? 'selected' : ''}>Partial</option>
              <option value="unpaid" ${activeFilters.status === 'unpaid' ? 'selected' : ''}>Unpaid</option>
            </select>
          </div>
          <div class="table-wrapper">
            <table id="feeTable">
              <thead><tr><th>Member</th><th>Event</th><th>Target Amt</th><th>Paid</th><th>Balance</th><th>Collector</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${!rows.length ? `<tr><td colspan="8">${emptyState('💰', 'No members assigned to fee events', 'Assign members to events in Manage Events')}</td></tr>` :
                  rows.map(r => `<tr data-act="${r.act.id}" data-status="${r.status}" data-search="${esc(r.member.name + ' ' + r.act.name).toLowerCase()}">
                    <td><strong>${esc(r.member.name)}</strong></td>
                    <td>${esc(r.act.name)}</td>
                    <td>${r.target > 0 ? '₹' + r.target.toFixed(2) : '—'}</td>
                    <td><strong class="text-green">₹${r.totalPaid.toFixed(2)}</strong>${r.payments.length > 1 ? `<div class="f-12" style="color:#9ca3af">${r.payments.length} payments</div>` : ''}</td>
                    <td>${r.target > 0 ? '₹' + Math.max(0, r.target - r.totalPaid).toFixed(2) : '—'}</td>
                    <td>${esc(r.collector)}</td>
                    <td>${statusBadge(r.status)}</td>
                    <td>
                      <div class="table-actions">
                        ${!r.payments.length
                          ? `<button class="btn btn-success btn-sm" onclick="showRecordFeeForMember('${r.act.id}','${r.member.id}','${esc(r.member.name)}',${r.totalPaid},${r.target},'admin-fees')">💰 Record</button>`
                          : ''}
                        ${r.latestPayment
                          ? `<button class="btn btn-secondary btn-sm" onclick="showEditFeeRecord('${r.latestPayment.id}',${r.target},'admin-fees')">✏️ Edit</button>`
                          : ''}
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
    filterFeeTableFull();
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function renderAdminDonations() {
  const el = document.getElementById('admin-donations');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: donations, error: donationsError }, { data: events, error: eventsError }] = await Promise.all([
      supa.from('donation_records').select('id, donor_name, donor_phone, amount, collection_date, event_id, notes').order('collection_date', { ascending: false }).limit(1000),
      supa.from('activities').select('id, name').eq('site_id', siteId).eq('type', 3),
    ]);
    if (donationsError || eventsError) throw donationsError || eventsError;
    const eventMap = Object.fromEntries((events || []).map(event => [event.id, event.name]));
    const siteDonations = (donations || []).filter(donation => eventMap[donation.event_id]);
    const total = siteDonations.reduce((sum, donation) => sum + parseFloat(donation.amount || 0), 0);
    el.innerHTML = `
      <div class="panel-header"><div><h2>Donations</h2><p>Record and review donations for your site</p></div><button class="btn btn-primary" onclick="showDonationModal()">+ Record Donation</button></div>
      <div class="stats-grid">${statCard('🤲', 'si-green', '₹' + total.toFixed(2), 'Total Donations')}</div>
      <div class="card"><div class="card-body table-wrapper">
        ${!siteDonations.length ? emptyState('🤲', 'No donations recorded', 'Record a donation to get started') : `<table>
          <thead><tr><th>Donor</th><th>Phone</th><th>Event</th><th>Amount</th><th>Date</th><th>Notes</th></tr></thead>
          <tbody>${siteDonations.map(donation => `<tr>
            <td><strong>${esc(donation.donor_name)}</strong></td><td>${esc(donation.donor_phone || '—')}</td>
            <td>${esc(eventMap[donation.event_id] || '—')}</td><td class="text-green">₹${parseFloat(donation.amount || 0).toFixed(2)}</td>
            <td>${donation.collection_date ? fmtDate(donation.collection_date) : '—'}</td><td>${esc(donation.notes || '—')}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div></div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function showDonationModal() {
  const [{ data: donationEvents, error: eventError }, { data: members, error: memberError }, { data: countries, error: countriesError }] = await Promise.all([
    supa.from('activities').select('id, name').eq('site_id', currentUser.site_id).eq('type', 3).order('name'),
    supa.from('members').select('id, name').eq('site_id', currentUser.site_id).order('name'),
    supa.from('lookup_country').select('country_id, country').order('country'),
  ]);
  if (eventError || memberError || countriesError) return toast((eventError || memberError || countriesError).message, 'error');
  const eventOptions = (donationEvents || []).map(event => `<option value="${event.id}">${esc(event.name)}</option>`).join('');
  const memberOptions = (members || []).map(member => `<option value="${member.id}">${esc(member.name)}</option>`).join('');

  showModal('Donation Collection', `
    <div class="form-group"><label>Event *</label>
      <select id="mDonationEvent"><option value="">Select donation event</option>${eventOptions}</select></div>
    <div class="form-group"><label>Donor Name *</label><input id="mDonorName" type="text" placeholder="Full name"></div>
    <div class="form-group"><label>Phone</label><input id="mDonorPhone" type="tel" placeholder="Phone number"></div>
    <div class="form-group"><label>Country</label><select id="mDonorCountry" data-ph="— Select Country —"><option value="">— Select Country —</option>${lookupOptsHTML(countries || [], 'country', '')}</select></div>
    <div class="form-group"><label>State</label><select id="mDonorState" data-ph="— Select State —" disabled><option value="">— Select Country first —</option></select></div>
    <div class="form-group"><label>City</label><select id="mDonorCity" data-ph="— Select City —" disabled><option value="">— Select State first —</option></select></div>
    <div class="form-group"><label>Nominee</label>
      <select id="mDonorNominee"><option value="">Select nominee</option>${memberOptions}</select></div>
    <div class="form-group"><label>Amount *</label><input id="mDonationAmount" type="number" min="0.01" step="0.01" placeholder="0.00"></div>
    <div class="form-group"><label>Collection Date</label><input id="mDonationDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
    <div class="form-group"><label>Notes</label><textarea id="mDonationNotes" placeholder="Additional notes..."></textarea></div>`,
  async () => {
    const eventId = val('mDonationEvent');
    const donorName = val('mDonorName');
    const amount = parseFloat(val('mDonationAmount'));
    if (!eventId) return toast('Donation event is required', 'error'), false;
    if (!donorName) return toast('Donor name is required', 'error'), false;
    if (!amount || amount <= 0) return toast('Valid donation amount is required', 'error'), false;
    const nominee = document.getElementById('mDonorNominee')?.selectedOptions[0]?.textContent || null;
    const { data: receipt, error: receiptError } = await supa.from('payment_reciept')
      .insert({}).select('id').single();
    if (receiptError) return toast(receiptError.message, 'error'), false;
    const { error } = await supa.from('donation_records').insert({
      donor_name: donorName, donor_phone: val('mDonorPhone') || null,
      donor_city: val('mDonorCity') || null, donor_state: val('mDonorState') || null,
      donor_country: val('mDonorCountry') || null,
      donor_nominee: nominee && val('mDonorNominee') ? nominee : null,
      amount, is_paid: true, event_id: eventId,
      reciept_id: receipt.id,
      collection_date: val('mDonationDate') || null, notes: val('mDonationNotes') || null,
    });
    if (error) {
      await supa.from('payment_reciept').delete().eq('id', receipt.id);
      return toast(error.message, 'error'), false;
    }
    toast('Donation recorded', 'success'); await navigate(currentUser.role === 'user' ? 'user-donations' : 'admin-donations'); return true;
  });
  wireDonationLocationCascade();
}

function wireDonationLocationCascade() {
  const countrySel = document.getElementById('mDonorCountry');
  const stateSel = document.getElementById('mDonorState');
  const citySel = document.getElementById('mDonorCity');
  if (!countrySel || !stateSel || !citySel) return;
  const block = (select, placeholder) => {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    select.disabled = true;
  };
  const fill = (select, rows, nameCol) => {
    select.innerHTML = `<option value="">${select.dataset.ph}</option>` + lookupOptsHTML(rows, nameCol, '');
    select.disabled = false;
  };
  countrySel.addEventListener('change', async () => {
    const countryId = countrySel.selectedOptions[0]?.dataset.id || '';
    block(stateSel, countryId ? 'Loading…' : '— Select Country first —');
    block(citySel, '— Select State first —');
    if (!countryId) return;
    try { fill(stateSel, await lookupRows('lookup_state', { country_id: countryId }, 'state'), 'state'); }
    catch (err) { block(stateSel, '— Select Country first —'); toast(err.message, 'error'); }
  });
  stateSel.addEventListener('change', async () => {
    const stateId = stateSel.selectedOptions[0]?.dataset.id || '';
    block(citySel, stateId ? 'Loading…' : '— Select State first —');
    if (!stateId) return;
    try {
      const districts = await lookupRows('lookup_district', { state_id: stateId }, 'district');
      const cityRows = (await Promise.all(districts.map(district => lookupRows('lookup_city', { district_id: district.district_id }, 'city')))).flat();
      fill(citySel, cityRows, 'city');
    } catch (err) { block(citySel, '— Select State first —'); toast(err.message, 'error'); }
  });
}

// Opens record payment modal pre-filled with specific member from admin view
async function showRecordFeeForMember(actId, memberId, memberName, totalPaid = 0, uiTarget = 0, navTarget = 'admin-fees') {
  const { data: act } = await supa.from('activities').select('*').eq('id', actId).single();
  if (!act) return;
  // Use the target already computed and displayed in the UI table
  const target = uiTarget || parseFloat(act.target_amount || 0);
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
    if (![1, 4].includes(Number(act.type)))        return toast('Payments can only be recorded for fee or association events', 'error'), false;
    const { data: existingRecords, error: existingRecordError } = await supa.from('fee_records')
      .select('id').eq('site_id', currentUser.site_id).eq('activity_id', actId).eq('member_id', memberId).limit(1);
    if (existingRecordError) return toast(existingRecordError.message, 'error'), false;
    if (existingRecords?.length) return toast('This member already has a payment record for this event', 'error'), false;
    const { data: receipt, error: receiptError } = await supa.from('payment_reciept')
      .insert({}).select('id').single();
    if (receiptError) return toast(receiptError.message, 'error'), false;
    const { error } = await supa.from('fee_records').insert({
      activity_id: actId, site_id: currentUser.site_id,
      collected_by: currentUser.id, member_id: memberId,
      amount, date, notes: val('mNotes') || null,
      target_amount: target > 0 ? target : null,
      reciept_id: receipt.id,
    });
    if (error) {
      await supa.from('payment_reciept').delete().eq('id', receipt.id);
      return toast(error.message, 'error'), false;
    }
    toast('Payment recorded!', 'success'); await navigate(navTarget); return true;
  });
}

async function showEditFeeRecord(recordId, targetAmt, navTarget = 'admin-fees') {
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
    <div class="form-group"><label>Total Paid Amount ($)</label>
      <input id="mPaidAmount" type="number" min="0.01" step="0.01"
        value="${parseFloat(r.amount || 0).toFixed(2)}" placeholder="0.00">
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
    const newAmount = parseFloat(val('mPaidAmount') || 0);
    if (!newAmount || newAmount <= 0) return toast('Valid paid amount is required', 'error'), false;
    const newTarget = canEditTarget ? parseFloat(val('mTargetAmount') || 0) : null;
    const otherPaymentsTotal = totalPaid - parseFloat(r.amount || 0);
    const proposedTotal = otherPaymentsTotal + newAmount;
    const effectiveTarget = canEditTarget ? newTarget : target;
    if (effectiveTarget > 0 && proposedTotal > effectiveTarget)
      return toast(`Total paid amount cannot exceed the target amount of ₹${effectiveTarget.toFixed(2)}`, 'error'), false;
    const updates = { amount: newAmount, date, notes: val('mNotes') || null };
    if (canEditTarget) updates.target_amount = newTarget > 0 ? newTarget : null;
    const { error } = await supa.from('fee_records').update(updates).eq('id', recordId);
    if (error) return toast(error.message, 'error'), false;
    toast('Payment updated!', 'success'); await navigate(navTarget); return true;
  });
}

async function exportFeeCSV() {
  const rows = window._feeRows;
  if (!rows || !rows.length) return toast('No data to export — open Payment Collections first', 'warning');
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);
  const csvRows = rows.map(r => [
    r.member.name,
    r.act.name,
    r.target > 0 ? r.target.toFixed(2) : '0',
    r.totalPaid.toFixed(2),
    r.target > 0 ? Math.max(0, r.target - r.totalPaid).toFixed(2) : '0',
    r.collector,
    capitalize(r.status),
  ]);
  downloadCSV(['Member', 'Event', 'Target Amt', 'Paid', 'Balance', 'Collector', 'Status'], csvRows, 'payment-collections.csv');
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
    const dataTypeId = await getEventTypeId('data');
    const [{ data: records, error }, { data: dataActs }] = await Promise.all([
      supa.from('data_records')
        .select('id, person_name, address, phone, date, activity_id, activity:activities!activity_id(id,name), collector:profiles!collected_by(name)')
        .eq('site_id', siteId).order('date', { ascending: false }),
      supa.from('activities').select('id, name').eq('site_id', siteId).eq('type', dataTypeId),
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
    const feeTypeId = await getEventTypeId('fee');
    const [{ data: feeActs, error }, { data: allMembers }, { data: feeRecords }] = await Promise.all([
      supa.from('activities').select('id, name, target_amount, assigned_users, due_date, created_at').eq('site_id', siteId).eq('type', feeTypeId).order('created_at'),
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
      <div class="panel-header"><div><h2>Collection Report</h2><p>Member-wise payment report across all events</p></div><button class="btn btn-secondary" onclick="exportReportCSV()">⬇️ Export CSV</button></div>
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

async function renderAdminAssociationReport() {
  const el = document.getElementById('admin-association-report');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: activities, error: activitiesError }, { data: feeRecords, error: recordsError }] = await Promise.all([
      supa.from('activities').select('id, name, target_amount').eq('site_id', siteId).eq('type', 4).order('name'),
      supa.from('fee_records').select('activity_id, member_id, amount, target_amount').eq('site_id', siteId).not('member_id', 'is', null).limit(10000),
    ]);
    if (activitiesError || recordsError) throw activitiesError || recordsError;
    const activityIds = (activities || []).map(activity => activity.id);
    const { data: assignments, error: assignmentsError } = activityIds.length
      ? await supa.from('activity_members').select('activity_id, member_id').in('activity_id', activityIds)
      : { data: [], error: null };
    if (assignmentsError) throw assignmentsError;
    const memberIds = [...new Set((assignments || []).map(assignment => assignment.member_id))];
    const { data: members, error: membersError } = memberIds.length
      ? await supa.from('members').select('id, name').in('id', memberIds).order('name')
      : { data: [], error: null };
    if (membersError) throw membersError;
    window._associationReportData = { activities: activities || [], assignments: assignments || [], members: members || [], feeRecords: feeRecords || [] };

    el.innerHTML = `
      <div class="panel-header"><div><h2>Association Report</h2><p>Event-wise member payment and outstanding balances</p></div><button class="btn btn-secondary" onclick="exportAssociationReportCSV()">⬇️ Export CSV</button></div>
      <div class="card">
        <div class="card-body">
          <div class="filters">
            <select id="associationReportEvent" onchange="refreshAssociationReport()">
              <option value="">All Association Events</option>
              ${(activities || []).map(activity => `<option value="${activity.id}">${esc(activity.name)}</option>`).join('')}
            </select>
            <select id="associationReportStatus" onchange="refreshAssociationReport()">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div class="table-wrapper" id="associationReportTable">${buildAssociationReportTable('', '')}</div>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function getAssociationReportRows(activityId, statusFilter = '') {
  const { activities, assignments, members, feeRecords } = window._associationReportData || { activities: [], assignments: [], members: [], feeRecords: [] };
  const activityMap = Object.fromEntries(activities.map(activity => [activity.id, activity]));
  const memberMap = Object.fromEntries(members.map(member => [member.id, member]));
  return assignments
    .filter(assignment => !activityId || assignment.activity_id === activityId)
    .map(assignment => {
      const activity = activityMap[assignment.activity_id];
      const member = memberMap[assignment.member_id];
      if (!activity || !member) return null;
      const payments = feeRecords.filter(record => record.activity_id === activity.id && record.member_id === member.id);
      const paid = payments.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
      const latest = payments[payments.length - 1];
      const target = parseFloat(latest?.target_amount || activity.target_amount || 0);
      const outstanding = Math.max(0, target - paid);
      const status = outstanding === 0 && paid > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      return { activity, member, target, paid, outstanding, status };
    })
    .filter(Boolean)
    .filter(row => !statusFilter || row.status === statusFilter)
    .sort((left, right) => left.activity.name.localeCompare(right.activity.name) || left.member.name.localeCompare(right.member.name));
}

function buildAssociationReportTable(activityId, statusFilter = '') {
  const rows = getAssociationReportRows(activityId, statusFilter);
  if (!rows.length) return emptyState('📋', 'No association members assigned', 'Assign members to an association event in Manage Events');
  const totals = rows.reduce((sum, row) => ({
    target: sum.target + row.target,
    paid: sum.paid + row.paid,
    outstanding: sum.outstanding + row.outstanding,
  }), { target: 0, paid: 0, outstanding: 0 });
  const memberTotals = getAssociationMemberTotals(rows);
  return `<table style="min-width:760px">
    <thead><tr><th>Event</th><th>Member</th><th style="text-align:right">Target Amount</th><th style="text-align:right">Total Paid</th><th style="text-align:right">Outstanding</th><th style="text-align:center">Status</th></tr></thead>
    <tbody>${rows.map(row => `<tr>
      <td>${esc(row.activity.name)}</td>
      <td><strong>${esc(row.member.name)}</strong></td>
      <td style="text-align:right">₹${row.target.toFixed(2)}</td>
      <td class="text-green" style="text-align:right">₹${row.paid.toFixed(2)}</td>
      <td style="text-align:right">${row.outstanding > 0 ? `<strong style="color:#ef4444">₹${row.outstanding.toFixed(2)}</strong>` : '₹0.00'}</td>
      <td style="text-align:center">${row.status === 'paid' ? '<span class="badge badge-success">Paid</span>' : row.status === 'partial' ? '<span class="badge badge-warning">Partial</span>' : '<span class="badge badge-danger">Unpaid</span>'}</td>
    </tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="6" style="height:10px;padding:0;border-top:2px solid var(--border)"></td></tr>
    <tr style="font-weight:700;background:#f9fafb">
      <td colspan="2">Final Total</td>
      <td style="text-align:right">₹${totals.target.toFixed(2)}</td>
      <td class="text-green" style="text-align:right">₹${totals.paid.toFixed(2)}</td>
      <td style="text-align:right;color:${totals.outstanding > 0 ? '#ef4444' : 'inherit'}">₹${totals.outstanding.toFixed(2)}</td>
      <td style="text-align:center">—</td>
    </tr></tfoot>
  </table>
  ${!activityId ? `<div style="margin-top:24px;padding-top:14px;border-top:2px solid var(--border)">
    <h3 style="font-size:14px;margin:0 0 10px">Member-wise Final Outstanding</h3>
    <table style="min-width:520px">
      <thead><tr><th>Member</th><th style="text-align:right">Total Target</th><th style="text-align:right">Total Paid</th><th style="text-align:right">Final Outstanding</th></tr></thead>
      <tbody>${memberTotals.map(member => `<tr>
        <td><strong>${esc(member.name)}</strong></td>
        <td style="text-align:right">₹${member.target.toFixed(2)}</td>
        <td class="text-green" style="text-align:right">₹${member.paid.toFixed(2)}</td>
        <td style="text-align:right">${member.outstanding > 0 ? `<strong style="color:#ef4444">₹${member.outstanding.toFixed(2)}</strong>` : '₹0.00'}</td>
      </tr>`).join('')}</tbody>
    </table>
  </div>` : ''}`;
}

function getAssociationMemberTotals(rows) {
  return Object.values(rows.reduce((result, row) => {
    const memberTotal = result[row.member.id] || { name: row.member.name, target: 0, paid: 0, outstanding: 0 };
    memberTotal.target += row.target;
    memberTotal.paid += row.paid;
    memberTotal.outstanding += row.outstanding;
    result[row.member.id] = memberTotal;
    return result;
  }, {})).sort((left, right) => right.outstanding - left.outstanding || left.name.localeCompare(right.name));
}

function refreshAssociationReport() {
  const table = document.getElementById('associationReportTable');
  if (table) table.innerHTML = buildAssociationReportTable(document.getElementById('associationReportEvent')?.value || '', document.getElementById('associationReportStatus')?.value || '');
}

function exportAssociationReportCSV() {
  const activityId = document.getElementById('associationReportEvent')?.value || '';
  const statusFilter = document.getElementById('associationReportStatus')?.value || '';
  const rows = getAssociationReportRows(activityId, statusFilter);
  if (!rows.length) return toast('No association report rows to export', 'warning');
  const totals = rows.reduce((sum, row) => ({
    target: sum.target + row.target,
    paid: sum.paid + row.paid,
    outstanding: sum.outstanding + row.outstanding,
  }), { target: 0, paid: 0, outstanding: 0 });
  const csvRows = rows.map(row => [
    row.activity.name, row.member.name, row.target.toFixed(2), row.paid.toFixed(2), row.outstanding.toFixed(2),
    row.status.charAt(0).toUpperCase() + row.status.slice(1),
  ]);
  csvRows.push(['Final Total', '', totals.target.toFixed(2), totals.paid.toFixed(2), totals.outstanding.toFixed(2), '']);
  if (!activityId) {
    const memberTotals = getAssociationMemberTotals(rows);
    csvRows.push([], ['Member-wise Final Outstanding'], ['Member', 'Total Target', 'Total Paid', 'Final Outstanding']);
    csvRows.push(...memberTotals.map(member => [member.name, member.target.toFixed(2), member.paid.toFixed(2), member.outstanding.toFixed(2)]));
  }
  downloadCSV(['Event', 'Member', 'Target Amount', 'Total Paid', 'Outstanding', 'Status'], csvRows, 'association-report.csv');
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
    if (c === null) return `<td style="background:#f9fafb;text-align:center;color:#9ca3af">0</td>`;
    if (c.paid === 0 && c.target === 0) return `<td style="text-align:center;color:#9ca3af">0</td>`;
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

function exportReportCSV() {
  const { feeActs, allMembers, feeRecords } = window._rptData || {};
  if (!feeActs) return toast('No report data loaded', 'warning');
  const year   = document.getElementById('rptYear')?.value   || '';
  const status = document.getElementById('rptStatus')?.value || '';

  const visibleActs = feeActs.filter(a => {
    if (!year) return true;
    const d = a.due_date || a.created_at;
    return d && new Date(d).getFullYear().toString() === year;
  });
  const assignedIds = new Set(visibleActs.flatMap(a => a.assigned_users || []));
  const visibleMembers = allMembers.filter(m => assignedIds.has(m.id));

  const rows = visibleMembers.map(m => {
    let totalPaid = 0, totalOutstanding = 0;
    const cells = visibleActs.map(a => {
      if (!(a.assigned_users || []).includes(m.id)) return null;
      const mp   = feeRecords.filter(r => r.activity_id === a.id && r.member_id === m.id);
      const paid = mp.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      const lat  = mp.length ? mp.sort((x, y) => new Date(y.date) - new Date(x.date))[0] : null;
      const tgt  = parseFloat(lat?.target_amount || a.target_amount || 0);
      const out  = tgt > 0 ? Math.max(0, tgt - paid) : 0;
      totalPaid += paid; totalOutstanding += out;
      return { paid, target: tgt, outstanding: out };
    });
    const anyAssigned = cells.some(c => c !== null);
    const st = !anyAssigned ? 'Unpaid'
      : totalOutstanding === 0 && totalPaid > 0 ? 'Paid'
      : totalPaid > 0 ? 'Partial' : 'Unpaid';
    return { m, cells, totalPaid, totalOutstanding, st };
  }).filter(r => !status || r.st.toLowerCase() === status);

  if (!rows.length) return toast('No data to export', 'warning');

  const headers = ['Member', ...visibleActs.map(a => a.name), 'Total Paid', 'Outstanding', 'Status'];
  const csvRows = rows.map(row => [
    row.m.name,
    ...row.cells.map(c => c === null ? '0' : c.paid.toFixed(2)),
    row.totalPaid.toFixed(2),
    row.totalOutstanding.toFixed(2),
    row.st,
  ]);
  downloadCSV(headers, csvRows, `payment-report${year ? '-' + year : ''}.csv`);
}

// ============================================================
//  USER — DASHBOARD
// ============================================================

async function renderUserDashboard() {
  const el = document.getElementById('user-dashboard');
  setLoading(el);
  try {
    const userId = currentUser.id;
    const [{ data: myFees }, { data: myDatas }, { data: site }, { data: siteCommittee }, { data: states }] = await Promise.all([
      supa.from('fee_records').select('amount').eq('collected_by', userId),
      supa.from('data_records').select('id').eq('collected_by', userId),
      currentUser.site_id ? supa.from('sites').select('name, state').eq('id', currentUser.site_id).single() : Promise.resolve({ data: null }),
      currentUser.site_id ? supa.from('members').select('name, designation, profile_picture_path, dashboard_view_order').eq('site_id', currentUser.site_id).eq('is_community_member', true) : Promise.resolve({ data: [] }),
      supa.from('lookup_state').select('state_id, state'),
    ]);
    const totalFees = (myFees || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const stateId = (states || []).find(state => state.state === site?.state)?.state_id;
    const { data: stateCommittee } = stateId
      ? await supa.from('board_committee_list').select('Name, Designation, profile_picture_path, list_order').eq('is_state_committee', true).eq('state_id', stateId).order('list_order')
      : { data: [] };
    const boardCards = (items, nameKey = 'name', designationKey = 'designation') => !items?.length
      ? '<p style="color:var(--text-light);font-size:13px;text-align:center;padding:10px;width:100%">No board members listed</p>'
      : items.sort((left, right) => (left.list_order ?? left.dashboard_view_order ?? 9999) - (right.list_order ?? right.dashboard_view_order ?? 9999)).map(item => {
        const name = item[nameKey] || '—';
        const designation = item[designationKey] || 'Committee Member';
        const initials = name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
        const photo = profilePicUrl(item.profile_picture_path);
        return `<div class="committee-stamp-card"><div class="stamp-photo-frame">${photo ? `<img src="${esc(photo)}" alt="${esc(name)}" class="stamp-photo-img">` : `<div class="stamp-photo-placeholder">${initials}</div>`}</div><div class="member-name">${esc(name)}</div><div class="member-role">${esc(designation)}</div></div>`;
      }).join('');

    el.innerHTML = `
      <div class="panel-header"><div><h2>My Dashboard</h2><p>${site?.name ? esc(site.name) : 'Not assigned to a site'}</p></div></div>
      ${currentUser.site_id ? `<div class="committee-dashboard-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="font-size:15px;font-weight:600;color:var(--text);margin:0">State Committee Board</h3></div><div class="committee-stamp-grid">${boardCards(stateCommittee, 'Name', 'Designation')}</div></div>
      <div class="committee-dashboard-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="font-size:15px;font-weight:600;color:var(--text);margin:0">Mahallu Jamaath Committee Board</h3></div><div class="committee-stamp-grid">${boardCards(siteCommittee)}</div></div>` : ''}
      <div class="stats-grid">
        ${statCard('💰', 'si-green',  '₹' + totalFees.toFixed(2),  'Fees Collected')}
        ${statCard('📝', 'si-blue',   (myFees  || []).length,      'Fee Transactions')}
        ${statCard('📁', 'si-purple', (myDatas || []).length,      'Data Records')}
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

// ============================================================
//  USER — FEE COLLECTION
// ============================================================

function buildUserPaymentCollections(feeActs, feeRecords, memberMap, activityMembers) {
  if (!feeActs.length) return '';

  const rows = [];
  feeActs.forEach(act => {
    (activityMembers[act.id] || []).forEach(mId => {
      if (!memberMap[mId]) return;
      const member    = memberMap[mId];
      const payments  = feeRecords.filter(r => r.activity_id === act.id && r.member_id === mId);
      const totalPaid = payments.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
      const latestRec = payments.length ? payments.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
      const target    = parseFloat(latestRec?.target_amount || act.target_amount || 0);
      const status    = target > 0 ? (totalPaid >= target ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid') : (payments.length > 0 ? 'paid' : 'unpaid');
      rows.push({ member, act, payments, totalPaid, target, status, latestPayment: latestRec });
    });
  });
  if (!rows.length) return '';

  const totalCollected = rows.reduce((s, r) => s + r.totalPaid, 0);
  const paidCount      = rows.filter(r => r.status === 'paid').length;
  const unpaidCount    = rows.filter(r => r.status !== 'paid').length;
  const statusBadge    = s => s === 'paid' ? '<span class="badge badge-success">✓ Paid</span>'
    : s === 'partial' ? '<span class="badge badge-warning">~ Partial</span>'
    : '<span class="badge badge-danger">✗ Unpaid</span>';

  return `
    <div class="stats-grid">
      ${statCard('💰', 'si-green',  '₹' + totalCollected.toFixed(2), 'Total Collected')}
      ${statCard('✅', 'si-teal',   paidCount,                        'Paid')}
      ${statCard('⏳', 'si-yellow', unpaidCount,                      'Pending')}
      ${statCard('👥', 'si-blue',   rows.length,                      'Total Assignments')}
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><h3>Payment Collections</h3></div>
      <div class="card-body">
        <div class="filters">
          <input class="filter-grow" id="feeSearch" type="text" placeholder="🔍 Search member or event..." oninput="filterFeeTableFull()">
          <select id="feeActF" onchange="filterFeeTableFull()">
            <option value="">All Events</option>
            ${feeActs.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')}
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
              ${!rows.length ? `<tr><td colspan="7">${emptyState('💰', 'No members assigned', '')}</td></tr>` :
                rows.map(r => `<tr data-act="${r.act.id}" data-status="${r.status}" data-search="${esc((r.member.name + ' ' + r.act.name).toLowerCase())}">
                  <td><strong>${esc(r.member.name)}</strong></td>
                  <td>${esc(r.act.name)}</td>
                  <td>${r.target > 0 ? '₹' + r.target.toFixed(2) : '—'}</td>
                  <td><strong class="text-green">₹${r.totalPaid.toFixed(2)}</strong></td>
                  <td>${r.target > 0 ? '₹' + Math.max(0, r.target - r.totalPaid).toFixed(2) : '—'}</td>
                  <td>${statusBadge(r.status)}</td>
                  <td><div class="table-actions">
                    ${!r.payments.length ? `<button class="btn btn-success btn-sm" onclick="showRecordFeeForMember('${r.act.id}','${r.member.id}','${esc(r.member.name)}',${r.totalPaid},${r.target},'user-fees')">💰 Record</button>` : ''}
                    ${r.latestPayment ? `<button class="btn btn-secondary btn-sm" onclick="showEditFeeRecord('${r.latestPayment.id}',${r.target},'user-fees')">✏️ Edit</button>` : ''}
                  </div></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

async function renderUserFees() {
  const el = document.getElementById('user-fees');
  setLoading(el);
  try {
    const userId  = currentUser.id;
    const siteId  = currentUser.site_id;
    const feeTypeId = await getEventTypeId('fee');
    const [{ data: myActivities }, { data: myFeeRecs }, { data: siteFeeRecords }] = await Promise.all([
      supa.from('activities').select('*').eq('site_id', siteId).in('type', [feeTypeId, 3]).contains('assigned_users', [userId]),
      supa.from('fee_records').select('*, activity:activities!activity_id(name), member:members!member_id(name)').eq('collected_by', userId).order('date', { ascending: false }),
      siteId ? supa.from('fee_records').select('id, member_id, activity_id, amount, date, target_amount').eq('site_id', siteId).not('member_id', 'is', null).limit(10000) : Promise.resolve({ data: [] }),
    ]);

    // Fetch member names for the Payment Collections table
    const myFeeActs = (myActivities || []).filter(activity => Number(activity.type) === Number(feeTypeId));
    const activityIds = myFeeActs.map(activity => activity.id);
    const { data: activityMemberRows } = activityIds.length
      ? await supa.from('activity_members').select('activity_id, member_id').in('activity_id', activityIds)
      : { data: [] };
    const allMemberIds = [...new Set((activityMemberRows || []).map(assignment => assignment.member_id))];
    const { data: assignedMembers } = allMemberIds.length
      ? await supa.from('members').select('id, name').in('id', allMemberIds).order('name')
      : { data: [] };
    const memberMap = Object.fromEntries((assignedMembers || []).map(m => [m.id, m]));
    const activityMembers = {};
    (activityMemberRows || []).forEach(assignment => {
      (activityMembers[assignment.activity_id] ||= []).push(assignment.member_id);
    });

    el.innerHTML = `
      <div class="panel-header"><div><h2>Fee Collection</h2><p>Record fee payments from community members</p></div></div>
      ${!(myActivities || []).length ? emptyState('💰', 'No fee or donation activities assigned', 'Your site admin will assign collection activities to you') : `
        ${buildUserPaymentCollections(myFeeActs || [], siteFeeRecords || [], memberMap, activityMembers)}
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
        </div>`}
      <button class="btn btn-primary" style="position:fixed;right:24px;bottom:24px;z-index:10;box-shadow:0 6px 18px rgba(0,0,0,.2)" onclick="showDonationModal()">＋ Donation</button>`;
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
    if (Number(act.type) !== 1) return toast('Fee records can only be created for fee events', 'error'), false;
    const memberId = document.getElementById('mMemberSelect')?.value || null;
    if (memberId) {
      const { data: existingRecords, error: existingRecordError } = await supa.from('fee_records')
        .select('id').eq('site_id', currentUser.site_id).eq('member_id', memberId).limit(1);
      if (existingRecordError) return toast(existingRecordError.message, 'error'), false;
      if (existingRecords?.length) return toast('This member already has a fee record for this site', 'error'), false;
    }
    const { data: receipt, error: receiptError } = await supa.from('payment_reciept')
      .insert({}).select('id').single();
    if (receiptError) return toast(receiptError.message, 'error'), false;
    const { error } = await supa.from('fee_records').insert({
      activity_id: actId, site_id: currentUser.site_id, collected_by: currentUser.id,
      member_id: memberId || null,
      payer_name: payerName, payer_phone: val('mPayerPhone') || null, amount, date, notes: val('mNotes') || null,
      reciept_id: receipt.id,
    });
    if (error) {
      await supa.from('payment_reciept').delete().eq('id', receipt.id);
      return toast(error.message, 'error'), false;
    }
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
    const dataTypeId = await getEventTypeId('data');
    const [{ data: myDataActs }, { data: myDataRecs }] = await Promise.all([
      supa.from('activities').select('*').eq('type', dataTypeId).contains('assigned_users', [userId]),
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
    const [{ data: feeRecs }, { data: dataRecs }, { data: expRecs }] = await Promise.all([
      supa.from('fee_records').select('*, activity:activities!activity_id(name), member:members!member_id(name)').eq('collected_by', userId).order('date', { ascending: false }),
      supa.from('data_records').select('*, activity:activities!activity_id(name), member:members!member_id(name)').eq('collected_by', userId).order('date', { ascending: false }),
      supa.from('expenses').select('*, category:expense_categories!category_id(name)').eq('entered_by', userId).order('date', { ascending: false }),
    ]);
    const total    = (feeRecs || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalExp = (expRecs || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    el.innerHTML = `
      <div class="panel-header"><div><h2>My History</h2><p>All your collection records</p></div></div>
      <div class="stats-grid">
        ${statCard('💰', 'si-green',  '₹' + total.toFixed(2),    'Total Fees Collected')}
        ${statCard('📝', 'si-blue',   (feeRecs  || []).length,   'Fee Transactions')}
        ${statCard('📁', 'si-purple', (dataRecs || []).length,   'Data Records')}
        ${statCard('💸', 'si-yellow', '₹' + totalExp.toFixed(2), 'Expenses Entered')}
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
      </div>
      <div class="card">
        <div class="card-header"><h3>Expense History</h3></div>
        <div class="card-body table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              ${!(expRecs || []).length ? `<tr><td colspan="4">${emptyState('💸', 'No expense records', '')}</td></tr>` :
                expRecs.map(r => `<tr>
                  <td>${fmtDate(r.date)}</td>
                  <td>${r.category?.name ? esc(r.category.name) : '—'}</td>
                  <td>${esc(r.description || '—')}</td>
                  <td><strong class="text-danger">₹${parseFloat(r.amount).toFixed(2)}</strong></td>
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
//  EXPENSES MODULE
// ============================================================

async function renderAdminExpenses() {
  const el = document.getElementById('admin-expenses');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: categories }, { data: expenses }] = await Promise.all([
      supa.from('expense_categories').select('id, name').eq('site_id', siteId).order('name'),
      supa.from('expenses')
        .select('id, category_id, amount, description, date, category:expense_categories!category_id(name), enteredBy:profiles!entered_by(name)')
        .eq('site_id', siteId).order('date', { ascending: false }),
    ]);

    const totalExpenses = (expenses || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    // Compute running balance (oldest first, then reverse for display)
    const sorted = [...(expenses || [])].reverse();
    let running = 0;
    const balMap = {};
    sorted.forEach(r => { running += parseFloat(r.amount || 0); balMap[r.id] = running; });

    const catOpts = (categories || []).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Expenses</h2><p>Track community expenses and categories</p></div>
        <div class="panel-header-actions">
          <button class="btn btn-secondary" onclick="showAddExpenseCatModal()">+ Category</button>
          <button class="btn btn-primary"   onclick="showAddExpenseModal()">+ Add Expense</button>
        </div>
      </div>
      <div class="stats-grid">
        ${statCard('💸', 'si-yellow', '₹' + totalExpenses.toFixed(2), 'Total Expenses')}
        ${statCard('📂', 'si-blue',   (categories || []).length,       'Categories')}
        ${statCard('📝', 'si-purple', (expenses   || []).length,       'Transactions')}
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3>Expense Categories</h3></div>
        <div class="card-body">
          ${!(categories || []).length ? emptyState('📂', 'No categories yet', 'Click "+ Category" to add one') : `
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${categories.map(c => `
                <div style="display:flex;align-items:center;gap:6px;background:#f3f4f6;border-radius:8px;padding:6px 12px;font-size:13px">
                  <span>${esc(c.name)}</span>
                  <button class="btn btn-danger btn-sm" style="padding:2px 7px;font-size:11px" onclick="deleteExpenseCat('${c.id}')">🗑️</button>
                </div>`).join('')}
            </div>`}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Expense Transactions</h3></div>
        <div class="card-body table-wrapper">
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Cumulative</th><th>Entered By</th><th>Action</th></tr></thead>
            <tbody>
              ${!(expenses || []).length ? `<tr><td colspan="7">${emptyState('💸', 'No expenses yet', 'Click "+ Add Expense" to record one')}</td></tr>` :
                expenses.map(r => `<tr>
                  <td>${fmtDate(r.date)}</td>
                  <td>${r.category?.name ? esc(r.category.name) : '—'}</td>
                  <td>${esc(r.description || '—')}</td>
                  <td><strong class="text-danger">₹${parseFloat(r.amount).toFixed(2)}</strong></td>
                  <td><strong>₹${(balMap[r.id] || 0).toFixed(2)}</strong></td>
                  <td>${r.enteredBy?.name ? esc(r.enteredBy.name) : '—'}</td>
                  <td><div class="table-actions"><button class="btn btn-secondary btn-sm" onclick="showEditExpenseModal('${r.id}')">✏️ Edit</button><button class="btn btn-danger btn-sm" onclick="deleteExpense('${r.id}')">🗑️</button></div></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

async function renderUserExpenses() {
  const el = document.getElementById('user-expenses');
  if (!currentUser.site_id) { el.innerHTML = noSiteMsg(); return; }
  // Reuse admin expenses view scoped to same site
  document.getElementById('admin-expenses').innerHTML = '';
  await renderAdminExpenses();
  const src = document.getElementById('admin-expenses');
  el.innerHTML = src.innerHTML;
  src.innerHTML = '';
}

async function showAddExpenseCatModal() {
  showModal('Add Expense Category',
    `<div class="form-group"><label>Category Name *</label><input id="mCatName" type="text" placeholder="e.g., Utilities"></div>`,
    async () => {
      const name = val('mCatName');
      if (!name) return toast('Category name is required', 'error'), false;
      const { error } = await supa.from('expense_categories').insert({ site_id: currentUser.site_id, name });
      if (error) return toast(error.message, 'error'), false;
      toast('Category added', 'success');
      await navigate(currentUser.role === 'user' ? 'user-expenses' : 'admin-expenses');
      return true;
    });
}

async function showAddExpenseModal() {
  const { data: cats } = await supa.from('expense_categories').select('id, name').eq('site_id', currentUser.site_id).order('name');
  const catOpts = (cats || []).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  showModal('Add Expense', `
    <div class="form-group"><label>Category</label>
      <select id="mExpCat"><option value="">— Select Category —</option>${catOpts}</select>
    </div>
    <div class="form-group"><label>Amount *</label><input id="mExpAmt" type="number" min="0.01" step="0.01" placeholder="0.00"></div>
    <div class="form-group"><label>Date *</label><input id="mExpDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="form-group"><label>Description</label><textarea id="mExpDesc" placeholder="Details..."></textarea></div>`,
    async () => {
      const amount = parseFloat(val('mExpAmt')), date = val('mExpDate');
      if (!amount || amount <= 0) return toast('Valid amount is required', 'error'), false;
      if (!date) return toast('Date is required', 'error'), false;
      const { error } = await supa.from('expenses').insert({
        site_id: currentUser.site_id,
        category_id: val('mExpCat') || null,
        amount, date,
        description: val('mExpDesc') || null,
        entered_by: currentUser.id,
      });
      if (error) return toast(error.message, 'error'), false;
      toast('Expense recorded', 'success');
      await navigate(currentUser.role === 'user' ? 'user-expenses' : 'admin-expenses');
      return true;
    });
}

async function showEditExpenseModal(expenseId) {
  const [{ data: expense, error: expenseError }, { data: categories, error: categoriesError }] = await Promise.all([
    supa.from('expenses').select('id, category_id, amount, date, description').eq('id', expenseId).single(),
    supa.from('expense_categories').select('id, name').eq('site_id', currentUser.site_id).order('name'),
  ]);
  if (expenseError || categoriesError) return toast((expenseError || categoriesError).message, 'error');
  if (!expense) return;
  const catOpts = (categories || []).map(category => `<option value="${category.id}" ${category.id === expense.category_id ? 'selected' : ''}>${esc(category.name)}</option>`).join('');
  showModal('Edit Expense', `
    <div class="form-group"><label>Category</label>
      <select id="mExpCat"><option value="">— Select Category —</option>${catOpts}</select>
    </div>
    <div class="form-group"><label>Amount *</label><input id="mExpAmt" type="number" min="0.01" step="0.01" value="${parseFloat(expense.amount || 0).toFixed(2)}"></div>
    <div class="form-group"><label>Date *</label><input id="mExpDate" type="date" value="${expense.date || ''}"></div>
    <div class="form-group"><label>Description</label><textarea id="mExpDesc" placeholder="Details...">${esc(expense.description || '')}</textarea></div>`,
  async () => {
    const amount = parseFloat(val('mExpAmt')), date = val('mExpDate');
    if (!amount || amount <= 0) return toast('Valid amount is required', 'error'), false;
    if (!date) return toast('Date is required', 'error'), false;
    const { error } = await supa.from('expenses').update({
      category_id: val('mExpCat') || null, amount, date, description: val('mExpDesc') || null,
    }).eq('id', expenseId);
    if (error) return toast(error.message, 'error'), false;
    toast('Expense updated', 'success');
    await navigate(currentUser.role === 'user' ? 'user-expenses' : 'admin-expenses');
    return true;
  });
}

function deleteExpenseCat(id) {
  confirmAction('Delete this category? Expenses in this category will lose their category.', async () => {
    const { error } = await supa.from('expense_categories').delete().eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Category deleted', 'success');
    await navigate(currentUser.role === 'user' ? 'user-expenses' : 'admin-expenses');
  });
}

function deleteExpense(id) {
  confirmAction('Delete this expense record?', async () => {
    const { error } = await supa.from('expenses').delete().eq('id', id);
    if (error) return toast(error.message, 'error');
    toast('Expense deleted', 'success');
    await navigate(currentUser.role === 'user' ? 'user-expenses' : 'admin-expenses');
  });
}

// ============================================================
//  EXPENSE REPORT
// ============================================================

async function renderAdminExpenseReport() {
  const el = document.getElementById('admin-expense-report');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }
  setLoading(el);
  try {
    const [{ data: expenses }, { data: categories }] = await Promise.all([
      supa.from('expenses')
        .select('id, amount, description, date, category:expense_categories!category_id(name), enteredBy:profiles!entered_by(name)')
        .eq('site_id', siteId).order('date', { ascending: false }),
      supa.from('expense_categories').select('id, name').eq('site_id', siteId).order('name'),
    ]);

    const totalExpenses = (expenses || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);

    // Category-wise summary
    const catSummary = {};
    (expenses || []).forEach(r => {
      const cat = r.category?.name || 'Uncategorised';
      catSummary[cat] = (catSummary[cat] || 0) + parseFloat(r.amount || 0);
    });

    // Running balance (oldest→newest)
    const sorted = [...(expenses || [])].reverse();
    let running = 0;
    const balMap = {};
    sorted.forEach(r => { running += parseFloat(r.amount || 0); balMap[r.id] = running; });

    // Year filter options
    const years = [...new Set((expenses || []).map(r => r.date?.slice(0,4)).filter(Boolean))].sort().reverse();

    el.innerHTML = `
      <div class="panel-header">
        <div><h2>Expense Report</h2><p>Full expense breakdown by category and date</p></div>
        <button class="btn btn-secondary" onclick="exportExpenseReportCSV()">⬇️ Export CSV</button>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><h3>By Category</h3></div>
        <div class="card-body table-wrapper">
          <table>
            <thead><tr><th>Category</th><th style="text-align:right">Total Amount</th></tr></thead>
            <tbody>
              ${Object.entries(catSummary).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => `<tr>
                <td>${esc(cat)}</td>
                <td style="text-align:right"><strong class="text-danger">₹${amt.toFixed(2)}</strong></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>All Transactions</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <select id="expRptYear" onchange="filterExpenseReport()" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
              <option value="">All Years</option>
              ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
            </select>
            <select id="expRptCat" onchange="filterExpenseReport()" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
              <option value="">All Categories</option>
              ${(categories || []).map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body table-wrapper">
          <table id="expRptTable">
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Cumulative</th><th>Entered By</th><th>Description</th></tr></thead>
            <tbody>
              ${!(expenses || []).length ? `<tr><td colspan="6">${emptyState('💸', 'No expenses recorded', '')}</td></tr>` :
                expenses.map(r => `<tr data-year="${r.date?.slice(0,4) || ''}" data-cat="${esc(r.category?.name || '')}">
                  <td>${fmtDate(r.date)}</td>
                  <td>${r.category?.name ? esc(r.category.name) : '—'}</td>
                  <td><strong class="text-danger">₹${parseFloat(r.amount).toFixed(2)}</strong></td>
                  <td>₹${(balMap[r.id] || 0).toFixed(2)}</td>
                  <td>${r.enteredBy?.name ? esc(r.enteredBy.name) : '—'}</td>
                  <td>${esc(r.description || '—')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    window._expReportData = expenses || [];
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function filterExpenseReport() {
  const year = document.getElementById('expRptYear')?.value || '';
  const cat  = document.getElementById('expRptCat')?.value  || '';
  document.querySelectorAll('#expRptTable tbody tr').forEach(row => {
    row.style.display = (
      (!year || row.dataset.year === year) &&
      (!cat  || row.dataset.cat  === cat)
    ) ? '' : 'none';
  });
}

function exportExpenseReportCSV() {
  const data = window._expReportData;
  if (!data || !data.length) return toast('No data — open Expense Report first', 'warning');
  const rows = data.map(r => [
    r.date, r.category?.name || '', r.description || '', parseFloat(r.amount).toFixed(2), r.enteredBy?.name || '',
  ]);
  downloadCSV(['Date', 'Category', 'Description', 'Amount', 'Entered By'], rows, 'expense-report.csv');
}

// ============================================================
//  BALANCE SHEET
// ============================================================

async function renderAdminBalanceSheet() {
  const el = document.getElementById('admin-balance-sheet');
  const siteId = currentUser.site_id;
  if (!siteId) { el.innerHTML = noSiteMsg(); return; }

  const year     = new Date().getFullYear();
  const defFrom  = `${year}-01-01`;
  const defTo    = `${year}-12-31`;

  el.innerHTML = `
    <div class="panel-header">
      <div><h2>Balance Sheet</h2><p>Income vs Expenses for selected period</p></div>
      <button class="btn btn-secondary" onclick="exportBalanceSheetCSV()">⬇️ Export CSV</button>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-body" style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div class="form-group" style="margin:0">
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">From</label>
          <input type="date" id="bsFrom" value="${defFrom}" style="padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
        </div>
        <div class="form-group" style="margin:0">
          <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">To</label>
          <input type="date" id="bsTo" value="${defTo}" style="padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:13px">
        </div>
        <button class="btn btn-primary" onclick="loadBalanceSheet()">Apply</button>
      </div>
    </div>
    <div id="bsContent"></div>`;

  await loadBalanceSheet();
}

async function loadBalanceSheet() {
  const el     = document.getElementById('bsContent');
  const siteId = currentUser.site_id;
  const from   = document.getElementById('bsFrom')?.value;
  const to     = document.getElementById('bsTo')?.value;
  if (!from || !to) return toast('Select a valid date range', 'error');
  setLoading(el);
  try {
    const [{ data: feeRecs }, { data: expenses }] = await Promise.all([
      supa.from('fee_records').select('amount, date, activity:activities!activity_id(name)')
        .eq('site_id', siteId).gte('date', from).lte('date', to),
      supa.from('expenses').select('amount, date, description, category:expense_categories!category_id(name)')
        .eq('site_id', siteId).gte('date', from).lte('date', to),
    ]);

    const totalIncome  = (feeRecs  || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const totalExpense = (expenses || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0);
    const balance      = totalIncome - totalExpense;

    // Income breakdown by activity
    const incomeByAct = {};
    (feeRecs || []).forEach(r => {
      const k = r.activity?.name || 'Unknown Event';
      incomeByAct[k] = (incomeByAct[k] || 0) + parseFloat(r.amount || 0);
    });

    // Expense breakdown by category
    const expByCat = {};
    (expenses || []).forEach(r => {
      const k = r.category?.name || 'Uncategorised';
      expByCat[k] = (expByCat[k] || 0) + parseFloat(r.amount || 0);
    });

    window._bsData = { from, to, totalIncome, totalExpense, balance, incomeByAct, expByCat };

    const balColor = balance >= 0 ? 'text-green' : 'text-danger';

    el.innerHTML = `
      <div class="two-col">
        <div class="card">
          <div class="card-header"><h3>💰 Income Breakdown</h3><span class="fw-bold text-green">₹${totalIncome.toFixed(2)}</span></div>
          <div class="card-body table-wrapper">
            <table>
              <thead><tr><th>Event / Source</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                ${!Object.keys(incomeByAct).length ? `<tr><td colspan="2">${emptyState('💰', 'No collections in this period', '')}</td></tr>` :
                  Object.entries(incomeByAct).sort((a,b) => b[1]-a[1]).map(([k,v]) => `<tr>
                    <td>${esc(k)}</td>
                    <td style="text-align:right"><strong class="text-green">₹${v.toFixed(2)}</strong></td>
                  </tr>`).join('')}
                ${Object.keys(incomeByAct).length ? `<tr style="border-top:2px solid var(--border)">
                  <td><strong>Total</strong></td>
                  <td style="text-align:right"><strong class="text-green">₹${totalIncome.toFixed(2)}</strong></td>
                </tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>💸 Expense Breakdown</h3><span class="fw-bold text-danger">₹${totalExpense.toFixed(2)}</span></div>
          <div class="card-body table-wrapper">
            <table>
              <thead><tr><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                ${!Object.keys(expByCat).length ? `<tr><td colspan="2">${emptyState('💸', 'No expenses in this period', '')}</td></tr>` :
                  Object.entries(expByCat).sort((a,b) => b[1]-a[1]).map(([k,v]) => `<tr>
                    <td>${esc(k)}</td>
                    <td style="text-align:right"><strong class="text-danger">₹${v.toFixed(2)}</strong></td>
                  </tr>`).join('')}
                ${Object.keys(expByCat).length ? `<tr style="border-top:2px solid var(--border)">
                  <td><strong>Total</strong></td>
                  <td style="text-align:right"><strong class="text-danger">₹${totalExpense.toFixed(2)}</strong></td>
                </tr>` : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:20px">
        <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px">
          <span style="font-size:16px;font-weight:700">Net Balance (${from} to ${to})</span>
          <span style="font-size:22px;font-weight:800" class="${balColor}">${balance >= 0 ? '+' : '-'}₹${Math.abs(balance).toFixed(2)}</span>
        </div>
      </div>`;
  } catch (err) { el.innerHTML = errHTML(err.message); }
}

function exportBalanceSheetCSV() {
  const d = window._bsData;
  if (!d) return toast('Load the balance sheet first', 'warning');
  const rows = [
    ['INCOME', '', ''],
    ...Object.entries(d.incomeByAct).map(([k,v]) => [k, '₹' + v.toFixed(2), '']),
    ['Total Income', '₹' + d.totalIncome.toFixed(2), ''],
    ['', '', ''],
    ['EXPENSES', '', ''],
    ...Object.entries(d.expByCat).map(([k,v]) => [k, '₹' + v.toFixed(2), '']),
    ['Total Expenses', '₹' + d.totalExpense.toFixed(2), ''],
    ['', '', ''],
    ['NET BALANCE', '₹' + d.balance.toFixed(2), d.balance >= 0 ? 'Surplus' : 'Deficit'],
  ];
  downloadCSV(['Description', 'Amount', 'Note'], rows, `balance-sheet-${d.from}-to-${d.to}.csv`);
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
