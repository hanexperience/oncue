/* ════════════════════════════════════════════════════════════════════
   Tax / BAS module  ·  Beets Project Manager
   Self-contained. Reuses the dashboard's Supabase api() + anon key.
   Mounts into #tax-page. Toggled from the topbar nav.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── Config / fallbacks (reuse dashboard globals if present) ──────────
  const SB_URL = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : 'https://rrxveifshucpinajtkgf.supabase.co';
  const SB_KEY = (typeof ANON_KEY !== 'undefined' && ANON_KEY) ? ANON_KEY : 'sb_publishable_548FF3LDIHbz55iHtylFZw_HKBW06Aj';

  async function sbApi(table, query, method, body) {
    if (typeof api === 'function') return api(table, query, method, body); // dashboard helper
    const opts = { method: method || 'GET', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(SB_URL + '/rest/v1/' + table + (query || ''), opts);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'HTTP ' + res.status); }
    if (method === 'DELETE') return true;
    const t = await res.text(); return t ? JSON.parse(t) : [];
  }
  function notify(msg, err) { if (typeof toast === 'function') toast(msg, err); }
  function esc2(s) { if (typeof esc === 'function') return esc(s); return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ── Helpers ──────────────────────────────────────────────────────────
  const GST_RATE = 0.10;
  function currentFY() { const d = new Date(); const y = d.getFullYear(); const start = d.getMonth() >= 6 ? y : y - 1; return start + '-' + String(start + 1).slice(2); }
  const FY = currentFY();
  const fyLabel = 'FY' + FY;
  // ATO concessional (before-tax) super contributions cap by financial year — indexed periodically.
  // Source: ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/contributions-caps
  const CONCESSIONAL_CAP = { '2023-24': 27500, '2024-25': 30000, '2025-26': 30000, '2026-27': 32500 };
  function concessionalCap() { return CONCESSIONAL_CAP[FY] || 30000; }

  function todayISO() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString().slice(0, 10); }
  function daysTo(iso) { if (!iso) return null; const n = new Date(); n.setHours(0, 0, 0, 0); const d = new Date(iso); d.setHours(0, 0, 0, 0); return Math.round((d - n) / 86400000); }
  function money(n) { return (Number(n) || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }); }
  function money2(n) { return (Number(n) || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2 }); }
  function fmtD(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); }
  function inRange(iso, start, end) { return iso && iso >= start && iso <= end; }
  function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }

  // Split a GST-inclusive (or exclusive) total into {ex, gst}
  function splitGst(total, includesGst, applies) {
    total = num(total);
    if (!applies) return { ex: total, gst: 0 };
    if (includesGst) { const ex = total / (1 + GST_RATE); return { ex: round2(ex), gst: round2(total - ex) }; }
    return { ex: round2(total), gst: round2(total * GST_RATE) };
  }
  function round2(n) { return Math.round(n * 100) / 100; }

  // Add n calendar months to an ISO date, clamping to the last day of the target month
  function addMonthsClamped(iso, n) {
    const [y, m, day] = iso.split('-').map(Number);
    const d = new Date(y, (m - 1) + n, 1);
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, daysInMonth));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // FY label for an arbitrary ISO date (same rule as currentFY: FY starts 1 Jul)
  function fyForDate(iso) { const m = Number(iso.slice(5, 7)); const y = Number(iso.slice(0, 4)); const start = m >= 7 ? y : y - 1; return start + '-' + String(start + 1).slice(2); }

  // ── State ────────────────────────────────────────────────────────────
  const S = { entities: [], invoices: [], expenses: [], wages: [], bas: [], recurring: [], current: null, loaded: false, editInv: null, editExp: null, editWage: null };

  // ── Load ─────────────────────────────────────────────────────────────
  async function load() {
    const [entities, invoices, expenses, wages, bas, recurring] = await Promise.all([
      sbApi('tax_entities', '?order=sort.asc'),
      sbApi('tax_invoices', '?fy=eq.' + FY + '&order=issue_date.desc.nullslast'),
      sbApi('tax_expenses', '?fy=eq.' + FY + '&order=expense_date.desc.nullslast'),
      sbApi('tax_wages', '?fy=eq.' + FY + '&order=pay_date.desc.nullslast'),
      sbApi('tax_bas_periods', '?fy=eq.' + FY + '&order=period_start.asc'),
      sbApi('tax_recurring_expenses', '?active=eq.true&order=next_run.asc')
    ]);
    S.entities = entities || []; S.invoices = invoices || []; S.expenses = expenses || []; S.wages = wages || []; S.bas = bas || []; S.recurring = recurring || [];
    if (!S.current) S.current = S.entities.length ? S.entities[0].id : null;
    S.loaded = true;

    // Auto-generate any recurring expenses that have come due since we last looked
    try {
      const changed = await generateDueRecurring();
      if (changed) S.expenses = await sbApi('tax_expenses', '?fy=eq.' + FY + '&order=expense_date.desc.nullslast');
    } catch (e) { /* non-fatal — don't block the page on this */ }
  }

  // Creates real tax_expenses rows for any active recurring template whose next_run has arrived,
  // catching up on more than one missed month if the portal wasn't opened for a while.
  async function generateDueRecurring() {
    const today = todayISO();
    const due = S.recurring.filter(r => r.active && r.next_run <= today);
    if (!due.length) return false;
    let created = false;
    for (const r of due) {
      let guard = 0;
      while (r.next_run <= today && guard < 24) {
        guard++;
        const g = splitGst(r.amount, r.includes_gst, true);
        const expRow = { entity_id: r.entity_id, description: r.description, category: r.category, expense_date: r.next_run, amount_ex_gst: g.ex, gst_amount: g.gst, deductible: r.deductible, fy: fyForDate(r.next_run), recurring_id: r.id };
        await sbApi('tax_expenses', '', 'POST', expRow);
        created = true;
        r.next_run = addMonthsClamped(r.next_run, 1);
      }
      await sbApi('tax_recurring_expenses', '?id=eq.' + r.id, 'PATCH', { next_run: r.next_run });
    }
    return created;
  }

  // ── Scope helpers (single entity or 'all') ───────────────────────────
  function entIds() { return S.current === 'all' ? S.entities.map(e => e.id) : [S.current]; }
  function inScope(row) { return entIds().indexOf(row.entity_id) !== -1; }
  function scopedInvoices() { return S.invoices.filter(inScope); }
  function scopedExpenses() { return S.expenses.filter(inScope); }
  function scopedWages() { return S.wages.filter(inScope); }

  function isOverdueInv(i) { return i.status !== 'paid' && i.due_date && daysTo(i.due_date) < 0; }

  // ── Money maths (cash basis) ─────────────────────────────────────────
  function computeSummary() {
    const inv = scopedInvoices(), exp = scopedExpenses();
    const paid = inv.filter(i => i.status === 'paid');
    const incomeEx = paid.reduce((s, i) => s + num(i.amount_ex_gst), 0);
    const gstCollected = paid.reduce((s, i) => s + num(i.gst_amount), 0);
    const outstanding = inv.filter(i => i.status !== 'paid').reduce((s, i) => s + num(i.amount_ex_gst) + num(i.gst_amount), 0);
    const overdueCount = inv.filter(isOverdueInv).length;
    const expEx = exp.filter(e => e.deductible).reduce((s, e) => s + num(e.amount_ex_gst), 0);
    const gstCredits = exp.reduce((s, e) => s + num(e.gst_amount), 0);
    const netIncome = incomeEx - expEx;

    // Reserve: per-entity reserve_pct applied to that entity's net income.
    // Sole-trader entities also get personal deductible super contributions (capped at the
    // concessional cap) subtracted first — that's a real reduction in taxable income under
    // s290-170 ATO rules, once a notice of intent has been lodged and acknowledged.
    let reserve = 0, superDeduction = 0;
    entIds().forEach(id => {
      const ent = S.entities.find(e => e.id === id); if (!ent) return;
      const ip = S.invoices.filter(i => i.entity_id === id && i.status === 'paid').reduce((s, i) => s + num(i.amount_ex_gst), 0);
      const ep = S.expenses.filter(e => e.entity_id === id && e.deductible).reduce((s, e) => s + num(e.amount_ex_gst), 0);
      let taxable = Math.max(ip - ep, 0);
      if (ent.entity_type === 'sole_trader') {
        const superPaid = S.wages.filter(w => w.entity_id === id).reduce((s, w) => s + num(w.super_amt), 0);
        const ded = Math.min(superPaid, concessionalCap());
        taxable = Math.max(taxable - ded, 0);
        superDeduction += ded;
      }
      reserve += taxable * (num(ent.reserve_pct) / 100);
    });
    return { incomeEx, gstCollected, outstanding, overdueCount, expEx, gstCredits, netIncome, reserve, superDeduction };
  }

  // GST for one BAS period (cash basis): collected on paid invoices, credits on expenses in range
  function basNet(entityId, p) {
    const collected = S.invoices.filter(i => i.entity_id === entityId && i.status === 'paid' && inRange(i.paid_date, p.period_start, p.period_end)).reduce((s, i) => s + num(i.gst_amount), 0);
    const credits = S.expenses.filter(e => e.entity_id === entityId && inRange(e.expense_date, p.period_start, p.period_end)).reduce((s, e) => s + num(e.gst_amount), 0);
    return { collected, credits, net: collected - credits };
  }

  // ── Render ───────────────────────────────────────────────────────────
  function render() {
    const root = document.getElementById('tax-page');
    if (!root) return;
    if (!S.loaded) { root.innerHTML = '<div class="tx-page"><p style="color:var(--muted);font-family:JetBrains Mono,monospace;font-size:12px;">Loading tax data…</p></div>'; return; }
    if (!S.entities.length) { root.innerHTML = '<div class="tx-page"><p style="color:var(--muted);">No tax entities set up yet.</p></div>'; return; }

    const sum = computeSummary();
    root.innerHTML =
      '<div class="tx-page">' +
        head() +
        entitySwitcher() +
        cards(sum) +
        basSection() +
        actionsSection(sum) +
        invoicesSection() +
        expensesSection() +
        wagesSection() +
        superSection() +
      '</div>';
  }

  function head() {
    return '<div class="tx-head">' +
      '<div><div class="tx-title">Tax &amp; BAS</div><div class="tx-fy">' + fyLabel + ' · 1 Jul ' + FY.slice(0, 4) + ' → 30 Jun 20' + FY.slice(5) + ' · cash basis</div></div>' +
      '<div class="tx-disclaimer">Estimates only — not tax advice. GST calculated at 10% on a cash basis (counted when invoices are paid). Confirm figures with your accountant.</div>' +
      '</div>';
  }

  function entitySwitcher() {
    let h = '<div class="tx-entities">';
    S.entities.forEach(e => {
      const t = e.entity_type === 'company' ? 'Pty Ltd' : 'Sole trader';
      h += '<button class="tx-ent-btn' + (S.current === e.id ? ' on' : '') + '" onclick="Tax.setEntity(\'' + e.id + '\')">' + esc2(e.name) + '<span class="tx-ent-type">' + t + '</span></button>';
    });
    if (S.entities.length > 1) h += '<button class="tx-ent-btn' + (S.current === 'all' ? ' on' : '') + '" onclick="Tax.setEntity(\'all\')">Both</button>';
    h += '</div>';
    return h;
  }

  function cards(s) {
    const gstOwing = s.gstCollected - s.gstCredits;
    const reserveSub = 'Recommended income-tax reserve on ' + money(s.netIncome) + ' net (paid) income this FY' +
      (s.superDeduction > 0 ? ' · ' + money(s.superDeduction) + ' already deducted for personal super contributions' : '');
    return '<div class="tx-cards">' +
      card('hero', 'Set aside for tax', money(s.reserve), reserveSub) +
      card('', 'Income (paid)', money(s.incomeEx), 'ex-GST · ' + money(s.outstanding) + ' still outstanding') +
      card('', 'GST position (FY)', money(gstOwing), (gstOwing >= 0 ? 'owed to ATO' : 'refund') + ' · ' + money(s.gstCollected) + ' collected − ' + money(s.gstCredits) + ' credits', gstOwing >= 0 ? 'pos' : 'neg') +
      card('', 'Deductible expenses', money(s.expEx), 'ex-GST this FY' + (s.overdueCount ? ' · ' + s.overdueCount + ' invoice(s) overdue' : '')) +
      '</div>';
  }
  function card(cls, label, value, sub, valCls) {
    return '<div class="tx-card ' + cls + '"><div class="tx-card-label">' + label + '</div>' +
      '<div class="tx-card-value ' + (valCls || '') + '">' + value + '</div>' +
      '<div class="tx-card-sub">' + sub + '</div></div>';
  }

  // ── BAS quarters ─────────────────────────────────────────────────────
  function basSection() {
    const today = todayISO();
    const ids = entIds();
    // group periods by quarter; if 'all', sum nets across entities
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    let cardsHtml = '';
    quarters.forEach(q => {
      const periods = S.bas.filter(b => b.quarter === q && ids.indexOf(b.entity_id) !== -1);
      if (!periods.length) return;
      const p0 = periods[0];
      let net = 0, collected = 0, credits = 0, status = 'paid', lodgedAll = true;
      periods.forEach(p => { const r = basNet(p.entity_id, p); net += r.net; collected += r.collected; credits += r.credits; if (p.status === 'open') { status = 'open'; lodgedAll = false; } else if (p.status === 'lodged' && status !== 'open') status = 'lodged'; });
      const d = daysTo(p0.due_date);
      const isCurrent = inRange(today, p0.period_start, p0.period_end);
      const overdue = d < 0 && status === 'open';
      let chip = '';
      if (overdue) chip = '<span class="tx-chip overdue">' + Math.abs(d) + 'd overdue</span>';
      else if (status === 'open' && d <= 30) chip = '<span class="tx-chip soon">' + (d === 0 ? 'due today' : 'in ' + d + 'd') + '</span>';
      const single = ids.length === 1;
      const statusCtl = single
        ? statusSelect(p0.id, p0.status, ['open', 'lodged', 'paid'], 'Tax.setBasStatus')
        : '<span class="tx-chip ' + status + '">' + status + '</span>';
      cardsHtml += '<div class="tx-bas' + (isCurrent ? ' current' : '') + (overdue ? ' overdue' : '') + '">' +
        '<div class="tx-bas-top"><span class="tx-bas-q">' + q + (isCurrent ? ' · now' : '') + '</span><span class="tx-bas-range">' + fmtD(p0.period_start) + '–' + fmtD(p0.period_end) + '</span></div>' +
        '<div class="tx-bas-due">Due <b>' + fmtD(p0.due_date) + '</b>' + chip + '</div>' +
        '<div class="tx-bas-net-label">Est. net GST</div>' +
        '<div class="tx-bas-net">' + money(net) + '</div>' +
        '<div class="tx-card-sub">' + money(collected) + ' collected − ' + money(credits) + ' credits</div>' +
        '<div class="tx-bas-foot">' + statusCtl + '</div>' +
        '</div>';
    });
    return section('BAS — quarterly', 'GST reported when invoices are paid (cash basis)', '<div class="tx-bas-grid">' + cardsHtml + '</div>');
  }

  // ── Actions ──────────────────────────────────────────────────────────
  function actionsSection(sum) {
    const items = [];
    const today = todayISO();
    entIds().forEach(id => {
      const ent = S.entities.find(e => e.id === id); if (!ent) return;
      S.bas.filter(b => b.entity_id === id).forEach(p => {
        if (p.status !== 'open') return;
        const d = daysTo(p.due_date); const r = basNet(id, p);
        if (d < 0) items.push({ warn: true, ic: '⚠️', html: '<b>' + esc2(ent.name) + ' — ' + p.quarter + ' BAS is ' + Math.abs(d) + ' days overdue</b> (was due ' + fmtD(p.due_date) + '). Est. net GST ' + money(r.net) + '.' });
        else if (d <= 30 && inRange(today, p.period_start, p.period_end) === false && d >= 0) items.push({ warn: d <= 7, ic: '🧾', html: esc2(ent.name) + ' — <b>' + p.quarter + ' BAS due ' + fmtD(p.due_date) + '</b> (' + (d === 0 ? 'today' : 'in ' + d + 'd') + '). Set aside ~' + money(r.net) + ' for GST.' });
      });
    });
    const overdueInv = scopedInvoices().filter(isOverdueInv);
    if (overdueInv.length) {
      const tot = overdueInv.reduce((s, i) => s + num(i.amount_ex_gst) + num(i.gst_amount), 0);
      items.push({ warn: true, ic: '📨', html: '<b>' + overdueInv.length + ' overdue invoice' + (overdueInv.length > 1 ? 's' : '') + '</b> to chase — ' + money(tot) + ' outstanding.' });
    }
    if (sum.reserve > 0) items.push({ warn: false, ic: '🏦', html: 'Aim to hold <b>' + money(sum.reserve) + '</b> aside for income tax so far this FY.' });
    if (!items.length) items.push({ warn: false, ic: '✅', html: 'Nothing pressing. BAS lodged and no overdue invoices.' });
    const body = '<div class="tx-actions">' + items.map(a => '<div class="tx-action' + (a.warn ? ' warn' : '') + '"><span class="tx-action-ic">' + a.ic + '</span><div>' + a.html + '</div></div>').join('') + '</div>';
    return section('Actions to take', '', body);
  }

  // ── Invoices ─────────────────────────────────────────────────────────
  function invoicesSection() {
    const rows = scopedInvoices();
    let body = '<div class="tx-table-wrap"><table class="tx-table"><thead><tr>' +
      '<th>Client / #</th>' + (S.current === 'all' ? '<th>Entity</th>' : '') + '<th>Issued</th><th>Due</th><th class="num">Ex-GST</th><th class="num">GST</th><th class="num">Total</th><th>Status</th><th></th></tr></thead><tbody>';
    if (!rows.length) body += '<tr><td colspan="9" class="tx-empty">No invoices yet this FY.</td></tr>';
    rows.forEach(i => {
      if (S.editInv === i.id) { body += invoiceEditRow(i); return; }
      const overdue = isOverdueInv(i);
      const total = num(i.amount_ex_gst) + num(i.gst_amount);
      const statusChip = overdue ? '<span class="tx-chip overdue">overdue</span>' : '<span class="tx-chip ' + i.status + '">' + i.status + '</span>';
      body += '<tr>' +
        '<td><b>' + esc2(i.client || '—') + '</b>' + (i.invoice_number ? ' <span class="muted">#' + esc2(i.invoice_number) + '</span>' : '') + '</td>' +
        (S.current === 'all' ? '<td class="muted">' + esc2(entName(i.entity_id)) + '</td>' : '') +
        '<td class="muted">' + fmtD(i.issue_date) + '</td>' +
        '<td class="muted">' + fmtD(i.due_date) + '</td>' +
        '<td class="num">' + money2(i.amount_ex_gst) + '</td>' +
        '<td class="num">' + money2(i.gst_amount) + '</td>' +
        '<td class="num"><b>' + money2(total) + '</b></td>' +
        '<td>' + statusChip + '</td>' +
        '<td class="num">' + (i.status !== 'paid' ? '<button class="tx-btn mini" onclick="Tax.markPaid(' + i.id + ')">Mark paid</button> ' : '') +
        '<button class="tx-btn mini" onclick="Tax.editInvoice(' + i.id + ')">✎</button> ' +
        '<button class="tx-btn mini danger" onclick="Tax.delInvoice(' + i.id + ')">✕</button></td>' +
        '</tr>';
    });
    body += '</tbody></table>' + invoiceAddRow() + '</div>';
    return section('Invoices', 'ex-GST + GST · mark paid to count toward BAS/reserve · ✎ to edit', body);
  }
  function invoiceEditRow(i) {
    return '<tr class="tx-editrow"><td colspan="20"><div class="tx-addrow">' + (S.current === 'all' ? entSelect('ei-ent-' + i.id) : '') +
      '<input class="tx-in md" id="ei-client-' + i.id + '" placeholder="Client" value="' + esc2(i.client || '') + '"/>' +
      '<input class="tx-in sm" id="ei-num-' + i.id + '" placeholder="Inv #" value="' + esc2(i.invoice_number || '') + '"/>' +
      '<input class="tx-in md" id="ei-issue-' + i.id + '" type="date" title="Issue date" value="' + esc2(i.issue_date || '') + '"/>' +
      '<input class="tx-in md" id="ei-due-' + i.id + '" type="date" title="Due date" value="' + esc2(i.due_date || '') + '"/>' +
      '<input class="tx-in sm" id="ei-exgst-' + i.id + '" type="number" step="0.01" placeholder="Ex-GST $" value="' + num(i.amount_ex_gst) + '"/>' +
      '<input class="tx-in sm" id="ei-gst-' + i.id + '" type="number" step="0.01" placeholder="GST $" value="' + num(i.gst_amount) + '"/>' +
      '<select class="tx-in sm" id="ei-status-' + i.id + '">' + ['sent', 'draft', 'paid'].map(o => '<option value="' + o + '"' + (o === i.status ? ' selected' : '') + '>' + o.charAt(0).toUpperCase() + o.slice(1) + '</option>').join('') + '</select>' +
      '<button class="tx-btn solid" onclick="Tax.saveInvoice(' + i.id + ')">Save</button>' +
      '<button class="tx-btn" onclick="Tax.cancelEdit()">Cancel</button>' +
      '</div></td></tr>';
  }
  function invoiceAddRow() {
    const entSel = S.current === 'all' ? entSelect('ni-ent') : '';
    return '<div class="tx-addrow">' + entSel +
      '<input class="tx-in md" id="ni-client" placeholder="Client"/>' +
      '<input class="tx-in sm" id="ni-num" placeholder="Inv #"/>' +
      '<input class="tx-in md" id="ni-issue" type="date" title="Issue date"/>' +
      '<input class="tx-in md" id="ni-due" type="date" title="Due date"/>' +
      '<input class="tx-in sm" id="ni-amt" type="number" step="0.01" placeholder="Total $"/>' +
      '<label class="tx-check"><input type="checkbox" id="ni-gst" checked/> incl. GST</label>' +
      '<select class="tx-in sm" id="ni-status"><option value="sent">Sent</option><option value="draft">Draft</option><option value="paid">Paid</option></select>' +
      '<button class="tx-btn solid" onclick="Tax.addInvoice()">+ Add</button>' +
      '</div>';
  }

  // ── Expenses ─────────────────────────────────────────────────────────
  function expensesSection() {
    const rows = scopedExpenses();
    let body = '<div class="tx-table-wrap"><table class="tx-table"><thead><tr>' +
      '<th>Description</th>' + (S.current === 'all' ? '<th>Entity</th>' : '') + '<th>Category</th><th>Date</th><th class="num">Ex-GST</th><th class="num">GST</th><th></th></tr></thead><tbody>';
    if (!rows.length) body += '<tr><td colspan="7" class="tx-empty">No expenses logged this FY.</td></tr>';
    rows.forEach(e => {
      if (S.editExp === e.id) { body += expenseEditRow(e); return; }
      body += '<tr>' +
        '<td><b>' + esc2(e.description || '—') + '</b>' + (e.deductible ? '' : ' <span class="tx-chip">non-deductible</span>') + (e.recurring_id ? ' <span class="tx-chip recur" title="Repeats monthly — click to stop future ones" onclick="Tax.stopRecurring(' + e.recurring_id + ')">🔁 monthly</span>' : '') + '</td>' +
        (S.current === 'all' ? '<td class="muted">' + esc2(entName(e.entity_id)) + '</td>' : '') +
        '<td class="muted">' + esc2(e.category || '—') + '</td>' +
        '<td class="muted">' + fmtD(e.expense_date) + '</td>' +
        '<td class="num">' + money2(e.amount_ex_gst) + '</td>' +
        '<td class="num">' + money2(e.gst_amount) + '</td>' +
        '<td class="num"><button class="tx-btn mini" onclick="Tax.editExpense(' + e.id + ')">✎</button> <button class="tx-btn mini danger" onclick="Tax.delExpense(' + e.id + ')">✕</button></td>' +
        '</tr>';
    });
    body += '</tbody></table>' + expenseAddRow() + '</div>';
    return section('Expenses', 'drives GST credits + deductions · ✎ to edit', body);
  }
  function expenseEditRow(e) {
    return '<tr class="tx-editrow"><td colspan="20"><div class="tx-addrow">' + (S.current === 'all' ? entSelect('ee-ent-' + e.id) : '') +
      '<input class="tx-in grow" id="ee-desc-' + e.id + '" placeholder="Description" value="' + esc2(e.description || '') + '"/>' +
      '<input class="tx-in md" id="ee-cat-' + e.id + '" placeholder="Category" list="tx-cat-list" value="' + esc2(e.category || '') + '"/>' +
      '<input class="tx-in md" id="ee-date-' + e.id + '" type="date" value="' + esc2(e.expense_date || '') + '"/>' +
      '<input class="tx-in sm" id="ee-exgst-' + e.id + '" type="number" step="0.01" placeholder="Ex-GST $" value="' + num(e.amount_ex_gst) + '"/>' +
      '<input class="tx-in sm" id="ee-gst-' + e.id + '" type="number" step="0.01" placeholder="GST $" value="' + num(e.gst_amount) + '"/>' +
      '<label class="tx-check"><input type="checkbox" id="ee-ded-' + e.id + '"' + (e.deductible ? ' checked' : '') + '/> deductible</label>' +
      '<button class="tx-btn solid" onclick="Tax.saveExpense(' + e.id + ')">Save</button>' +
      '<button class="tx-btn" onclick="Tax.cancelEdit()">Cancel</button>' +
      '</div></td></tr>';
  }
  function expenseAddRow() {
    const entSel = S.current === 'all' ? entSelect('ne-ent') : '';
    return '<div class="tx-addrow">' + entSel +
      '<input class="tx-in grow" id="ne-desc" placeholder="Description"/>' +
      '<input class="tx-in md" id="ne-cat" placeholder="Category" list="tx-cat-list"/>' +
      '<datalist id="tx-cat-list"><option>Software</option><option>Contractors</option><option>Travel</option><option>Equipment</option><option>Marketing</option><option>Office</option><option>Fees</option></datalist>' +
      '<input class="tx-in md" id="ne-date" type="date"/>' +
      '<input class="tx-in sm" id="ne-amt" type="number" step="0.01" placeholder="Total $"/>' +
      '<label class="tx-check"><input type="checkbox" id="ne-gst" checked/> incl. GST</label>' +
      '<label class="tx-check"><input type="checkbox" id="ne-ded" checked/> deductible</label>' +
      '<label class="tx-check"><input type="checkbox" id="ne-recur"/> 🔁 repeats monthly</label>' +
      '<button class="tx-btn solid" onclick="Tax.addExpense()">+ Add</button>' +
      '</div>';
  }

  // ── Wages / director drawings ────────────────────────────────────────
  function wagesSection() {
    const rows = scopedWages();
    const totG = rows.reduce((s, w) => s + num(w.gross), 0), totP = rows.reduce((s, w) => s + num(w.paygw), 0), totS = rows.reduce((s, w) => s + num(w.super_amt), 0);
    let body = '<div class="tx-table-wrap"><table class="tx-table"><thead><tr>' +
      '<th>Date</th>' + (S.current === 'all' ? '<th>Entity</th>' : '') + '<th>Note</th><th class="num">Gross</th><th class="num">PAYG w/h</th><th class="num">Super</th><th></th></tr></thead><tbody>';
    if (!rows.length) body += '<tr><td colspan="7" class="tx-empty">No wage/drawing runs logged. Variable pay — add each run as it happens.</td></tr>';
    rows.forEach(w => {
      if (S.editWage === w.id) { body += wageEditRow(w); return; }
      body += '<tr>' +
        '<td class="muted">' + fmtD(w.pay_date) + '</td>' +
        (S.current === 'all' ? '<td class="muted">' + esc2(entName(w.entity_id)) + '</td>' : '') +
        '<td>' + esc2(w.notes || '—') + '</td>' +
        '<td class="num">' + money2(w.gross) + '</td>' +
        '<td class="num">' + money2(w.paygw) + '</td>' +
        '<td class="num">' + money2(w.super_amt) + '</td>' +
        '<td class="num"><button class="tx-btn mini" onclick="Tax.editWage(' + w.id + ')">✎</button> <button class="tx-btn mini danger" onclick="Tax.delWage(' + w.id + ')">✕</button></td>' +
        '</tr>';
    });
    if (rows.length) body += '<tr><td class="muted" ' + (S.current === 'all' ? 'colspan="3"' : 'colspan="2"') + '><b>Total</b></td><td class="num"><b>' + money2(totG) + '</b></td><td class="num"><b>' + money2(totP) + '</b></td><td class="num"><b>' + money2(totS) + '</b></td><td></td></tr>';
    body += '</tbody></table>' + wageAddRow() + '</div>';
    return section('Director pay / drawings', 'variable — log each run manually · ✎ to edit', body);
  }
  function wageEditRow(w) {
    return '<tr class="tx-editrow"><td colspan="20"><div class="tx-addrow">' + (S.current === 'all' ? entSelect('ew-ent-' + w.id) : '') +
      '<input class="tx-in md" id="ew-date-' + w.id + '" type="date" value="' + esc2(w.pay_date || '') + '"/>' +
      '<input class="tx-in grow" id="ew-note-' + w.id + '" placeholder="Note (optional)" value="' + esc2(w.notes || '') + '"/>' +
      '<input class="tx-in sm" id="ew-gross-' + w.id + '" type="number" step="0.01" placeholder="Gross $" value="' + num(w.gross) + '"/>' +
      '<input class="tx-in sm" id="ew-payg-' + w.id + '" type="number" step="0.01" placeholder="PAYG $" value="' + num(w.paygw) + '"/>' +
      '<input class="tx-in sm" id="ew-super-' + w.id + '" type="number" step="0.01" placeholder="Super $" value="' + num(w.super_amt) + '"/>' +
      '<button class="tx-btn solid" onclick="Tax.saveWage(' + w.id + ')">Save</button>' +
      '<button class="tx-btn" onclick="Tax.cancelEdit()">Cancel</button>' +
      '</div></td></tr>';
  }
  function wageAddRow() {
    const entSel = S.current === 'all' ? entSelect('nw-ent') : '';
    return '<div class="tx-addrow">' + entSel +
      '<input class="tx-in md" id="nw-date" type="date"/>' +
      '<input class="tx-in grow" id="nw-note" placeholder="Note (optional)"/>' +
      '<input class="tx-in sm" id="nw-gross" type="number" step="0.01" placeholder="Gross $"/>' +
      '<input class="tx-in sm" id="nw-payg" type="number" step="0.01" placeholder="PAYG $"/>' +
      '<input class="tx-in sm" id="nw-super" type="number" step="0.01" placeholder="Super $"/>' +
      '<button class="tx-btn solid" onclick="Tax.addWage()">+ Add</button>' +
      '</div>';
  }

  // ── Super contributions ──────────────────────────────────────────────
  // Income base for the super target differs by entity type:
  //  - sole trader (Beets & Co): no compulsory SG on yourself, so there's no ATO-mandated
  //    base either. Using NET income (paid invoices ex-GST minus deductible expenses ex-GST,
  //    matched by month) rather than gross avoids overstating the target — a chunk of gross
  //    revenue is real business cost that was never available to put toward super.
  //  - company (Here & Now): SG is a legal obligation on wages paid to a director/employee,
  //    so the base stays gross wages from Director pay / drawings.
  function defaultSuperRate(ent) { return (ent && ent.super_rate_pct != null && ent.super_rate_pct !== '') ? num(ent.super_rate_pct) : 12; }
  function monthLabel(ym) { const parts = ym.split('-').map(Number); return new Date(parts[0], parts[1] - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }); }
  function isSoleTrader(ent) { return ent && ent.entity_type === 'sole_trader'; }
  // { 'YYYY-MM': { income, expense } } — paid invoices vs. deductible expenses, each in their own month
  function soleTraderMonthly(id) {
    const m = {};
    S.invoices.filter(i => i.entity_id === id && i.status === 'paid').forEach(i => {
      if (!i.paid_date) return; const key = i.paid_date.slice(0, 7);
      m[key] = m[key] || { income: 0, expense: 0 }; m[key].income += num(i.amount_ex_gst);
    });
    S.expenses.filter(e => e.entity_id === id && e.deductible).forEach(e => {
      if (!e.expense_date) return; const key = e.expense_date.slice(0, 7);
      m[key] = m[key] || { income: 0, expense: 0 }; m[key].expense += num(e.amount_ex_gst);
    });
    return m;
  }
  function superBaseLabel(ent) { return isSoleTrader(ent) ? 'net income (after expenses)' : 'gross wages'; }

  function superSection() {
    const ids = entIds();
    let totBase = 0, totPaid = 0, totReq = 0;
    ids.forEach(id => {
      const ent = S.entities.find(e => e.id === id);
      const rate = defaultSuperRate(ent);
      let base;
      if (isSoleTrader(ent)) {
        const mm = soleTraderMonthly(id);
        base = Object.keys(mm).reduce((s, k) => s + mm[k].income - mm[k].expense, 0);
      } else {
        base = S.wages.filter(w => w.entity_id === id).reduce((s, w) => s + num(w.gross), 0);
      }
      const paid = S.wages.filter(w => w.entity_id === id).reduce((s, w) => s + num(w.super_amt), 0);
      totBase += base; totPaid += paid; totReq += round2(Math.max(base, 0) * rate / 100);
    });
    const variance = round2(totPaid - totReq);
    const mixedBase = ids.length > 1 && new Set(ids.map(id => superBaseLabel(S.entities.find(e => e.id === id)))).size > 1;
    const baseLabel = mixedBase ? 'income base' : superBaseLabel(S.entities.find(e => e.id === ids[0]));
    const rateNote = ids.length > 1 ? 'at each entity\'s target rate' : defaultSuperRate(S.entities.find(e => e.id === ids[0])) + '% of ' + baseLabel;

    const cardsHtml = '<div class="tx-cards">' +
      card('', 'Super paid (FY)', money(totPaid), 'actual payments logged in Director pay / drawings below') +
      card('', 'Super required (FY)', money(totReq), rateNote + ' · ' + money(totBase) + ' ' + baseLabel) +
      card('', variance >= 0 ? 'Ahead' : 'Behind target', money(Math.abs(variance)), variance >= 0 ? 'paid more than the target so far' : 'still needed to hit the target', variance >= 0 ? 'neg' : 'pos') +
      '</div>';

    // Monthly breakdown — sole trader base = that month's paid income minus that month's
    // deductible expenses (can go negative in a heavy-expense month; "required" floors at $0).
    // Company base = that month's gross wages. Super paid always keyed by wage pay_date.
    const monthly = {};
    function bucket(key, id) { monthly[key] = monthly[key] || {}; monthly[key][id] = monthly[key][id] || { base: 0, paid: 0 }; return monthly[key][id]; }
    ids.forEach(id => {
      const ent = S.entities.find(e => e.id === id);
      if (isSoleTrader(ent)) {
        const mm = soleTraderMonthly(id);
        Object.keys(mm).forEach(key => { bucket(key, id).base += mm[key].income - mm[key].expense; });
      } else {
        S.wages.filter(w => w.entity_id === id).forEach(w => { if (w.pay_date) bucket(w.pay_date.slice(0, 7), id).base += num(w.gross); });
      }
      S.wages.filter(w => w.entity_id === id).forEach(w => { if (w.pay_date) bucket(w.pay_date.slice(0, 7), id).paid += num(w.super_amt); });
    });
    const months = Object.keys(monthly).sort();
    let rowsHtml = '';
    months.forEach(mo => {
      ids.forEach(id => {
        const m = monthly[mo][id]; if (!m) return;
        const ent = S.entities.find(e => e.id === id);
        const rate = defaultSuperRate(ent);
        const req = round2(Math.max(m.base, 0) * rate / 100);
        const varc = round2(m.paid - req);
        rowsHtml += '<tr>' +
          '<td class="muted">' + monthLabel(mo) + '</td>' +
          (ids.length > 1 ? '<td class="muted">' + esc2(entName(id)) + '</td>' : '') +
          '<td class="num">' + money2(m.base) + '</td>' +
          '<td class="num">' + money2(req) + '</td>' +
          '<td class="num">' + money2(m.paid) + '</td>' +
          '<td class="num ' + (varc < 0 ? 'neg-behind' : 'pos-ahead') + '">' + money2(varc) + '</td>' +
          '</tr>';
      });
    });
    if (!rowsHtml) rowsHtml = '<tr><td colspan="' + (ids.length > 1 ? 6 : 5) + '" class="tx-empty">Nothing logged yet — paid invoices/expenses (sole trader) or gross wages (company) will show here once entered.</td></tr>';

    const table = '<div class="tx-table-wrap"><table class="tx-table"><thead><tr>' +
      '<th>Month</th>' + (ids.length > 1 ? '<th>Entity</th>' : '') + '<th class="num">' + (mixedBase ? 'Income base' : (baseLabel === 'gross wages' ? 'Gross wages' : 'Net income')) + '</th><th class="num">Super required</th><th class="num">Super paid</th><th class="num">Variance</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';

    const body = cardsHtml + superTaxNote(ids) + superRatesRow() + table;
    return section('Super contributions', 'Beets & Co target = net income (paid invoices minus deductible expenses) × rate (sole trader, no compulsory SG on yourself) · Here & Now target = gross wages × rate (company SG obligation)', body);
  }

  // Personal deductible super contributions (sole trader entities only): taxed at a flat 15%
  // inside the fund instead of your income-tax reserve rate, up to the concessional cap —
  // and only once a notice of intent to claim has been lodged with and acknowledged by the fund.
  function superTaxNote(ids) {
    const soleIds = ids.filter(id => isSoleTrader(S.entities.find(e => e.id === id)));
    if (!soleIds.length) return '';
    const cap = concessionalCap();
    let html = soleIds.map(id => {
      const ent = S.entities.find(e => e.id === id);
      const paid = S.wages.filter(w => w.entity_id === id).reduce((s, w) => s + num(w.super_amt), 0);
      const capped = Math.min(paid, cap);
      const over = round2(Math.max(paid - cap, 0));
      const marginal = num(ent.reserve_pct);
      const saved = marginal > 15 ? round2(capped * (marginal - 15) / 100) : 0;
      return '<div class="tx-action"><span class="tx-action-ic">🏦</span><div>' +
        '<b>' + esc2(ent.name) + '</b> — as a sole trader you can claim personal super contributions as a tax deduction (lodge a "notice of intent to claim a deduction" with your fund and get it acknowledged before you lodge your return). ' +
        'Inside the fund, deductible contributions are taxed at a flat <b>15%</b> — not your ~' + (marginal || '—') + '% reserve rate — so this genuinely lowers what you owe, up to the cap. ' +
        money(capped) + ' of ' + money(paid) + ' contributed this ' + fyLabel + ' counts toward the ' + money(cap) + ' concessional cap' +
        (over > 0 ? ' (' + money(over) + ' is over the cap — excess isn\'t concessional and gets taxed at your marginal rate instead, so it\'s worth pulling contributions back under the cap where you can)' : '') + '.' +
        (saved > 0 ? ' Estimated tax saved so far this FY: <b>' + money(saved) + '</b> — already reflected in the “Set aside for tax” card above.' : '') +
        '</div></div>';
    }).join('');
    return '<div class="tx-actions" style="margin:0 0 14px;">' + html + '</div>';
  }

  function superRatesRow() {
    return '<div class="tx-super-rates">' + S.entities.map(e => {
      const rate = defaultSuperRate(e);
      return '<label class="tx-super-rate">' + esc2(e.name) + ' target rate <input class="tx-in xs" type="number" step="0.5" min="0" max="100" value="' + rate + '" onchange="Tax.setSuperRate(\'' + e.id + '\', this.value)"/>%</label>';
    }).join('') + '</div>';
  }

  // ── Small render utils ───────────────────────────────────────────────
  function section(label, note, body) {
    return '<div class="tx-section"><div class="tx-section-head"><div class="tx-section-label">' + label + '</div>' + (note ? '<div class="tx-section-note">' + note + '</div>' : '') + '</div>' + body + '</div>';
  }
  function entName(id) { const e = S.entities.find(x => x.id === id); return e ? e.name : id; }
  function entSelect(elId) { return '<select class="tx-in md" id="' + elId + '">' + S.entities.map(e => '<option value="' + e.id + '">' + esc2(e.name) + '</option>').join('') + '</select>'; }
  function statusSelect(id, val, opts, handler) {
    return '<select class="tx-status-sel" onchange="' + handler + '(' + id + ', this.value)">' + opts.map(o => '<option value="' + o + '"' + (o === val ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>';
  }
  function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
  function checked(id) { const el = document.getElementById(id); return el ? el.checked : false; }
  function pickEntity(elId) { return S.current === 'all' ? (val(elId) || (S.entities[0] && S.entities[0].id)) : S.current; }

  // ── Mutations ────────────────────────────────────────────────────────
  async function reloadAndRender() { await load(); render(); }

  const Tax = {
    async init() { if (!document.getElementById('tax-page')) return; if (!S.loaded) { render(); try { await load(); } catch (e) { document.getElementById('tax-page').innerHTML = '<div class="tx-page"><p style="color:var(--rust)">Could not load tax data: ' + esc2(e.message) + '</p></div>'; return; } } render(); },
    setEntity(id) { S.current = id; render(); },

    async addInvoice() {
      const entity = pickEntity('ni-ent'); const amt = val('ni-amt');
      if (!num(amt)) return notify('Enter an amount', true);
      const g = splitGst(amt, checked('ni-gst'), true);
      const status = val('ni-status') || 'sent';
      const row = { entity_id: entity, client: val('ni-client') || null, invoice_number: val('ni-num') || null, issue_date: val('ni-issue') || null, due_date: val('ni-due') || null, amount_ex_gst: g.ex, gst_amount: g.gst, status, paid_date: status === 'paid' ? (val('ni-issue') || todayISO()) : null, fy: FY };
      try { await sbApi('tax_invoices', '', 'POST', row); notify('Invoice added'); await reloadAndRender(); } catch (e) { notify('Failed: ' + e.message, true); }
    },
    async markPaid(id) {
      try { await sbApi('tax_invoices', '?id=eq.' + id, 'PATCH', { status: 'paid', paid_date: todayISO() }); const i = S.invoices.find(x => x.id === id); if (i) { i.status = 'paid'; i.paid_date = todayISO(); } render(); notify('Marked paid'); } catch (e) { notify('Failed: ' + e.message, true); }
    },
    async delInvoice(id) { try { await sbApi('tax_invoices', '?id=eq.' + id, 'DELETE'); S.invoices = S.invoices.filter(x => x.id !== id); render(); notify('Invoice deleted'); } catch (e) { notify('Failed: ' + e.message, true); } },

    cancelEdit() { S.editInv = null; S.editExp = null; S.editWage = null; render(); },
    editInvoice(id) { S.editInv = id; S.editExp = null; S.editWage = null; render(); },
    async saveInvoice(id) {
      const entity = S.current === 'all' ? (val('ei-ent-' + id) || (S.entities[0] && S.entities[0].id)) : S.current;
      const status = val('ei-status-' + id) || 'sent';
      const existing = S.invoices.find(x => x.id === id) || {};
      const patch = {
        entity_id: entity, client: val('ei-client-' + id) || null, invoice_number: val('ei-num-' + id) || null,
        issue_date: val('ei-issue-' + id) || null, due_date: val('ei-due-' + id) || null,
        amount_ex_gst: round2(num(val('ei-exgst-' + id))), gst_amount: round2(num(val('ei-gst-' + id))),
        status, paid_date: status === 'paid' ? (existing.paid_date || todayISO()) : null
      };
      try { await sbApi('tax_invoices', '?id=eq.' + id, 'PATCH', patch); notify('Invoice updated'); S.editInv = null; await reloadAndRender(); } catch (e) { notify('Failed: ' + e.message, true); }
    },

    async addExpense() {
      const entity = pickEntity('ne-ent'); const amt = val('ne-amt');
      if (!num(amt)) return notify('Enter an amount', true);
      const g = splitGst(amt, checked('ne-gst'), true);
      const expDate = val('ne-date') || todayISO();
      const isRecurring = checked('ne-recur');
      const desc = val('ne-desc') || null, cat = val('ne-cat') || null, ded = checked('ne-ded');
      const row = { entity_id: entity, description: desc, category: cat, expense_date: expDate, amount_ex_gst: g.ex, gst_amount: g.gst, deductible: ded, fy: FY };
      try {
        if (isRecurring) {
          const day = Number(expDate.slice(8, 10));
          const recRow = { entity_id: entity, description: desc, category: cat, amount: num(amt), includes_gst: checked('ne-gst'), deductible: ded, day_of_month: day, next_run: addMonthsClamped(expDate, 1), active: true };
          const createdRec = await sbApi('tax_recurring_expenses', '', 'POST', recRow);
          if (createdRec && createdRec[0]) row.recurring_id = createdRec[0].id;
        }
        await sbApi('tax_expenses', '', 'POST', row);
        notify(isRecurring ? 'Expense added — will repeat monthly' : 'Expense added');
        await reloadAndRender();
      } catch (e) { notify('Failed: ' + e.message, true); }
    },
    async delExpense(id) { try { await sbApi('tax_expenses', '?id=eq.' + id, 'DELETE'); S.expenses = S.expenses.filter(x => x.id !== id); render(); notify('Expense deleted'); } catch (e) { notify('Failed: ' + e.message, true); } },

    editExpense(id) { S.editExp = id; S.editInv = null; S.editWage = null; render(); },
    async saveExpense(id) {
      const entity = S.current === 'all' ? (val('ee-ent-' + id) || (S.entities[0] && S.entities[0].id)) : S.current;
      const patch = {
        entity_id: entity, description: val('ee-desc-' + id) || null, category: val('ee-cat-' + id) || null,
        expense_date: val('ee-date-' + id) || null, amount_ex_gst: round2(num(val('ee-exgst-' + id))),
        gst_amount: round2(num(val('ee-gst-' + id))), deductible: checked('ee-ded-' + id)
      };
      try { await sbApi('tax_expenses', '?id=eq.' + id, 'PATCH', patch); notify('Expense updated'); S.editExp = null; await reloadAndRender(); } catch (e) { notify('Failed: ' + e.message, true); }
    },
    async stopRecurring(id) {
      if (!confirm('Stop this recurring expense? Past entries stay — future ones will no longer be added automatically.')) return;
      try { await sbApi('tax_recurring_expenses', '?id=eq.' + id, 'PATCH', { active: false }); S.recurring = S.recurring.filter(r => r.id !== id); render(); notify('Recurring expense stopped'); } catch (e) { notify('Failed: ' + e.message, true); }
    },

    async addWage() {
      const entity = pickEntity('nw-ent');
      if (!num(val('nw-gross'))) return notify('Enter a gross amount', true);
      const row = { entity_id: entity, pay_date: val('nw-date') || todayISO(), notes: val('nw-note') || null, gross: round2(num(val('nw-gross'))), paygw: round2(num(val('nw-payg'))), super_amt: round2(num(val('nw-super'))), fy: FY };
      try { await sbApi('tax_wages', '', 'POST', row); notify('Pay run added'); await reloadAndRender(); } catch (e) { notify('Failed: ' + e.message, true); }
    },
    async delWage(id) { try { await sbApi('tax_wages', '?id=eq.' + id, 'DELETE'); S.wages = S.wages.filter(x => x.id !== id); render(); notify('Deleted'); } catch (e) { notify('Failed: ' + e.message, true); } },

    editWage(id) { S.editWage = id; S.editInv = null; S.editExp = null; render(); },
    async saveWage(id) {
      const entity = S.current === 'all' ? (val('ew-ent-' + id) || (S.entities[0] && S.entities[0].id)) : S.current;
      const patch = {
        entity_id: entity, pay_date: val('ew-date-' + id) || null, notes: val('ew-note-' + id) || null,
        gross: round2(num(val('ew-gross-' + id))), paygw: round2(num(val('ew-payg-' + id))), super_amt: round2(num(val('ew-super-' + id)))
      };
      try { await sbApi('tax_wages', '?id=eq.' + id, 'PATCH', patch); notify('Pay run updated'); S.editWage = null; await reloadAndRender(); } catch (e) { notify('Failed: ' + e.message, true); }
    },

    async setBasStatus(id, status) {
      const patch = { status, lodged_date: (status === 'lodged' || status === 'paid') ? todayISO() : null };
      try { await sbApi('tax_bas_periods', '?id=eq.' + id, 'PATCH', patch); const b = S.bas.find(x => x.id === id); if (b) { b.status = status; b.lodged_date = patch.lodged_date; } render(); notify('BAS updated'); } catch (e) { notify('Failed: ' + e.message, true); }
    },

    async setSuperRate(entityId, rate) {
      const r = num(rate);
      try { await sbApi('tax_entities', '?id=eq.' + entityId, 'PATCH', { super_rate_pct: r }); const ent = S.entities.find(e => e.id === entityId); if (ent) ent.super_rate_pct = r; render(); notify('Target super rate updated'); } catch (e) { notify('Failed: ' + e.message, true); }
    }
  };

  window.Tax = Tax;
})();
