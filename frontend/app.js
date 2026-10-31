const API_BASE = location.origin.includes(':9000') ? '/api' : 'http://localhost:9000/api';

const PAGES = [
  ['index.html', 'Home'],
  ['users.html', 'Users & Staff'],
  ['rooms.html', 'Rooms'],
  ['bookings.html', 'Bookings'],
  ['checkin_logs.html', 'Check-in Logs'],
  ['invoices.html', 'Invoices'],
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const peso = n => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
const fmt = d => (d ? String(d).replace('T', ' ').slice(0, 16) : '');
const badge = s => `<span class="badge ${esc(String(s).toLowerCase().replace(/\s+/g, '_'))}">${esc(s)}</span>`;

async function api(path, method = 'GET', body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error || `Request failed (${res.status})`);
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
  const here = location.pathname.split('/').pop() || 'index.html';
  document.getElementById('nav').innerHTML =
    '<b class="logo">PlayStay<span>Suites</span></b>' +
    PAGES.map(([href, label]) => `<a href="${href}" class="${href === here ? 'on' : ''}">${label}</a>`).join('');
}

async function initCrud(cfg) {
  renderNav();
  cfg.fields = cfg.fields || [];
  const id = cfg.idKey;
  const canAdd = cfg.fields.length > 0;
  const canEdit = canAdd && cfg.canEdit !== false;
  const canDelete = cfg.canDelete !== false;
  const $ = s => document.querySelector(s);
  let rows = [], editId = null;

  await Promise.all(cfg.fields.filter(f => f.from).map(async f => {
    try {
      const list = await api(f.from.url);
      f.options = list.map(o => ({ value: o[f.from.value], label: f.from.label(o) }));
    } catch { f.options = []; }
  }));

  const input = f => {
    const req = f.required === false ? '' : 'required';
    const opts = (f.options || []).map(o => (typeof o === 'object' ? o : { value: o, label: o }));
    const el = f.type === 'select'
      ? `<select name="${f.key}" ${req}><option value="">Select…</option>${opts.map(o => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}</select>`
      : `<input name="${f.key}" type="${f.type || 'text'}" ${f.type === 'number' ? 'step="any"' : ''} ${req}>`;
    return `<label>${f.label}${el}</label>`;
  };

  $('#app').innerHTML = `
    <div class="head"><h1>${cfg.title}</h1><input id="q" type="search" placeholder="Search this table"></div>
    ${canAdd ? `<form id="f" class="card"><h2 id="ft">Add record</h2>
      <div class="grid">${cfg.fields.map(input).join('')}</div>
      <div class="row"><button class="btn">Save</button><button type="button" class="btn ghost" id="cancel" hidden>Cancel edit</button></div></form>` : ''}
    <div class="card scroll"><table><thead><tr>${cfg.columns.map(c => `<th>${c.label}</th>`).join('')}<th></th></tr></thead><tbody id="tb"></tbody></table></div>`;

  const draw = () => {
    const q = $('#q').value.toLowerCase();
    const list = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    $('#tb').innerHTML = list.length
      ? list.map(r => `<tr>${cfg.columns.map(c => `<td>${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}
          <td class="acts">
            ${(cfg.actions ? cfg.actions(r) : []).map((a, i) => `<button class="btn sm" data-id="${r[id]}" data-a="${i}">${a.label}</button>`).join('')}
            ${canEdit ? `<button class="btn sm ghost" data-id="${r[id]}" data-e>Edit</button>` : ''}
            ${canDelete ? `<button class="btn sm danger" data-id="${r[id]}" data-d>Delete</button>` : ''}
          </td></tr>`).join('')
      : `<tr><td colspan="${cfg.columns.length + 1}" class="empty">Nothing here yet.${canAdd ? ' Add the first record above.' : ''}</td></tr>`;
  };

  const load = async () => {
    try { rows = await api(cfg.endpoint); draw(); } catch (e) { toast(e.message, true); }
  };

  const form = $('#f');
  const reset = () => { editId = null; form.reset(); $('#ft').textContent = 'Add record'; $('#cancel').hidden = true; };
  const startEdit = r => {
    editId = r[id];
    $('#ft').textContent = 'Edit record';
    $('#cancel').hidden = false;
    cfg.fields.forEach(f => {
      const v = r[f.key] ?? '';
      form.elements[f.key].value = f.type === 'datetime-local' ? String(v).replace(' ', 'T').slice(0, 16) : v;
    });
    form.scrollIntoView({ behavior: 'smooth' });
  };

  $('#q').oninput = draw;

  $('#tb').onclick = async e => {
    const b = e.target.closest('button');
    if (!b) return;
    const r = rows.find(x => String(x[id]) === b.dataset.id);
    try {
      if ('d' in b.dataset) {
        if (!confirm('Delete this record?')) return;
        await api(`${cfg.endpoint}/${r[id]}`, 'DELETE');
        toast('Deleted');
      } else if ('e' in b.dataset) {
        return startEdit(r);
      } else {
        await cfg.actions(r)[b.dataset.a].run();
      }
      await load();
    } catch (err) { toast(err.message, true); }
  };

  if (form) {
    $('#cancel').onclick = reset;
    form.onsubmit = async e => {
      e.preventDefault();
      const body = {};
      cfg.fields.forEach(f => {
        const v = form.elements[f.key].value;
        body[f.key] = v === '' ? null : f.type === 'number' ? Number(v) : v;
      });
      const problem = cfg.validate && cfg.validate(body);
      if (problem) return toast(problem, true);
      try {
        await api(editId ? `${cfg.endpoint}/${editId}` : cfg.endpoint, editId ? 'PUT' : 'POST', body);
        toast('Saved');
        reset();
        await load();
      } catch (err) { toast(err.message, true); }
    };
  }

  load();
}