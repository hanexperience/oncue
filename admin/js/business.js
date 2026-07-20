/* ============================================================
   BUSINESS MODULE — Beets & Co client records, monthly reports
   (snapshots) and lead generation. Ported from admin-portal-work.html.
   Needs an ADMIN key (the clients table is RLS-locked to the anon
   key by design — it stores client portal access codes). The key is
   asked for once per session and kept in sessionStorage only.
   Exposes window.BusinessModule + window.BIZ (inline handlers).
   ============================================================ */
(function () {
'use strict';

const SUPABASE_URL = 'https://rrxveifshucpinajtkgf.supabase.co';
const CLIENT_PORTAL_BASE = 'Client_Portal.html';
const N8N_WEBHOOK_URL = localStorage.getItem('bc_n8n_url') || 'http://localhost:5678/webhook/lead-scraper-ondemand';
const N8N_OUTREACH_URL = 'http://localhost:5678/webhook/lead-outreach-send'; // kept for reference
  const SUPABASE_URL_LEADS = 'https://rrxveifshucpinajtkgf.supabase.co'; // same project as scraped_leads
let WEBHOOK_KEY = "asdfghjklasdfghjklas"; // ⚠️ replace with your real webhook secret from the n8n Header Auth credential
let appView = 'clients';
let allLeads = [];
let KEY = null; // gets overwritten by DEFAULT_GATE_KEY below once that's declared
let currentClientId = null;
let clientCache = {};
let activeTab = 'details';
let viewPeriod = null; // {year,month} of the retainer month being viewed; null = All months
let allClients = [];

// Renamed from the broken `gate-key` variable — used to auto-fill/auto-unlock the gate.


// ── DEMO MODE: forced off — this copy is local-only and always hits real Supabase ──
const DEMO = false;

// ── Key gate ──




  // ── REST wrapper ──
  async function db(table, method, body, query) {
    if (DEMO) return demoDb(table, method, body, query);
    const opt = { method: method || 'GET', headers: {
      'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
      'Prefer': 'return=representation' } };
    if (body) opt.body = JSON.stringify(body);
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + table + (query || ''), opt);
    if (!res.ok) { const e = await res.json().catch(function(){return {};}); throw new Error(e.message || ('HTTP ' + res.status)); }
    if (method === 'DELETE') return true;
    return res.json();
  }

  // ── Save-status indicator ──
  let _saveTimer = null;
  function setStatus(state) {
    const el = document.getElementById('save-status');
    clearTimeout(_saveTimer);
    if (state === 'saving') { el.className = 'save-status saving'; el.innerHTML = '<span class="dot"></span> Saving…'; }
    else if (state === 'saved') {
      const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      el.className = 'save-status saved'; el.innerHTML = '<span class="dot"></span> Saved ' + t;
      _saveTimer = setTimeout(function () { el.className = 'save-status'; el.innerHTML = '<span class="dot"></span> All changes saved'; }, 3500);
    } else if (state === 'error') { el.className = 'save-status error'; el.innerHTML = '<span class="dot"></span> Save failed'; }
  }

  function toast(msg, isErr) { if (window.toast) window.toast(msg, isErr); }
  function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── Field labels ──
  const FIELD_LABELS = {
    name:'Client Name', slug:'Client Slug (for history)', access_code:'Access Code (Login)', project_title:'Project Title',
    project_started:'Project Started (sub-line)', project_subtitle:'Project Subtitle', pm_name:'Project Manager',
    status_badge:'Status Badge', last_updated:'Last Updated (DD Mon YYYY)', setup_badge:'Setup Badge',
    retainer_badge:'Retainer Badge', package_name:'Package Name', package_sub:'Package Sub-line',
    cal_label:'Calendar Label (e.g. June 2026)', cal_year:'Calendar Year', cal_month:'Calendar Month (1–12)',
    recap_month:'Recap Month', contract_start:'Contract Start Date',
    focus_label:'Monthly Focus (e.g. Trust: proof-of-process)'
  };

  // ── Select options for nested tables ──
  const SELECT_OPTS = {
    phase_status: [['done','Complete'],['active','In Progress'],['pending','Upcoming']],
    owner: [['oncue','Beets & Co'],['client','Client'],['waiting','Waiting']],
    post_status: [['draft','Drafting'],['approval','Needs Approval'],['scheduled','Scheduled'],['published','Published']],
    gap_type: [['visibility','Visibility'],['trust','Trust'],['conversion','Conversion']],
    gap_status: [['open','Queued'],['active','Active'],['closed','Closed']],
    pillar: [['','— None —'],['visibility','Visibility'],['trust','Trust'],['conversion','Conversion']]
  };
  const NESTED = {
    quotas: { title:'Quotas', order:'sort', cols:[['label','Label','text'],['used','Used','number','tiny'],['total','Total','number','tiny']] },
    phases: { title:'Phases', order:'sort', cols:[['num','Phase #','text','narrow'],['name','Name','text'],['status','Status','select:phase_status','narrow']] },
    next_steps: { title:'Next Steps', order:'sort', cols:[['body','Step','text'],['owner','Owner','select:owner','narrow']] },
    deliverables: { title:'Deliverables', order:'sort', cols:[['icon','Icon','text','tiny'],['name','Name','text'],['status','Status','text','narrow'],['link','Link','text']] },
    gaps: { title:'Gap Register', order:'sort', cols:[['gap','Gap','text'],['type','Type','select:gap_type','narrow'],['status','Status','select:gap_status','narrow'],['notes','Notes','text']] },
    posts: { title:'Content Pipeline', order:'post_date', cols:[['post_date','Date','date','narrow'],['channel','Channel','text','narrow'],['title','Title','text'],['pillar','Pillar','select:pillar','narrow'],['content_url','Content URL','text'],['status','Status','select:post_status','narrow'],['in_pipeline','Pipeline?','checkbox','tiny'],['script','Teleprompter Script','text']] },
    decisions_log: { title:'Decisions Log', order:'sort', cols:[['decision_date','Date','text','narrow'],['body','Decision','text']] }
  };

  // ── Tabs ── (distribute the giant form into clean sections)
  const TABS = [
    { id:'details', label:'Details', fields:['name','slug','access_code','project_title','project_started','project_subtitle','pm_name','status_badge','setup_badge','retainer_badge','last_updated','contract_start'], nested:[] },
    { id:'package', label:'Package', fields:['package_name','package_sub'], nested:['quotas'] },
    { id:'phases', label:'Phases & Steps', fields:[], nested:['phases','next_steps'] },
    { id:'deliverables', label:'Deliverables', fields:[], nested:['deliverables','decisions_log'] },
    { id:'planning', label:'Planning', fields:['focus_label'], textarea:'focus_notes', textareaLabel:'The Why (1\u20132 sentences on why this is the focus)', nested:['gaps'] },
    { id:'content', label:'Content', fields:['cal_label','cal_year','cal_month'], nested:['posts'] },
    { id:'calendar', label:'Calendar', fields:[], nested:[] },
    { id:'performance', label:'Performance', fields:[], nested:[] },
    { id:'recap', label:'Recap', fields:['recap_month'], textarea:'recap_body', textareaLabel:'Monthly Recap (blank line separates paragraphs)', nested:[] },
    { id:'history', label:'History', fields:[], nested:[] }
  ];
  const ALL_FIELDS = ['name','slug','access_code','project_title','project_started','project_subtitle','pm_name','status_badge','setup_badge','retainer_badge','last_updated','package_name','package_sub','cal_label','cal_year','cal_month','recap_month','contract_start','focus_label'];

  // ── Sidebar ──
  async function loadClients() {
    try {
      allClients = await db('clients', 'GET', null, '?select=id,name,access_code&order=name.asc');
      renderClientList(document.getElementById('client-search').value);
    } catch (err) { toast('Failed to load clients', true); }
  }
  function renderClientList(filter) {
    const list = document.getElementById('client-list');
    const q = (filter || '').toLowerCase();
    const rows = allClients.filter(function (c) {
      return !q || (c.name || '').toLowerCase().indexOf(q) > -1 || (c.access_code || '').toLowerCase().indexOf(q) > -1;
    });
    if (!rows.length) { list.innerHTML = '<li class="client-empty">No clients match</li>'; return; }
    list.innerHTML = '';
    rows.forEach(function (c) {
      const li = document.createElement('li');
      li.className = 'client-item' + (c.id === currentClientId ? ' active' : '');
      li.innerHTML = '<div class="client-item-name">' + esc(c.name) + '</div><div class="client-item-code">Code: ' + esc(c.access_code) + '</div>';
      li.onclick = function () { selectClient(c.id); };
      list.appendChild(li);
    });
  }
  function filterClients(v) { renderClientList(v); }

  // ── Select client ──
  async function selectClient(id) {
    currentClientId = id;
    activeTab = 'details';
    document.querySelector('.editor-empty').style.display = 'none';
    document.getElementById('client-form').style.display = 'block';
    try {
      const rows = await db('clients', 'GET', null, '?id=eq.' + id);
      clientCache = rows[0] || {};
      // Default the month lens to the client's current retainer period.
      viewPeriod = clientCache.contract_start ? currentContractPeriod(clientCache.contract_start) : null;
      renderClientShell();
      renderClientList(document.getElementById('client-search').value);
      await renderTab();
    } catch (err) { toast('Error loading client', true); }
  }

  function renderClientShell() {
    const c = clientCache;
    let h = '<div class="client-head"><div class="client-head-top"><div>';
    h += '<h1>' + esc(c.name || 'Untitled client') + '</h1>';
    h += '<div class="code">Access code: ' + esc(c.access_code || '—') + '</div></div>';
    h += '<div class="client-head-actions">';
    // Month lens — filters content, deliverables, planning & decisions by retainer month.
    if (c.contract_start) {
      var _idx = currentPeriodIndex(c.contract_start);
      var _periods = contractPeriods(c.contract_start, _idx + 2) || [];
      h += '<div style="display:flex;align-items:center;gap:8px;margin-right:6px;">';
      h += '<span style="font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);">Viewing month</span>';
      h += '<select id="month-lens" onchange="BIZ.setViewPeriod(this.value)" style="padding:7px 10px;border-radius:8px;border:1px solid var(--line,#ddd);background:var(--paper,#fff);font:inherit;font-size:13px;">';
      _periods.forEach(function (p, i) {
        var val = p.year + '-' + p.month;
        var sel = (viewPeriod && viewPeriod.year === p.year && viewPeriod.month === p.month) ? ' selected' : '';
        h += '<option value="' + val + '"' + sel + '>' + esc(p.label) + (i === _idx ? ' · current' : '') + '</option>';
      });
      h += '<option value="all"' + (viewPeriod ? '' : ' selected') + '>All months</option>';
      h += '</select></div>';
    }
    h += '<button class="btn" onclick="BIZ.copyLink()">Copy login link</button>';
    h += '<a class="btn solid" id="preview-btn" target="_blank" rel="noopener">Preview as client →</a>';
    h += '</div></div>';
    h += '<div class="tabs" id="tabs">';
    TABS.forEach(function (t) {
      h += '<button class="tab' + (t.id === activeTab ? ' active' : '') + '" data-tab="' + t.id + '" onclick="BIZ.switchTab(\'' + t.id + '\')">' + t.label + '<span class="tab-count" data-tabcount="' + t.id + '"></span></button>';
    });
    h += '</div></div>';
    h += '<div class="tab-panel" id="tab-panel"></div>';
    document.getElementById('client-form').innerHTML = h;
    updatePreviewLink();
  }

  function updatePreviewLink() {
    const btn = document.getElementById('preview-btn');
    if (!btn) return;
    const code = clientCache.access_code || '';
    btn.href = CLIENT_PORTAL_BASE + '?code=' + encodeURIComponent(code) + (DEMO ? '&demo=1' : '');
  }

  function switchTab(id) {
    activeTab = id;
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === id); });
    document.getElementById('editor-area').scrollTop = 0;
    renderTab();
  }

  async function renderTab() {
    const tab = TABS.find(function (t) { return t.id === activeTab; });
    const panel = document.getElementById('tab-panel');
    let h = '';
    const c = clientCache;

    // intro per tab
    const intros = {
      details: ['Client & Project', 'Identity, project framing, and the badges shown at the top of the client portal.'],
      package: ['Package & Quotas', 'The package banner and the monthly usage counters your client sees.'],
      phases: ['Phases & Next Steps', 'The project phase tracker and the shared to-do list.'],
      deliverables: ['Deliverables & Decisions', 'Shared files and the running log of decisions made.'],
      planning: ['Monthly Planning', 'Set this month\u2019s focus and keep the running register of gaps it should close. Do this first, before touching the content calendar.'],
      content: ['Content Calendar', 'Calendar month and every planned post in the pipeline.'],
      calendar: ['Calendar', 'A visual look at the month — the same grid your client sees in their portal, with quick navigation to plan ahead.'],
      performance: ['Performance', 'Live Instagram, Facebook & YouTube stats for posts published this period — pulled straight from Meta and YouTube.'],
      recap: ['Monthly Recap', 'The written wrap-up shown at the bottom of the portal.'],
      history: ['Monthly History', 'Close out a month to save a permanent snapshot. Clients can browse all past months in their portal.']
    };
    h += '<div class="panel-title">' + intros[tab.id][0] + '</div><div class="panel-note">' + intros[tab.id][1] + '</div>';

    // fields
    if (tab.fields.length) {
      h += '<div class="field-card"><div class="grid-2">';
      tab.fields.forEach(function (f) {
        const wide = (f === 'project_title' || f === 'project_subtitle' || f === 'project_started') ? ' span-2' : '';
        h += '<div class="form-group' + wide + '"><label class="form-label">' + FIELD_LABELS[f] + '</label>';
        var inputType = (f === 'contract_start') ? 'date' : 'text';
        h += '<input type="' + inputType + '" class="form-input" id="cf-' + f + '" value="' + esc(c[f] || '') + '" oninput="BIZ.onFieldInput(\'' + f + '\')"></div>';
      });
      h += '</div></div>';
    }
    // generic textarea (label set per-tab)
    if (tab.textarea) {
      h += '<div class="field-card"><div class="form-group"><label class="form-label">' + esc(tab.textareaLabel || 'Notes') + '</label>';
      h += '<textarea class="form-textarea" id="cf-' + tab.textarea + '" oninput="BIZ.onFieldInput(\'' + tab.textarea + '\')">' + esc(c[tab.textarea]) + '</textarea></div></div>';
    }
    // nested tables
    tab.nested.forEach(function (t) { h += '<div id="sec-' + t + '"></div>'; });

    // history tab special content
    if (tab.id === 'history') {
      h += '<div id="history-tab-content"><div style="font-family:inherit,monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted-2);padding:24px 0;">Loading…</div></div>';
    }
    // calendar tab special content
    if (tab.id === 'calendar') {
      h += '<div id="admin-cal-root"><div style="font-family:inherit,monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted-2);padding:24px 0;">Loading…</div></div>';
    }
    // performance tab special content
    if (tab.id === 'performance') {
      h += '<div id="performance-root"><div style="font-family:inherit,monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted-2);padding:24px 0;">Loading…</div></div>';
    }

    panel.innerHTML = h;
    for (const t of tab.nested) await loadNested(t);
    if (tab.id === 'history') await renderHistoryTab();
    if (tab.id === 'calendar') await renderAdminCalendar();
    if (tab.id === 'performance') await renderPerformanceTab();
  }

  // ── Calendar tab (visual, navigable — mirrors the client portal's calendar) ──
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function mixCategory(channel) {
    const c = (channel || '').toLowerCase();
    if (c.indexOf('reel') > -1) return 'Reels';
    if (c.indexOf('story') > -1) return 'Stories';
    if (c.indexOf('blog') > -1) return 'Blog';
    if (c.indexOf('gbp') > -1) return 'GBP Posts';
    return 'Static Posts';
  }
  function buildCalendarGrid(year, month, posts) {
    if (!year || !month) return '<div class="table-empty">Set a calendar year and month on the Content tab first.</div>';
    const dow = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let g = '<div class="cal-grid">';
    dow.forEach(function (d) { g += '<div class="cal-dow">' + d + '</div>'; });
    const byDay = {};
    posts.forEach(function (p) {
      if (!p.post_date) return;
      const parts = p.post_date.split('-');
      if (parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month) {
        const day = parseInt(parts[2], 10);
        (byDay[day] = byDay[day] || []).push(p);
      }
    });
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const lead = (firstWeekday + 6) % 7;
    const days = new Date(year, month, 0).getDate();
    const now = new Date();
    const isThisMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    for (let i = 0; i < lead; i++) g += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= days; d++) {
      const weekday = new Date(year, month - 1, d).getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const dayPosts = byDay[d] || [];
      const dateStr = year + '-' + String(month).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const emptyCls = (isWeekend && dayPosts.length === 0) ? ' empty' : '';
      const todayCls = (isThisMonth && now.getDate() === d) ? ' today' : '';
      g += '<div class="cal-cell' + emptyCls + todayCls + '" data-date="' + dateStr + '" onclick="BIZ.openPostModal(null,\'' + dateStr + '\')">';
      g += '<div class="cal-cell-hint">+</div>';
      g += '<div class="cal-date">' + d + '</div>';
      dayPosts.forEach(function (p) {
        g += '<div class="cal-post s-' + esc(p.status) + '" onclick="event.stopPropagation(); openPostModal(\'' + esc(p.id) + '\')">';
        g += '<span class="ct">' + esc(p.channel) + '</span>' + esc(p.title) + '</div>';
      });
      g += '</div>';
    }
    const total = lead + days;
    const trail = (7 - (total % 7)) % 7;
    for (let i = 0; i < trail; i++) g += '<div class="cal-cell empty"></div>';
    g += '</div>';
    return g;
  }

  let adminCalPosts = [];
  let adminCalViewY = null, adminCalViewM = null;

  // Real, live "today" — the calendar always defaults to this, not to whatever
  // was last saved in the client's cal_year/cal_month fields.
  function realTodayYM() {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }

  async function renderAdminCalendar() {
    const root = document.getElementById('admin-cal-root');
    if (!root) return;
    try {
      adminCalPosts = await db('posts', 'GET', null, '?client_id=eq.' + currentClientId + '&order=post_date.asc');
    } catch (e) { adminCalPosts = []; }
    const rn = realTodayYM();
    adminCalViewY = rn.y;
    adminCalViewM = rn.m;
    root.innerHTML = renderAdminCalendarHTML();
  }

  function renderAdminCalendarHTML() {
    const c = clientCache;
    const posts = adminCalPosts;
    const viewY = adminCalViewY, viewM = adminCalViewM;
    const rn = realTodayYM();
    const isCurrent = (viewY === rn.y && viewM === rn.m);
    // Only use the client's custom cal_label if it was actually set for the
    // month currently in view — otherwise fall back to the plain month name,
    // so a stale label (e.g. "June 2026") never shows up over the real month.
    const labelMatches = c.cal_label && c.cal_year === viewY && c.cal_month === viewM;
    const viewLabel = labelMatches ? c.cal_label : (MONTHS[viewM - 1] + ' ' + viewY);

    const viewPosts = posts.filter(function (p) {
      if (!p.post_date) return false;
      const parts = p.post_date.split('-');
      return parseInt(parts[0], 10) === viewY && parseInt(parts[1], 10) === viewM;
    });

    const mixOrder = ['Static Posts', 'Reels', 'Stories', 'Blog', 'GBP Posts'];
    const mix = { 'Static Posts': 0, 'Reels': 0, 'Stories': 0, 'Blog': 0, 'GBP Posts': 0 };
    viewPosts.forEach(function (p) { mix[mixCategory(p.channel)]++; });
    const pillarOrder = ['visibility', 'trust', 'conversion'];
    const pillarLabels = { visibility: 'Visibility / SEO', trust: 'Trust / Authority', conversion: 'Conversion / Leads', untagged: 'Untagged' };
    const pillarMix = { visibility: 0, trust: 0, conversion: 0, untagged: 0 };
    viewPosts.forEach(function (p) { pillarMix[p.pillar && pillarMix.hasOwnProperty(p.pillar) ? p.pillar : 'untagged']++; });

    let h = '<div class="cal-toolbar"><div class="cal-toolbar-left">';
    h += '<button class="cal-nav-btn" onclick="BIZ.adminCalNav(-1)" aria-label="Previous month">\u2190</button>';
    h += '<div class="cal-month">' + esc(viewLabel) + '</div>';
    h += '<button class="cal-nav-btn" onclick="BIZ.adminCalNav(1)" aria-label="Next month">\u2192</button>';
    if (!isCurrent) h += '<button class="cal-back-btn" onclick="BIZ.adminCalNavReset()">Back to current month</button>';
    h += '</div><div class="cal-legend">';
    h += '<div class="legend-item"><div class="legend-dot" style="background:var(--muted-2)"></div>Drafting</div>';
    h += '<div class="legend-item"><div class="legend-dot" style="background:var(--rust)"></div>Needs Approval</div>';
    h += '<div class="legend-item"><div class="legend-dot" style="background:var(--ink)"></div>Scheduled</div>';
    h += '<div class="legend-item"><div class="legend-dot" style="background:var(--green)"></div>Published</div>';
    h += '</div></div>';
    h += buildCalendarGrid(viewY, viewM, posts);

    h += '<div class="cal-sec"><div class="cal-sec-title">' + (isCurrent ? 'This' : 'That') + ' month\u2019s content mix</div><div class="mix-grid">';
    mixOrder.forEach(function (k) { h += '<div class="mix-item"><div class="mix-count">' + mix[k] + '</div><div class="mix-label">' + k + '</div></div>'; });
    h += '<div class="mix-item total"><div class="mix-count">' + viewPosts.length + '</div><div class="mix-label">Total Planned</div></div>';
    h += '</div></div>';

    h += '<div class="cal-sec"><div class="cal-sec-title">Where the effort went</div><div class="mix-grid">';
    pillarOrder.concat(pillarMix.untagged ? ['untagged'] : []).forEach(function (k) { h += '<div class="mix-item"><div class="mix-count">' + pillarMix[k] + '</div><div class="mix-label">' + pillarLabels[k] + '</div></div>'; });
    h += '</div></div>';
    return h;
  }

  function adminCalNav(delta) {
    let m = adminCalViewM + delta, y = adminCalViewY;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    adminCalViewY = y; adminCalViewM = m;
    const root = document.getElementById('admin-cal-root');
    if (root) root.innerHTML = renderAdminCalendarHTML();
  }
  function adminCalNavReset() {
    const rn = realTodayYM();
    adminCalViewY = rn.y; adminCalViewM = rn.m;
    const root = document.getElementById('admin-cal-root');
    if (root) root.innerHTML = renderAdminCalendarHTML();
  }

  // ── Post add/edit modal (opened from a calendar cell or post chip) ──
  let pmEditingId = null;
  function fillSelect(id, opts, val) {
    const el = document.getElementById(id);
    el.innerHTML = opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('');
    el.value = val || '';
  }
  function openPostModal(postId, prefillDate) {
    pmEditingId = postId || null;
    const post = postId ? adminCalPosts.find(function (p) { return String(p.id) === String(postId); }) : null;
    document.getElementById('post-modal-title').textContent = post ? 'Edit Post' : 'New Post';
    document.getElementById('pm-date').value = post ? post.post_date : (prefillDate || '');
    document.getElementById('pm-channel').value = post ? (post.channel || '') : '';
    document.getElementById('pm-title').value = post ? (post.title || '') : '';
    fillSelect('pm-pillar', SELECT_OPTS.pillar, post ? post.pillar : '');
    fillSelect('pm-status', SELECT_OPTS.post_status, post ? post.status : 'draft');
    document.getElementById('pm-url').value = post ? (post.content_url || '') : '';
    document.getElementById('pm-script').value = post ? (post.script || '') : '';
    document.getElementById('pm-pipeline').checked = post ? !!post.in_pipeline : true;
    document.getElementById('pm-delete-btn').style.display = post ? 'inline-flex' : 'none';
    document.getElementById('post-modal-overlay').style.display = 'flex';
  }
  function closePostModal() {
    document.getElementById('post-modal-overlay').style.display = 'none';
    pmEditingId = null;
  }
  async function savePostModalForm() {
    const date = document.getElementById('pm-date').value;
    if (!date) { toast('Pick a date first', true); return; }
    const payload = {
      post_date: date,
      channel: document.getElementById('pm-channel').value,
      title: document.getElementById('pm-title').value,
      pillar: document.getElementById('pm-pillar').value || null,
      status: document.getElementById('pm-status').value,
      content_url: document.getElementById('pm-url').value,
      script: document.getElementById('pm-script').value,
      in_pipeline: document.getElementById('pm-pipeline').checked
    };
    setStatus('saving');
    try {
      if (pmEditingId) await db('posts', 'PATCH', payload, '?id=eq.' + pmEditingId);
      else { payload.client_id = currentClientId; await db('posts', 'POST', payload); }
      setStatus('saved');
      closePostModal();
      toast('Post saved');
      await renderAdminCalendar();
    } catch (err) { setStatus('error'); toast('Save failed: ' + err.message, true); }
  }
  async function deletePostModalForm() {
    if (!pmEditingId) return;
    if (!confirm('Delete this post?')) return;
    setStatus('saving');
    try {
      await db('posts', 'DELETE', null, '?id=eq.' + pmEditingId);
      setStatus('saved');
      closePostModal();
      toast('Post deleted');
      await renderAdminCalendar();
    } catch (err) { setStatus('error'); toast('Delete failed', true); }
  }

  // ── Field autosave (debounced) ──
  const _fieldTimers = {};
  function onFieldInput(field) {
    clearTimeout(_fieldTimers[field]);
    _fieldTimers[field] = setTimeout(function () { saveField(field); }, 650);
  }
  async function saveField(field) {
    if (!currentClientId) return;
    const el = document.getElementById('cf-' + field);
    if (!el) return;
    let v = el.value;
    if (field === 'cal_year' || field === 'cal_month') v = v === '' ? null : parseInt(v, 10);
    const u = {}; u[field] = v;
    setStatus('saving');
    try {
      await db('clients', 'PATCH', u, '?id=eq.' + currentClientId);
      clientCache[field] = v;
      setStatus('saved');
      el.classList.remove('field-saved'); void el.offsetWidth; el.classList.add('field-saved');
      if (field === 'name' || field === 'access_code') { loadClients(); renderClientShell ? null : null; }
      if (field === 'name') { const hEl = document.querySelector('.client-head h1'); if (hEl) hEl.textContent = v || 'Untitled client'; }
      if (field === 'access_code') { const cEl = document.querySelector('.client-head .code'); if (cEl) cEl.textContent = 'Access code: ' + (v || '—'); updatePreviewLink(); }
    } catch (err) { setStatus('error'); toast('Save failed: ' + err.message, true); }
  }

  function copyLink() {
    const code = clientCache.access_code || '';
    const url = (location.origin && location.origin !== 'null' ? location.origin + '/clients/' : '') + 'crowncon.html?code=' + encodeURIComponent(code);
    navigator.clipboard.writeText(url).then(function(){ toast('Login link copied'); });
  }

  // ── Nested table render ──
  async function loadNested(table) {
    const def = NESTED[table];
    const canReorder = def.order === 'sort';
    try {
      let rows = await db(table, 'GET', null, '?client_id=eq.' + currentClientId + '&order=' + def.order + '.asc');
      rows = rows.filter(function (r) { return rowInViewPeriod(table, r); });
      const scopedByMonth = viewPeriod && PERIOD_TABLES[table];
      let h = '<div class="sec-head"><h3>' + def.title + '</h3></div>';
      h += '<div class="table-card">';
      if (!rows.length) {
        h += '<div class="table-empty">' + (scopedByMonth ? 'No rows for this month' : 'No rows yet') + '</div>';
      } else {
        h += '<table class="data-table"><thead><tr>';
        if (canReorder) h += '<th class="tiny"></th>';
        def.cols.forEach(function (col) { h += '<th>' + col[1] + '</th>'; });
        h += '<th></th></tr></thead><tbody>';
        rows.forEach(function (r, idx) {
          h += '<tr data-id="' + esc(r.id) + '">';
          if (canReorder) {
            h += '<td class="tiny"><div style="display:flex;gap:3px;">';
            h += '<button class="icon-btn" ' + (idx === 0 ? 'disabled' : '') + ' onclick="BIZ.moveRow(\'' + table + '\',\'' + r.id + '\',-1)" title="Move up">↑</button>';
            h += '<button class="icon-btn" ' + (idx === rows.length - 1 ? 'disabled' : '') + ' onclick="BIZ.moveRow(\'' + table + '\',\'' + r.id + '\',1)" title="Move down">↓</button>';
            h += '</div></td>';
          }
          def.cols.forEach(function (col) {
            const field = col[0], type = col[2], cls = col[3] ? ' class="' + col[3] + '"' : '';
            const onch = 'onchange="BIZ.updateRow(\'' + table + '\',\'' + r.id + '\',\'' + field + '\',this)"';
            h += '<td' + cls + '>';
            if (type && type.indexOf('select:') === 0) {
              const opts = SELECT_OPTS[type.split(':')[1]];
              h += '<select ' + onch + '>' + opts.map(function (o) {
                return '<option value="' + o[0] + '"' + (r[field] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
              }).join('') + '</select>';
            } else if (type === 'checkbox') {
              h += '<input type="checkbox" ' + (r[field] ? 'checked' : '') + ' ' + onch + '>';
            } else {
              h += '<input type="' + (type || 'text') + '" value="' + esc(r[field]) + '" ' + onch + '>';
            }
            h += '</td>';
          });
          h += '<td class="cell-actions"><button class="icon-btn del" onclick="BIZ.delRow(\'' + table + '\',\'' + r.id + '\')" title="Delete">×</button></td></tr>';
        });
        h += '</tbody></table>';
      }
      h += '<div class="table-foot"><button class="add-row" onclick="BIZ.addRow(\'' + table + '\')">+ Add ' + def.title.replace(/s$/, '').toLowerCase() + ' row</button></div>';
      h += '</div>';
      document.getElementById('sec-' + table).innerHTML = h;
      updateTabCounts(table, rows.length);
    } catch (err) { document.getElementById('sec-' + table).innerHTML = '<p style="color:var(--rust)">Failed: ' + esc(err.message) + '</p>'; }
  }

  function updateTabCounts(table, n) {
    // posts awaiting approval badge on Content tab
    if (table === 'posts') {
      // recompute approval count from current rows in DOM
      const sel = document.querySelectorAll('#sec-posts select');
      let approvals = 0;
      sel.forEach(function (s) { if (s.value === 'approval') approvals++; });
    }
  }

  async function updateRow(table, id, field, el) {
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (field === 'used' || field === 'total' || field === 'sort') v = v === '' ? null : parseInt(v, 10);
    const p = {}; p[field] = v;
    setStatus('saving');
    try {
      await db(table, 'PATCH', p, '?id=eq.' + id);
      setStatus('saved');
      const cell = el.closest('td');
      if (cell) { cell.classList.remove('cell-saved'); void cell.offsetWidth; cell.classList.add('cell-saved'); setTimeout(function(){ cell.classList.remove('cell-saved'); }, 1100); }
    } catch (err) { setStatus('error'); toast('Save failed', true); }
  }

  async function moveRow(table, id, dir) {
    const def = NESTED[table];
    try {
      const rows = await db(table, 'GET', null, '?client_id=eq.' + currentClientId + '&order=' + def.order + '.asc');
      const i = rows.findIndex(function (r) { return String(r.id) === String(id); });
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rows.length) return;
      const a = rows[i], b = rows[j];
      const av = (a.sort == null ? i : a.sort), bv = (b.sort == null ? j : b.sort);
      setStatus('saving');
      await db(table, 'PATCH', { sort: bv }, '?id=eq.' + a.id);
      await db(table, 'PATCH', { sort: av }, '?id=eq.' + b.id);
      setStatus('saved');
      await loadNested(table);
    } catch (err) { setStatus('error'); toast('Reorder failed', true); }
  }

  async function addRow(table) {
    const base = { client_id: currentClientId };
    // place new rows at the end for sort-ordered tables
    if (NESTED[table].order === 'sort') {
      try { const ex = await db(table, 'GET', null, '?client_id=eq.' + currentClientId + '&order=sort.asc'); base.sort = ex.length ? (Math.max.apply(null, ex.map(function(r){return r.sort||0;})) + 1) : 0; } catch (e) {}
    }
    // The retainer month a new row should belong to: the month being viewed,
    // falling back to the client's current period.
    var _tag = viewPeriod || ((clientCache && clientCache.contract_start) ? currentContractPeriod(clientCache.contract_start) : null);
    if (table === 'posts') {
      base.title = 'New post'; base.channel = 'Static · IG'; base.status = 'draft'; base.in_pipeline = true;
      var _today = new Date().toISOString().split('T')[0];
      // Date the post so it lands in the month you're viewing (today if that's the current month).
      var _todayTag = periodTagForDate(_today, clientCache && clientCache.contract_start);
      var _inView = _tag && _todayTag && _todayTag.year === _tag.year && _todayTag.month === _tag.month;
      base.post_date = (_inView || !_tag) ? _today : (periodStartISO(clientCache.contract_start, _tag) || _today);
    }
    if (table === 'phases') { base.status = 'pending'; base.name = 'New phase'; base.num = 'Phase'; }
    if (table === 'next_steps') { base.owner = 'oncue'; base.body = 'New step'; }
    if (table === 'quotas') { base.label = 'New'; base.used = 0; base.total = 0; }
    if (table === 'deliverables') { base.name = 'New deliverable'; base.icon = 'PDF'; base.status = 'Upcoming'; }
    if (table === 'decisions_log') { base.decision_date = ''; base.body = 'New decision'; }
    if (table === 'gaps') { base.gap = 'New gap'; base.type = 'visibility'; base.status = 'open'; }
    // Stamp the retainer period on month-scoped tables so the lens can filter them.
    if (_tag && PERIOD_TABLES[table] && table !== 'posts') {
      base.period_year = _tag.year; base.period_month = _tag.month;
    }
    setStatus('saving');
    try { await db(table, 'POST', base); setStatus('saved'); loadNested(table); }
    catch (err) { setStatus('error'); toast('Add failed: ' + err.message, true); }
  }

  async function delRow(table, id) {
    if (!confirm('Delete this row?')) return;
    setStatus('saving');
    try { await db(table, 'DELETE', null, '?id=eq.' + id); setStatus('saved'); loadNested(table); }
    catch (err) { setStatus('error'); toast('Delete failed', true); }
  }

  async function createNewClient() {
    const name = prompt('New client name?'); if (!name) return;
    const code = prompt('Access code for their portal login?'); if (!code) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const rows = await db('clients', 'POST', { slug: slug, name: name, access_code: code, status_badge: 'Active' });
      toast('Client created'); await loadClients(); selectClient(rows[0].id);
    } catch (err) { toast('Create failed: ' + err.message, true); }
  }

  // ── App view switch (Clients / Leads) ──
  function setAppView(view) {
    appView = view;
    var _nc = document.getElementById('nav-clients'); if (_nc) _nc.classList.toggle('active', view === 'clients');
    var _nl = document.getElementById('nav-leads'); if (_nl) _nl.classList.toggle('active', view === 'leads');
    document.querySelector('.admin-layout').style.display = (view === 'clients') ? 'flex' : 'none';
    document.getElementById('leads-layout').style.display = (view === 'leads') ? 'block' : 'none';
    if (view === 'leads' && !allLeads.length) loadLeads();
  }

  // ── Lead Generator ──
  function pollScrapeJob(jobId, statusEl) {
    const start = Date.now();
    const MAX_MS = 3 * 60 * 1000;
    const interval = setInterval(async function () {
      try {
        const res = await fetch(SUPABASE_URL_LEADS + '/rest/v1/pending_scrapes?id=eq.' + encodeURIComponent(jobId) + '&select=status,found_count', {
          headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
        });
        const rows = await res.json();
        const job = rows[0];
        if (!job) return;
        if (job.status === 'done') {
          clearInterval(interval);
          statusEl.textContent = (job.found_count || 0) + ' lead(s) found and qualified. Loading…';
          await loadLeads();
        } else if (job.status === 'error') {
          clearInterval(interval);
          statusEl.textContent = 'Scrape failed — check n8n execution logs.';
        } else if (Date.now() - start > MAX_MS) {
          clearInterval(interval);
          statusEl.textContent = 'Still running in background — hit Refresh in a moment.';
          await loadLeads();
        }
      } catch (e) { /* network blip, keep polling */ }
    }, 4000);
  }

    async function triggerScrape() {
    const category = document.getElementById('lead-category').value.trim();
    const postcode = document.getElementById('lead-postcode').value.trim();
    const statusEl = document.getElementById('lead-scrape-status');
    if (!category || !postcode) { toast('Enter a category and postcode', true); return; }
    const btn = document.getElementById('lead-scrape-btn');
    btn.disabled = true; btn.textContent = 'Scraping…';
    statusEl.textContent = 'Searching Google Maps for "' + category + '" near ' + postcode + '…';
    try {
      if (DEMO) {
        await new Promise(function (r) { setTimeout(r, 900); });
        DEMO_DB.scraped_leads.unshift({
          id: 'L' + (++_idc), place_id: 'demo-place-' + Date.now(), company_name: category + ' Demo Co', category: category,
          website: 'No Website', phone: '03 9000 0000', address: 'Demo St, VIC ' + postcode, postcode: postcode,
          created_at: new Date().toISOString(), status: 'new', site_score: null, signals: null, contact_email: null,
          draft_message: null, last_checked: null
        });
        statusEl.textContent = 'Demo mode — added 1 sample lead, no real scrape ran.';
      } else {
        const jobId = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
        const jobRes = await fetch(SUPABASE_URL_LEADS + '/rest/v1/pending_scrapes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ id: jobId, category: category, postcode: postcode, status: 'pending', created_at: new Date().toISOString() })
        });
        if (!jobRes.ok) { const t = await jobRes.text(); throw new Error('Failed to queue job: ' + t); }
        statusEl.textContent = 'Job queued — n8n will pick it up within 10 seconds. Watching for results…';
        pollScrapeJob(jobId, statusEl);
      }
      await loadLeads();
    } catch (err) {
      statusEl.textContent = '';
      toast('Scrape failed: ' + err.message, true);
    } finally {
      btn.disabled = false; btn.textContent = 'Scrape & Qualify';
    }
  }

  async function loadLeads() {
    const tbody = document.getElementById('leads-tbody');
    try {
      allLeads = DEMO ? DEMO_DB.scraped_leads.slice() : await db('scraped_leads', 'GET', null, '?select=*&order=created_at.desc&limit=200');
      renderLeadsTable();
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="11" style="color:var(--rust);">Failed to load leads: ' + esc(err.message) + '</td></tr>';
    }
  }

  function renderLeadsTable() {
    const tbody = document.getElementById('leads-tbody');
    const countEl = document.getElementById('lead-count');
    const statusFilter = document.getElementById('lead-status-filter').value;
    const search = (document.getElementById('lead-search').value || '').toLowerCase();
    const sort = document.getElementById('lead-sort').value;

    // Rebuild category dropdown from live data
    const catSelect = document.getElementById('lead-category-filter');
    const currentCat = catSelect.value;
    const cats = [...new Set(allLeads.map(function (r) { return r.category || ''; }).filter(Boolean))].sort();
    catSelect.innerHTML = '<option value="">All categories</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (c === currentCat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');

    const categoryFilter = catSelect.value;

    let rows = allLeads.slice();
    if (statusFilter === 'ignored') {
      rows = rows.filter(function (r) { return (r.status || 'new') === 'ignored'; });
    } else if (statusFilter) {
      rows = rows.filter(function (r) { return (r.status || 'new') === statusFilter; });
    } else {
      rows = rows.filter(function (r) { return (r.status || 'new') !== 'ignored'; });
    }
    if (categoryFilter) rows = rows.filter(function (r) { return (r.category || '') === categoryFilter; });
    if (search) rows = rows.filter(function (r) { return (r.company_name || '').toLowerCase().indexOf(search) > -1; });

    if (sort === 'score_desc') rows.sort(function (a, b) { return (b.site_score || 0) - (a.site_score || 0); });
    else if (sort === 'name_asc') rows.sort(function (a, b) { return (a.company_name || '').localeCompare(b.company_name || ''); });
    else rows.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });

    countEl.textContent = rows.length + ' lead' + (rows.length === 1 ? '' : 's');

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="11" style="color:var(--muted-2);font-family:\'JetBrains Mono\',monospace;font-size:10px;text-transform:uppercase;padding:18px 10px;">No leads match</td></tr>';
      return;
    }

    let h = '';
    rows.forEach(function (r) {
      const status = r.status || 'new';
      const websiteOk = r.website && r.website !== 'No Website';
      const website = websiteOk ? '<a href="' + esc(r.website) + '" target="_blank" rel="noopener">' + esc(r.website.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a>' : '<span style="color:var(--muted-2)">none</span>';
      const isChecked = selectedPlaceIds.has(r.place_id);
      h += '<tr>';
      h += '<td><input type="checkbox" class="lead-check" data-pid="' + esc(r.place_id) + '" onchange="BIZ.toggleRow(this)"' + (isChecked ? ' checked' : '') + '></td>';
      h += '<td><strong>' + esc(r.company_name) + '</strong></td>';
      h += '<td style="color:var(--muted)">' + esc(r.category || '') + '</td>';
      h += '<td>' + esc(r.postcode || '') + '</td>';
      h += '<td style="font-family:\'JetBrains Mono\',monospace;font-size:11px;">' + esc(r.phone || '') + '</td>';
      h += '<td>' + website + '</td>';
      h += '<td><span class="status-pill ' + esc(status) + '">' + esc(status.replace('_', ' ')) + '</span></td>';
      h += '<td class="score-pill">' + (r.site_score == null ? '—' : r.site_score) + '</td>';
      h += '<td>' +
        '<input class="email-inline" type="email" ' +
        'value="' + esc(r.contact_email || '') + '" ' +
        'placeholder="' + (r.contact_email ? '' : 'Add email…') + '" ' +
        'data-pid="' + esc(r.place_id) + '" ' +
        'data-orig="' + esc(r.contact_email || '') + '" ' +
        'onchange="BIZ.saveEmail(this)">' +
        '</td>';
      h += '<td style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:var(--muted);">' + (r.last_checked ? new Date(r.last_checked).toLocaleDateString() : '—') + '</td>';
      let actions = '';
      if (status === 'ignored') {
        actions += '<button class="btn" data-pid="' + esc(r.place_id) + '" onclick="BIZ.markStatus(this.dataset.pid, \'new\')">Restore</button>';
      } else if (status !== 'contacted') {
        if (r.contact_email) actions += '<button class="btn solid" data-pid="' + esc(r.place_id) + '" onclick="BIZ.sendOutreachEmail(this.dataset.pid)" style="margin-right:6px;">Send email</button>';
        actions += '<button class="btn" data-pid="' + esc(r.place_id) + '" onclick="BIZ.markContacted(this.dataset.pid)" style="margin-right:6px;">Mark contacted</button>';
        actions += '<button class="btn" data-pid="' + esc(r.place_id) + '" onclick="BIZ.markStatus(this.dataset.pid, \'ignored\')\" style="color:var(--muted);">Ignore</button>';
      }
      h += '<td class="cell-actions">' + actions + '</td>';
      h += '</tr>';
    });
    tbody.innerHTML = h;
  }

  async function sendOutreachEmail(placeId) {
    const lead = allLeads.find(function (r) { return r.place_id === placeId; });
    if (!lead) return;
    if (!confirm('Send outreach email to ' + lead.contact_email + ' (' + lead.company_name + ')?')) return;
    try {
      if (DEMO) {
        await new Promise(function (r) { setTimeout(r, 600); });
        lead.status = 'contacted';
        toast('Demo mode — no real email sent. Marked contacted.');
      } else {
        const emailJobRes = await fetch(SUPABASE_URL_LEADS + '/rest/v1/pending_emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ place_id: placeId, status: 'pending', created_at: new Date().toISOString() })
        });
        if (!emailJobRes.ok) { const t = await emailJobRes.text(); throw new Error('Failed to queue email: ' + t); }
        toast('Email queued — will send within 15 seconds. Check your BCC inbox to confirm.');
      }
      await loadLeads();
    } catch (err) { toast('Send failed: ' + err.message, true); }
  }

  async function saveEmail(input) {
    const placeId = input.dataset.pid;
    const orig = input.dataset.orig;
    const val = input.value.trim();
    if (val === orig) return;
    if (val && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
      toast('Enter a valid email address', true);
      input.value = orig;
      return;
    }
    try {
      if (DEMO) {
        const row = DEMO_DB.scraped_leads.find(function (r) { return r.place_id === placeId; });
        if (row) row.contact_email = val || null;
      } else {
        await db('scraped_leads', 'PATCH', { contact_email: val || null }, '?place_id=eq.' + encodeURIComponent(placeId));
      }
      input.dataset.orig = val;
      const lead = allLeads.find(function (r) { return r.place_id === placeId; });
      if (lead) lead.contact_email = val || null;
      toast(val ? 'Email saved' : 'Email cleared');
      renderLeadsTable();
    } catch (err) {
      toast('Save failed: ' + err.message, true);
      input.value = orig;
    }
  }

  // ── Selection state ──
  let selectedPlaceIds = new Set();

  function toggleRow(cb) {
    const pid = cb.dataset.pid;
    if (cb.checked) selectedPlaceIds.add(pid); else selectedPlaceIds.delete(pid);
    updateBatchBar();
  }

  function toggleSelectAll(cb) {
    const checks = document.querySelectorAll('#leads-tbody .lead-check');
    checks.forEach(function (c) {
      c.checked = cb.checked;
      if (cb.checked) selectedPlaceIds.add(c.dataset.pid); else selectedPlaceIds.delete(c.dataset.pid);
    });
    updateBatchBar();
    renderLeadsTable();
  }

  function updateBatchBar() {
    const n = selectedPlaceIds.size;
    document.getElementById('batch-label').textContent = n + ' selected';
    document.getElementById('batch-bar').classList.toggle('visible', n > 0);
  }

  function clearSelection() {
    selectedPlaceIds.clear();
    updateBatchBar();
    renderLeadsTable();
  }

  async function batchSendEmails() {
    const leads = allLeads.filter(function (r) {
      return selectedPlaceIds.has(r.place_id) && r.contact_email && r.status !== 'contacted' && r.status !== 'ignored';
    });
    if (!leads.length) { toast('No selected leads have a contact email', true); return; }
    const DELAY_MS = 90000;
    const totalMins = Math.ceil((leads.length * DELAY_MS) / 60000);
    if (!confirm('Send emails to ' + leads.length + ' lead(s)? They will be sent one at a time, ~90 seconds apart (~' + totalMins + ' min total). Leave this tab open.')) return;
    const progress = document.getElementById('batch-progress');
    let sent = 0, failed = 0;
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      progress.textContent = 'Sending ' + (i + 1) + ' of ' + leads.length + '…';
      try {
        if (DEMO) {
          await new Promise(function (r) { setTimeout(r, 800); });
          lead.status = 'contacted';
        } else {
          const res = await fetch(SUPABASE_URL_LEADS + '/rest/v1/pending_emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ place_id: lead.place_id, status: 'pending', created_at: new Date().toISOString() })
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
        }
        sent++;
        selectedPlaceIds.delete(lead.place_id);
        if (i < leads.length - 1) {
          let remaining = DELAY_MS / 1000;
          await new Promise(function (resolve) {
            const t = setInterval(function () {
              remaining--;
              progress.textContent = 'Sent ' + sent + ' — next in ' + remaining + 's…';
              if (remaining <= 0) { clearInterval(t); resolve(); }
            }, 1000);
          });
        }
      } catch (err) { failed++; console.error(err); }
    }
    progress.textContent = '';
    updateBatchBar();
    toast('Done — ' + sent + ' queued' + (failed ? ', ' + failed + ' failed' : ''));
    await loadLeads();
  }

  async function batchIgnore() {
    if (!selectedPlaceIds.size) return;
    if (!confirm('Mark ' + selectedPlaceIds.size + ' lead(s) as ignored?')) return;
    for (const pid of [...selectedPlaceIds]) {
      try {
        if (DEMO) {
          const row = DEMO_DB.scraped_leads.find(function (r) { return r.place_id === pid; });
          if (row) row.status = 'ignored';
        } else {
          await db('scraped_leads', 'PATCH', { status: 'ignored' }, '?place_id=eq.' + encodeURIComponent(pid));
        }
        selectedPlaceIds.delete(pid);
      } catch (e) { console.error(e); }
    }
    updateBatchBar();
    toast('Ignored');
    await loadLeads();
  }

  async function markStatus(placeId, status) {
    const labels = { contacted: 'Marked contacted', ignored: 'Ignored', new: 'Restored' };
    try {
      if (DEMO) {
        const row = DEMO_DB.scraped_leads.find(function (r) { return r.place_id === placeId; });
        if (row) row.status = status;
      } else {
        await db('scraped_leads', 'PATCH', { status: status }, '?place_id=eq.' + encodeURIComponent(placeId));
      }
      toast(labels[status] || 'Updated');
      await loadLeads();
    } catch (err) { toast('Update failed: ' + err.message, true); }
  }

  async function markContacted(placeId) { return markStatus(placeId, 'contacted'); }

  

  // ── In-memory demo backend ──────────────────────────────────────────────
  const DEMO_DB = (function () {
    const now = new Date(); const Y = now.getFullYear(), M = now.getMonth() + 1;
    const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][M - 1] + ' ' + Y;
    const iso = function (d) { return Y + '-' + String(M).padStart(2,'0') + '-' + String(d).padStart(2,'0'); };
    return {
      clients: [
        { id:'c1', slug:'crowncon', name:'CrownCon', access_code:'crown26', project_title:'CrownCon 2026 — Brand & Social Launch', project_started:'Engagement started 14 Jan 2026 · 6-month retainer', project_subtitle:'Pop-culture & gaming convention · Brisbane', pm_name:'Michael', status_badge:'Active', setup_badge:'Setup Complete', retainer_badge:'Retainer · Mo. 4', last_updated:'28 May 2026', package_name:'Growth Social', package_sub:'Managed content + community · billed monthly', cal_label: MN, cal_year:Y, cal_month:M, recap_month:MN + ' Recap', recap_body:'Reach grew 34% month-on-month, driven mostly by the two artist-reveal Reels.\n\nWe locked the visual system for the ticket-tier announcements and rolled it across both static posts and Stories.\n\nNext month we shift focus to early-bird ticket conversion and the first creator collaboration.', focus_label:'Trust: proof of vendor & artist commitments', focus_notes:'Ticket buyers are asking whether the lineup is locked. This month\u2019s content leans into confirmed bookings and behind-the-scenes prep to remove that doubt before the early-bird push.' },
        { id:'c2', slug:'harborline', name:'Harborline Café', access_code:'harbor7', project_title:'Harborline — Local Brand Refresh', project_started:'Engagement started 3 Mar 2026 · 3-month sprint', project_subtitle:'Specialty coffee & brunch · Fremantle', pm_name:'Michael', status_badge:'Active', setup_badge:'Onboarding', retainer_badge:'Sprint · Mo. 2', last_updated:'27 May 2026', package_name:'Local Essentials', package_sub:'Lite content + Google presence', cal_label:MN, cal_year:Y, cal_month:M, recap_month:MN + ' Recap', recap_body:'Refreshed the menu photography and launched the weekly specials format.\n\nGoogle Business profile is now fully optimised with weekly posts.', focus_label:'Visibility: local brunch search terms', focus_notes:'Near-zero presence on \u201cbrunch near me\u201d searches. Focus is GBP cadence and a blog post built around the new menu, both targeting that search intent.' }
      ],
      quotas: [
        { id:'q1', client_id:'c1', label:'Static Posts', used:8, total:12, sort:0 },
        { id:'q2', client_id:'c1', label:'Reels', used:3, total:4, sort:1 },
        { id:'q3', client_id:'c1', label:'Stories', used:14, total:20, sort:2 },
        { id:'q4', client_id:'c1', label:'Blog', used:1, total:2, sort:3 },
        { id:'q5', client_id:'c1', label:'GBP Posts', used:4, total:4, sort:4 },
        { id:'q6', client_id:'c2', label:'Static Posts', used:5, total:8, sort:0 },
        { id:'q7', client_id:'c2', label:'GBP Posts', used:4, total:4, sort:1 }
      ],
      phases: [
        { id:'ph1', client_id:'c1', num:'Phase 01', name:'Discovery & Strategy', status:'done', sort:0 },
        { id:'ph2', client_id:'c1', num:'Phase 02', name:'Brand & Visual System', status:'done', sort:1 },
        { id:'ph3', client_id:'c1', num:'Phase 03', name:'Content Production', status:'active', sort:2 },
        { id:'ph4', client_id:'c1', num:'Phase 04', name:'Launch & Ticketing Push', status:'pending', sort:3 },
        { id:'ph5', client_id:'c1', num:'Phase 05', name:'Event Coverage', status:'pending', sort:4 },
        { id:'ph6', client_id:'c2', num:'Phase 01', name:'Audit & Setup', status:'done', sort:0 },
        { id:'ph7', client_id:'c2', num:'Phase 02', name:'Content & Cadence', status:'active', sort:1 }
      ],
      next_steps: [
        { id:'n1', client_id:'c1', body:'Approve the three artist-reveal posts.', owner:'client', sort:0 },
        { id:'n2', client_id:'c1', body:'Send through early-bird ticket pricing.', owner:'client', sort:1 },
        { id:'n3', client_id:'c1', body:'Finalise the ticket-tier announcement carousel.', owner:'oncue', sort:2 },
        { id:'n4', client_id:'c1', body:'Venue photography — waiting on shoot date.', owner:'waiting', sort:3 },
        { id:'n5', client_id:'c2', body:'Approve the May specials graphics.', owner:'client', sort:0 },
        { id:'n6', client_id:'c2', body:'Schedule the June photo shoot.', owner:'oncue', sort:1 }
      ],
      deliverables: [
        { id:'d1', client_id:'c1', icon:'PDF', name:'Brand Guidelines v2', status:'', link:'#', sort:0 },
        { id:'d2', client_id:'c1', icon:'FIG', name:'Social Template Kit', status:'', link:'#', sort:1 },
        { id:'d3', client_id:'c1', icon:'DOC', name:'June Content Plan', status:'', link:'#', sort:2 },
        { id:'d4', client_id:'c1', icon:'XLS', name:'Performance Dashboard', status:'In Progress', link:'', sort:3 },
        { id:'d5', client_id:'c2', icon:'PDF', name:'Menu Photography Pack', status:'', link:'#', sort:0 }
      ],
      decisions_log: [
        { id:'dl1', client_id:'c1', decision_date:'26 May', body:'Locked the neon-on-charcoal look for ticket-tier creative.', sort:0 },
        { id:'dl2', client_id:'c1', decision_date:'19 May', body:'Approved weekly GBP posting cadence (every Tuesday).', sort:1 },
        { id:'dl3', client_id:'c1', decision_date:'12 May', body:'Moved cosplay contest reveal to early June.', sort:2 },
        { id:'dl4', client_id:'c2', decision_date:'20 May', body:'Adopted the weekly-specials post format.', sort:0 }
      ],
      gaps: [
        { id:'g1', client_id:'c1', gap:'No proof bookings are locked', type:'trust', status:'active', notes:'This month\u2019s focus', sort:0 },
        { id:'g2', client_id:'c1', gap:'Low visibility on \u201ccosplay contest brisbane\u201d', type:'visibility', status:'open', notes:'Queued for next month', sort:1 },
        { id:'g3', client_id:'c1', gap:'No clear early-bird CTA in bio/posts', type:'conversion', status:'open', notes:'', sort:2 },
        { id:'g4', client_id:'c2', gap:'No presence on \u201cbrunch near me\u201d searches', type:'visibility', status:'active', notes:'This month\u2019s focus', sort:0 },
        { id:'g5', client_id:'c2', gap:'Zero Google reviews', type:'trust', status:'open', notes:'', sort:1 }
      ],
      posts: [
        { id:'p1', client_id:'c1', post_date:iso(3),  channel:'Static · IG', title:'Countdown: 90 days to CrownCon', content_url:'#', status:'published', in_pipeline:false, pillar:'visibility' },
        { id:'p2', client_id:'c1', post_date:iso(5),  channel:'Reel · IG',   title:'Artist reveal — headliner teaser', content_url:'#', status:'published', in_pipeline:false, pillar:'trust' },
        { id:'p3', client_id:'c1', post_date:iso(10), channel:'Static · IG', title:'Ticket tiers explained — carousel', content_url:'#', status:'approval', in_pipeline:true, pillar:'conversion' },
        { id:'p4', client_id:'c1', post_date:iso(13), channel:'Reel · IG',   title:'Cosplay contest announcement', content_url:'#', status:'approval', in_pipeline:true, pillar:'visibility' },
        { id:'p5', client_id:'c1', post_date:iso(17), channel:'Static · IG', title:'Meet the panel hosts', content_url:'#', status:'approval', in_pipeline:true, pillar:'trust' },
        { id:'p6', client_id:'c1', post_date:iso(20), channel:'Story · IG',  title:'Early-bird tickets — 48hr flash', content_url:'', status:'scheduled', in_pipeline:true, pillar:'conversion' },
        { id:'p7', client_id:'c2', post_date:iso(8),  channel:'Static · IG', title:'May specials — flat white week', content_url:'', status:'approval', in_pipeline:true, pillar:'' },
        { id:'p8', client_id:'c2', post_date:iso(15), channel:'GBP',         title:'Weekly update: new brunch hours', content_url:'', status:'scheduled', in_pipeline:true, pillar:'visibility' }
      ],
      scraped_leads: [
        { id:'L1', place_id:'demo-l1', company_name:'120 Group Building and Construction', category:'Contractor', website:'http://www.120group.com.au/', phone:'1800 900 400', address:'105/210-218 Boundary Rd, Braeside VIC 3195, Australia', postcode:'3195', created_at:'2026-06-27T11:34:44Z', status:'low_priority', site_score:35, signals:{https:false,mobile_viewport:true,pagespeed_performance:0.62,footer_year:null}, contact_email:'info@120group.com.au', draft_message:null, last_checked:'2026-06-27T11:50:14Z' },
        { id:'L2', place_id:'demo-l2', company_name:'Haven Building Solutions', category:'Contractor', website:'http://www.havenbuild.com.au/', phone:'0402 851 678', address:'18 Long St, Mentone VIC 3194, Australia', postcode:'3195', created_at:'2026-06-27T11:34:44Z', status:'qualified', site_score:60, signals:{https:false,mobile_viewport:false,pagespeed_performance:0.31,footer_year:2021}, contact_email:null, draft_message:null, last_checked:'2026-06-27T11:51:18Z' },
        { id:'L3', place_id:'demo-l3', company_name:'Riverside Electrical', category:'Electrician', website:'No Website', phone:'0411 222 333', address:'4 River St, Mordialloc VIC 3195, Australia', postcode:'3195', created_at:'2026-06-27T09:10:00Z', status:'qualified', site_score:100, signals:{no_website:true}, contact_email:null, draft_message:null, last_checked:'2026-06-27T09:10:30Z' },
        { id:'L4', place_id:'demo-l4', company_name:'Bayview Renovations', category:'Contractor', website:'https://bayviewrenovations.com.au/', phone:'1300 222 775', address:'21/238 Governor Rd, Braeside VIC 3195, Australia', postcode:'3195', created_at:'2026-06-27T11:34:44Z', status:'low_priority', site_score:10, signals:{https:true,mobile_viewport:true,pagespeed_performance:0.88,footer_year:2026}, contact_email:null, draft_message:null, last_checked:'2026-06-27T11:51:31Z' }
      ]
    };
  })();

  let _idc = 1000;
  // ── History tab ───────────────────────────────────────────────────────────
  var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Contract period helpers ──
  function contractPeriods(startDateStr, count) {
    // Returns array of {label, year, month} for `count` periods from contract_start
    if (!startDateStr) return null;
    var parts = startDateStr.split('-');
    var startY = parseInt(parts[0], 10), startM = parseInt(parts[1], 10) - 1, startD = parseInt(parts[2], 10);
    var periods = [];
    for (var i = 0; i < count; i++) {
      var pStartY = startY, pStartM = startM + i, pStartD = startD;
      // normalise month overflow
      pStartY += Math.floor(pStartM / 12);
      pStartM = ((pStartM % 12) + 12) % 12;
      var pEndDate = new Date(pStartY, pStartM + 1, pStartD - 1 < 1 ? 0 : pStartD - 1);
      // if day-1 crossed month boundary, adjust
      var pEnd = new Date(pStartY, pStartM, pStartD);
      pEnd.setMonth(pEnd.getMonth() + 1);
      pEnd.setDate(pEnd.getDate() - 1);
      var pStart = new Date(pStartY, pStartM, pStartD);
      var fmtShort = function(d) {
        return d.getDate() + ' ' + MONTH_SHORT[d.getMonth()];
      };
      var label = 'Month ' + (i + 1) + ' · ' + fmtShort(pStart) + ' – ' + fmtShort(pEnd) + ' ' + pEnd.getFullYear();
      var startISO = pStart.getFullYear() + '-' + String(pStart.getMonth() + 1).padStart(2, '0') + '-' + String(pStart.getDate()).padStart(2, '0');
      periods.push({ label: label, year: pEnd.getFullYear(), month: pEnd.getMonth() + 1, startISO: startISO });
    }
    return periods;
  }

  // ── Admin month lens ──────────────────────────────────────────────
  // Nested tables that are scoped to a retainer month.
  var PERIOD_TABLES = { decisions_log: 1, deliverables: 1, gaps: 1, posts: 1 };

  // Which retainer period (year/month of period END) a given date falls in.
  function periodTagForDate(dateStr, contractStart) {
    if (!dateStr || !contractStart) return null;
    var s = String(contractStart).split('-'), d = String(dateStr).split('-');
    var sy = +s[0], sm = +s[1] - 1, sd = +s[2];
    var dy = +d[0], dm = +d[1] - 1, dd = +d[2];
    var k = (dy - sy) * 12 + (dm - sm);
    if (dd < sd) k -= 1;
    if (k < 0) k = 0;
    var pend = new Date(sy, sm + k + 1, sd); pend.setDate(pend.getDate() - 1);
    return { year: pend.getFullYear(), month: pend.getMonth() + 1 };
  }

  // Index (0-based) of the retainer period containing today.
  function currentPeriodIndex(contractStart) {
    if (!contractStart) return 0;
    var parts = String(contractStart).split('-');
    var sy = +parts[0], sm = +parts[1] - 1, sd = +parts[2];
    var now = new Date();
    var k = (now.getFullYear() - sy) * 12 + (now.getMonth() - sm);
    if (now.getDate() < sd) k -= 1;
    return Math.max(0, k);
  }

  // Start date (ISO) of the period matching a given {year,month} tag.
  function periodStartISO(contractStart, tag) {
    if (!contractStart || !tag) return null;
    var ps = contractPeriods(contractStart, currentPeriodIndex(contractStart) + 3) || [];
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].year === tag.year && ps[i].month === tag.month) return ps[i].startISO;
    }
    return null;
  }

  // Does a fetched row belong to the month currently being viewed?
  function rowInViewPeriod(table, r) {
    if (!viewPeriod) return true;             // "All months"
    if (!PERIOD_TABLES[table]) return true;   // not a month-scoped table
    if (table === 'posts') {
      var t = periodTagForDate(r.post_date, clientCache && clientCache.contract_start);
      return !!t && t.year === viewPeriod.year && t.month === viewPeriod.month;
    }
    return r.period_year === viewPeriod.year && r.period_month === viewPeriod.month;
  }

  function setViewPeriod(val) {
    if (val === 'all') { viewPeriod = null; }
    else { var p = val.split('-'); viewPeriod = { year: +p[0], month: +p[1] }; }
    renderTab();
  }

  function currentContractPeriod(startDateStr) {
    if (!startDateStr) return null;
    var parts = startDateStr.split('-');
    var startY = parseInt(parts[0], 10), startM = parseInt(parts[1], 10) - 1, startD = parseInt(parts[2], 10);
    var now = new Date();
    // how many full months since contract start?
    var totalMonths = (now.getFullYear() - startY) * 12 + (now.getMonth() - startM);
    if (now.getDate() < startD) totalMonths -= 1;
    var periodIndex = Math.max(0, totalMonths);
    var periods = contractPeriods(startDateStr, periodIndex + 1);
    return periods ? periods[periodIndex] : null;
  }

  // ── Performance tab ──────────────────────────────────────────────────────
  // Reads public.va_post_performance — a view (latest snapshot per slot/platform,
  // joined to va_calendar_slots for client_id/slot_date/caption) that lives in the
  // same Supabase project. Built for the Ops Workspace's Instagram/Facebook/YouTube
  // publishing + stats system (social-publish / social-stats edge functions).
  // Scoped per-client via va_calendar_slots.client_id, so this is safe to reuse for
  // any future client that gets their own Ops Workspace instance.
  var PLATFORM_LABELS = { ig_feed:'IG Feed', ig_reel:'IG Reel', ig_trial_reel:'IG Trial Reel', fb_feed:'FB Feed', fb_reel:'FB Reel', yt_long:'YouTube', yt_short:'YT Short', ig_story:'IG Story', fb_story:'FB Story' };
  function platformLabel(k) { return PLATFORM_LABELS[k] || k; }

  // Date range (ISO start/end) for a retainer period tag {year,month}, derived
  // from the same contractPeriods() math the month lens already uses.
  function performancePeriodRange(contractStart, tag) {
    var startISO = periodStartISO(contractStart, tag);
    if (!startISO) return null;
    var sp = startISO.split('-');
    var start = new Date(+sp[0], +sp[1] - 1, +sp[2]);
    var end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);
    var endISO = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');
    return { startISO: startISO, endISO: endISO };
  }

  async function renderPerformanceTab() {
    var root = document.getElementById('performance-root');
    if (!root) return;
    var c = clientCache;
    var range = (viewPeriod && c.contract_start) ? performancePeriodRange(c.contract_start, viewPeriod) : null;
    var query = '?client_id=eq.' + currentClientId + '&order=slot_date.desc';
    if (range) query += '&slot_date=gte.' + range.startISO + '&slot_date=lte.' + range.endISO;
    var rows = [];
    try { rows = await db('va_post_performance', 'GET', null, query); }
    catch (e) { root.innerHTML = '<div class="table-empty">Could not load performance data — this client may not have an Ops Workspace connected yet.</div>'; return; }
    root.innerHTML = renderPerformanceHTML(rows, range);
  }

  function renderPerformanceHTML(rows, range) {
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">';
    h += '<div style="font-family:\'JetBrains Mono\',monospace;font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);">' + (range ? (esc(range.startISO) + ' → ' + esc(range.endISO)) : 'All time') + '</div>';
    h += '<button class="btn" onclick="BIZ.refreshPerformanceStats(this)">↻ Refresh stats</button>';
    h += '</div>';

    if (!rows.length) { h += '<div class="table-empty">No published posts with stats in this period yet.</div>'; return h; }

    // Reach isn't available for every platform/post-type: YouTube has no
    // reach concept via this API, and Facebook Reels/videos lost their reach
    // metric when Meta deprecated it (only plain FB feed/photo/link posts
    // still expose reach — fetchFBStats flags Reels with reach_unavailable
    // in the row's raw JSON). This distinguishes "genuinely can't get this
    // number" from "just hasn't been fetched yet" so the client sees "Not
    // available" instead of a blank/zero that reads as zero reach.
    function reachIsNA(r) {
      return r.platform === 'yt_long' || r.platform === 'yt_short' || !!(r.raw && r.raw.reach_unavailable);
    }

    var totals = { likes: 0, comments: 0, shares: 0, views: 0, reach: 0 };
    var seenSlots = {}; var byPlatform = {};
    rows.forEach(function (r) {
      seenSlots[r.slot_id] = 1;
      totals.likes += r.likes || 0; totals.comments += r.comments || 0;
      totals.shares += r.shares || 0; totals.views += r.views || 0; totals.reach += r.reach || 0;
      var p = byPlatform[r.platform] = byPlatform[r.platform] || { count: 0, likes: 0, comments: 0, shares: 0, views: 0, reach: 0, reachNAOnly: true };
      p.count++; p.likes += r.likes || 0; p.comments += r.comments || 0; p.shares += r.shares || 0; p.views += r.views || 0; p.reach += r.reach || 0;
      if (!reachIsNA(r)) p.reachNAOnly = false;
    });
    var postCount = Object.keys(seenSlots).length;

    h += '<div class="mix-grid" style="margin-bottom:26px;">';
    h += '<div class="mix-item total"><div class="mix-count">' + postCount + '</div><div class="mix-label">Posts Published</div></div>';
    h += '<div class="mix-item"><div class="mix-count">' + totals.likes + '</div><div class="mix-label">Likes</div></div>';
    h += '<div class="mix-item"><div class="mix-count">' + totals.comments + '</div><div class="mix-label">Comments</div></div>';
    h += '<div class="mix-item"><div class="mix-count">' + totals.shares + '</div><div class="mix-label">Shares</div></div>';
    h += '<div class="mix-item"><div class="mix-count">' + totals.views + '</div><div class="mix-label">Views</div></div>';
    h += '<div class="mix-item"><div class="mix-count">' + totals.reach + '</div><div class="mix-label">Reach</div></div>';
    h += '</div>';

    h += '<div class="cal-sec"><div class="cal-sec-title">By platform</div><div class="table-card"><table class="data-table"><thead><tr><th>Platform</th><th>Posts</th><th>Likes</th><th>Comments</th><th>Shares</th><th>Views</th><th>Reach</th></tr></thead><tbody>';
    var naCell = '<span style="color:var(--muted);font-style:italic">Not available</span>';
    Object.keys(byPlatform).sort().forEach(function (k) {
      var p = byPlatform[k];
      var reachCell = p.reachNAOnly ? naCell : p.reach;
      h += '<tr><td>' + esc(platformLabel(k)) + '</td><td>' + p.count + '</td><td>' + p.likes + '</td><td>' + p.comments + '</td><td>' + p.shares + '</td><td>' + p.views + '</td><td>' + reachCell + '</td></tr>';
    });
    h += '</tbody></table></div></div>';

    h += '<div class="cal-sec"><div class="cal-sec-title">Posts</div><div class="table-card"><table class="data-table"><thead><tr><th>Date</th><th>Platform</th><th>Caption</th><th>Likes</th><th>Comments</th><th>Views</th><th>Reach</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      var cap = (r.caption || '').replace(/\s+/g, ' ').trim();
      if (cap.length > 60) cap = cap.slice(0, 60) + '…';
      var reachCell = reachIsNA(r) ? naCell : (r.reach != null ? r.reach : 0);
      h += '<tr><td class="narrow">' + esc(r.slot_date || '') + '</td><td class="narrow">' + esc(platformLabel(r.platform)) + '</td><td>' + esc(cap) + '</td><td>' + (r.likes || 0) + '</td><td>' + (r.comments || 0) + '</td><td>' + (r.views || 0) + '</td><td>' + reachCell + '</td></tr>';
    });
    h += '</tbody></table></div></div>';
    return h;
  }

  async function refreshPerformanceStats(btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Refreshing…'; }
    try {
      var res = await fetch(SUPABASE_URL + '/functions/v1/social-stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY },
        body: JSON.stringify({ cron: true })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      toast('Stats refreshed');
      await renderPerformanceTab();
    } catch (e) { toast('Refresh failed: ' + e.message, true); }
    finally { if (btn) { btn.disabled = false; btn.textContent = '↻ Refresh stats'; } }
  }

  async function renderHistoryTab() {
    var el = document.getElementById('history-tab-content');
    if (!el) return;
    var contractStart = (clientCache && clientCache.contract_start) || null;
    var currentPeriod = contractStart ? currentContractPeriod(contractStart) : null;

    // Build quick-fill suggestions
    var suggestions = [];
    if (currentPeriod) {
      suggestions.push({ label: currentPeriod.label, year: currentPeriod.year, month: currentPeriod.month, hint: 'Current contract period' });
    }
    // Last calendar month as fallback
    var now = new Date();
    var lastMo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    suggestions.push({ label: MONTH_NAMES[lastMo.getMonth()] + ' ' + lastMo.getFullYear(), year: lastMo.getFullYear(), month: lastMo.getMonth() + 1, hint: 'Last calendar month' });
    suggestions.push({ label: 'Initial Setup — Complete', year: now.getFullYear(), month: now.getMonth() + 1, hint: 'Phase archive' });

    var h = '<div class="field-card" style="margin-bottom:24px;">';
    h += '<div class="sec-head" style="margin-top:0;"><h3>Save a Snapshot</h3></div>';
    h += '<p style="font-size:13px;color:var(--muted);margin-bottom:16px;">Saves a permanent record of all current data for this client. Appears in their History tab as a reportable month or milestone.</p>';

    if (!contractStart) {
      h += '<p style="font-size:12px;color:var(--rust);margin-bottom:16px;font-family:\'JetBrains Mono\',monospace;text-transform:uppercase;letter-spacing:.6px;">⚠ No contract start date set — add one in the Details tab for accurate period labels.</p>';
    }

    // Quick-fill chips
    h += '<div class="form-group" style="margin-bottom:6px;"><label class="form-label">Quick-fill label</label>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">';
    suggestions.forEach(function(s, i) {
      h += '<button type="button" class="btn" style="font-size:11px;padding:5px 12px;" ';
      h += 'onclick="BIZ.fillSnapLabel(' + JSON.stringify(s.label) + ',' + s.year + ',' + s.month + ')">';
      h += esc(s.hint) + '</button>';
    });
    h += '</div>';

    // Editable label field
    var defaultLabel = currentPeriod ? currentPeriod.label : (MONTH_NAMES[now.getMonth()] + ' ' + now.getFullYear());
    var defaultYear  = currentPeriod ? currentPeriod.year  : now.getFullYear();
    var defaultMonth = currentPeriod ? currentPeriod.month : now.getMonth() + 1;
    h += '<input type="text" class="form-input" id="close-label" value="' + esc(defaultLabel) + '" placeholder="e.g. Month 2 · 14 Feb – 13 Mar 2026">';
    h += '<input type="hidden" id="close-year" value="' + defaultYear + '">';
    h += '<input type="hidden" id="close-month-num" value="' + defaultMonth + '">';
    h += '</div>';

    h += '<div class="form-group" style="margin-bottom:16px;">';
    h += '<label class="form-label">Closed by</label>';
    h += '<input type="text" class="form-input" id="close-month-by" value="' + esc((clientCache && clientCache.pm_name) || 'Michael') + '" placeholder="Your name">';
    h += '</div>';
    h += '<div class="form-group" style="margin-bottom:16px;"><label class="form-label">Internal notes (not shown to client)</label>';
    h += '<textarea class="form-textarea" id="close-month-notes" style="min-height:80px;" placeholder="Anything worth noting..."></textarea></div>';
    h += '<button class="btn solid" onclick="BIZ.closeMonth()" id="close-month-btn">Save Snapshot</button>';
    h += '<span id="close-month-status" style="font-family:inherit,monospace;font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-left:14px;"></span>';
    h += '</div>';
    h += '<div id="snapshot-list"><div style="font-family:inherit,monospace;font-size:10px;color:var(--muted-2);padding:8px 0;">Loading past reports...</div></div>';
    el.innerHTML = h;
    await loadSnapshotList();
  }

  function fillSnapLabel(label, year, month) {
    var lEl = document.getElementById('close-label');
    var yEl = document.getElementById('close-year');
    var mEl = document.getElementById('close-month-num');
    if (lEl) lEl.value = label;
    if (yEl) yEl.value = year;
    if (mEl) mEl.value = month;
  }

  async function loadSnapshotList() {
    var el = document.getElementById('snapshot-list');
    if (!el) return;
    var slug = clientCache.slug || '';
    if (!slug) { el.innerHTML = '<p style="color:var(--muted);font-size:13px;">No client slug set. Add one in Details tab first.</p>'; return; }
    try {
      var snaps = await rpcAdmin('list_snapshots', { p_client_slug: slug });
      if (!snaps || !snaps.length) {
        el.innerHTML = '<div style="font-family:inherit,monospace;font-size:10px;color:var(--muted-2);padding:8px 0;">No snapshots yet. Close a month above to create the first one.</div>';
        return;
      }
      var h = '<div class="sec-head"><h3>Past Reports</h3></div>';
      h += '<div class="table-card"><table class="data-table"><thead><tr>';
      h += '<th>Month</th><th>Closed By</th><th>Date Saved</th><th>Notes</th><th></th></tr></thead><tbody>';
      snaps.forEach(function (s) {
        var d = new Date(s.created_at);
        var ds = d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + ' ' + d.getFullYear();
        h += '<tr><td><strong>' + esc(s.month_label) + '</strong></td>';
        h += '<td style="color:var(--muted)">' + esc(s.created_by || '') + '</td>';
        h += '<td style="font-family:inherit,monospace;font-size:10px;color:var(--muted)">' + ds + '</td>';
        h += '<td style="color:var(--muted);font-size:12.5px;">' + esc(s.notes || '') + '</td>';
        h += '<td class="cell-actions"><button class="btn" data-sid="' + s.id + '" onclick="BIZ.copySnapLink(this.dataset.sid)">Copy link</button></td>';
        h += '</tr>';
      });
      h += '</tbody></table></div>';
      el.innerHTML = h;
    } catch (err) {
      el.innerHTML = '<p style="color:var(--rust);font-size:13px;">Failed: ' + esc(err.message) + '</p>';
    }
  }

  async function closeMonth() {
    var slug = clientCache.slug || '';
    if (!slug) { toast('Add a client slug in Details first', true); return; }
    var label    = (document.getElementById('close-label').value || '').trim();
    var year     = parseInt(document.getElementById('close-year').value, 10);
    var monthNum = parseInt(document.getElementById('close-month-num').value, 10);
    if (!label) { toast('Please enter a snapshot label', true); return; }
    var by = (document.getElementById('close-month-by').value || 'admin').trim();
    var notes = document.getElementById('close-month-notes').value.trim() || null;
    var btn = document.getElementById('close-month-btn');
    var status = document.getElementById('close-month-status');
    btn.disabled = true; btn.textContent = 'Saving...';
    status.textContent = '';
    try {
      var res = await rpcAdmin('save_snapshot', { p_client_slug: slug, p_month_label: label, p_month_year: year, p_month_num: monthNum, p_created_by: by, p_notes: notes });
      if (res && res.ok) {
        status.textContent = 'Saved'; status.style.color = 'var(--green)';
        toast(label + ' snapshot saved');
        await loadSnapshotList();
      } else { throw new Error((res && res.error) || 'Unknown error'); }
    } catch (err) {
      status.textContent = 'Failed'; status.style.color = 'var(--rust)';
      toast('Save failed: ' + err.message, true);
    } finally { btn.disabled = false; btn.textContent = 'Save Snapshot'; }
  }

  function copySnapLink(snapId) {
    var url = 'https://beetsandco.com.au/clients/report.html?id=' + snapId;
    navigator.clipboard.writeText(url).then(function () { toast('Report link copied'); });
  }

  async function rpcAdmin(fn, body) {
    if (DEMO) return demoRpcAdmin(fn, body);
    var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': 'Bearer ' + KEY },
      body: JSON.stringify(body)
    });
    if (!res.ok) { var e = await res.json().catch(function(){return {};}); throw new Error(e.message || 'HTTP ' + res.status); }
    return res.json();
  }

  function demoRpcAdmin(fn) {
    if (fn === 'list_snapshots') return Promise.resolve([
      { id: 'demo-1', month_label: 'April 2026', created_by: 'Michael', created_at: '2026-04-30T10:00:00Z', notes: 'Strong reel month.' },
      { id: 'demo-2', month_label: 'March 2026', created_by: 'Michael', created_at: '2026-03-31T10:00:00Z', notes: null }
    ]);
    if (fn === 'save_snapshot') return Promise.resolve({ ok: true, id: 'demo-new' });
    return Promise.resolve(null);
  }

  function demoDb(table, method, body, query) {
    return new Promise(function (resolve) {
      setTimeout(function () { resolve(demoDbSync(table, method, body, query)); }, 160); // simulate latency
    });
  }
  function demoDbSync(table, method, body, query) {
    const store = DEMO_DB[table] || (DEMO_DB[table] = []);
    const q = query || '';
    const idMatch = q.match(/[?&]id=eq\.([^&]+)/);
    const cliMatch = q.match(/client_id=eq\.([^&]+)/);
    const orderMatch = q.match(/order=([a-z_]+)\.asc/);
    if (method === 'GET' || !method) {
      let rows = store.slice();
      if (idMatch) rows = rows.filter(function (r) { return String(r.id) === decodeURIComponent(idMatch[1]); });
      if (cliMatch) rows = rows.filter(function (r) { return String(r.client_id) === decodeURIComponent(cliMatch[1]); });
      if (orderMatch) { const k = orderMatch[1]; rows.sort(function (a, b) { return (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0); }); }
      else if (table === 'clients') rows.sort(function (a, b) { return (a.name > b.name ? 1 : -1); });
      return rows.map(function (r) { return Object.assign({}, r); });
    }
    if (method === 'PATCH') {
      const row = store.find(function (r) { return String(r.id) === decodeURIComponent(idMatch[1]); });
      if (row) Object.assign(row, body);
      return row ? [Object.assign({}, row)] : [];
    }
    if (method === 'POST') {
      const row = Object.assign({ id: 'demo' + (++_idc) }, body);
      store.push(row);
      return [Object.assign({}, row)];
    }
    if (method === 'DELETE') {
      const i = store.findIndex(function (r) { return String(r.id) === decodeURIComponent(idMatch[1]); });
      if (i > -1) store.splice(i, 1);
      return true;
    }
        return [];
  }

/* ---- module gate (replaces the old full-page gate) ---- */
KEY = sessionStorage.getItem('oc_admin_key') || null;
WEBHOOK_KEY = sessionStorage.getItem('oc_webhook_key') || WEBHOOK_KEY;
let _bizView = null, _bizSection = 'clients';

const KEY_PANEL = `
<div class="biz-root"><div class="gate-box" style="margin:60px auto;">
  <div class="gate-title">Business admin</div>
  <div class="gate-sub">The client records table is locked to the public key on purpose — enter the admin (service) key to work on Clients, Reports and Leads. Held for this browser session only.</div>
  <div class="form-group"><label class="form-label">Admin key</label>
    <input type="password" class="form-input" id="biz-key" placeholder="eyJhbGci..." onkeydown="if(event.key==='Enter') BIZ.bizUnlock()"/></div>
  <div class="form-group" style="margin-top:14px;"><label class="form-label">n8n webhook key (optional — Leads only)</label>
    <input type="password" class="form-input" id="biz-webhook-key"/></div>
  <button class="btn solid" style="width:100%;justify-content:center;padding:14px;font-size:12px;margin-top:16px;" onclick="BIZ.bizUnlock()">Unlock</button>
  <div id="biz-gate-err" style="color:var(--rust);font-size:11px;margin-top:12px;display:none;">Could not connect with that key.</div>
</div></div>`;

async function bizUnlock() {
  const k = (document.getElementById('biz-key').value || '').trim();
  if (!k) return;
  KEY = k;
  const wk = (document.getElementById('biz-webhook-key').value || '').trim();
  if (wk) WEBHOOK_KEY = wk;
  try {
    await db('clients', 'GET', null, '?select=id&limit=1');
    sessionStorage.setItem('oc_admin_key', k);
    if (WEBHOOK_KEY) sessionStorage.setItem('oc_webhook_key', WEBHOOK_KEY);
    boot(_bizView, _bizSection);
  } catch (e) {
    KEY = null;
    document.getElementById('biz-gate-err').style.display = 'block';
  }
}
function bizLock() {
  sessionStorage.removeItem('oc_admin_key'); sessionStorage.removeItem('oc_webhook_key');
  KEY = null; WEBHOOK_KEY = null;
  if (_bizView) _bizView.innerHTML = KEY_PANEL;
}

/* ---- module template (ported admin body, gate/topbar removed) ---- */
const BIZ_TEMPLATE = `<div class="biz-topbar">
  <div class="topbar-wordmark"><span class="mark">Beets &amp; Co. · Business</span></div>
  <div style="display:flex;gap:10px;align-items:center;">
    <span class="save-status" id="save-status"><span class="dot"></span> All changes saved</span>
    <button class="btn" onclick="BIZ.bizLock()">Clear admin key</button>
  </div>
</div>
<div class="admin-layout">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Clients</h2>
      <button class="btn accent" onclick="BIZ.createNewClient()">+ New</button>
    </div>
    <div class="search-wrap">
      <input class="search-input" id="client-search" placeholder="Search clients…" oninput="BIZ.filterClients(this.value)"/>
    </div>
    <ul class="client-list" id="client-list"></ul>
  </aside>

  <main class="editor" id="editor-area">
    <div class="editor-empty">Select a client to edit</div>
    <div id="client-form" style="display:none;"></div>
  </main>
</div>

<div class="leads-layout" id="leads-layout" style="display:none;">
  <div class="panel-title">Lead Generator</div>
  <div class="panel-note">Search Google Maps for a category + postcode. Results upsert into Supabase and qualify automatically in the background.</div>

  <div class="field-card">
    <div class="lead-form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <input type="text" class="form-input" id="lead-category" list="lead-category-suggestions" placeholder="e.g. Builder, Electrician, Lawyer">
        <datalist id="lead-category-suggestions">
          <option value="Builder"><option value="Contractor"><option value="Electrician"><option value="Plumber">
          <option value="Carpenter"><option value="Painter"><option value="Landscaper"><option value="Roofer">
          <option value="Lawyer"><option value="Conveyancer"><option value="Accountant"><option value="Real Estate Agent">
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Postcode</label>
        <input type="text" class="form-input" id="lead-postcode" placeholder="e.g. 3195" style="width:130px;">
      </div>
      <button class="btn solid" id="lead-scrape-btn" onclick="BIZ.triggerScrape()">Scrape & Qualify</button>
    </div>
    <div class="lead-scrape-status" id="lead-scrape-status"></div>
  </div>

  <div class="lead-toolbar">
    <select class="form-input" id="lead-status-filter" onchange="BIZ.renderLeadsTable()">
      <option value="">All statuses</option>
      <option value="new">New</option>
      <option value="qualified">Qualified</option>
      <option value="low_priority">Low priority</option>
      <option value="needs_review">Needs review</option>
      <option value="contacted">Contacted</option>
      <option value="ignored">Ignored</option>
    </select>
    <select class="form-input" id="lead-category-filter" onchange="BIZ.renderLeadsTable()">
      <option value="">All categories</option>
    </select>
    <input type="text" class="form-input" id="lead-search" placeholder="Search company…" oninput="BIZ.renderLeadsTable()">
    <select class="form-input" id="lead-sort" onchange="BIZ.renderLeadsTable()">
      <option value="created_desc">Newest first</option>
      <option value="score_desc">Highest opportunity</option>
      <option value="name_asc">Company name</option>
    </select>
    <button class="btn" onclick="BIZ.loadLeads()">Refresh</button>
    <span class="lead-count" id="lead-count"></span>
  </div>

  <div class="batch-bar" id="batch-bar">
    <span id="batch-label">0 selected</span>
    <button class="btn" onclick="BIZ.batchSendEmails()">Send emails to selected</button>
    <button class="btn" onclick="BIZ.batchIgnore()">Ignore selected</button>
    <button class="btn" onclick="BIZ.clearSelection()" style="background:transparent;color:var(--paper);border-color:rgba(255,255,255,0.3);">Clear</button>
    <span class="batch-progress" id="batch-progress"></span>
  </div>

  <div class="table-card">
    <table class="data-table">
      <thead><tr>
        <th style="width:32px;"><input type="checkbox" class="lead-check" id="select-all" onclick="BIZ.toggleSelectAll(this)" title="Select all"></th>
        <th>Company</th><th>Category</th><th>Postcode</th><th>Phone</th><th>Website</th>
        <th>Status</th><th>Score</th><th>Email</th><th>Checked</th><th></th>
      </tr></thead>
      <tbody id="leads-tbody"><tr><td colspan="11" style="color:var(--muted-2);font-family:'JetBrains Mono',monospace;font-size:10px;text-transform:uppercase;padding:18px 10px;">No leads loaded yet</td></tr></tbody>
    </table>
  </div>
</div>

<div class="modal-overlay" id="post-modal-overlay" style="display:none;" onclick="if(event.target===this) BIZ.closePostModal()">
  <div class="modal-box">
    <div class="modal-head">
      <h3 id="post-modal-title">New Post</h3>
      <button class="modal-x" onclick="BIZ.closePostModal()" aria-label="Close">&times;</button>
    </div>
    <div class="modal-body">
      <div class="grid-2">
        <div class="form-group"><label class="form-label">Date</label><input type="date" class="form-input" id="pm-date"></div>
        <div class="form-group"><label class="form-label">Channel</label><input type="text" class="form-input" id="pm-channel" placeholder="Static · IG"></div>
      </div>
      <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" id="pm-title" placeholder="Working title"></div>
      <div class="grid-2">
        <div class="form-group"><label class="form-label">Pillar</label><select class="form-input" id="pm-pillar"></select></div>
        <div class="form-group"><label class="form-label">Status</label><select class="form-input" id="pm-status"></select></div>
      </div>
      <div class="form-group"><label class="form-label">Content URL</label><input type="text" class="form-input" id="pm-url" placeholder="https://…"></div>
      <div class="form-group"><label class="form-label">Teleprompter / Script</label><textarea class="form-textarea" id="pm-script" style="min-height:90px;"></textarea></div>
      <div class="form-group" style="display:flex;align-items:center;gap:9px;flex-direction:row;">
        <input type="checkbox" id="pm-pipeline" style="margin:0;"><label class="form-label" style="margin:0;text-transform:none;letter-spacing:0;font-size:13px;">Show in client pipeline / approvals</label>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn danger" id="pm-delete-btn" onclick="BIZ.deletePostModalForm()">Delete</button>
      <div style="flex:1"></div>
      <button class="btn" onclick="BIZ.closePostModal()">Cancel</button>
      <button class="btn solid" onclick="BIZ.savePostModalForm()">Save</button>
    </div>
  </div>
</div>

`;

let _booted = false;
function sizeBizLayout() {
  const root = document.querySelector('.biz-root');
  const layout = document.querySelector('.biz-root .admin-layout');
  if (!root || !layout) return;
  const top = layout.getBoundingClientRect().top;
  root.style.setProperty('--biz-h', Math.max(480, window.innerHeight - top - 12) + 'px');
}
let _bizResizeHooked = false;

async function boot(view, section) {
  view.innerHTML = '<div class="biz-root">' + BIZ_TEMPLATE + '</div>';
  _booted = true;
  setAppView(section);
  sizeBizLayout();
  if (!_bizResizeHooked) { window.addEventListener('resize', sizeBizLayout); _bizResizeHooked = true; }
  try { await loadClients(); } catch (e) { toast('Failed to load clients', true); }
}

window.BIZ = Object.assign({ bizLock, bizUnlock }, { addRow, adminCalNav, adminCalNavReset, batchIgnore, batchSendEmails, clearSelection, closeMonth, closePostModal, copyLink, copySnapLink, createNewClient, delRow, deletePostModalForm, fillSnapLabel, filterClients, loadLeads, markContacted, markStatus, moveRow, onFieldInput, openPostModal, refreshPerformanceStats, renderLeadsTable, saveEmail, savePostModalForm, sendOutreachEmail, setViewPeriod, switchTab, toggleRow, toggleSelectAll, triggerScrape, updateRow });

window.BusinessModule = {
  async render(view, section) {
    _bizView = view; _bizSection = section || 'clients';
    if (!KEY) { view.innerHTML = KEY_PANEL; return; }
    await boot(view, _bizSection);
  }
};
})();
