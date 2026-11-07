const API_BASE = '/api';

const PAGES = [
  { file: 'index.html', label: 'Home', roles: ['Admin', 'Staff', 'Student'] },
  { file: 'users.html', label: 'Users & Staff', roles: ['Admin'] },
  { file: 'rooms.html', label: 'Rooms', roles: ['Admin', 'Staff', 'Student'] },
  { file: 'amenities.html', label: 'Amenities', roles: ['Admin', 'Staff'] },
  { file: 'services.html', label: 'Services', roles: ['Admin', 'Staff'] },
  { file: 'promos.html', label: 'Promotions', roles: ['Admin', 'Staff'] },
  { file: 'bookings.html', label: 'Bookings', roles: ['Admin', 'Staff', 'Student'] },
  { file: 'checkin_logs.html', label: 'Check-in Logs', roles: ['Admin', 'Staff'] },
  { file: 'invoices.html', label: 'Invoices', roles: ['Admin', 'Staff'] },
  { file: 'reports.html', label: 'Reports', roles: ['Admin', 'Staff'] },
];

function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser'));
  } catch {
    return null;
  }
}

function requireAuth() {
  const token = sessionStorage.getItem('authToken');
  const user = getCurrentUser();

  if (!token || !user || !user.role) {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    location.href = 'login.html';
    return false;
  }

  return true;
}

function logout() {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('currentUser');
  location.href = 'login.html';
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const peso = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const fmt = d => (d ? String(d).replace('T', ' ').slice(0, 16) : '');
const spinner = (text = 'Loading…') => `<span class="spinner" aria-hidden="true"></span><span>${esc(text)}</span>`;
const badge = s => `<span class="badge ${esc(String(s).toLowerCase().replace(/\s+/g, '_'))}">${esc(s)}</span>`;

async function api(path, method = 'GET', body) {
  const token = sessionStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');

    if (!location.pathname.endsWith('login.html')) {
      location.href = 'login.html';
    }

    throw new Error(json.message || 'Please log in again.');
  }

  if (!res.ok) {
    throw new Error(
      json.message || json.error || `Request failed (${res.status})`
    );
  }

  return json.data ?? json;
}

function toast(msg, bad) {
  const t = document.createElement('div');
  t.className = 'toast' + (bad ? ' bad' : '');
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

function renderNav() {
  const user = getCurrentUser();

  if (!user) {
    location.href = 'login.html';
    return;
  }

  const here = location.pathname.split('/').pop() || 'index.html';

  const allowedPages = PAGES.filter(page =>
    page.roles.includes(user.role)
  );

  const currentPage = PAGES.find(page => page.file === here);
  if (currentPage && !currentPage.roles.includes(user.role)) {
    location.replace('index.html');
    return false;
  }

  document.getElementById('nav').innerHTML =
    `<b class="logo">PlayStay<span>Suites</span></b>` +

    `<div class="nav-links">` +
    allowedPages.map(page =>
      `<a href="${page.file}" class="${page.file === here ? 'on' : ''}">
        ${page.label}
      </a>`
    ).join('') +
    `</div>` +

    `<div class="nav-links"><span class="nav-user">${esc(user.role)}</span>
     <button class="btn sm ghost" id="logoutBtn">Sign Out</button></div>`;

  document.getElementById('logoutBtn').onclick = logout;
  return true;
}


async function initCrud(cfg) {
  if (!requireAuth()) return;
  if (renderNav() === false) return;

  const app = document.querySelector('#app');
  app.setAttribute('aria-busy', 'true');
  app.innerHTML = `<div class="page-loading" role="status">${spinner('Loading page…')}</div>`;

  cfg.fields = cfg.fields || [];
  const id = cfg.idKey;
  const currentUser = getCurrentUser();
  const isStudent = currentUser?.role === 'Student';

  const canAdd = cfg.fields.length > 0 &&
      (!isStudent || cfg.studentCanAdd === true);

  const canEdit = !isStudent && canAdd && cfg.canEdit !== false;
  const canDeleteRow = r => !isStudent && (typeof cfg.canDelete === 'function' ? cfg.canDelete(r) : cfg.canDelete !== false);
  const $ = s => document.querySelector(s);
  let rows = [], editId = null;

  await Promise.all(cfg.fields.filter(f => f.from && canAdd).map(async f => {
    try {
      const list = await api(f.from.url);
      f.options = list.map(o => ({ value: o[f.from.value], label: f.from.label(o) }));
    } catch (error) { f.options = []; f.loadError = error.message || 'Unable to load options.'; }
  }));

  const input = f => {
    if (f.type === 'checkboxes') {
      const boxes = (f.options || []).map(o =>
        `<label class="multi-option"><input type="checkbox" name="${esc(f.key)}" value="${esc(o.value)}"> <span>${esc(o.label)}</span></label>`
      ).join('');
      return `<div class="multi-field"><span class="field-label">${esc(f.label)}</span>
        <details class="multi-select" data-field="${esc(f.key)}">
          <summary><span class="multi-summary-text">Choose amenities</span><span class="selected-count">0 selected</span></summary>
          <div class="multi-select-panel">
            <input class="multi-search" type="search" data-multi-search placeholder="Search amenities…" aria-label="Search ${esc(f.label)}">
            <div class="multi-options">${boxes || `<span class="mute">${esc(f.empty || 'No amenities available.')}</span>`}</div>
          </div>
        </details>
        ${f.help ? `<small class="field-help">${esc(f.help)}</small>` : ''}
      </div>`;
    }
    const req = f.required === false ? '' : 'required';
    const opts = (f.options || []).map(o => (typeof o === 'object' ? o : { value: o, label: o }));
    const el = f.type === 'select'
      ? `<select name="${f.key}" ${req}><option value="">${esc(f.placeholder || 'Select…')}</option>${opts.map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}${!opts.length && (f.loadError || f.empty) ? `<option value="" disabled>${esc(f.loadError || f.empty)}</option>` : ''}</select>${f.help ? `<small class="field-help">${esc(f.help)}</small>` : ''}`
      : `<input name="${f.key}" type="${f.type || 'text'}" ${f.type === 'number' ? `step="${f.step || 'any'}"` : ''} ${req}>`;
    return `<label>${f.label}${el}</label>`;
  };

  $('#app').innerHTML = `
    <div class="head"><div><h1>${cfg.title}</h1>${cfg.subtitle ? `<p class="sub">${cfg.subtitle}</p>` : ''}</div><input id="q" type="search" placeholder="Search this table"></div>
    ${canAdd ? `<form id="f" class="card"><h2 id="ft">Add record</h2>
      <div class="grid">${cfg.fields.map(input).join('')}</div>
      ${cfg.preview ? '<div id="preview" class="preview"></div>' : ''}
      <div class="row"><button class="btn">${esc(cfg.submitLabel || 'Save')}</button><button type="button" class="btn ghost" id="cancel" hidden>Cancel edit</button></div></form>` : ''}
    <div class="card scroll"><table><thead><tr>${cfg.columns.map(c => `<th>${c.label}</th>`).join('')}<th></th></tr></thead><tbody id="tb"></tbody></table></div>`;
  app.removeAttribute('aria-busy');

  const draw = () => {
    const q = $('#q').value.toLowerCase();
    const list = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    $('#tb').innerHTML = list.length
      ? list.map(r => `<tr>${cfg.columns.map(c => `<td data-label="${esc(c.label)}">${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}
          <td class="acts">
            ${(!isStudent && cfg.actions ? cfg.actions(r) : []).map((a, i) => `<button class="btn sm" data-id="${r[id]}" data-a="${i}">${a.label}</button>`).join('')}            ${canEdit ? `<button class="btn sm ghost" data-id="${r[id]}" data-e>Edit</button>` : ''}
            ${canDeleteRow(r) ? `<button class="btn sm danger" data-id="${r[id]}" data-d>${esc(cfg.deleteLabel || 'Delete')}</button>` : ''}
          </td></tr>`).join('')
      : `<tr><td colspan="${cfg.columns.length + 1}" class="empty">Nothing here yet.${canAdd ? ' Add the first record above.' : ''}</td></tr>`;
  };

  const colSpan = cfg.columns.length + 1;
  const load = async () => {
    $('#tb').innerHTML = `<tr class="loading-row"><td colspan="${colSpan}" class="empty" role="status"><div class="loading-inline">${spinner('Loading records…')}</div></td></tr>`;
    try {
      rows = await api(cfg.endpoint);
      draw();
    } catch (e) {
      $('#tb').innerHTML = `<tr><td colspan="${colSpan}" class="empty error">Could not load records: ${esc(e.message)}<br><button type="button" class="btn sm ghost" data-retry>Try again</button></td></tr>`;
      toast(e.message, true);
    }
  };

  const form = $('#f');

  const refreshFieldOptions = async () => {
    if (!form) return;
    for (const f of cfg.fields.filter(field => field.from && canAdd)) {
      try {
        const list = await api(f.from.url);
        f.options = list.map(o => ({ value: o[f.from.value], label: f.from.label(o) }));
        f.loadError = '';
      } catch (error) {
        f.options = [];
        f.loadError = error.message || 'Unable to load options.';
      }
      if (f.type === 'select') {
        const select = form.elements[f.key];
        const previous = select.value;
        const options = f.options.map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
        const empty = !f.options.length && (f.loadError || f.empty)
          ? `<option value="" disabled>${esc(f.loadError || f.empty)}</option>` : '';
        select.innerHTML = `<option value="">${esc(f.placeholder || 'Select…')}</option>${options}${empty}`;
        if (f.options.some(o => String(o.value) === previous)) select.value = previous;
      }
    }
  };

  const readForm = () => {
    const body = {};
    cfg.fields.forEach(f => {
      if (f.type === 'checkboxes') {
        body[f.key] = [...form.querySelectorAll(`input[name="${f.key}"]:checked`)].map(box => Number(box.value));
        return;
      }
      const v = form.elements[f.key].value;
      body[f.key] = v === '' ? null : f.type === 'number' ? Number(v) : v;
    });
    return body;
  };

  const updateMultiSummaries = () => {
    if (!form) return;
    form.querySelectorAll('.multi-select').forEach(menu => {
      const checked = [...menu.querySelectorAll('input[type="checkbox"]:checked')];
      const count = menu.querySelector('.selected-count');
      const summary = menu.querySelector('.multi-summary-text');
      if (count) count.textContent = `${checked.length} selected`;
      if (summary) summary.textContent = checked.length
        ? checked.slice(0, 2).map(box => box.closest('label')?.querySelector('span')?.textContent || '').join(', ') + (checked.length > 2 ? ` +${checked.length - 2} more` : '')
        : 'Choose amenities';
    });
  };

  const refreshPreview = () => {
    const box = $('#preview');
    if (!form || !box || !cfg.preview) return;
    try { box.innerHTML = cfg.preview(readForm()) || ''; } catch { box.innerHTML = ''; }
  };

  const reset = () => { editId = null; form.reset(); form.querySelectorAll('.multi-select').forEach(menu => menu.removeAttribute('open')); updateMultiSummaries(); $('#ft').textContent = 'Add record'; $('#cancel').hidden = true; };
  const startEdit = r => {
    editId = r[id];
    $('#ft').textContent = 'Edit record';
    $('#cancel').hidden = false;
    cfg.fields.forEach(f => {
      const v = r[f.key] ?? '';
      if (f.type === 'checkboxes') {
        const ticked = (Array.isArray(v) ? v : String(v).split(',')).map(String);
        form.querySelectorAll(`input[name="${f.key}"]`).forEach(box => { box.checked = ticked.includes(box.value); });
        return;
      }
      form.elements[f.key].value = f.type === 'datetime-local' ? String(v).replace(' ', 'T').slice(0, 16) : v;
    });
    updateMultiSummaries();
    refreshPreview();
    form.scrollIntoView({ behavior: 'smooth' });
  };

  $('#q').oninput = draw;

  $('#tb').onclick = async e => {
    const b = e.target.closest('button');
    if (!b) return;
    if ('retry' in b.dataset) return load();
    const r = rows.find(x => String(x[id]) === b.dataset.id);
    b.disabled = true; 
    try {
      if ('d' in b.dataset) {
        if (cfg.onDelete) {
          if (await cfg.onDelete(r) === false) return;
        } else {
          if (!confirm(cfg.deleteConfirm || 'Delete this record?')) return;
          await api(`${cfg.endpoint}/${r[id]}`, 'DELETE');
          toast('Deleted');
        }
      } else if ('e' in b.dataset) {
        return startEdit(r);
      } else {
        await cfg.actions(r)[b.dataset.a].run();
      }
      await load();
    } catch (err) { toast(err.message, true); }
    finally { b.disabled = false; }
  };

  if (form) {
    $('#cancel').onclick = reset;
    form.addEventListener('input', e => {
      if (e.target.matches('[data-multi-search]')) {
        const term = e.target.value.toLowerCase();
        e.target.closest('.multi-select-panel').querySelectorAll('.multi-option').forEach(option => {
          option.hidden = !option.textContent.toLowerCase().includes(term);
        });
      }
      refreshPreview();
    });
    form.addEventListener('change', () => { updateMultiSummaries(); refreshPreview(); });
    form.addEventListener('reset', () => setTimeout(refreshPreview));
    updateMultiSummaries();
    refreshPreview();
    const submitBtn = form.querySelector('.row button:not([type="button"])');
    form.onsubmit = async e => {
      e.preventDefault();
      const body = readForm();
      const problem = cfg.validate && cfg.validate(body);
      if (problem) return toast(problem, true);
      const label = submitBtn.textContent;
      submitBtn.disabled = true; 
      submitBtn.textContent = 'Saving…';
      try {
        await api(editId ? `${cfg.endpoint}/${editId}` : cfg.endpoint, editId ? 'PUT' : 'POST', body);
        toast(cfg.successMessage || 'Saved');
        reset();
        await refreshFieldOptions();
        await load();
      } catch (err) { toast(err.message, true); }
      finally { submitBtn.disabled = false; submitBtn.textContent = label; }
    };
  }

  load();
  return { reload: load };
}