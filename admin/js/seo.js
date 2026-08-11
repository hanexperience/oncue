/* ============================================================
   SEO MODULE — Command → SEO
   Per-client keyword strategy, rank tracking, location pages,
   AI/LLM visibility, content plan, competitors, link targets.

   Replaces the per-client Keyword Tracker spreadsheets
   (Crowncon_Keyword_Tracker.xlsx, dig-dig-keyword-tracker.xlsx).
   Supabase is master; the workbooks were a one-time import.

   Lives in Command (global section) but is inherently per-client,
   so it carries its OWN client dropdown rather than reading the
   header client picker — Command hides that picker by design.

   Bulk data work (imports, re-scoring, monthly rank drops) is done
   through the Supabase connector, not here. This UI is a viewer
   with light inline editing: statuses, gates, checkboxes, notes.

   Exposes window.SeoModule + window.SEO (inline handlers).
   ============================================================ */
(function () {
'use strict';

const SUPABASE_URL = 'https://rrxveifshucpinajtkgf.supabase.co';
const ANON_KEY = 'sb_publishable_548FF3LDIHbz55iHtylFZw_HKBW06Aj';

// ── State ──
let clients   = [];
let clientId  = null;
let sub       = 'overview';
let D         = {};   // loaded data for the current client
let loading   = false;

// Per-tab view state (filters/sorts), reset on client change
let kwFilter  = { q:'', cluster:'', tracked:'all', sort:'priority' };
let locFilter = { tier:'', status:'' };
let cpFilter  = { status:'' };

const SUBTABS = [
  ['overview',    'Overview'],
  ['keywords',    'Keywords'],
  ['ranks',       'Ranks'],
  ['locations',   'Locations'],
  ['ai',          'AI Visibility'],
  ['content',     'Content'],
  ['competitors', 'Competitors'],
  ['links',       'Links']
];

const CONTENT_STATUSES  = ['Not started','In progress','In review','Published','On hold'];
const LOCATION_STATUSES = ['Not started','In progress','Ready','Published'];
const LINK_STATUSES     = ['Not started','In progress','Submitted','Live','Rejected'];

// ── API ──
async function api(path, method, body) {
  const opts = {
    method: method || 'GET',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': 'Bearer ' + ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'HTTP ' + res.status);
  }
  if (method === 'DELETE') return true;
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

function toast(msg, err) { if (window.toast) window.toast(msg, err); }
function esc(s) {
  return (s == null ? '' : String(s))
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
function n(v){ return (v === null || v === undefined || v === '') ? null : Number(v); }
function fmt(v){ const x = n(v); return x === null || isNaN(x) ? '—' : (Math.round(x*10)/10).toLocaleString(); }
function ymd(d){ return d ? String(d).slice(0,10) : ''; }
function daysSince(d){
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

// ── Load ──
async function loadClients() {
  clients = await api('client_picker?select=id,name,slug&order=name');
}

async function loadClient() {
  if (!clientId) { D = {}; return; }
  const c = 'client_id=eq.' + clientId;
  const [config, keywords, ranks, locations, questions, citations, competitors, plan, links] =
    await Promise.all([
      api('seo_config?' + c + '&select=*'),
      api('seo_keywords_scored?' + c + '&select=*&order=keyword'),
      api('seo_rank_snapshots?' + c + '&select=*&order=checked_on.desc'),
      api('seo_locations?' + c + '&select=*&order=tier,suburb'),
      api('seo_ai_questions?' + c + '&select=*&order=priority,question'),
      api('seo_ai_citations?' + c + '&select=*&order=checked_on.desc'),
      api('seo_competitors?' + c + '&select=*&order=threat_level,name'),
      api('seo_content_plan?' + c + '&select=*&order=phase,priority'),
      api('seo_link_targets?' + c + '&select=*&order=priority,domain_strength.desc')
    ]);
  D = { config: config[0] || null, keywords, ranks, locations, questions,
        citations, competitors, plan, links };
}

// ── Inline persistence ──
async function patch(table, id, field, value) {
  try {
    const body = {}; body[field] = value;
    await api(table + '?id=eq.' + id, 'PATCH', body);
    toast('Saved');
  } catch (e) { toast('Save failed: ' + e.message, true); }
}

function setField(table, id, field, el) {
  const v = el.type === 'checkbox' ? el.checked : (el.value === '' ? null : el.value);
  patch(table, id, field, v);
  const row = D[tableKey(table)] && D[tableKey(table)].find(r => r.id === id);
  if (row) row[field] = v;
}
function tableKey(t) {
  return { seo_keywords:'keywords', seo_locations:'locations', seo_ai_questions:'questions',
           seo_content_plan:'plan', seo_link_targets:'links', seo_competitors:'competitors' }[t];
}

async function setGate(locId, gateKey, el) {
  const loc = D.locations.find(l => l.id === locId);
  if (!loc) return;
  const gates = Object.assign({}, loc.gates || {});
  gates[gateKey] = el.checked;
  loc.gates = gates;
  await patch('seo_locations', locId, 'gates', gates);
  const cell = document.getElementById('gc-' + locId);
  if (cell) cell.innerHTML = gateSummary(loc);
}

function gateDefs() {
  return (D.config && Array.isArray(D.config.gates)) ? D.config.gates : [];
}
function gatesMet(loc) {
  const defs = gateDefs();
  if (!defs.length) return null;
  return defs.filter(g => (loc.gates || {})[g.key]).length;
}
function gateSummary(loc) {
  const defs = gateDefs(); const met = gatesMet(loc);
  if (met === null) return '<span class="seo-dim">no gates defined</span>';
  const ready = met === defs.length;
  const cls = ready ? 'ok' : (met === defs.length - 1 ? 'warn' : 'dim');
  return `<span class="seo-gatecount ${cls}">${met}/${defs.length}${ready ? ' · ready' : ''}</span>`;
}

// ── Render shell ──
function shell() {
  const opts = clients.map(c =>
    `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${esc(c.name)}</option>`
  ).join('');
  const tabs = SUBTABS.map(([k, l]) =>
    `<button data-sub="${k}" class="seo-subtab ${k === sub ? 'active' : ''}" onclick="SEO.go('${k}')">${l}</button>`
  ).join('');
  return `
  <div class="seo-head">
    <div class="seo-head-top">
      <div>
        <h1>SEO Strategy</h1>
        <p class="seo-sub">Keyword, location and AI-visibility tracking, per client.</p>
      </div>
      <div class="seo-head-actions">
        <select class="seo-client" onchange="SEO.setClient(this.value)">
          <option value="">Select a client…</option>${opts}
        </select>
      </div>
    </div>
    <div class="seo-subtabs">${tabs}</div>
  </div>
  <div class="seo-body" id="seo-body"></div>`;
}

function go(k) {
  sub = k;
  localStorage.setItem('bc_seo_sub', k);
  document.querySelectorAll('.seo-subtab').forEach(b =>
    b.classList.toggle('active', b.dataset.sub === k));
  paint();
}

async function setClient(id) {
  clientId = id || null;
  localStorage.setItem('bc_seo_client', clientId || '');
  kwFilter  = { q:'', cluster:'', tracked:'all', sort:'priority' };
  locFilter = { tier:'', status:'' };
  cpFilter  = { status:'' };
  const body = document.getElementById('seo-body');
  if (body) body.innerHTML = '<div class="seo-empty">Loading…</div>';
  loading = true;
  try { await loadClient(); }
  catch (e) { if (body) body.innerHTML = `<div class="seo-empty err">Load failed: ${esc(e.message)}</div>`; loading = false; return; }
  loading = false;
  paint();
}

function paint() {
  const body = document.getElementById('seo-body');
  if (!body) return;
  if (!clientId) { body.innerHTML = '<div class="seo-empty">Pick a client to begin.</div>'; return; }
  if (loading)   { body.innerHTML = '<div class="seo-empty">Loading…</div>'; return; }
  if (!D.config) {
    body.innerHTML = `<div class="seo-empty">
      <p>No SEO setup for this client yet.</p>
      <button class="seo-btn solid" onclick="SEO.cloneTemplate()">Set up from template</button>
      <p class="seo-dim" style="margin-top:10px">Seeds scoring config, gate definitions, a starter AI question bank and standard AU link targets.</p>
    </div>`;
    return;
  }
  const fn = { overview:vOverview, keywords:vKeywords, ranks:vRanks, locations:vLocations,
               ai:vAi, content:vContent, competitors:vCompetitors, links:vLinks }[sub];
  body.innerHTML = fn ? fn() : '';
}

async function cloneTemplate() {
  try {
    await api('rpc/seo_clone_template', 'POST', { p_client: clientId });
    toast('Template applied');
    await setClient(clientId);
  } catch (e) { toast('Clone failed: ' + e.message, true); }
}

/* ============================================================
   OVERVIEW — the screen that a spreadsheet cannot give you:
   what changed and what is one step from done.
   ============================================================ */
function vOverview() {
  const kws     = D.keywords;
  const tracked = kws.filter(k => k.is_tracked);
  const ranked  = tracked.filter(k => k.latest_rank !== null && k.latest_rank !== undefined);
  const up      = kws.filter(k => n(k.rank_change) > 0);
  const down    = kws.filter(k => n(k.rank_change) < 0);
  const stale   = tracked.filter(k => {
    const d = daysSince(k.latest_rank_date);
    return d === null || d > 30;
  });
  const defs    = gateDefs();
  const ready   = D.locations.filter(l => defs.length && gatesMet(l) === defs.length);
  const nearly  = D.locations.filter(l => defs.length && gatesMet(l) === defs.length - 1);
  const unans   = D.questions.filter(q => !q.answered_on_site);
  const notStarted = D.plan.filter(p => (p.status || 'Not started') === 'Not started');
  const published  = D.plan.filter(p => p.status === 'Published');
  const top3    = ranked.filter(k => k.latest_rank <= 3).length;
  const striking = ranked.filter(k => k.latest_rank >= 11 && k.latest_rank <= 20);

  const stat = (num, label, cls) =>
    `<div class="seo-stat ${cls || ''}"><div class="n">${num}</div><div class="l">${label}</div></div>`;

  const nextUp = kws
    .filter(k => n(k.priority_score) !== null)
    .filter(k => !D.plan.some(p => p.primary_keyword_id === k.id && p.status === 'Published'))
    .sort((a, b) => n(b.priority_score) - n(a.priority_score))
    .slice(0, 12);

  return `
  <div class="seo-stats">
    ${stat(kws.length, 'Keywords')}
    ${stat(tracked.length, 'Tracked')}
    ${stat(top3, 'Ranking top 3', top3 ? 'good' : '')}
    ${stat(striking.length, 'Striking distance (11–20)', striking.length ? 'warn' : '')}
    ${stat(up.length, 'Improved', up.length ? 'good' : '')}
    ${stat(down.length, 'Declined', down.length ? 'bad' : '')}
    ${stat(stale.length, 'Rank check overdue', stale.length ? 'warn' : '')}
    ${stat(unans.length, 'AI questions unanswered', unans.length ? 'warn' : '')}
  </div>

  <div class="seo-cols">
    <div class="seo-panel">
      <h3>Movement since last check</h3>
      ${(up.length + down.length) === 0
        ? '<p class="seo-dim">No keyword has two rank snapshots yet, so there is nothing to compare. Movement appears once a second check is recorded.</p>'
        : `<table class="seo-table compact">
             <thead><tr><th>Keyword</th><th class="r">Now</th><th class="r">Was</th><th class="r">Δ</th></tr></thead>
             <tbody>${down.concat(up)
               .sort((a,b) => n(a.rank_change) - n(b.rank_change))
               .slice(0, 15)
               .map(k => `<tr>
                  <td>${esc(k.keyword)}</td>
                  <td class="r">${k.latest_rank ?? '—'}</td>
                  <td class="r">${k.previous_rank ?? '—'}</td>
                  <td class="r ${n(k.rank_change) > 0 ? 'up' : 'down'}">${n(k.rank_change) > 0 ? '▲' : '▼'} ${Math.abs(n(k.rank_change))}</td>
                </tr>`).join('')}</tbody>
           </table>`}
    </div>

    <div class="seo-panel">
      <h3>One gate from publishing</h3>
      ${!defs.length
        ? '<p class="seo-dim">No publish gates defined for this client.</p>'
        : nearly.length
          ? `<ul class="seo-list">${nearly.map(l => {
              const missing = defs.filter(g => !(l.gates || {})[g.key]).map(g => g.label).join(', ');
              return `<li><b>${esc(l.suburb)}</b> <span class="seo-dim">— needs ${esc(missing)}</span></li>`;
            }).join('')}</ul>`
          : `<p class="seo-dim">Nothing at ${defs.length - 1}/${defs.length}. ${ready.length} location${ready.length === 1 ? '' : 's'} fully ready, ${D.locations.length} total.</p>`}
    </div>

    <div class="seo-panel">
      <h3>Highest priority, not yet published</h3>
      ${nextUp.length
        ? `<table class="seo-table compact">
             <thead><tr><th>Keyword</th><th class="r">Score</th><th class="r">Vol</th><th class="r">KD</th><th class="r">Rank</th></tr></thead>
             <tbody>${nextUp.map(k => `<tr>
                <td>${esc(k.keyword)}</td>
                <td class="r"><b>${fmt(k.priority_score)}</b></td>
                <td class="r">${fmt(k.volume)}</td>
                <td class="r">${fmt(k.kd)}</td>
                <td class="r">${k.latest_rank ?? '—'}</td>
              </tr>`).join('')}</tbody>
           </table>`
        : '<p class="seo-dim">No keyword has both a volume and a KD figure yet, so nothing can be scored. Fill those in to rank the work.</p>'}
    </div>

    <div class="seo-panel">
      <h3>Content pipeline</h3>
      <div class="seo-mini-stats">
        <span><b>${published.length}</b> published</span>
        <span><b>${D.plan.length - published.length - notStarted.length}</b> in flight</span>
        <span><b>${notStarted.length}</b> not started</span>
      </div>
      ${notStarted.length
        ? `<ul class="seo-list">${notStarted.slice(0, 8).map(p =>
            `<li>${esc(p.asset_name || p.url || '—')} <span class="seo-dim">${esc(p.target_month || p.phase || '')}</span></li>`
          ).join('')}</ul>`
        : '<p class="seo-dim">Everything in the plan has been started.</p>'}
    </div>
  </div>`;
}

/* ── KEYWORDS ── */
function vKeywords() {
  const clusters = [...new Set(D.keywords.map(k => k.cluster).filter(Boolean))].sort();
  let rows = D.keywords.slice();
  const q = kwFilter.q.toLowerCase();
  if (q) rows = rows.filter(k => (k.keyword || '').toLowerCase().includes(q) ||
                                 (k.notes || '').toLowerCase().includes(q));
  if (kwFilter.cluster) rows = rows.filter(k => k.cluster === kwFilter.cluster);
  if (kwFilter.tracked === 'yes') rows = rows.filter(k => k.is_tracked);
  if (kwFilter.tracked === 'no')  rows = rows.filter(k => !k.is_tracked);

  const sorters = {
    priority: (a,b) => (n(b.priority_score) ?? -1) - (n(a.priority_score) ?? -1),
    volume:   (a,b) => (n(b.volume) ?? -1) - (n(a.volume) ?? -1),
    kd:       (a,b) => (n(a.kd) ?? 999) - (n(b.kd) ?? 999),
    rank:     (a,b) => (a.latest_rank ?? 999) - (b.latest_rank ?? 999),
    keyword:  (a,b) => (a.keyword || '').localeCompare(b.keyword || '')
  };
  rows.sort(sorters[kwFilter.sort] || sorters.priority);

  const model = (D.config.scoring || {}).model;
  const modelNote = model === 'volume_intent_kd'
    ? 'Score = (volume × intent weight) ÷ (KD + 10)'
    : 'Score = weighted 0–100 blend of volume, KD, intent and tier';

  return `
  <div class="seo-filters">
    <input class="seo-search" placeholder="Search keywords…" value="${esc(kwFilter.q)}"
           oninput="SEO.kwSet('q', this.value)"/>
    <select onchange="SEO.kwSet('cluster', this.value)">
      <option value="">All clusters</option>
      ${clusters.map(c => `<option ${c === kwFilter.cluster ? 'selected' : ''}>${esc(c)}</option>`).join('')}
    </select>
    <select onchange="SEO.kwSet('tracked', this.value)">
      <option value="all">All</option>
      <option value="yes" ${kwFilter.tracked === 'yes' ? 'selected' : ''}>Tracked only</option>
      <option value="no"  ${kwFilter.tracked === 'no'  ? 'selected' : ''}>Untracked only</option>
    </select>
    <select onchange="SEO.kwSet('sort', this.value)">
      <option value="priority" ${kwFilter.sort==='priority'?'selected':''}>Sort: Priority</option>
      <option value="volume"   ${kwFilter.sort==='volume'  ?'selected':''}>Sort: Volume</option>
      <option value="kd"       ${kwFilter.sort==='kd'      ?'selected':''}>Sort: Difficulty</option>
      <option value="rank"     ${kwFilter.sort==='rank'    ?'selected':''}>Sort: Rank</option>
      <option value="keyword"  ${kwFilter.sort==='keyword' ?'selected':''}>Sort: A–Z</option>
    </select>
    <span class="seo-count">${rows.length} of ${D.keywords.length} · <span class="seo-dim">${modelNote}</span></span>
  </div>
  <table class="seo-table">
    <thead><tr>
      <th>Keyword</th><th>Cluster</th><th>Intent</th><th class="c">Tier</th>
      <th class="r">Vol</th><th class="r">KD</th><th class="r">CPC</th>
      <th class="r">Score</th><th class="r">Rank</th><th class="c">Track</th><th>Target page</th>
    </tr></thead>
    <tbody>${rows.map(k => `<tr>
      <td class="kw">${esc(k.keyword)}${k.notes ? `<div class="seo-note">${esc(k.notes)}</div>` : ''}</td>
      <td>${esc(k.cluster || k.theme || '')}</td>
      <td>${esc(k.intent || '')}</td>
      <td class="c">${esc(k.tier || '')}</td>
      <td class="r">${fmt(k.volume)}</td>
      <td class="r">${fmt(k.kd)}</td>
      <td class="r">${k.cpc ? '$' + fmt(k.cpc) : '—'}</td>
      <td class="r score">${fmt(k.priority_score)}</td>
      <td class="r">${k.latest_rank ?? '—'}</td>
      <td class="c"><input type="checkbox" ${k.is_tracked ? 'checked' : ''}
          onchange="SEO.setField('seo_keywords','${k.id}','is_tracked',this)"/></td>
      <td class="dim">${esc(k.target_page || k.existing_asset || '')}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}
function kwSet(k, v) { kwFilter[k] = v; paint(); }

/* ── RANKS ── pivot snapshots into a date matrix ── */
function vRanks() {
  const tracked = D.keywords.filter(k => k.is_tracked);
  const dates = [...new Set(D.ranks.map(r => ymd(r.checked_on)))].sort().slice(-8);
  const byKw = {};
  D.ranks.forEach(r => {
    (byKw[r.keyword_id] = byKw[r.keyword_id] || {})[ymd(r.checked_on)] = r.position;
  });

  if (!dates.length) {
    return `<div class="seo-empty">
      <p>No rank snapshots recorded yet.</p>
      <p class="seo-dim">Snapshots are stored one row per keyword per check date, so this table grows sideways
      as checks accumulate — no need to add a column each month.</p>
    </div>`;
  }

  const rows = tracked.slice().sort((a, b) => {
    const av = a.latest_rank ?? 999, bv = b.latest_rank ?? 999;
    return av - bv;
  });

  return `
  <div class="seo-filters">
    <span class="seo-count">${rows.length} tracked keyword${rows.length === 1 ? '' : 's'} ·
    showing last ${dates.length} check${dates.length === 1 ? '' : 's'}</span>
  </div>
  <table class="seo-table">
    <thead><tr>
      <th>Keyword</th><th>Group</th>
      ${dates.map(d => `<th class="r">${d.slice(5)}</th>`).join('')}
      <th class="r">Δ</th>
    </tr></thead>
    <tbody>${rows.map(k => {
      const m = byKw[k.id] || {};
      const first = dates.map(d => m[d]).find(v => v !== undefined);
      const last  = dates.slice().reverse().map(d => m[d]).find(v => v !== undefined);
      const delta = (first !== undefined && last !== undefined && first !== last) ? first - last : null;
      return `<tr>
        <td class="kw">${esc(k.keyword)}</td>
        <td class="dim">${esc(k.priority_label || k.cluster || '')}</td>
        ${dates.map(d => {
          const v = m[d];
          if (v === undefined) return '<td class="r dim">·</td>';
          const cls = v <= 3 ? 'ok' : v <= 10 ? 'warn' : '';
          return `<td class="r ${cls}">${v}</td>`;
        }).join('')}
        <td class="r ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'dim'}">${
          delta === null ? '—' : (delta > 0 ? '▲ ' : '▼ ') + Math.abs(delta)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

/* ── LOCATIONS ── */
function vLocations() {
  const defs = gateDefs();
  const tiers = [...new Set(D.locations.map(l => l.tier).filter(Boolean))].sort();
  let rows = D.locations.slice();
  if (locFilter.tier)   rows = rows.filter(l => l.tier === locFilter.tier);
  if (locFilter.status) rows = rows.filter(l => (l.status || 'Not started') === locFilter.status);

  return `
  <div class="seo-filters">
    <select onchange="SEO.locSet('tier', this.value)">
      <option value="">All tiers</option>
      ${tiers.map(t => `<option ${t === locFilter.tier ? 'selected' : ''}>${esc(t)}</option>`).join('')}
    </select>
    <select onchange="SEO.locSet('status', this.value)">
      <option value="">All statuses</option>
      ${LOCATION_STATUSES.map(s => `<option ${s === locFilter.status ? 'selected' : ''}>${s}</option>`).join('')}
    </select>
    <span class="seo-count">${rows.length} of ${D.locations.length}</span>
  </div>
  <table class="seo-table">
    <thead><tr>
      <th>Suburb</th><th class="c">Tier</th><th>Council</th><th>URL</th>
      ${defs.map(g => `<th class="c gate" title="${esc(g.label)}">${esc(g.key.toUpperCase())}</th>`).join('')}
      <th class="c">Gates</th><th>Status</th>
    </tr></thead>
    <tbody>${rows.map(l => `<tr>
      <td class="kw">${esc(l.suburb)}${l.notes ? `<div class="seo-note">${esc(l.notes)}</div>` : ''}</td>
      <td class="c">${esc(l.tier || '')}</td>
      <td class="dim">${esc(l.council || l.region || '')}</td>
      <td class="dim">${esc(l.url || '')}</td>
      ${defs.map(g => `<td class="c"><input type="checkbox" ${(l.gates || {})[g.key] ? 'checked' : ''}
          title="${esc(g.label)}" onchange="SEO.setGate('${l.id}','${g.key}',this)"/></td>`).join('')}
      <td class="c" id="gc-${l.id}">${gateSummary(l)}</td>
      <td><select class="seo-inline" onchange="SEO.setField('seo_locations','${l.id}','status',this)">
        ${LOCATION_STATUSES.map(s => `<option ${s === (l.status || 'Not started') ? 'selected' : ''}>${s}</option>`).join('')}
      </select></td>
    </tr>`).join('')}</tbody>
  </table>
  ${defs.length ? `<p class="seo-legend">${defs.map(g => `<b>${esc(g.key.toUpperCase())}</b> ${esc(g.label)}`).join(' · ')}</p>` : ''}`;
}
function locSet(k, v) { locFilter[k] = v; paint(); }

/* ── AI VISIBILITY ── */
function vAi() {
  const qs = D.questions;
  const answered = qs.filter(q => q.answered_on_site).length;
  const cites = D.citations;
  const named = cites.filter(c => c.named).length;

  return `
  <div class="seo-stats">
    <div class="seo-stat"><div class="n">${qs.length}</div><div class="l">Questions tracked</div></div>
    <div class="seo-stat ${answered ? 'good' : ''}"><div class="n">${answered}</div><div class="l">Answered on site</div></div>
    <div class="seo-stat ${qs.length - answered ? 'warn' : ''}"><div class="n">${qs.length - answered}</div><div class="l">Not yet answered</div></div>
    <div class="seo-stat ${named ? 'good' : 'bad'}"><div class="n">${cites.length ? Math.round(named / cites.length * 100) + '%' : '—'}</div><div class="l">Citation rate (${cites.length} checks)</div></div>
  </div>

  <h3 class="seo-h3">Question bank</h3>
  <table class="seo-table">
    <thead><tr><th>Question</th><th>Cluster</th><th>Funnel</th><th>Priority</th><th>Target page</th><th class="c">Answered</th></tr></thead>
    <tbody>${qs.map(q => `<tr>
      <td class="kw">${esc(q.question)}${q.why_it_matters ? `<div class="seo-note">${esc(q.why_it_matters)}</div>` : ''}</td>
      <td>${esc(q.cluster || q.qtype || '')}</td>
      <td>${esc(q.funnel || '')}</td>
      <td>${esc(q.priority || '')}</td>
      <td class="dim">${esc(q.target_page || '')}</td>
      <td class="c"><input type="checkbox" ${q.answered_on_site ? 'checked' : ''}
          onchange="SEO.setField('seo_ai_questions','${q.id}','answered_on_site',this)"/></td>
    </tr>`).join('')}</tbody>
  </table>

  <h3 class="seo-h3">Citation log</h3>
  ${cites.length
    ? `<table class="seo-table">
         <thead><tr><th>Date</th><th>Engine</th><th>Prompt</th><th class="c">Named</th><th class="r">Pos</th><th>Competitors named</th></tr></thead>
         <tbody>${cites.map(c => `<tr>
           <td>${ymd(c.checked_on)}</td>
           <td>${esc(c.engine)}</td>
           <td class="kw">${esc(c.prompt_text || '')}</td>
           <td class="c">${c.named ? '<span class="seo-yes">yes</span>' : '<span class="seo-no">no</span>'}</td>
           <td class="r">${c.position_in_list ?? '—'}</td>
           <td class="dim">${esc(c.competitors_named || '')}</td>
         </tr>`).join('')}</tbody>
       </table>`
    : '<p class="seo-dim">No citation checks logged yet. Each check is one row per engine per prompt, so the history builds up over months.</p>'}`;
}

/* ── CONTENT ── */
function vContent() {
  let rows = D.plan.slice();
  if (cpFilter.status) rows = rows.filter(p => (p.status || 'Not started') === cpFilter.status);
  return `
  <div class="seo-filters">
    <select onchange="SEO.cpSet('status', this.value)">
      <option value="">All statuses</option>
      ${CONTENT_STATUSES.map(s => `<option ${s === cpFilter.status ? 'selected' : ''}>${s}</option>`).join('')}
    </select>
    <span class="seo-count">${rows.length} of ${D.plan.length}</span>
  </div>
  <table class="seo-table">
    <thead><tr><th class="c">Phase</th><th class="c">Pri</th><th>Asset / URL</th><th>Type</th>
      <th>Primary keyword</th><th class="r">Words</th><th>Month</th><th>Owner</th><th>Status</th></tr></thead>
    <tbody>${rows.map(p => `<tr>
      <td class="c">${esc(p.phase || '')}</td>
      <td class="c">${esc(p.priority || '')}</td>
      <td class="kw">${esc(p.asset_name || p.url || '')}
        ${p.secondary_keywords ? `<div class="seo-note">${esc(p.secondary_keywords)}</div>` : ''}</td>
      <td>${esc(p.page_type || '')}</td>
      <td>${esc(p.primary_keyword || '')}</td>
      <td class="r">${esc(p.word_target || '')}</td>
      <td>${esc(p.target_month || '')}</td>
      <td>${esc(p.owner || '')}</td>
      <td><select class="seo-inline" onchange="SEO.setField('seo_content_plan','${p.id}','status',this)">
        ${CONTENT_STATUSES.map(s => `<option ${s === (p.status || 'Not started') ? 'selected' : ''}>${s}</option>`).join('')}
      </select></td>
    </tr>`).join('')}</tbody>
  </table>`;
}
function cpSet(k, v) { cpFilter[k] = v; paint(); }

/* ── COMPETITORS ── */
function vCompetitors() {
  return `
  <table class="seo-table">
    <thead><tr><th>Competitor</th><th>Domain</th><th class="r">DS</th><th class="r">Ref. domains</th>
      <th class="r">Organic kw</th><th>Threat</th><th>Ranks for</th><th>Counter</th></tr></thead>
    <tbody>${D.competitors.map(c => `<tr>
      <td class="kw">${esc(c.name)}${c.focus ? `<div class="seo-note">${esc(c.focus)}</div>` : ''}</td>
      <td class="dim">${esc(c.domain || '')}</td>
      <td class="r">${fmt(c.domain_strength ?? c.domain_authority)}</td>
      <td class="r">${fmt(c.referring_domains)}</td>
      <td class="r">${fmt(c.organic_keywords)}</td>
      <td>${esc(c.threat_level || '')}</td>
      <td class="wrap">${esc(c.ranks_for || c.why_they_matter || '')}</td>
      <td class="wrap">${esc(c.counter_strategy || '')}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

/* ── LINKS ── */
function vLinks() {
  const live = D.links.filter(l => l.status === 'Live').length;
  return `
  <div class="seo-stats">
    <div class="seo-stat"><div class="n">${D.links.length}</div><div class="l">Targets</div></div>
    <div class="seo-stat ${live ? 'good' : ''}"><div class="n">${live}</div><div class="l">Live</div></div>
    <div class="seo-stat"><div class="n">${D.links.filter(l => l.fixes_nap).length}</div><div class="l">Also fix NAP</div></div>
  </div>
  <table class="seo-table">
    <thead><tr><th>Source</th><th class="r">DS</th><th>Type</th><th>Priority</th>
      <th class="c">NAP</th><th>Competitor has it</th><th>Status</th></tr></thead>
    <tbody>${D.links.map(l => `<tr>
      <td class="kw">${esc(l.source)}${l.notes ? `<div class="seo-note">${esc(l.notes)}</div>` : ''}</td>
      <td class="r">${fmt(l.domain_strength)}</td>
      <td>${esc(l.ltype || '')}</td>
      <td>${esc(l.priority || '')}</td>
      <td class="c">${l.fixes_nap ? '✓' : ''}</td>
      <td class="dim">${esc(l.competitor_has_it || '')}</td>
      <td><select class="seo-inline" onchange="SEO.setField('seo_link_targets','${l.id}','status',this)">
        ${LINK_STATUSES.map(s => `<option ${s === (l.status || 'Not started') ? 'selected' : ''}>${s}</option>`).join('')}
      </select></td>
    </tr>`).join('')}</tbody>
  </table>`;
}

// ── Handlers exposed to inline attributes ──
window.SEO = { go, setClient, setField, setGate, kwSet, locSet, cpSet, cloneTemplate };

window.SeoModule = {
  async render(view) {
    view.innerHTML = '<div class="seo-root"><div class="seo-page" id="seo-page">Loading…</div></div>';
    try {
      if (!clients.length) await loadClients();
      const savedClient = localStorage.getItem('bc_seo_client');
      const savedSub    = localStorage.getItem('bc_seo_sub');
      if (savedSub && SUBTABS.some(s => s[0] === savedSub)) sub = savedSub;
      if (savedClient && clients.some(c => c.id === savedClient)) clientId = savedClient;
      else if (!clientId && clients.length) clientId = null;

      document.getElementById('seo-page').innerHTML = shell();
      if (clientId) await setClient(clientId);
      else paint();
    } catch (e) {
      view.innerHTML = `<div class="seo-root"><div class="seo-page">
        <div class="seo-empty err">SEO load failed: ${esc(e.message)}</div></div></div>`;
    }
  }
};
})();
