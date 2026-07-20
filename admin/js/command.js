/* ============================================================
   COMMAND MODULE — personal projects / focus / weekly / tax
   Ported from dashboard.html ("Command · Michael Beets").
   Global scope: NOT filtered by the client picker.
   Exposes window.CommandModule + window.CMD (inline handlers).
   ============================================================ */
(function () {
'use strict';

const SUPABASE_URL = 'https://rrxveifshucpinajtkgf.supabase.co';
  let ANON_KEY = 'sb_publishable_548FF3LDIHbz55iHtylFZw_HKBW06Aj';

  // ── State ──
  let allProjects = [];
  let openActions = [];
  let doneCounts  = {};
  let doneCache   = {};
  let filterCat   = null;
  let focusCollapsed = false;
  let weekCollapsed  = false;
  let archiveOpen = false;
  let doneToday   = 0;

  // Weekly tasks state
  let weeklyTasks       = [];
  let weeklyCompletions = {}; // { task_id: completion_id }

  

  // ── API ──
  async function api(table, query, method, body) {
    const opts = {
      method: method || 'GET',
      headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + (query || ''), opts);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'HTTP ' + res.status); }
    if (method === 'DELETE') return true;
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  }

  // ── Save status ──
  let _saveTimer;
  function setStatus(s) {
    const el = document.getElementById('save-status');
    clearTimeout(_saveTimer);
    if (s === 'saving') { el.className = 'save-status saving'; el.innerHTML = '<span class="dot"></span> Saving…'; }
    else if (s === 'saved') {
      el.className = 'save-status saved'; el.innerHTML = '<span class="dot"></span> Saved';
      _saveTimer = setTimeout(() => { el.className = 'save-status'; el.innerHTML = '<span class="dot"></span> Live'; }, 2500);
    } else if (s === 'error') { el.className = 'save-status error'; el.innerHTML = '<span class="dot"></span> Save failed'; }
  }

  function toast(msg, err) { if (window.toast) window.toast(msg, err); }

  function esc(s) { return (s == null ? '' : String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function daysUntil(d) {
    if (!d) return null;
    const now = new Date(); now.setHours(0,0,0,0);
    const dt = new Date(d); dt.setHours(0,0,0,0);
    return Math.round((dt - now) / 86400000);
  }

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  }

  // ── Due-date helpers ──
  function dueInfo(dstr) {
    const days = daysUntil(dstr);
    if (days === null) return { label: '', cls: '' };
    if (days < 0)  return { label: Math.abs(days) + 'd over', cls: 'overdue' };
    if (days === 0) return { label: 'Today', cls: 'today' };
    if (days === 1) return { label: 'Tmrw', cls: 'soon' };
    if (days <= 7) return { label: days + 'd', cls: 'soon' };
    return { label: formatDate(dstr), cls: '' };
  }

  // ── Action ordering: pinned → open → flagged, blocked sink to bottom ──
  function sortActions(arr) {
    return arr.slice().sort((a, b) =>
      ((b.pinned?1:0) - (a.pinned?1:0)) ||
      ((a.blocked?1:0) - (b.blocked?1:0)) ||
      ((b.flagged?1:0) - (a.flagged?1:0)) ||
      ((a.sort || 0) - (b.sort || 0)) ||
      (a.id - b.id));
  }

  // ── Single action <li> ──
  function actionItemHtml(a, p) {
    const pid = esc(p.id);
    const cls = ['action-item'];
    if (a.pinned)  cls.push('pinned-item');
    if (a.flagged) cls.push('flagged-item');
    if (a.blocked) cls.push('blocked-item');
    let meta = '';
    if (a.due_date) { const d = dueInfo(a.due_date); meta += `<span class="due-chip ${d.cls}" onclick="CMD.openDuePicker(${a.id})" title="Change due date">⏱ ${d.label}</span>`; }
    if (a.blocked && a.waiting_on) meta += `<span class="waiting-chip">⏸ ${esc(a.waiting_on)}</span>`;
    return `
      <li class="${cls.join(' ')}" id="action-${a.id}">
        <input type="checkbox" class="action-check" onchange="CMD.toggleAction(${a.id}, this.checked, '${pid}')"/>
        <div class="action-main">
          <span class="action-body" ondblclick="CMD.startEdit(${a.id}, '${pid}')">${esc(a.body)}</span>
          <div class="action-meta">${meta}</div>
        </div>
        <div class="action-controls">
          <button class="action-ctrl${a.pinned?' on':''}" onclick="CMD.togglePin(${a.id}, ${!!a.pinned}, '${pid}')" title="${a.pinned?'Unpin from focus':'Pin to focus'}">📌</button>
          <button class="action-ctrl${a.blocked?' on':''}" onclick="CMD.toggleBlock(${a.id}, ${!!a.blocked}, '${pid}')" title="${a.blocked?'Unblock':'Mark blocked / waiting'}">⏸</button>
          <button class="action-ctrl${a.flagged?' on':''}" onclick="CMD.toggleFlag(${a.id}, ${!!a.flagged}, '${pid}')" title="${a.flagged?'Remove priority':'Mark as priority'}">⚡</button>
          <button class="action-ctrl${a.due_date?' on':''}" onclick="CMD.openDuePicker(${a.id})" title="Set due date">📅</button>
          <input type="date" class="action-due-input" id="due-input-${a.id}" value="${a.due_date||''}" onchange="CMD.setDue(${a.id}, this.value, '${pid}')"/>
        </div>
      </li>`;
  }

  function rerenderProjectActions(projectId) {
    const p = allProjects.find(x => x.id === projectId);
    const card = document.getElementById('card-' + projectId);
    if (!p || !card) return;
    const list = card.querySelector('.actions-list');
    if (list) list.innerHTML = sortActions(openActions.filter(a => a.project_id === projectId)).map(a => actionItemHtml(a, p)).join('');
  }

  function openDuePicker(id) {
    const inp = document.getElementById('due-input-' + id);
    if (!inp) return;
    if (inp.showPicker) { try { inp.showPicker(); return; } catch (e) {} }
    inp.focus(); inp.click();
  }

  // ── Set due date ──
  async function setDue(id, value, projectId) {
    setStatus('saving');
    try {
      await api('pm_actions', '?id=eq.' + id, 'PATCH', { due_date: value || null });
      setStatus('saved');
      const a = openActions.find(x => x.id === id);
      if (a) a.due_date = value || null;
      rerenderProjectActions(projectId);
      renderFocusPanel();
      renderWeekPanel();
      renderStats();
    } catch (e) { setStatus('error'); toast('Could not set due date', true); }
  }

  // ── Toggle pin (📌 to Today's Focus) ──
  async function togglePin(id, current, projectId) {
    const newVal = !current;
    setStatus('saving');
    try {
      await api('pm_actions', '?id=eq.' + id, 'PATCH', { pinned: newVal });
      setStatus('saved');
      const a = openActions.find(x => x.id === id);
      if (a) a.pinned = newVal;
      rerenderProjectActions(projectId);
      renderFocusPanel();
    } catch (e) { setStatus('error'); toast('Could not pin', true); }
  }

  // ── Toggle blocked / waiting-on ──
  async function toggleBlock(id, current, projectId) {
    const newVal = !current;
    let waiting = null;
    if (newVal) {
      waiting = prompt('Waiting on? (who or what — optional)') || null;
      if (waiting !== null) waiting = waiting.trim() || null;
    }
    setStatus('saving');
    try {
      await api('pm_actions', '?id=eq.' + id, 'PATCH', { blocked: newVal, waiting_on: newVal ? waiting : null });
      setStatus('saved');
      const a = openActions.find(x => x.id === id);
      if (a) { a.blocked = newVal; a.waiting_on = newVal ? waiting : null; }
      rerenderProjectActions(projectId);
      renderFocusPanel();
      renderWeekPanel();
      renderStats();
    } catch (e) { setStatus('error'); toast('Could not update', true); }
  }

  // ── Week start (Monday) ──
  function getWeekStart() {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const offset = day === 0 ? -6 : 1 - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + offset);
    return mon.toISOString().split('T')[0];
  }

  // ── Init ──
  async function init() {
    document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    await renderAll();
  }

  async function renderAll() {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const ws = getWeekStart();

      const [projects, actions, doneRows, tasks, completions] = await Promise.all([
        api('pm_projects', '?order=sort.asc,priority.asc'),
        api('pm_actions',  '?done=eq.false&order=pinned.desc,flagged.desc,sort.asc'),
        api('pm_actions',  '?done=eq.true&select=id,project_id,done_at&order=done_at.desc'),
        api('weekly_tasks', '?active=eq.true&order=sort.asc,created_at.asc'),
        api('weekly_completions', '?week_start=eq.' + ws + '&select=id,task_id')
      ]);

      allProjects = projects;
      openActions = actions;
      weeklyTasks = tasks;
      weeklyCompletions = {};
      completions.forEach(c => { weeklyCompletions[c.task_id] = c.id; });

      doneCounts = {};
      doneToday = 0;
      doneRows.forEach(a => {
        doneCounts[a.project_id] = (doneCounts[a.project_id] || 0) + 1;
        if (a.done_at && a.done_at.startsWith(todayStr)) doneToday++;
      });

      // Populate category datalist for new project modal
      const cats = [...new Set(projects.map(p => p.category).filter(Boolean))];
      document.getElementById('cat-list').innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');

      renderStats();
      renderFilterTabs();
      renderFocusPanel();
      renderWeekPanel();
      renderCleanupPanel();
      renderProjectGrids();
    } catch (e) { toast('Failed to load: ' + e.message, true); }
  }

  // ── Stats ──
  function renderStats() {
    const active = allProjects.filter(p => p.status !== 'upcoming' && p.status !== 'complete');
    const urgent = allProjects.filter(p => { const d = daysUntil(p.deadline); return d !== null && d <= 7 && p.status !== 'complete'; });
    const wkDone = Object.values(weeklyCompletions).length;
    const wkTotal = weeklyTasks.length;
    const overdue = openActions.filter(a => !a.blocked && a.due_date && daysUntil(a.due_date) < 0).length;
    const blocked = openActions.filter(a => a.blocked).length;
    document.getElementById('stats-left').innerHTML = `
      <div class="stat"><div class="stat-label">Active</div><div class="stat-value">${active.length}</div><div class="stat-sub">projects</div></div>
      <div class="stat"><div class="stat-label">Urgent</div><div class="stat-value" style="color:${urgent.length?'var(--rust)':'var(--ink)'}">${urgent.length}</div><div class="stat-sub">within 7 days</div></div>
      <div class="stat"><div class="stat-label">Open actions</div><div class="stat-value">${openActions.length}</div><div class="stat-sub">to do</div></div>
      <div class="stat"><div class="stat-label">Overdue</div><div class="stat-value" style="color:${overdue?'var(--rust)':'var(--ink)'}">${overdue}</div><div class="stat-sub">past due</div></div>
      ${blocked ? `<div class="stat"><div class="stat-label">Blocked</div><div class="stat-value" style="color:var(--rust)">${blocked}</div><div class="stat-sub">waiting</div></div>` : ''}
      <div class="stat"><div class="stat-label">Done today</div><div class="stat-value" style="color:${doneToday?'var(--green)':'var(--ink)'}">${doneToday}</div><div class="stat-sub">completed</div></div>
      ${wkTotal ? `<div class="stat"><div class="stat-label">This week</div><div class="stat-value" style="color:${wkDone===wkTotal?'var(--green)':'var(--ink)'}">${wkDone}/${wkTotal}</div><div class="stat-sub">recurring</div></div>` : ''}
    `;
  }

  // ── Filter tabs ──
  function renderFilterTabs() {
    const cats = [...new Set(allProjects.filter(p=>p.status!=='complete').map(p => p.category).filter(Boolean))];
    let html = '<span class="filter-label">Filter</span>';
    html += `<button class="filter-tab${filterCat===null?' active':''}" onclick="CMD.setFilter(null)">All</button>`;
    cats.forEach(c => {
      html += `<button class="filter-tab${filterCat===c?' active':''}" onclick="CMD.setFilter('${esc(c)}')">${esc(c)}</button>`;
    });
    document.getElementById('filter-bar').innerHTML = html;
  }

  function setFilter(cat) {
    filterCat = cat;
    renderFilterTabs();
    renderProjectGrids();
  }

  // ── Focus panel ──
  function renderFocusPanel() {
    const focusItems = getFocusActions();
    const panel = document.getElementById('focus-panel');
    const focusList = document.getElementById('focus-list');
    const focusCount = document.getElementById('focus-count');

    if (focusItems.length === 0) { panel.style.display = 'none'; return; }
    panel.style.display = '';
    focusCount.textContent = focusItems.length;

    const bodyEl = document.getElementById('focus-body');
    bodyEl.style.display = focusCollapsed ? 'none' : '';
    document.getElementById('focus-collapse-btn').textContent = focusCollapsed ? 'Expand ↓' : 'Collapse ↑';

    focusList.innerHTML = focusItems.map(({ action, project }) => {
      let due = '';
      if (action.due_date) { const d = dueInfo(action.due_date); due = `<span class="due-chip ${d.cls}">⏱ ${d.label}</span>`; }
      const mark = action.pinned ? '<span class="focus-flag" title="Pinned">📌</span>' : (action.flagged ? '<span class="focus-flag">⚡</span>' : '');
      return `
      <div class="focus-item" id="focus-item-${action.id}">
        <input type="checkbox" class="focus-check" onchange="CMD.toggleAction(${action.id}, this.checked, '${esc(project.id)}', true)"/>
        <span class="focus-project-tag">${esc(project.name)}</span>
        <span class="focus-text">${esc(action.body)}</span>
        ${due}
        ${mark}
      </div>`;
    }).join('');
  }

  function getFocusActions() {
    const CAP = 8;
    const projById = {};
    allProjects.forEach(p => { projById[p.id] = p; });
    const result = [];
    const seen = new Set();
    const add = (a) => {
      if (seen.has(a.id) || result.length >= CAP) return;
      const project = projById[a.project_id];
      if (!project || project.status === 'complete') return;
      seen.add(a.id);
      result.push({ action: a, project });
    };

    // 1. Pinned actions always come first (by due date, then priority)
    const live = openActions.filter(a => !a.blocked && projById[a.project_id] && projById[a.project_id].status !== 'complete');
    live.filter(a => a.pinned)
      .sort((a, b) => (daysUntil(a.due_date) ?? 999) - (daysUntil(b.due_date) ?? 999))
      .forEach(add);

    // 2. Overdue / due-soon actions (within 3 days)
    live.filter(a => !a.pinned && a.due_date !== null && a.due_date !== undefined && daysUntil(a.due_date) <= 3)
      .sort((a, b) => daysUntil(a.due_date) - daysUntil(b.due_date))
      .forEach(add);

    // 3. Fill from projects, ranked by deadline then priority (2 per project)
    const scored = allProjects
      .filter(p => p.status !== 'complete')
      .map(p => {
        const days = daysUntil(p.deadline);
        const df = days === null ? 500 : Math.max(days, 0);
        return { project: p, score: df * 10 + (p.priority || 99) };
      })
      .sort((a, b) => a.score - b.score);

    for (const { project } of scored) {
      if (result.length >= CAP) break;
      const pas = live.filter(a => a.project_id === project.id && !a.pinned && !seen.has(a.id));
      const flagged = pas.filter(a => a.flagged);
      const unflagged = pas.filter(a => !a.flagged);
      [...flagged, ...unflagged].slice(0, 2).forEach(add);
    }
    return result;
  }

  function toggleFocusPanel() {
    focusCollapsed = !focusCollapsed;
    renderFocusPanel();
  }

  // ── This Week (cross-project) ──
  function renderWeekPanel() {
    const panel = document.getElementById('week-panel');
    const bodyWrap = document.getElementById('week-body');
    const countEl = document.getElementById('week-count');
    if (!panel) return;

    const ws = new Date(getWeekStart()); ws.setHours(0, 0, 0, 0);
    const weekEnd = new Date(ws); weekEnd.setDate(ws.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
    const projById = {}; allProjects.forEach(p => { projById[p.id] = p; });

    const dueActions = openActions.filter(a => {
      if (a.blocked || !a.due_date) return false;
      const p = projById[a.project_id];
      if (!p || p.status === 'complete') return false;
      const d = new Date(a.due_date); d.setHours(0, 0, 0, 0);
      return d <= weekEnd;
    }).sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0));

    const recurring = weeklyTasks.slice();
    const incompleteRecurring = recurring.filter(t => !weeklyCompletions[t.id]);

    if (!dueActions.length && !recurring.length) { panel.style.display = 'none'; return; }
    panel.style.display = '';
    countEl.textContent = dueActions.length + incompleteRecurring.length;

    bodyWrap.style.display = weekCollapsed ? 'none' : '';
    document.getElementById('week-collapse-btn').textContent = weekCollapsed ? 'Expand ↓' : 'Collapse ↑';

    let html = '';
    if (dueActions.length) {
      html += '<div class="week-sub">Due &amp; overdue</div>';
      html += dueActions.map(a => {
        const p = projById[a.project_id];
        const d = dueInfo(a.due_date);
        const bg = d.cls === 'overdue' ? 'var(--rust-tint)' : d.cls === 'today' ? 'var(--hi)' : 'var(--blue-tint)';
        const col = d.cls === 'overdue' ? 'var(--rust)' : d.cls === 'today' ? 'var(--ink)' : 'var(--blue)';
        return `<div class="week-row" id="week-act-${a.id}">
          <input type="checkbox" class="week-check" onchange="CMD.toggleAction(${a.id}, this.checked, '${esc(a.project_id)}')"/>
          <span class="week-tag">${esc(p.name)}</span>
          <span class="week-text">${esc(a.body)}</span>
          <span class="week-due" style="color:${col};background:${bg}">${d.label}</span>
        </div>`;
      }).join('');
    }
    if (recurring.length) {
      html += '<div class="week-sub">Recurring</div>';
      html += recurring.map(t => {
        const done = !!weeklyCompletions[t.id];
        const p = allProjects.find(x => x.name === t.tag);
        const pid = p ? p.id : '';
        return `<div class="week-row${done ? ' wk-done' : ''}">
          <input type="checkbox" class="week-check" ${done ? 'checked' : ''} onchange="CMD.toggleWeeklyTask(${t.id}, this.checked, '${esc(pid)}')"/>
          ${t.tag ? `<span class="week-tag">${esc(t.tag)}</span>` : ''}
          <span class="week-text">${esc(t.body)}</span>
        </div>`;
      }).join('');
    }
    bodyWrap.innerHTML = html;
  }

  function toggleWeekPanel() {
    weekCollapsed = !weekCollapsed;
    renderWeekPanel();
  }

  // ── Project grids ──
  function renderProjectGrids() {
    const filtered = filterCat ? allProjects.filter(p => p.category === filterCat) : allProjects;
    const urgent  = allProjects.filter(p => { const d = daysUntil(p.deadline); return d !== null && d <= 7 && p.status !== 'complete'; });
    const active   = filtered.filter(p => p.status !== 'upcoming' && p.status !== 'complete');
    const upcoming = filtered.filter(p => p.status === 'upcoming');
    const complete = filtered.filter(p => p.status === 'complete');

    // Alert bar
    const alertContainer = document.getElementById('alert-container');
    alertContainer.innerHTML = '';
    if (urgent.length) {
      const items = urgent.map(p => {
        const d = daysUntil(p.deadline);
        const s = d === 0 ? 'today' : d === 1 ? 'tomorrow' : d < 0 ? `${Math.abs(d)}d overdue` : `in ${d} days`;
        return `<strong>${esc(p.name)}</strong> — ${esc(p.deadline_label||'')} ${s}`;
      }).join(' &nbsp;·&nbsp; ');
      alertContainer.innerHTML = `<div class="alert-bar"><span class="alert-badge">⚡ Urgent</span><span class="alert-text">${items}</span></div>`;
    }

    // Active
    document.getElementById('active-grid').innerHTML = active.map(p => renderCard(p)).join('');

    // Upcoming
    const upcLabel = document.getElementById('upcoming-label');
    const upGrid   = document.getElementById('upcoming-grid');
    if (upcoming.length) {
      upcLabel.style.display = ''; upGrid.innerHTML = upcoming.map(p => renderCard(p)).join('');
    } else { upcLabel.style.display = 'none'; upGrid.innerHTML = ''; }

    // Archive
    const archiveSection = document.getElementById('archive-section');
    if (complete.length) {
      archiveSection.style.display = '';
      document.getElementById('archive-toggle-label').textContent = `Completed (${complete.length})`;
      if (archiveOpen) {
        document.getElementById('archive-grid').innerHTML = complete.map(p => renderCard(p, true)).join('');
        document.getElementById('archive-grid').style.display = '';
        document.getElementById('archive-toggle').classList.add('open');
      }
    } else { archiveSection.style.display = 'none'; }
  }

  // ── Card renderer ──
  function renderCard(p, isArchive) {
    const actions = openActions.filter(a => a.project_id === p.id);
    const days = daysUntil(p.deadline);
    const isUrgent = days !== null && days <= 7 && p.status !== 'complete';
    let statusCls = p.status;
    if (isUrgent) statusCls = 'urgent';
    const statusLabels = { active:'Active', upcoming:'Upcoming', recurring:'Recurring', complete:'Complete', urgent:'Urgent' };

    let deadlineHtml = '';
    if (p.deadline) {
      const near = days !== null && days <= 14;
      const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 0 ? `${Math.abs(days)}d overdue` : `${days} days`;
      deadlineHtml = `<div class="deadline-tag ${near?'near':'far'}">⏰ ${esc(p.deadline_label || p.deadline)} — ${label}</div>`;
    } else if (p.deadline_label) {
      deadlineHtml = `<div class="deadline-tag far">↻ ${esc(p.deadline_label)}</div>`;
    }

    const actionsHtml = sortActions(actions).map(a => actionItemHtml(a, p)).join('');

    const doneCount = doneCounts[p.id] || 0;
    const doneRowHtml = doneCount > 0 ? `
      <div class="done-row">
        <button class="done-toggle-btn" id="done-btn-${esc(p.id)}" onclick="CMD.toggleDoneSection('${esc(p.id)}')">
          <em class="done-arrow">↓</em> ${doneCount} completed
        </button>
        <div class="done-section" id="done-section-${esc(p.id)}">
          <div class="done-loading" id="done-loading-${esc(p.id)}">Loading…</div>
          <ul class="done-actions-list" id="done-list-${esc(p.id)}" style="display:none;"></ul>
        </div>
      </div>` : '';

    const weeklyHtml = renderCardWeeklySection(p);

    return `
      <div class="project-card ${isUrgent?'urgent':''} ${p.status==='upcoming'?'upcoming':''} ${isArchive?'complete-card':''}" id="card-${esc(p.id)}">
        <div class="card-head">
          <div>
            <div class="card-priority">#${p.priority} · ${esc(p.category)}</div>
            <div class="card-name">${esc(p.name)}</div>
          </div>
          <div class="status-pill ${statusCls}" title="Click to cycle status" onclick="CMD.cycleStatus('${esc(p.id)}', '${p.status}')">${statusLabels[statusCls]||p.status}</div>
        </div>
        <div class="card-body">
          <div class="card-desc">${esc(p.description)}</div>
          ${deadlineHtml}
          ${weeklyHtml}
          <ul class="actions-list">${actionsHtml}</ul>
          ${doneRowHtml}
          <div class="add-action-row">
            <input type="text" class="add-action-input" id="new-action-${esc(p.id)}" placeholder="Add action…" onkeydown="if(event.key==='Enter') CMD.addAction('${esc(p.id)}')"/>
            <button class="add-action-btn" onclick="CMD.addAction('${esc(p.id)}')">+ Add</button>
          </div>
        </div>
        ${p.notes ? `<div class="card-foot"><div class="card-notes">${esc(p.notes)}</div></div>` : ''}
      </div>`;
  }

  // ── Weekly (per-project) ──
  function projectWeeklyTasks(projectName) {
    return weeklyTasks.filter(t => t.tag === projectName);
  }

  function renderCardWeeklySection(p) {
    const tasks = projectWeeklyTasks(p.name);
    const total = tasks.length;
    const done  = tasks.filter(t => weeklyCompletions[t.id]).length;
    const open   = tasks.filter(t => !weeklyCompletions[t.id]);
    const closed = tasks.filter(t =>  weeklyCompletions[t.id]);

    const renderItem = t => `
      <div class="weekly-item${weeklyCompletions[t.id]?' wk-done':''}" id="wkitem-${t.id}">
        <input type="checkbox" class="weekly-check" ${weeklyCompletions[t.id]?'checked':''} onchange="CMD.toggleWeeklyTask(${t.id}, this.checked, '${esc(p.id)}')"/>
        <span class="weekly-body">${esc(t.body)}</span>
        <button class="weekly-remove-btn" onclick="CMD.removeWeeklyTask(${t.id})" title="Remove task">×</button>
      </div>`;

    const listHtml = total > 0 ? (open.map(renderItem).join('') + closed.map(renderItem).join('')) : '<div class="cw-empty">No weekly tasks.</div>';
    const progressHtml = total > 0 ? `<span class="card-weekly-progress" style="color:${done===total?'var(--green)':'var(--blue)'};background:${done===total?'var(--green-tint)':'var(--blue-tint)'}">${done}/${total}</span>` : '';

    return `
      <div class="card-weekly">
        <div class="card-weekly-head">
          <span class="card-weekly-title">This Week</span>
          ${progressHtml}
          <button class="card-weekly-add-btn" onclick="CMD.toggleCardWeeklyAdd('${esc(p.id)}')" title="Add weekly task">+</button>
        </div>
        <div class="card-weekly-list" id="cw-list-${esc(p.id)}">${listHtml}</div>
        <div class="card-weekly-add-row" id="cw-add-${esc(p.id)}" style="display:none;">
          <input type="text" class="add-action-input" id="cw-input-${esc(p.id)}" placeholder="Weekly task…" onkeydown="if(event.key==='Enter') CMD.addCardWeeklyTask('${esc(p.id)}')"/>
          <button class="add-action-btn" onclick="CMD.addCardWeeklyTask('${esc(p.id)}')">+ Add</button>
        </div>
      </div>`;
  }

  function refreshCardWeekly(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    const card = document.getElementById('card-' + projectId);
    const old = card && card.querySelector('.card-weekly');
    if (project && old) old.outerHTML = renderCardWeeklySection(project);
  }

  function toggleCardWeeklyAdd(projectId, forceClose) {
    const row = document.getElementById('cw-add-' + projectId);
    if (!row) return;
    const isOpen = row.style.display !== 'none';
    if (forceClose) { row.style.display = 'none'; return; }
    row.style.display = isOpen ? 'none' : '';
    if (!isOpen) { const inp = document.getElementById('cw-input-' + projectId); if (inp) inp.focus(); }
  }

  async function addCardWeeklyTask(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    const input = document.getElementById('cw-input-' + projectId);
    const body = ((input && input.value) || '').trim();
    if (!body || !project) return;
    setStatus('saving');
    try {
      const rows = await api('weekly_tasks', '', 'POST', { body, tag: project.name, sort: weeklyTasks.length });
      setStatus('saved');
      input.value = '';
      if (rows[0]) weeklyTasks.push(rows[0]);
      toggleCardWeeklyAdd(projectId, true);
      refreshCardWeekly(projectId);
      renderStats();
      toast('Weekly task added');
    } catch (e) { setStatus('error'); toast('Could not add task', true); }
  }

  // ── Cleanup panel: weekly tasks without a matching project ──
  function orphanWeeklyTasks() {
    const names = new Set(allProjects.map(p => p.name));
    return weeklyTasks.filter(t => !t.tag || !names.has(t.tag));
  }

  function renderCleanupPanel() {
    const orphans = orphanWeeklyTasks();
    const panel = document.getElementById('cleanup-panel');
    if (!orphans.length) { panel.style.display = 'none'; panel.innerHTML = ''; return; }
    panel.style.display = '';
    const projectOptions = allProjects.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('');
    panel.innerHTML = `
      <div class="cleanup-head">⚠ Weekly tasks needing a project (${orphans.length})</div>
      <div class="cleanup-list">
        ${orphans.map(t => `
          <div class="cleanup-item" id="cleanup-${t.id}">
            <span class="cleanup-body">${esc(t.body)}</span>
            <select class="cleanup-select" id="cleanup-select-${t.id}">
              <option value="">Assign to…</option>
              ${projectOptions}
            </select>
            <button class="btn" onclick="CMD.assignWeeklyTask(${t.id})">Assign</button>
            <button class="cleanup-remove" onclick="CMD.removeWeeklyTask(${t.id})" title="Delete">×</button>
          </div>`).join('')}
      </div>`;
  }

  async function assignWeeklyTask(taskId) {
    const sel = document.getElementById('cleanup-select-' + taskId);
    const tag = sel && sel.value;
    if (!tag) return;
    setStatus('saving');
    try {
      await api('weekly_tasks', '?id=eq.' + taskId, 'PATCH', { tag });
      setStatus('saved');
      const t = weeklyTasks.find(w => w.id === taskId);
      if (t) t.tag = tag;
      renderCleanupPanel();
      renderProjectGrids();
      toast('Assigned to ' + tag);
    } catch (e) { setStatus('error'); toast('Could not assign', true); }
  }

  // ── Toggle action done ──
  async function toggleAction(id, done, projectId, fromFocus) {
    setStatus('saving');
    try {
      await api('pm_actions', '?id=eq.' + id, 'PATCH', { done, done_at: done ? new Date().toISOString() : null });
      setStatus('saved');
      if (done) {
        openActions = openActions.filter(a => a.id !== id);
        doneCounts[projectId] = (doneCounts[projectId] || 0) + 1;
        doneToday++;
        const item = document.getElementById('action-' + id);
        if (item) { item.style.opacity = '0'; item.style.transition = 'opacity .3s'; setTimeout(() => item.remove(), 320); }
        const fi = document.getElementById('focus-item-' + id);
        if (fi) { fi.style.opacity = '0'; fi.style.transition = 'opacity .3s'; setTimeout(() => { fi.remove(); renderFocusPanel(); }, 320); }
        delete doneCache[projectId];
        renderStats();
        renderWeekPanel();
        setTimeout(() => updateDoneBtn(projectId), 350);
      } else {
        await renderAll();
      }
    } catch (e) { setStatus('error'); toast('Save failed', true); }
  }

  function updateDoneBtn(projectId) {
    const btn = document.getElementById('done-btn-' + projectId);
    if (btn) {
      const count = doneCounts[projectId] || 0;
      if (count > 0) {
        const arrow = btn.querySelector('.done-arrow');
        const arrowHtml = arrow ? arrow.outerHTML : '<em class="done-arrow">↓</em>';
        btn.innerHTML = arrowHtml + ' ' + count + ' completed';
        btn.closest('.done-row').style.display = '';
      }
    }
  }

  // ── Add action ──
  async function addAction(projectId) {
    const input = document.getElementById('new-action-' + projectId);
    const body = (input?.value || '').trim();
    if (!body) return;
    setStatus('saving');
    try {
      const rows = await api('pm_actions', '', 'POST', { project_id: projectId, body, sort: 99, flagged: false });
      setStatus('saved');
      input.value = '';
      if (rows[0]) {
        openActions.push(rows[0]);
        rerenderProjectActions(projectId);
        renderStats();
        renderFocusPanel();
        renderWeekPanel();
      }
    } catch (e) { setStatus('error'); toast('Could not add action', true); }
  }

  // ── Toggle flag (⚡ priority) ──
  async function toggleFlag(id, current, projectId) {
    const newVal = !current;
    setStatus('saving');
    try {
      await api('pm_actions', '?id=eq.' + id, 'PATCH', { flagged: newVal });
      setStatus('saved');
      const action = openActions.find(a => a.id === id);
      if (action) action.flagged = newVal;
      rerenderProjectActions(projectId);
      renderFocusPanel();
    } catch (e) { setStatus('error'); toast('Could not update priority', true); }
  }

  // ── Cycle status ──
  async function cycleStatus(projectId, current) {
    const cycle = { active:'upcoming', upcoming:'complete', complete:'active', recurring:'active' };
    const next = cycle[current] || 'active';
    setStatus('saving');
    try {
      await api('pm_projects', '?id=eq.' + projectId, 'PATCH', { status: next });
      setStatus('saved');
      toast('Status → ' + next);
      await renderAll();
    } catch (e) { setStatus('error'); toast('Update failed', true); }
  }

  // ── Done section (per card) ──
  async function toggleDoneSection(projectId) {
    const section = document.getElementById('done-section-' + projectId);
    const btn = document.getElementById('done-btn-' + projectId);
    if (!section) return;
    const isOpen = section.classList.contains('open');
    if (isOpen) {
      section.classList.remove('open');
      if (btn) btn.classList.remove('open');
      const arrow = btn?.querySelector('.done-arrow');
      if (arrow) arrow.style.transform = '';
    } else {
      section.classList.add('open');
      if (btn) btn.classList.add('open');
      await loadDoneActions(projectId);
    }
  }

  async function loadDoneActions(projectId) {
    const loading = document.getElementById('done-loading-' + projectId);
    const list    = document.getElementById('done-list-' + projectId);
    if (!list) return;
    if (doneCache[projectId]) { renderDoneList(doneCache[projectId], list, loading); return; }
    try {
      const rows = await api('pm_actions', '?project_id=eq.' + projectId + '&done=eq.true&order=done_at.desc&limit=20');
      doneCache[projectId] = rows;
      renderDoneList(rows, list, loading);
    } catch (e) {
      if (loading) loading.textContent = 'Could not load.';
    }
  }

  function renderDoneList(rows, list, loading) {
    if (loading) loading.style.display = 'none';
    if (!list) return;
    if (rows.length === 0) {
      list.style.display = '';
      list.innerHTML = '<li style="padding:4px 6px;font-size:12px;color:var(--muted);">Nothing completed yet.</li>';
      return;
    }
    list.innerHTML = rows.map(a => `
      <li class="done-action-item">
        <span class="done-action-check">✓</span>
        <span class="done-action-body">${esc(a.body)}</span>
        ${a.done_at ? `<span class="done-action-date">${formatDate(a.done_at)}</span>` : ''}
      </li>`).join('');
    list.style.display = '';
  }

  // ── Inline action editing ──
  let _editOriginal = {};
  function startEdit(id, projectId) {
    const item = document.getElementById('action-' + id);
    if (!item) return;
    const body = item.querySelector('.action-body');
    if (!body || body.contentEditable === 'true') return;
    _editOriginal[id] = body.textContent;
    body.contentEditable = 'true';
    body.focus();
    const range = document.createRange();
    range.selectNodeContents(body);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    body.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); body.blur(); }
      if (e.key === 'Escape') { body.textContent = _editOriginal[id]; body.blur(); delete _editOriginal[id]; }
    }, { once: false, capture: false });
    body._keyListener = true;

    body.addEventListener('blur', async function onBlur() {
      if (body.contentEditable !== 'true') return;
      body.contentEditable = 'false';
      const newText = body.textContent.trim();
      if (!newText || newText === _editOriginal[id]) {
        body.textContent = _editOriginal[id] || newText;
        delete _editOriginal[id];
        return;
      }
      setStatus('saving');
      try {
        await api('pm_actions', '?id=eq.' + id, 'PATCH', { body: newText });
        setStatus('saved');
        const action = openActions.find(a => a.id === id);
        if (action) action.body = newText;
        delete _editOriginal[id];
        renderFocusPanel();
      } catch (err) {
        setStatus('error');
        body.textContent = _editOriginal[id];
        toast('Could not save edit', true);
        delete _editOriginal[id];
      }
    }, { once: true });
  }

  // ── Archive toggle ──
  function toggleArchive() {
    archiveOpen = !archiveOpen;
    const grid = document.getElementById('archive-grid');
    const toggle = document.getElementById('archive-toggle');
    const complete = allProjects.filter(p => p.status === 'complete');
    if (archiveOpen) {
      grid.innerHTML = complete.map(p => renderCard(p, true)).join('');
      grid.style.display = '';
      toggle.classList.add('open');
    } else {
      grid.style.display = 'none';
      toggle.classList.remove('open');
    }
  }

  // ── New project modal ──
  function openModal() {
    document.getElementById('modal-overlay').classList.add('open');
    document.getElementById('np-name').focus();
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    document.getElementById('modal-err').style.display = 'none';
    ['np-name','np-category','np-desc','np-notes','np-deadline','np-deadline-label'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('np-status').value = 'active';
  }

  function handleModalClick(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  }

  async function submitNewProject() {
    const name = document.getElementById('np-name').value.trim();
    const errEl = document.getElementById('modal-err');
    if (!name) { errEl.textContent = 'Project name is required.'; errEl.style.display = ''; return; }
    errEl.style.display = 'none';

    const maxPriority = allProjects.reduce((m, p) => Math.max(m, p.priority || 0), 0);
    const id = slugify(name) + '-' + Date.now().toString(36);
    const payload = {
      id,
      name,
      category: document.getElementById('np-category').value.trim() || null,
      status: document.getElementById('np-status').value,
      description: document.getElementById('np-desc').value.trim() || null,
      deadline: document.getElementById('np-deadline').value || null,
      deadline_label: document.getElementById('np-deadline-label').value.trim() || null,
      notes: document.getElementById('np-notes').value.trim() || null,
      priority: maxPriority + 1,
      sort: maxPriority + 1
    };

    setStatus('saving');
    try {
      await api('pm_projects', '', 'POST', payload);
      setStatus('saved');
      toast('Project created');
      closeModal();
      await renderAll();
    } catch (e) {
      setStatus('error');
      errEl.textContent = 'Could not create project: ' + e.message;
      errEl.style.display = '';
    }
  }

  // ── Weekly Tasks (toggle/remove; per-project rendering is above) ──

  async function toggleWeeklyTask(taskId, done, projectId) {
    const ws = getWeekStart();
    setStatus('saving');
    try {
      if (done) {
        const rows = await api('weekly_completions', '', 'POST', { task_id: taskId, week_start: ws });
        if (rows[0]) weeklyCompletions[taskId] = rows[0].id;
      } else {
        const compId = weeklyCompletions[taskId];
        if (compId) {
          await api('weekly_completions', '?id=eq.' + compId, 'DELETE');
          delete weeklyCompletions[taskId];
        }
      }
      setStatus('saved');
      renderStats();
      renderWeekPanel();
      if (projectId) refreshCardWeekly(projectId);
    } catch(e) { setStatus('error'); toast('Could not update task', true); }
  }

  async function removeWeeklyTask(taskId) {
    if (!confirm('Remove this recurring task? It won\'t appear in future weeks.')) return;
    const t = weeklyTasks.find(w => w.id === taskId);
    const tag = t ? t.tag : null;
    setStatus('saving');
    try {
      await api('weekly_tasks', '?id=eq.' + taskId, 'PATCH', { active: false });
      setStatus('saved');
      weeklyTasks = weeklyTasks.filter(w => w.id !== taskId);
      delete weeklyCompletions[taskId];
      renderStats();
      renderCleanupPanel();
      const project = allProjects.find(p => p.name === tag);
      if (project) refreshCardWeekly(project.id);
    } catch(e) { setStatus('error'); toast('Could not remove task', true); }
  }

  // keyboard shortcut: Escape closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); }
  });

/* ---- module template (ported dashboard body, gate/topbar removed) ---- */
const CMD_TEMPLATE = `<div class="cmd-topbar">
  <div><span class="topbar-date" id="topbar-date"></span></div>
  <div style="display:flex;gap:10px;align-items:center;">
    <span class="save-status" id="save-status"><span class="dot"></span> Live</span>
    <button class="btn accent" onclick="CMD.openModal()" id="new-project-btn">+ New Project</button>
  </div>
</div>
<div class="page" id="main-page">
  <div id="alert-container"></div>
  <div class="cleanup-panel" id="cleanup-panel" style="display:none;"></div>

  <!-- Stats -->
  <div class="stats-strip" id="stats-strip">
    <div class="stats-left" id="stats-left"></div>
    <button class="btn" onclick="CMD.renderAll()" title="Refresh data" style="flex-shrink:0;">↻ Refresh</button>
  </div>

    <!-- Projects -->
    <div class="projects-col">

      <!-- Filter bar -->
      <div class="filter-bar" id="filter-bar"></div>

      <!-- Today's Focus -->
      <div class="focus-panel" id="focus-panel" style="display:none;">
        <div class="focus-panel-head">
          <div class="focus-panel-title">
            Today's Focus
            <span class="focus-count" id="focus-count">0</span>
          </div>
          <button class="focus-collapse" id="focus-collapse-btn" onclick="CMD.toggleFocusPanel()">Collapse ↑</button>
        </div>
        <div id="focus-body">
          <div class="focus-list" id="focus-list"></div>
        </div>
      </div>

      <!-- This Week (cross-project) -->
      <div class="week-panel" id="week-panel" style="display:none;">
        <div class="week-panel-head">
          <div class="week-panel-title">
            This Week
            <span class="week-count" id="week-count">0</span>
          </div>
          <button class="focus-collapse" id="week-collapse-btn" onclick="CMD.toggleWeekPanel()">Collapse ↑</button>
        </div>
        <div class="week-body" id="week-body"></div>
      </div>

      <!-- Active projects -->
      <div class="section-label" id="active-label">Active Projects</div>
      <div class="project-grid" id="active-grid"></div>

      <!-- Upcoming projects -->
      <div class="section-label" id="upcoming-label" style="display:none;">On the Horizon</div>
      <div class="project-grid" id="upcoming-grid"></div>

      <!-- Completed projects -->
      <div id="archive-section" style="display:none;">
        <div class="archive-toggle" id="archive-toggle" onclick="CMD.toggleArchive()">
          <em class="archive-toggle-arrow">▶</em>
          <span class="archive-toggle-label" id="archive-toggle-label">Completed</span>
          <div class="archive-line"></div>
        </div>
        <div class="project-grid" id="archive-grid" style="display:none;"></div>
      </div>

    </div><!-- /projects-col -->

  <div class="footer">
    <span>Live · Supabase</span>
    <span>Update via Claude: /updateproject · or edit directly here</span>
  </div>
</div>

<!-- Add Project Modal -->
<div class="modal-overlay" id="modal-overlay" onclick="CMD.handleModalClick(event)">
  <div class="modal-box">
    <div class="modal-title">New Project</div>
    <div class="modal-row">
      <label class="form-label">Project Name *</label>
      <input type="text" class="form-input" id="np-name" placeholder="e.g. Here & Now"/>
    </div>
    <div class="modal-row">
      <label class="form-label">Category</label>
      <input type="text" class="form-input" id="np-category" placeholder="e.g. Production, Academic, Personal…" list="cat-list"/>
      <datalist id="cat-list"></datalist>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" class="modal-row">
      <div>
        <label class="form-label">Status</label>
        <select class="form-input form-select" id="np-status">
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="recurring">Recurring</option>
        </select>
      </div>
      <div>
        <label class="form-label">Deadline (optional)</label>
        <input type="date" class="form-input" id="np-deadline"/>
      </div>
    </div>
    <div class="modal-row">
      <label class="form-label">Deadline Label (optional)</label>
      <input type="text" class="form-input" id="np-deadline-label" placeholder="e.g. St. Kilda Film Festival"/>
    </div>
    <div class="modal-row">
      <label class="form-label">Description</label>
      <textarea class="form-input form-textarea" id="np-desc" placeholder="Brief overview of this project…"></textarea>
    </div>
    <div class="modal-row">
      <label class="form-label">Notes</label>
      <textarea class="form-input form-textarea" id="np-notes" placeholder="Anything to keep in mind…" style="min-height:56px;"></textarea>
    </div>
    <div class="modal-foot">
      <button class="btn" onclick="CMD.closeModal()">Cancel</button>
      <button class="btn solid" onclick="CMD.submitNewProject()">Create Project</button>
    </div>
    <div id="modal-err" style="color:var(--rust);font-size:12px;margin-top:12px;display:none;"></div>
  </div>
</div>

`;

window.CMD = { addAction, addCardWeeklyTask, assignWeeklyTask, closeModal, cycleStatus, handleModalClick, openDuePicker, openModal, removeWeeklyTask, renderAll, setDue, setFilter, startEdit, submitNewProject, toggleAction, toggleArchive, toggleBlock, toggleCardWeeklyAdd, toggleDoneSection, toggleFlag, toggleFocusPanel, togglePin, toggleWeekPanel, toggleWeeklyTask };

window.CommandModule = {
  async render(view) {
    view.innerHTML = '<div class="cmd-root">' + CMD_TEMPLATE + '</div>';
    try { await init(); } catch (e) { toast('Command load failed: ' + e.message, true); }
  },
  async renderTax(view) {
    view.innerHTML = '<div class="cmd-root"><div class="page" id="tax-page"></div></div>';
    if (window.Tax) { try { await window.Tax.init(); } catch (e) { toast('Tax load failed: ' + e.message, true); } }
    else { document.getElementById('tax-page').innerHTML = '<div class="tx-page"><p>tax.js not loaded.</p></div>'; }
  }
};
})();
