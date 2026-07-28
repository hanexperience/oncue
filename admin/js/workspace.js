/* ============================================================
   CONFIG
   ============================================================ */
const SUPABASE_URL = "https://rrxveifshucpinajtkgf.supabase.co";
const SUPABASE_KEY = "sb_publishable_548FF3LDIHbz55iHtylFZw_HKBW06Aj";
// ▼ Passcodes, each mapped to which clients they can see/switch between.
//   allow: null means "every client in the picker" (Han's own passcode).
//   allow: [...] restricts the picker to just those client slugs — a VA
//   passcode only ever sees the client(s) they're assigned to, and can't
//   switch to anything else via the dropdown.
//   Add a new entry here for each new VA/client pairing. Change any value
//   any time — this is a light UI gate, not bank-grade security (the app's
//   Supabase key is visible in this file's source either way), but it does
//   stop a VA from casually browsing into other clients' content/calendar.
const PASSCODES = {
  "crowncon-va": { role: "va", allow: ["crowncon"] },
  "beets-owner-2026": { role: "owner", allow: null }
};

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const FUNCTIONS_URL = SUPABASE_URL + "/functions/v1";
// Only needed if you set a SYNC_SECRET in Supabase Edge Function secrets:
const SYNC_TOKEN = "";

/* Shared option sets */
const PLATFORMS = ["IG feed","IG Reel","IG Trial Reel","IG Story","YT long-form","YT Short","FB feed","FB Story","FB Reel"];
const PILLARS = ["Dream","Craft","Proof","Process","Meet Tim","Knowledge","Background"];

/* UTM Builder (2026-07-27) — config lives here so campaigns/audiences can be
   edited without touching the render/generator logic below. */
const UTM_CAMPAIGNS = [
  { value:"kdr-custom-home", label:"KDR Custom Home" },
  { value:"custom-builder-melbourne", label:"Custom Builder Melbourne" },
  { value:"home-renovation", label:"Home Renovation" },
  { value:"property-investment", label:"Property Investment" },
  { value:"australian-building", label:"Australian Building" },
  { value:"family-home-build", label:"Family Home Build" }
];
const UTM_SUBREDDITS = [
  { value:"r_melbourne", label:"r/melbourne" },
  { value:"r_ausproperty", label:"r/AusProperty" },
  { value:"r_homeimprovement", label:"r/HomeImprovement" },
  { value:"r_buildersau", label:"r/BuildersAustralia" },
  { value:"r_australiahousing", label:"r/australia (Housing)" },
  { value:"r_constructionau", label:"r/constructionau" },
  { value:"reddit_ad", label:"Reddit Ad (Paid)" }
];
const UTM_FB_AUDIENCES = [
  { value:"fb_melbourne", label:"Melbourne Area" },
  { value:"fb_bayside", label:"Bayside Suburbs" },
  { value:"fb_homeowners", label:"Homeowners 40-65" },
  { value:"fb_custom", label:"Custom Audience" },
  { value:"fb_lookalike", label:"Lookalike Audience" }
];

/* Collection definitions — each becomes a tab (except dashboard/settings) */
const COLLECTIONS = {
  content: {
    table:"va_content_items", title:"Content Library", icon:"",
    sub:"Every video/photo waiting for a caption. Drop files in the Drive folder",
    orderBy:"created_at", newLabel:"+ Add content item",
    fields:[
      {k:"name",l:"Name / file",t:"text",full:true},
      {k:"status",l:"Status",t:"status",o:["New from Drive","Needs description","Description written","Tim approved","Scheduled","Posted"]},
      {k:"type",l:"Type",t:"select",o:["video","photo","carousel"]},
      {k:"aspect_ratio",l:"Aspect",t:"select",o:["9:16","16:9","4:5","1:1"]},
      {k:"dimensions",l:"Dimensions (auto)",t:"text"},
      {k:"pillar",l:"Pillar",t:"select",o:PILLARS},
      {k:"drive_link",l:"Drive link",t:"url",full:true},
      {k:"platforms",l:"Platforms",t:"multi",o:PLATFORMS,full:true},
      {k:"collaborators",l:"IG Collaborators (usernames, comma-separated, max 3 — feed/Reel only)",t:"text",full:true},
      {k:"tagged_accounts",l:"Tag accounts (usernames, comma-separated — @mention tag, no invite needed, feed/Reel only)",t:"text",full:true},
      {k:"cover_image_url",l:"Cover image (Reels/YouTube — pick a synced photo, or paste an image URL)",t:"cover_ref",full:true},
      {k:"description",l:"Description / caption (Beets writes)",t:"textarea",full:true}
    ]
  },
  blog: {
    table:"va_blog_posts", title:"Blog Posts",
    sub:"Every blog post exists to target a keyword — track what's live, what it targets, and tie posts back to a social pillar.",
    orderBy:"published_date", newLabel:"+ Add blog post",
    fields:[
      {k:"title",l:"Blog post title",t:"text",full:true},
      {k:"status",l:"Status",t:"status",o:["Draft","In review","Published"]},
      {k:"published_date",l:"Date published",t:"date"},
      {k:"url",l:"Live URL",t:"url"},
      {k:"target_keywords",l:"Target keywords (comma-separated)",t:"text",full:true}
    ]
  },
calendar: {
    table:"va_calendar_slots", title:"Posting Calendar",
    sub:"One row per scheduled post — dated, timed, and tagged by pillar.",
    orderBy:"slot_date", newLabel:"+ Add post slot",
    fields:[
      {k:"slot_date",l:"Date",t:"date"},
      {k:"slot_time",l:"Scheduled Time (AEST)",t:"time"},
      {k:"pillar",l:"Pillar",t:"select",o:PILLARS},
      {k:"status",l:"Status",t:"status",o:["Planned","Asset ready","Caption written","Tim approved","Scheduled","Posted","Cancelled"]},
      {k:"content_item_id",l:"Assigned video / content",t:"content_ref",full:true},
      {k:"platforms",l:"Platforms",t:"multi",o:PLATFORMS,full:true},
      {k:"collaborators",l:"IG Collaborators (usernames, comma-separated, max 3 — overrides the content item's, feed/Reel only)",t:"text",full:true},
      {k:"tagged_accounts",l:"Tag accounts (usernames, comma-separated — overrides the content item's, feed/Reel only)",t:"text",full:true},
      {k:"cover_image_url",l:"Cover image (Reels/YouTube — pick a synced photo, or paste an image URL; overrides the content item's)",t:"cover_ref",full:true},
      {k:"caption",l:"Caption",t:"textarea",full:true},
      {k:"notes",l:"Notes",t:"text",full:true}
    ]
  },
  reviews: {
    table:"va_reviews", title:"Reviews",
    sub:"Push past 10 Google reviews. Ask in Tim's voice, follow up once, respond to every review within 48h.",
    orderBy:"created_at", newLabel:"+ Add client",
    icon:"⭐", titleKey:"client", subtitleKey:"project", previewKey:"notes",
    fields:[
      {k:"client",l:"Client",t:"text"},
      {k:"project",l:"Project",t:"text"},
      {k:"channel",l:"Channel",t:"select",o:["","SMS","Email","In person","Other"]},
      {k:"asked_date",l:"Asked",t:"date"},
      {k:"rating",l:"Rating",t:"select",o:["","1","2","3","4","5"]},
      {k:"reply_status",l:"Reply",t:"status",o:["None","Draft","Tim approved","Posted"]},
      {k:"followed_up",l:"Followed up",t:"bool"},
      {k:"received",l:"Review received",t:"bool"},
      {k:"reply_draft",l:"Reply draft",t:"textarea",full:true},
      {k:"notes",l:"Notes",t:"text",full:true}
    ]
  },
  guest: {
    table:"va_guest_posts", title:"Guest Posts",
    sub:"Track outreach for backlinks: who we contacted, price, submission and status.",
    orderBy:"created_at", newLabel:"+ Add guest post",
    icon:"🔗", titleKey:"site_name", subtitleKey:"contact", previewKey:"notes",
    fields:[
      {k:"site_name",l:"Site / publication",t:"text"},
      {k:"status",l:"Status",t:"status",o:["Not Contacted","Contacted","Negotiating","Agreed","Submitted","Published","Declined"]},
      {k:"contact",l:"Contact name",t:"text"},
      {k:"contact_email",l:"Contact email",t:"email"},
      {k:"site_url",l:"Site URL",t:"url"},
      {k:"price",l:"Price (AUD)",t:"number"},
      {k:"date_contacted",l:"Date contacted",t:"date"},
      {k:"date_published",l:"Date published",t:"date"},
      {k:"submitted_url",l:"Published / submitted URL",t:"url",full:true},
      {k:"notes",l:"Notes",t:"textarea",full:true}
    ]
  },
  pins: {
    table:"va_pins", title:"Pinterest",
    sub:"Draft pins → Beets/Tim approve titles → publish. Keyword-rich titles, linked to a project/blog page.",
    orderBy:"created_at", newLabel:"+ Add pin",
    icon:"📌", titleKey:"title", subtitleKey:"board", previewKey:"description",
    fields:[
      {k:"title",l:"Keyword title",t:"text",full:true},
      {k:"status",l:"Status",t:"status",o:["Draft","Approved","Published"]},
      {k:"board",l:"Board",t:"text"},
      {k:"image_ref",l:"Image ref",t:"text"},
      {k:"link_url",l:"Destination link",t:"url",full:true},
      {k:"description",l:"Description",t:"textarea",full:true},
      {k:"notes",l:"Notes",t:"text",full:true}
    ]
  },
  directories: {
    table:"va_directories", title:"Directories",
    sub:"Use the EXACT master NAP every time (copy it from the top bar). Consistency is what counts.",
    orderBy:"created_at", newLabel:"+ Add directory",
    icon:"📇", titleKey:"name", previewKey:"notes",
    fields:[
      {k:"name",l:"Directory",t:"text"},
      {k:"status",l:"Status",t:"status",o:["To do","Submitted","Live","Needs fix"]},
      {k:"submitted",l:"Submitted",t:"bool"},
      {k:"url",l:"URL",t:"url",full:true},
      {k:"notes",l:"Notes",t:"text",full:true}
    ]
  },
  dm: {
    table:"va_dm_contacts", title:"DM Audit",
    sub:"Comb past Instagram DMs. List real contacts (skip spam). Flag review candidates; offer reciprocal reviews to business contacts.",
    orderBy:"created_at", newLabel:"+ Add contact",
    icon:"💬", titleKey:"handle", subtitleKey:"relationship", previewKey:"notes",
    fields:[
      {k:"handle",l:"Handle / name",t:"text"},
      {k:"status",l:"Status",t:"status",o:["To review","Reaching out","Asked","Done","Ignore"]},
      {k:"relationship",l:"Relationship",t:"text"},
      {k:"last_interaction",l:"Last interaction",t:"text"},
      {k:"review_candidate",l:"Review candidate",t:"bool"},
      {k:"reciprocal_offer",l:"Reciprocal offer",t:"bool"},
      {k:"notes",l:"Notes",t:"text",full:true}
    ]
  },
  reddit: {
    table:"va_reddit_threads", title:"Reddit/Facebook Watch",
    sub:"Flag relevant threads — don't reply yourself. The reply goes out in Tim's voice.",
    orderBy:"created_at", newLabel:"+ Add thread",
    icon:"👽", titleKey:"url", subtitleKey:"handled_by", previewKey:"note", emptyTitle:"(no thread URL yet)",
    fields:[
      {k:"url",l:"Thread URL",t:"url",full:true},
      {k:"status",l:"Status",t:"status",o:["Flagged","Reply drafted","Posted","Skip"]},
      {k:"handled_by",l:"Handled by",t:"text"},
      {k:"thread_date",l:"Date",t:"date"},
      {k:"note",l:"Why relevant",t:"textarea",full:true}
    ]
  },
  gbp: {
    table:"va_gbp_tasks", title:"GBP Tasks",
    sub:"Google Business Profile: weekly posts, fresh photos (from Tim), Q&A, review replies.",
    orderBy:"created_at", newLabel:"+ Add GBP task",
    icon:"📍", titleKey:"task_type", subtitleKey:"week", previewKey:"notes", emptyTitle:"(task type not set)",
    fields:[
      {k:"task_type",l:"Type",t:"select",o:["Post","Photos","Q&A","Review reply"]},
      {k:"status",l:"Status",t:"status",o:["To do","Done"]},
      {k:"week",l:"Week",t:"text"},
      {k:"notes",l:"Notes",t:"text",full:true}
    ]
  },
  notes: {
    table:"va_notes", title:"Handoff Notes",
    sub:"Running log between Beets and the VA. Newest first.",
    orderBy:"created_at", newLabel:"+ Add note",
    icon:"🗒️", titleKey:"author", previewKey:"body", emptyTitle:"(no author set)",
    fields:[
      {k:"author",l:"From",t:"text"},
      {k:"body",l:"Note",t:"textarea",full:true}
    ]
  }
};

const TAB_ORDER = ["dashboard","content","blog","calendar","performance","reviews","guest","pins","directories","dm","reddit","utm","gbp","notes","settings"];
const TAB_LABELS = {dashboard:"This Week", settings:"Brand & Setup", performance:"Performance", utm:"UTM Builder"};

/* ============================================================
   MODULE TABS (2026-07-18) — owner-only tabs served by external
   modules (js/business.js, js/command.js, js/tax.js) instead of
   the collections engine. These are GLOBAL: not filtered by the
   client picker (Business manages all clients at once; Command is
   Michael's personal cross-business board). The picker/NAP bar is
   hidden while one is open so it can't imply a scope it doesn't have.
   ============================================================ */
const MODULE_TABS = {
  clients:  { group:"Business", label:"Clients",   run:v=>window.BusinessModule.render(v,"clients") },
  leads:    { group:"Business", label:"Leads",     run:v=>window.BusinessModule.render(v,"leads") },
  projects: { group:"Command",  label:"Projects",  run:v=>window.CommandModule.render(v) },
  tax:      { group:"Command",  label:"Tax / BAS", run:v=>window.CommandModule.renderTax(v) },
  // Tools (2026-07-28): unlike Business/Command, this is visible to VAs too
  // — it's a standalone creative utility (Instagram grid layout planner),
  // not client data that needs owner-only gating. ownerOnly:false is what
  // exempts it from the owner-only checks in buildSections/switchSection/
  // openTab below.
  tools:    { group:"Tools",    label:"Grid Builder", ownerOnly:false, run:v=>renderGridBuilder(v) }
};
const MODULE_TAB_ORDER = ["clients","leads","projects","tax","tools"];
function isOwner(){ return getAccess().role === "owner"; }

// Tools → Grid Builder (2026-07-28): a self-contained single-file Instagram
// grid layout tool (tools/grid-builder.html, deployed at /admin/tools/...).
// It manages its own full-page layout (dark theme, own fonts/canvas), so it
// is embedded via iframe rather than ported into this app's CSS/DOM the way
// Business/Command were — far lower risk of style/handler collisions, and
// the tool has no need to talk to Supabase or this app's state at all.
function renderGridBuilder(view){
  view.innerHTML = `<iframe src="/admin/tools/grid-builder.html" title="Grid Builder" style="width:100%;height:calc(100vh - 130px);border:none;display:block;background:#0C0C0C"></iframe>`;
}

/* ── Sections (2026-07-18) ──
   Top-level switcher in the header: Workspace (per-client tabs) |
   Business | Command | Tools. The tab row only ever shows the active
   section's tabs. VAs get a trimmed switcher (Workspace + Tools only) —
   Business/Command stay owner-only. */
let CURRENT_SECTION = 'Workspace';
const SECTION_DEFAULT_TAB = { Workspace:'dashboard', Business:'clients', Command:'projects', Tools:'tools' };
function sectionOf(tab){ return MODULE_TABS[tab] ? MODULE_TABS[tab].group : 'Workspace'; }
function buildSections(){
  const el = document.getElementById('sections');
  if(!el) return;
  const sections = isOwner() ? ['Workspace','Business','Command','Tools'] : ['Workspace','Tools'];
  el.innerHTML = sections.map(sec=>
    `<button data-sec="${sec}" class="${sec===CURRENT_SECTION?'active':''}" onclick="switchSection('${sec}')">${sec}</button>`
  ).join('');
}
function switchSection(sec){
  if(!isOwner() && sec!=='Workspace' && sec!=='Tools') return;
  CURRENT_SECTION = sec;
  buildSections();
  buildTabs();
  // Reopen the tab you last used in that section, falling back to its default.
  const remembered = localStorage.getItem('cc_tab_'+sec);
  const valid = sec==='Workspace'
    ? TAB_ORDER.includes(remembered)
    : (MODULE_TABS[remembered] && MODULE_TABS[remembered].group===sec);
  openTab(valid ? remembered : SECTION_DEFAULT_TAB[sec]);
}

let SETTINGS = {};

/* ============================================================
   MULTI-CLIENT (2026-07-17, fully isolated as of the same day's
   follow-up fix): one shared Ops Workspace, switchable between
   clients via a picker in the top bar. Every tab — Content Library,
   Posting Calendar, Performance, Reviews, Guest Posts, Pins,
   Directories, DM Audit, Reddit Watch, GBP Tasks, Handoff Notes,
   Anchor Tasks, and Brand & Setup (NAP/brand voice/Drive folder) —
   is filtered and saved by CURRENT_CLIENT_ID. Nothing is shared
   between clients any more; switching the picker gives you a
   completely separate workspace. Publishing/stats already resolve
   credentials per-client server-side (see social-publish /
   social-stats edge functions). Selection persists in localStorage
   across reloads. A brand-new client starts with everything empty —
   including Brand & Setup, so set its NAP/Drive folder there before
   using Sync from Drive.
   ============================================================ */
let CLIENTS = [];
let CURRENT_CLIENT_ID = localStorage.getItem('cc_client_id') || null;
let CURRENT_TAB = 'dashboard';

async function loadClients(){
  // Reads from the client_picker VIEW, not the clients table directly — the
  // clients table has RLS locked down tight (it also stores client portal
  // access codes for Beets & Co, which the anon key must never be able to
  // read), so a direct select from it silently returns zero rows rather
  // than an error. client_picker exposes only id+name and is safe for the
  // anon/publishable key this workspace runs on.
  const {data,error} = await sb.from('client_picker').select('id,name,slug,base_url').order('name');
  if(error){ toast('Could not load clients: '+error.message); return; }
  const all = data || [];
  const access = getAccess();
  // allow:null (owner passcode) sees every client; allow:[...] (VA passcode)
  // only ever sees the client(s) they're assigned to — the dropdown simply
  // never contains anything else to switch to.
  CLIENTS = access.allow ? all.filter(c=>access.allow.includes(c.slug)) : all;
  if(!CLIENTS.length) return;
  // Default: keep the saved selection if it's still a real (and permitted)
  // client; otherwise prefer Crowncon (this workspace's primary client)
  // over whatever's first.
  if(!CURRENT_CLIENT_ID || !CLIENTS.some(c=>c.id===CURRENT_CLIENT_ID)){
    const crowncon = CLIENTS.find(c=>/crowncon/i.test(c.name||''));
    CURRENT_CLIENT_ID = (crowncon || CLIENTS[0]).id;
  }
  localStorage.setItem('cc_client_id', CURRENT_CLIENT_ID);
  renderClientPicker();
}
function renderClientPicker(){
  const sel = document.getElementById('clientPicker');
  if(!sel) return;
  sel.innerHTML = CLIENTS.map(c=>`<option value="${c.id}" ${c.id===CURRENT_CLIENT_ID?'selected':''}>${esc(c.name)}</option>`).join('');
  // Nothing to switch to (VA with a single assigned client) — show it as a
  // fixed label rather than a dropdown that implies other options exist.
  sel.disabled = CLIENTS.length<=1;
}
async function onChangeClient(id){
  if(id===CURRENT_CLIENT_ID) return;
  CURRENT_CLIENT_ID = id;
  localStorage.setItem('cc_client_id', id);
  const c = CLIENTS.find(x=>x.id===id);
  toast('Switched to ' + (c?c.name:'client'));
  // Settings (NAP/brand voice/Drive folder) are per-client now, so the top
  // bar needs a fresh load for whichever client we just switched to.
  await loadSettings();
  openTab(CURRENT_TAB || 'dashboard');
}

/* ============================================================
   GATE
   ============================================================ */
function tryUnlock(){
  const v = document.getElementById('pass').value.trim();
  const match = PASSCODES[v];
  if(match){
    sessionStorage.setItem('cc_ok','1');
    sessionStorage.setItem('cc_access', JSON.stringify(match));
    showApp();
  } else {
    document.getElementById('passErr').textContent = "Incorrect passcode";
  }
}
document.getElementById('pass').addEventListener('keydown',e=>{ if(e.key==='Enter') tryUnlock(); });
function lock(){ sessionStorage.removeItem('cc_ok'); sessionStorage.removeItem('cc_access'); location.reload(); }
// Fails safe to the most restrictive access (Crowncon VA) if the session
// somehow has no recorded access — e.g. a tab left open from before this
// feature existed. Never defaults to "owner, sees everything."
function getAccess(){
  try{ const raw = sessionStorage.getItem('cc_access'); if(raw) return JSON.parse(raw); }catch(e){}
  return { role: "va", allow: ["crowncon"] };
}

async function showApp(){
  document.getElementById('gate').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  // Clients must load first now — Settings is per-client, so it needs
  // CURRENT_CLIENT_ID resolved before it knows whose NAP/brand/Drive
  // folder to load.
  await loadClients();
  await loadSettings();
  // Reopen whichever tab was active before the last reload — including its
  // section (Workspace / Business / Command). Falls back to This Week.
  const savedTab = localStorage.getItem('cc_active_tab');
  const target = TAB_ORDER.includes(savedTab) || (MODULE_TABS[savedTab] && (MODULE_TABS[savedTab].ownerOnly!==false || isOwner())) ? savedTab : 'dashboard';
  CURRENT_SECTION = sectionOf(target);
  buildSections();
  buildTabs();
  openTab(target);
}
if(sessionStorage.getItem('cc_ok')==='1'){ showApp(); }

/* ============================================================
   SETTINGS / TOP BAR
   ============================================================ */
async function loadSettings(){
  SETTINGS = {};
  // Per-client (2026-07-17) — no client selected yet means no settings to
  // show; the top bar renders blank rather than leaking another client's
  // NAP/brand voice.
  if(!CURRENT_CLIENT_ID){ renderTopBar(); return; }
  const {data} = await sb.from('va_settings').select('*').eq('client_id',CURRENT_CLIENT_ID);
  (data||[]).forEach(r=>SETTINGS[r.key]=r.value);
  renderTopBar();
}
function renderTopBar(){
  const nap = SETTINGS.nap||{};
  document.getElementById('napBar').innerHTML =
    `<span><b>${esc(nap.name||'')}</b></span>`+
    `<span>${esc(nap.address||'')}</span>`+
    `<span><b>${esc(nap.phone||'')}</b></span>`+
    `<span>${esc(nap.email||'')}</span>`;
  document.getElementById('ruleLine').textContent = (SETTINGS.brand&&SETTINGS.brand.golden_rule)||'';
  const drive = (SETTINGS.drive&&SETTINGS.drive.folder_url)||'#';
  document.getElementById('driveBtn').href = drive;
}
function copyNAP(){
  const n = SETTINGS.nap||{};
  const txt = `${n.name}\n${n.address}\n${n.phone}\n${n.email}`;
  navigator.clipboard.writeText(txt).then(()=>toast('Master NAP copied'));
}

/* ============================================================
   TABS
   ============================================================ */
function buildTabs(){
  const nav = document.getElementById('tabs');
  if(CURRENT_SECTION==='Workspace'){
    nav.innerHTML = TAB_ORDER.map(id=>{
      const label = TAB_LABELS[id] || (COLLECTIONS[id] && COLLECTIONS[id].title) || id;
      return `<button data-tab="${id}" onclick="openTab('${id}')">${label}</button>`;
    }).join('');
  } else {
    nav.innerHTML = MODULE_TAB_ORDER
      .filter(id=>MODULE_TABS[id].group===CURRENT_SECTION)
      .map(id=>`<button data-tab="${id}" onclick="openTab('${id}')">${MODULE_TABS[id].label}</button>`)
      .join('');
  }
}
function setActive(id){
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active', b.dataset.tab===id));
}
// Hide the client picker / NAP bar / Drive button on global (Business/
// Command) tabs — they're per-client concepts and would imply a scope
// those tabs don't have. Restored the moment a Workspace tab reopens.
function setGlobalMode(on){
  document.querySelector('header').classList.toggle('global-mode', !!on);
  // Business/Command layouts are full-app designs (sidebar + wide editors) —
  // release them from the workspace's centered 1100px column.
  document.querySelector('main').classList.toggle('global-mode', !!on);
}
async function openTab(id){
  const sec = sectionOf(id);
  if(sec!==CURRENT_SECTION){ CURRENT_SECTION = sec; buildSections(); buildTabs(); }
  localStorage.setItem('cc_tab_'+sec, id);
  if(MODULE_TABS[id]){
    if(MODULE_TABS[id].ownerOnly!==false && !isOwner()){ toast('Owner access only'); return; }
    CURRENT_TAB = id;
    localStorage.setItem('cc_active_tab', id);
    setActive(id);
    setGlobalMode(true);
    const view = document.getElementById('view');
    view.innerHTML = '<div class="empty">Loading…</div>';
    try { await MODULE_TABS[id].run(view); }
    catch(e){ view.innerHTML = `<div class="empty">Module failed to load: ${esc(e.message)}</div>`; }
    return;
  }
  setGlobalMode(false);
  CURRENT_TAB = id;
  localStorage.setItem('cc_active_tab', id);
  setActive(id);
  const view = document.getElementById('view');
  view.innerHTML = '<div class="empty">Loading…</div>';
  if(id==='dashboard') return renderDashboard();
  if(id==='settings') return renderSettings();
  if(id==='content') return renderContent();
  if(id==='blog') return renderBlog();
  if(id==='calendar') return renderCalendar();
  if(id==='performance') return renderPerformance();
  if(id==='utm') return renderUTMBuilder();
  return renderCollection(id);
}

/* ============================================================
   UTM BUILDER (2026-07-27) — client-scoped like every other Workspace
   tab: uses CLIENTS[current].base_url (from the client_picker view) so
   the generated link always points at the right client's domain without
   retyping it. Pure frontend string-building, no Supabase writes.
   ============================================================ */
function currentClientObj(){ return CLIENTS.find(c=>c.id===CURRENT_CLIENT_ID); }
function utmAudienceOptions(platform){
  return platform==='facebook' ? UTM_FB_AUDIENCES : UTM_SUBREDDITS;
}
async function renderUTMBuilder(){
  const view = document.getElementById('view');
  if(!CURRENT_CLIENT_ID){ view.innerHTML = '<div class="empty">No client selected — pick one from the dropdown in the top bar.</div>'; return; }
  const client = currentClientObj();
  const hasBaseUrl = client && client.base_url;
  view.innerHTML =
    `<div class="tabhead"><div><h2>UTM Builder</h2><div class="sub">Build a trackable Reddit/Facebook link for ${esc(client?client.name:'this client')} — pick the options below, then copy.</div></div></div>
     ${hasBaseUrl?'':'<div class="callout">⚠️ No base URL set for this client yet — links will fall back to Crowncon\'s domain. Add one in the <code>clients.base_url</code> column.</div>'}
     <div class="card">
       <div class="grid">
         <div class="f">
           <label>Platform</label>
           <select id="utm-platform" onchange="updateUTM()">
             <option value="reddit">Reddit</option>
             <option value="facebook">Facebook</option>
           </select>
         </div>
         <div class="f">
           <label>Medium</label>
           <select id="utm-medium" onchange="updateUTM()">
             <option value="organic">Organic</option>
             <option value="cpc">CPC (Paid)</option>
           </select>
         </div>
         <div class="f">
           <label>Campaign</label>
           <select id="utm-campaign" onchange="updateUTM()">
             ${UTM_CAMPAIGNS.map(c=>`<option value="${c.value}">${esc(c.label)}</option>`).join('')}
           </select>
         </div>
         <div class="f" id="utm-audience-group">
           <label>Subreddit</label>
           <select id="utm-audience" onchange="updateUTM()">
             ${UTM_SUBREDDITS.map(a=>`<option value="${a.value}">${esc(a.label)}</option>`).join('')}
           </select>
         </div>
         <div class="f full">
           <label>Landing page (optional — path only, e.g. /contact)</label>
           <input type="text" id="utm-landing" placeholder="Leave blank for homepage" oninput="updateUTM()">
         </div>
       </div>
       <div class="utm-output" id="utm-output"></div>
       <div style="display:flex;align-items:center;gap:10px">
         <button class="btn-add" onclick="copyUTM()">Copy link</button>
         <span class="utm-status" id="utm-status"></span>
       </div>
     </div>`;
  updateUTM();
}
function updateUTM(){
  const platformSel = document.getElementById('utm-platform');
  if(!platformSel) return;
  const platform = platformSel.value;
  const medium = document.getElementById('utm-medium').value;
  const campaign = document.getElementById('utm-campaign').value;
  const landingRaw = document.getElementById('utm-landing').value.trim();

  // Swap the audience dropdown's options (and label) if the platform changed
  // — Reddit shows subreddits, Facebook shows saved audiences.
  const group = document.getElementById('utm-audience-group');
  const label = platform==='facebook' ? 'Facebook Audience' : 'Subreddit';
  const opts = utmAudienceOptions(platform);
  const existing = document.getElementById('utm-audience');
  const wrongSet = !existing || existing.dataset.platform !== platform;
  if(wrongSet){
    group.innerHTML = `<label>${label}</label><select id="utm-audience" data-platform="${platform}" onchange="updateUTM()">${opts.map(a=>`<option value="${a.value}">${esc(a.label)}</option>`).join('')}</select>`;
  }
  const audience = document.getElementById('utm-audience').value;

  const client = currentClientObj();
  let baseUrl = (client && client.base_url) ? client.base_url : 'https://crowncon.com.au';
  baseUrl = baseUrl.replace(/\/+$/,'');
  let landing = landingRaw ? (landingRaw.startsWith('/') ? landingRaw : '/'+landingRaw) : '';
  let url = baseUrl + landing;
  const separator = url.includes('?') ? '&' : '?';
  url += separator + 'utm_source=' + encodeURIComponent(platform)
       + '&utm_medium=' + encodeURIComponent(medium)
       + '&utm_campaign=' + encodeURIComponent(campaign)
       + '&utm_content=' + encodeURIComponent(audience);

  const output = document.getElementById('utm-output');
  if(output){ output.textContent = url; output.classList.add('active'); }
  const status = document.getElementById('utm-status');
  if(status){ status.textContent = ''; status.classList.remove('copied'); }
}
function copyUTM(){
  const output = document.getElementById('utm-output');
  const url = output ? output.textContent : '';
  if(!url) return;
  navigator.clipboard.writeText(url).then(()=>{
    const status = document.getElementById('utm-status');
    if(!status) return;
    status.textContent = '✓ Copied!';
    status.classList.add('copied');
    setTimeout(()=>{ status.textContent=''; status.classList.remove('copied'); }, 2000);
  });
}

/* ============================================================
   GENERIC COLLECTION RENDER
   ============================================================ */
// Rows + active filter values per generic tab, keyed by collection id — lets
// every list tab (Reviews, Guest Posts, Pinterest, Directories, DM Audit,
// Reddit Watch, GBP Tasks, Handoff Notes) filter without a re-fetch, same as
// Content Library/Blog already do. Persists in memory for the session so
// switching tabs and coming back keeps the filter set.
let COLL_ROWS = {};
let COLL_FILTERS = {};
// Any status/select field on a collection becomes a dropdown filter
// automatically — e.g. Directories' Status ("To do"/"Submitted"/"Live"/
// "Needs fix") or GBP Tasks' Type + Status — no per-tab wiring needed.
function filterableFields(id){
  return (COLLECTIONS[id].fields||[]).filter(f=>(f.t==='status'||f.t==='select') && f.o && f.o.length);
}
async function renderCollection(id){
  const c = COLLECTIONS[id];
  const view = document.getElementById('view');
  // Every tab is client-scoped now (2026-07-17) — nothing renders without a
  // client selected, same as Content Library/Calendar/Performance already work.
  if(!CURRENT_CLIENT_ID){ view.innerHTML = '<div class="empty">No client selected — pick one from the dropdown in the top bar.</div>'; return; }
  // Newest-first for created_at (default "recently added" order) and
  // published_date (blog posts — most recently published at the top,
  // drafts with no date yet pushed to the bottom via nullsFirst:false
  // rather than Postgres' default of sorting nulls to the top of a DESC
  // list). Everything else (e.g. calendar's slot_date) stays chronological/ascending.
  const DESC_ORDER_KEYS = ['created_at','published_date'];
  const {data,error} = await sb.from(c.table).select('*').eq('client_id',CURRENT_CLIENT_ID).order(c.orderBy,{ascending: !DESC_ORDER_KEYS.includes(c.orderBy), nullsFirst:false});
  if(error){ view.innerHTML = `<div class="empty">Error loading: ${esc(error.message)}</div>`; return; }
  COLL_ROWS[id] = data||[];
  if(!COLL_FILTERS[id]) COLL_FILTERS[id] = {};
  const filterFields = filterableFields(id);
  filterFields.forEach(f=>{ if(!(f.k in COLL_FILTERS[id])) COLL_FILTERS[id][f.k]='All'; });
  const actions = `<div style="display:flex;gap:8px;flex-wrap:wrap">`+
    (id==='content'?`<button class="btn-add" style="background:var(--accent)" onclick="syncDrive(this)">⟳ Sync from Drive</button>`:'')+
    `<button class="btn-add" onclick="addRow('${id}')">${c.newLabel}</button></div>`;
  view.innerHTML =
    `<div class="tabhead"><div><h2>${c.title}</h2><div class="sub">${esc(c.sub)}</div></div>
       ${actions}</div>
     ${id==='directories'?'<div class="callout">⚠️ Copy the master NAP from the top bar and paste it identically into every listing — never retype it.</div>':''}
     ${id==='content'?'<div class="callout">📁 New videos/photos go in the Drive folder (button top-right). </div>':''}
     ${filterFields.length?'<div class="filterbar" id="collFilterBar"></div>':''}
     <div class="cards" id="cards"></div>`;
  if(filterFields.length) renderCollFilterBar(id);
  renderCollCards(id);
}
function renderCollFilterBar(id){
  const bar = document.getElementById('collFilterBar');
  if(!bar) return;
  const state = COLL_FILTERS[id]||{};
  bar.innerHTML = `<span class="flabel">Filter</span>` +
    filterableFields(id).map(f=>{
      const opts = ['All', ...f.o.filter(o=>o!=='')];
      return `<select onchange="setCollFilter('${id}','${f.k}',this.value)">${opts.map(o=>`<option value="${esc(o)}" ${state[f.k]===o?'selected':''}>${o==='All'?'All '+esc(f.l):esc(o)}</option>`).join('')}</select>`;
    }).join('') +
    `<span class="count" id="collCount"></span>`;
}
function setCollFilter(id,key,val){ COLL_FILTERS[id][key]=val; renderCollFilterBar(id); renderCollCards(id); }
function renderCollCards(id){
  const wrap = document.getElementById('cards');
  if(!wrap) return;
  const c = COLLECTIONS[id];
  let rows = COLL_ROWS[id]||[];
  const state = COLL_FILTERS[id]||{};
  filterableFields(id).forEach(f=>{
    const val = state[f.k];
    if(val && val!=='All') rows = rows.filter(r=>(r[f.k]||'')===val);
  });
  const cnt = document.getElementById('collCount'); if(cnt) cnt.textContent = `${rows.length} item${rows.length===1?'':'s'}`;
  if(!rows.length){ wrap.innerHTML = `<div class="empty">${(COLL_ROWS[id]||[]).length?'No items match this filter.':`Nothing here yet — click "${esc(c.newLabel)}".`}</div>`; return; }
  wrap.innerHTML=''; rows.forEach(r=>wrap.appendChild(buildCard(id,r)));
}

function fieldHTML(id,row,f){
  const val = row[f.k];
  let html = `<div class="f ${f.full?'full':''}">`;
  if(f.t!=='bool') html += `<label>${f.l}</label>`;
  if(f.t==='text'||f.t==='url'||f.t==='email'||f.t==='number'||f.t==='date'||f.t==='time'){
    const it = f.t==='time'?'time':(f.t==='number'?'number':(f.t==='date'?'date':(f.t==='email'?'email':(f.t==='url'?'url':'text'))));
    html += `<input type="${it}" value="${esc(val==null?'':val)}" oninput="queueSave('${id}','${row.id}','${f.k}',this.value)">`;
  } else if(f.t==='textarea'){
    html += `<textarea oninput="queueSave('${id}','${row.id}','${f.k}',this.value)">${esc(val==null?'':val)}</textarea>`;
  } else if(f.t==='select'||f.t==='status'){
    html += `<select class="${f.t==='status'?'status':''}" onchange="saveField('${id}','${row.id}','${f.k}',this.value)">`;
    f.o.forEach(o=>{ html += `<option ${String(val||'')===o?'selected':''}>${esc(o)}</option>`; });
    html += `</select>`;
  } else if(f.t==='bool'){
    html += `<div class="chk"><input type="checkbox" ${val?'checked':''} onchange="saveField('${id}','${row.id}','${f.k}',this.checked)"> <span>${f.l}</span></div>`;
  } else if(f.t==='multi'){
    const arr = Array.isArray(val)?val:[];
    html += `<div class="checks">`;
    f.o.forEach(o=>{ html += `<label class="chk"><input type="checkbox" ${arr.includes(o)?'checked':''} onchange="saveMulti('${id}','${row.id}','${f.k}','${esc(o)}',this.checked)"> ${esc(o)}</label>`; });
    html += `</div>`;
  } else if(f.t==='content_ref'){
    html += `<div id="cref-${row.id}">${crefInner(row)}</div>`;
  } else if(f.t==='cover_ref'){
    html += `<div id="coverref-${id}-${row.id}">${coverRefInner(id,row)}</div>`;
  }
  html += `</div>`;
  return html;
}
function fieldsGridHTML(id,row){
  const c = COLLECTIONS[id];
  return `<div class="grid">` + c.fields.map(f=>fieldHTML(id,row,f)).join('') + `</div>`;
}
// Generic status→colour heuristic for the simple list tabs (Reviews, Guest
// Posts, Pins, Directories, DM Audit, Reddit Watch, GBP Tasks) — these each
// have their own status vocabulary (see COLLECTIONS), so rather than a
// lookup table per collection, bucket by what the word itself implies:
// done/live/approved = green, in-progress = amber, declined/skip = red,
// anything else (draft/to do/none/blank) = grey.
function statusColor(status){
  const s = String(status||'').toLowerCase();
  if(!s || s==='none') return 'var(--muted)';
  if(/(published|posted|done|live|approved)/.test(s)) return 'var(--good)';
  if(/(declined|needs fix|ignore|skip|failed)/.test(s)) return 'var(--bad)';
  if(/(draft|to do|to review|flagged|contacted|negotiating|agreed|submitted|in review|reaching out|asked|drafted)/.test(s)) return 'var(--warn)';
  return 'var(--muted)';
}
// Collapsible summary card for the generic list tabs — same collapsed-
// summary/expand-for-full-form pattern as Content Library/Calendar/Blog, so
// every tab is easy to scan and navigate rather than showing the full edit
// form for every row at once. Collapsed view is built from each
// collection's titleKey/subtitleKey/previewKey/icon (set in COLLECTIONS)
// plus its status field (if it has one), so it stays generic across very
// different field sets.
function buildCard(id,row){
  const c = COLLECTIONS[id];
  const card = document.createElement('div');
  card.className='ccard'; card.dataset.id=row.id;
  const statusField = c.fields.find(f=>f.t==='status');
  const statusVal = statusField ? row[statusField.k] : null;
  const titleVal = c.titleKey ? row[c.titleKey] : null;
  const title = titleVal ? String(titleVal) : (c.emptyTitle || '(untitled)');
  const subtitleVal = c.subtitleKey ? row[c.subtitleKey] : null;
  const previewVal = c.previewKey ? row[c.previewKey] : null;
  const preview = previewVal ? `<div class="desc-prev">${esc(String(previewVal).length>140 ? String(previewVal).slice(0,140)+'…' : String(previewVal))}</div>` : '';
  card.innerHTML = `
    <div class="ccard-head" onclick="toggleContent(this)">
      <div class="thumb-ph" style="width:56px;height:56px" title="${esc(c.title)}">${c.icon||'📋'}</div>
      <div class="ccard-meta">
        <div class="ccard-name">${esc(title)}</div>
        <div class="ccard-tags">
          ${statusVal?`<span class="pill" style="background:${statusColor(statusVal)}">${esc(statusVal)}</span>`:''}
          ${subtitleVal?`<span class="ar">${esc(String(subtitleVal))}</span>`:''}
        </div>
        ${preview}
      </div>
      <button class="expand-btn toggle-arrow">▸</button>
    </div>
    <div class="ccard-body hidden">
      ${fieldsGridHTML(id,row)}
      ${id==='calendar'?publishBlockHTML(row):''}
      ${id==='blog'?blogScheduleHTML(row):''}
      <div class="card-foot"><span class="meta">${row.created_at?('Added '+fmtDate(row.created_at)):''}</span>
        <button class="btn-del" onclick="delRow('${id}','${row.id}',this)">Delete</button></div>
    </div>`;
  return card;
}
// Lets a blog post spin up a calendar slot as its social tie-in post,
// mirroring Content Library's "Schedule to calendar" — but blog posts
// aren't video/photo content_items (different table, and va_calendar_slots.
// content_item_id is FK'd specifically to va_content_items), so this
// creates a slot with the blog's title/keywords pre-filled into the
// caption/notes instead of a content_item_id link. Assign actual video/
// photo content and platforms on the new slot afterward if it needs them.
function blogScheduleHTML(row){
  return `<div class="publish-block">
    <div class="sched">
      <input type="date" id="bd-${row.id}">
      <button class="btn-sm" onclick="scheduleFromBlog('${row.id}')">＋ Schedule tie-in post to calendar</button>
    </div>
  </div>`;
}
async function scheduleFromBlog(rowId){
  if(!CURRENT_CLIENT_ID){ toast('Pick a client first'); return; }
  const inp = document.getElementById('bd-'+rowId);
  const date = inp && inp.value;
  if(!date){ toast('Pick a date first'); return; }
  const {data:post} = await sb.from('va_blog_posts').select('title,target_keywords').eq('id',rowId).single();
  const title = (post&&post.title) || 'Untitled blog post';
  const keywords = post&&post.target_keywords;
  const caption = `Blog tie-in: ${title}`;
  const notes = keywords ? `Targets: ${keywords}` : null;
  const {error} = await sb.from('va_calendar_slots').insert({
    slot_date: date, caption, notes, status:'Planned', client_id: CURRENT_CLIENT_ID
  });
  if(error){ toast('Schedule failed: '+error.message); return; }
  toast('Added to calendar — ' + date);
}

// Collapsible blog post card — same collapsed-summary/expand-for-full-form
// pattern as Content Library and Calendar cards. Collapsed shows title,
// status, published date, and targeted keywords; expanded reveals the full
// edit form plus the "Schedule tie-in post to calendar" action.
function blogStatusColor(status){
  return status==='Published' ? 'var(--good)' : status==='In review' ? 'var(--warn)' : 'var(--muted)';
}
function buildBlogCard(row){
  const card = document.createElement('div');
  card.className='ccard'; card.dataset.id=row.id;
  const dateLabel = row.published_date ? fmtDate(row.published_date) : 'Not published yet';
  const kwPrev = row.target_keywords ? `<div class="desc-prev">🎯 ${esc(row.target_keywords)}</div>` : `<div class="desc-prev" style="font-style:italic">No target keywords set yet</div>`;
  const urlLink = row.url ? `<div class="ccard-links"><a href="${esc(row.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">↗ View live</a></div>` : '';
  card.innerHTML = `
    <div class="ccard-head" onclick="toggleContent(this)">
      <div class="thumb-ph" style="width:56px;height:56px" title="Blog post">📝</div>
      <div class="ccard-meta">
        <div class="ccard-name">${esc(row.title||'(untitled)')}</div>
        <div class="ccard-tags">
          <span class="pill" style="background:${blogStatusColor(row.status)}">${esc(row.status||'Draft')}</span>
          <span class="ar">${esc(dateLabel)}</span>
        </div>
        ${urlLink}
        ${kwPrev}
      </div>
      <button class="expand-btn toggle-arrow">▸</button>
    </div>
    <div class="ccard-body hidden">
      ${fieldsGridHTML('blog',row)}
      ${blogScheduleHTML(row)}
      <div class="card-foot"><span class="meta">${row.created_at?('Added '+fmtDate(row.created_at)):''}</span>
        <button class="btn-del" onclick="delRow('blog','${row.id}',this)">Delete</button></div>
    </div>`;
  return card;
}

async function renderBlog(){
  setActive('blog');
  const view = document.getElementById('view');
  if(!CURRENT_CLIENT_ID){ view.innerHTML = '<div class="empty">No client selected — pick one from the dropdown in the top bar.</div>'; return; }
  const c = COLLECTIONS.blog;
  const {data,error} = await sb.from(c.table).select('*').eq('client_id',CURRENT_CLIENT_ID).order('published_date',{ascending:false,nullsFirst:false});
  if(error){ view.innerHTML = `<div class="empty">Error: ${esc(error.message)}</div>`; return; }
  BLOG_ROWS = data||[];
  view.innerHTML = `
    <div class="tabhead"><div><h2>${c.title}</h2><div class="sub">${esc(c.sub)}</div></div>
      <button class="btn-add" onclick="addRow('blog')">${c.newLabel}</button></div>
    <div class="filterbar" id="blogFilterBar"></div>
    <div class="cards" id="blogCards"></div>`;
  renderBlogFilterBar();
  renderBlogCards();
}
function renderBlogFilterBar(){
  const bar = document.getElementById('blogFilterBar');
  if(!bar) return;
  bar.innerHTML = `<span class="flabel">Filter</span>
    <select onchange="setBlogStatus(this.value)">${BLOG_STATUSES.map(s=>`<option value="${esc(s)}" ${blogStatusFilter===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
    <span class="count" id="blogCount"></span>`;
}
function setBlogStatus(s){ blogStatusFilter=s; renderBlogFilterBar(); renderBlogCards(); }
function renderBlogCards(){
  const wrap = document.getElementById('blogCards');
  if(!wrap) return;
  let rows = BLOG_ROWS;
  if(blogStatusFilter!=='All') rows = rows.filter(r=>(r.status||'Draft')===blogStatusFilter);
  const cc = document.getElementById('blogCount'); if(cc) cc.textContent = `${rows.length} post${rows.length===1?'':'s'}`;
  if(!rows.length){ wrap.innerHTML = `<div class="empty">No posts match this filter.</div>`; return; }
  wrap.innerHTML=''; rows.forEach(r=>wrap.appendChild(buildBlogCard(r)));
}

/* ---- Publish (Instagram / Facebook via social-publish Edge Function) ---- */
const PUBLISH_KEY_LABELS = {ig_feed:'IG Feed', ig_reel:'IG Reel', ig_trial_reel:'IG Trial Reel', ig_story:'IG Story', fb_feed:'FB Feed', fb_story:'FB Story', fb_reel:'FB Reel', yt_long:'YouTube', yt_short:'YT Short', facebook:'Facebook', instagram:'Instagram', youtube:'YouTube'};
// Maps the platform labels stored on va_calendar_slots.platforms back to the
// platform_post_ids key the edge function writes results under — needed to
// show a per-platform status line for exactly what's currently ticked.
const PLATFORM_LABEL_TO_KEY = {
  'IG feed':'ig_feed', 'IG Reel':'ig_reel', 'IG Trial Reel':'ig_trial_reel', 'IG Story':'ig_story',
  'FB feed':'fb_feed', 'FB Story':'fb_story', 'FB Reel':'fb_reel',
  'YT long-form':'yt_long', 'YT Short':'yt_short'
};
// Small icon per platform for the calendar's compact card view — lets you
// tell at a glance what a post is going out to without reading text.
const PLATFORM_ICONS = {
  'IG feed':'📸','IG Reel':'🎬','IG Trial Reel':'🎬','IG Story':'⚡',
  'FB feed':'📘','FB Story':'⚡','FB Reel':'🎬',
  'YT long-form':'▶️','YT Short':'▶️'
};
function platformIconsHTML(platforms){
  const arr = Array.isArray(platforms)?platforms:[];
  if(!arr.length) return `<span style="color:var(--muted);font-size:11px">No platforms set</span>`;
  return `<span class="plat-icons">` + arr.map(p=>`<span title="${esc(p)}">${PLATFORM_ICONS[p]||'•'}</span>`).join('') + `</span>`;
}
function publishBlockHTML(row){
  const status = row.publish_status || 'Not queued';
  const slug = status.toLowerCase().replace(/\s+/g,'-');
  const ids = row.platform_post_ids || {};
  const requested = Array.isArray(row.platforms) ? row.platforms : [];
  const requestedKeys = new Set(requested.map(p=>PLATFORM_LABEL_TO_KEY[p]).filter(Boolean));

  // Per-platform breakdown for everything currently ticked on this post —
  // this is what makes a partial failure (e.g. FB Reel errors while IG
  // succeeds) visible platform-by-platform instead of one aggregate pill
  // that can otherwise read "Published" even when a ticked platform failed.
  const platformRows = requested.map(label=>{
    const key = PLATFORM_LABEL_TO_KEY[label];
    const entry = key ? ids[key] : null;
    let state, text;
    if(entry && entry.error){ state='fail'; text = entry.error; }
    else if(entry && entry.published_at){ state='ok'; text = 'Published'; }
    else if(entry && entry.status==='processing'){ state='wait'; text = 'Still processing…'; }
    else { state='wait'; text = 'Not attempted yet'; }
    const dot = state==='ok'?'✅':state==='fail'?'❌':'⏳';
    return `<div class="publish-plat-row publish-plat-${state}">
      <span>${PLATFORM_ICONS[label]||'•'}</span>
      <span class="publish-plat-label">${esc(label)}</span>
      <span>${dot}</span>
      <span class="publish-plat-text">${esc(text)}</span>
      ${entry && entry.permalink ? `<a href="${esc(entry.permalink)}" target="_blank" rel="noopener">View ↗</a>` : ''}
    </div>`;
  }).join('');

  // Leftover results for platforms no longer ticked — usually means a
  // platform was unticked after a failed attempt. Surface it rather than
  // silently dropping it, since the pill/rows above only reflect the
  // currently-ticked platforms.
  const orphanErrors = Object.entries(ids)
    .filter(([k,v])=> v && v.error && !requestedKeys.has(k))
    .map(([k,v])=>`${PUBLISH_KEY_LABELS[k]||k} (no longer ticked): ${v.error}`);

  // "Armed" = cron will pick this up and auto-publish it (see the
  // APPROVAL GATE in the social-publish edge function: only "Tim approved"
  // or "Scheduled" slots get auto-published). Only show Cancel while that's
  // actually true and it hasn't gone out yet.
  const armed = (row.status==='Tim approved' || row.status==='Scheduled') && status!=='Published';
  const hasIGMedia = ['ig_feed','ig_reel','ig_trial_reel'].some(k=>ids[k]&&ids[k].media_id);
  return `<div class="publish-block" id="pub-${row.id}">
    <div class="publish-row">
      <span class="pill status-${slug}">${esc(status)}</span>
      ${armed
        ? `<span class="cref-note">⏰ Scheduled — will auto-publish on its own, no need to click Publish now</span>`
        : `<button class="btn-sm" onclick="publishSlot('${row.id}',this)">🚀 Publish now</button>`}
      ${armed?`<button class="btn-sm" style="border-color:var(--bad);color:var(--bad)" onclick="cancelSlot('${row.id}',this)">🛑 Cancel schedule</button>`:''}
      ${hasIGMedia?`<button class="btn-sm" onclick="checkCollabStatus('${row.id}',this)">👥 Check collab status</button>`:''}
    </div>
    ${requested.length ? `<div class="publish-plat-list">${platformRows}</div>` : ''}
    ${row.status==='Cancelled'?'<div class="cref-note" style="margin-top:6px">Cancelled — this post won’t auto-publish. Change its Status above to reschedule.</div>':''}
    ${row.publish_error?`<div class="publish-error">${esc(row.publish_error)}</div>`:''}
    ${orphanErrors.length?`<div class="publish-error">${esc(orphanErrors.join(' | '))}</div>`:''}
  </div>`;
}
// Re-renders just the publish block (status pill / Publish now / Cancel
// schedule / links) for one calendar card in place, without a full
// re-fetch. Needed anywhere a change affects `armed`/publish_status display
// — e.g. the workflow Status dropdown — so the card reflects it immediately
// instead of only after the next tab switch or page reload.
function refreshPublishBlock(rowId){
  const row = CALENDAR_ROWS.find(x=>x.id===rowId);
  const el = document.getElementById('pub-'+rowId);
  if(row && el) el.outerHTML = publishBlockHTML(row);
}
async function publishSlot(rowId,btn){
  if(!confirm('This publishes live to the connected accounts right now — no draft/undo. Continue?')) return;
  const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Publishing…';
  try{
    const res = await fetch(FUNCTIONS_URL+'/social-publish',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({slotId: rowId})
    });
    const d = await res.json().catch(()=>({}));
    if(!res.ok && !d.publish_status){ toast('Publish failed: '+(d.error||('HTTP '+res.status))); btn.disabled=false; btn.textContent=orig; return; }
    toast(d.message || 'Publish updated');
    renderCalendar();
  }catch(e){ toast('Publish error: '+e.message); btn.disabled=false; btn.textContent=orig; }
}
async function cancelSlot(rowId,btn){
  if(!confirm('Cancel this scheduled post? It will stop it from auto-publishing. You can reschedule later by changing its Status again.')) return;
  const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Cancelling…';
  const {error} = await sb.from('va_calendar_slots').update({status:'Cancelled'}).eq('id',rowId);
  if(error){ toast('Cancel failed: '+error.message); btn.disabled=false; btn.textContent=orig; return; }
  const row = CALENDAR_ROWS.find(x=>x.id===rowId); if(row) row.status='Cancelled';
  toast('Schedule cancelled');
  renderCalendar();
}
async function checkCollabStatus(rowId,btn){
  const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Checking…';
  try{
    const res = await fetch(FUNCTIONS_URL+'/social-publish',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({checkCollaborators: rowId})
    });
    const d = await res.json().catch(()=>({}));
    btn.disabled = false; btn.textContent = orig;
    if(!res.ok || d.error){ toast('Check failed: '+(d.error||('HTTP '+res.status))); return; }
    const lines = [];
    Object.entries(d.results||{}).forEach(([platform,list])=>{
      if(Array.isArray(list)){
        if(!list.length) lines.push(`${PUBLISH_KEY_LABELS[platform]||platform}: no confirmed collaborators (they may not have enabled collaborator tagging)`);
        else list.forEach(c=>lines.push(`${PUBLISH_KEY_LABELS[platform]||platform} — @${c.username}: ${c.invite_status}`));
      } else if(list && list.error){
        lines.push(`${PUBLISH_KEY_LABELS[platform]||platform}: ${list.error}`);
      }
    });
    toast(lines.join(' · ') || 'No collaborator data returned.');
  }catch(e){ btn.disabled=false; btn.textContent=orig; toast('Check error: '+e.message); }
}

/* ---- Content Library: thumbnails, collapsible cards, pillar/status filters ---- */
let CONTENT_ROWS = [];
let CALENDAR_CONTENT = [];
let CALENDAR_ROWS = [];
let CAL_FILTER = {};
let contentPillar = 'All';
let contentStatus = 'All';
let contentType = 'All';
const CONTENT_STATUSES = ['All','New from Drive','Needs description','Description written','Tim approved','Scheduled','Posted'];

let BLOG_ROWS = [];
let blogStatusFilter = 'All';
const BLOG_STATUSES = ['All','Draft','In review','Published'];

async function renderContent(){
  setActive('content');
  const view = document.getElementById('view');
  view.innerHTML = '<div class="empty">Loading…</div>';
  if(!CURRENT_CLIENT_ID){ view.innerHTML = '<div class="empty">No client selected — pick one from the dropdown in the top bar.</div>'; return; }
  const {data,error} = await sb.from('va_content_items').select('*').eq('client_id',CURRENT_CLIENT_ID).order('created_at',{ascending:false});
  if(error){ view.innerHTML = `<div class="empty">Error: ${esc(error.message)}</div>`; return; }
  CONTENT_ROWS = data||[];
  const c = COLLECTIONS.content;
  view.innerHTML = `
    <div class="tabhead"><div><h2>${c.title}</h2><div class="sub">${esc(c.sub)}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn-add" style="background:var(--accent)" onclick="syncDrive(this)">⟳ Sync from Drive</button>
        <button class="btn-add" onclick="addRow('content')">${c.newLabel}</button></div></div>
    <div class="callout">📁 New videos/photos go in the Drive folder (button top-right). Click Sync to pull them in. Tap a card to expand and add its details.</div>
    <div class="filterbar" id="filterBar"></div>
    <div id="ccards" style="margin-top:12px"></div>`;
  renderFilterBars(); renderContentCards();
}
function renderFilterBars(){
  // Dropdowns instead of three rows of chip buttons (2026-07-17) — same
  // filtering logic/state (contentType/contentPillar/contentStatus), just a
  // single compact row instead of stacked button rows.
  const types = [['All','All'],['Videos','video'],['Photos','photo'],['Carousels','carousel']];
  const pills = ['All',...PILLARS];
  document.getElementById('filterBar').innerHTML =
    `<span class="flabel">Filter</span>
     <select onchange="setContentType(this.value)">${types.map(t=>`<option value="${t[1]}" ${contentType===t[1]?'selected':''}>${t[0]}</option>`).join('')}</select>
     <select onchange="setContentPillar(this.value)">${pills.map(p=>`<option value="${esc(p)}" ${contentPillar===p?'selected':''}>${esc(p)}</option>`).join('')}</select>
     <select onchange="setContentStatus(this.value)">${CONTENT_STATUSES.map(s=>`<option value="${esc(s)}" ${contentStatus===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
     <span class="count" id="ccount"></span>`;
}
function setContentPillar(p){ contentPillar=p; renderFilterBars(); renderContentCards(); }
function setContentStatus(s){ contentStatus=s; renderFilterBars(); renderContentCards(); }
function setContentType(v){ contentType=v; renderFilterBars(); renderContentCards(); }
function renderContentCards(){
  const wrap = document.getElementById('ccards');
  let rows = CONTENT_ROWS;
  if(contentType!=='All') rows = rows.filter(r=>(r.type||'')===contentType);
  if(contentPillar!=='All') rows = rows.filter(r=>(r.pillar||'')===contentPillar);
  if(contentStatus!=='All') rows = rows.filter(r=>(r.status||'')===contentStatus);
  const cc = document.getElementById('ccount'); if(cc) cc.textContent = `${rows.length} item${rows.length===1?'':'s'}`;
  if(!rows.length){ wrap.innerHTML = `<div class="empty">No items match this filter. Try "All", or Sync from Drive.</div>`; return; }
  wrap.innerHTML=''; rows.forEach(r=>wrap.appendChild(buildContentCard(r)));
}
function pillarColor(p){ return {Dream:'#7d6b4f',Craft:'#5f5138',Proof:'#5b7a53',Process:'#3f6b7a','Meet Tim':'#8a5a6a',Knowledge:'#b8863b',Background:'#6b7686'}[p]||'#8a8377'; }
function thumbFor(r){
  if(r.drive_file_id) return `https://drive.google.com/thumbnail?id=${r.drive_file_id}&sz=w640`;
  if(r.thumbnail_url) return r.thumbnail_url;
  return null;
}
function imgFail(img,type){ const d=document.createElement('div'); d.className='thumb-ph'; d.style.width=img.style.width; d.style.height=img.style.height; d.textContent=(type==='photo'?'🖼️':'🎬'); img.replaceWith(d); }
function ratioNum(r){
  if(r.dimensions){ const m=String(r.dimensions).match(/(\d+)\D+(\d+)/); if(m){ const w=+m[1], h=+m[2]; if(w&&h) return w/h; } }
  const map={'9:16':9/16,'16:9':16/9,'4:5':4/5,'1:1':1,'2:3':2/3,'3:2':3/2};
  return map[r.aspect_ratio] || (r.type==='photo'?1:9/16);
}
function thumbBox(r){ const H=80; let w=Math.round(H*ratioNum(r)); w=Math.max(34,Math.min(150,w)); return `width:${w}px;height:${H}px`; }
function recoFor(r){
  const ratio = ratioNum(r);
  if(ratio < 0.72) return {label:'Vertical', plats:['IG Reel','IG Story','YT Short','FB Story']};
  if(ratio > 1.35) return {label:'Landscape', plats:['YT long-form','FB feed']};
  return {label:'Square / Portrait', plats:['IG feed','FB feed']};
}
function recoLine(r, applyExpr){
  const rec = recoFor(r);
  return `<div class="reco">🎯 Best for: ${rec.plats.map(esc).join(' · ')}${applyExpr?` <button class="btn-sm" onclick="${applyExpr}">Apply</button>`:''}</div>`;
}
async function applyReco(coll,rowId){
  const arr = coll==='content'?CONTENT_ROWS:CALENDAR_ROWS;
  const r = arr.find(x=>x.id===rowId); if(!r) return;
  const plats = recoFor(r).plats;
  const table = coll==='content'?'va_content_items':'va_calendar_slots';
  const {error} = await sb.from(table).update({platforms:plats}).eq('id',rowId);
  if(error){ toast('Failed: '+error.message); return; }
  r.platforms = plats; toast('Suggested platforms applied');
  if(coll==='content') renderContent(); else renderCalendar();
}
async function applyRecoToPost(rowId, videoId){
  const v = CALENDAR_CONTENT.find(ci=>ci.id===videoId)||{};
  const plats = recoFor(v).plats;
  const {error} = await sb.from('va_calendar_slots').update({platforms:plats}).eq('id',rowId);
  if(error){ toast('Failed'); return; }
  const row = CALENDAR_ROWS.find(x=>x.id===rowId); if(row) row.platforms=plats;
  toast('Platforms set for post'); renderCalendar();
}
async function scheduleFromContent(rowId){
  const inpDate = document.getElementById('sd-'+rowId);
  const inpTime = document.getElementById('st-'+rowId);
  const date = inpDate && inpDate.value;
  const time = inpTime && inpTime.value;
  if(!date){ toast('Pick a date first'); return; }
  const r = CONTENT_ROWS.find(x=>x.id===rowId)||{};
  const {error} = await sb.from('va_calendar_slots').insert({
    slot_date: date,
    slot_time: time || null,
    content_item_id: rowId,
    pillar: r.pillar||null,
    platforms: recoFor(r).plats,
    caption: r.description||null,
    status: 'Planned',
    client_id: CURRENT_CLIENT_ID
  });
  if(error){ toast('Schedule failed: '+error.message); return; }
  toast('Added to calendar — ' + date + (time ? ' at ' + formatFriendlyTime(time) : ''));
}

function driveDownload(id){ return `https://drive.google.com/uc?export=download&id=${id}`; }
function driveView(r){ return r.drive_link || (r.drive_file_id?`https://drive.google.com/file/d/${r.drive_file_id}/view`:null); }
function linksHTML(r){
  const links=[];
  links.push(`<a href="#" onclick="event.stopPropagation();event.preventDefault();openPreview('${r.id}')">👁 Preview</a>`);
  const v = driveView(r);
  if(v) links.push(`<a href="${esc(v)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">↗ Open in Drive</a>`);
  if(r.drive_file_id) links.push(`<a href="${driveDownload(r.drive_file_id)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">⬇ Download</a>`);
  return `<div class="ccard-links">${links.join('')}</div>`;
}
function tagsHTML(r){
  const pillar = r.pillar||'';
  const pb = pillar ? `<span class="pill" style="background:${pillarColor(pillar)}">${esc(pillar)}</span>`
                    : `<span class="pill" style="background:#c9c1b0">No pillar</span>`;
  return `${pb}<span class="pill status">${esc(r.status||'')}</span>${r.aspect_ratio?`<span class="ar">${esc(r.aspect_ratio)}</span>`:''}${r.dimensions?`<span class="ar">${esc(r.dimensions)} px</span>`:''}`;
}
function buildContentCard(r){
  const card = document.createElement('div');
  card.className='ccard'; card.dataset.id=r.id;
  const th = thumbFor(r);
  const box = thumbBox(r);
  const thumbHTML = th
    ? `<img class="thumb" style="${box}" src="${esc(th)}" referrerpolicy="no-referrer" onerror="imgFail(this,'${esc(r.type||'')}')">`
    : `<div class="thumb-ph" style="${box}" title="No preview available from Drive">${r.type==='photo'?'🖼️':'🎬'}</div>`;
  const prev = r.description ? `<div class="desc-prev">${esc(r.description)}</div>` : '';
  card.innerHTML = `
    <div class="ccard-head" onclick="toggleContent(this)">
      ${thumbHTML}
      <div class="ccard-meta">
        <div class="ccard-name">${esc(r.name||'(untitled)')}</div>
        <div class="ccard-tags">${tagsHTML(r)}</div>
        ${linksHTML(r)}
        ${recoLine(r, `event.stopPropagation();applyReco('content','${r.id}')`)}
        ${prev}
      </div>
      <button class="expand-btn toggle-arrow">▸</button>
    </div>
    <div class="ccard-body hidden">
      ${fieldsGridHTML('content',r)}
      <div class="ccard-actions">
        <div class="sched">
          <input type="date" id="sd-${r.id}">
          <input type="time" id="st-${r.id}" style="width:110px; padding:6px 8px; border:1px solid var(--line); border-radius:5px; font-family:inherit; font-size:12px;">
          <button class="btn-sm" onclick="scheduleFromContent('${r.id}')">＋ Schedule to calendar</button>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-del" onclick="delRow('content','${r.id}',this)">Delete</button>
        </div>
      </div>
    </div>`;
  return card;
}

function toggleContent(head){
  const body = head.nextElementSibling;
  const open = body.classList.toggle('hidden')===false;
  const arrow = head.querySelector('.toggle-arrow');
  if(arrow) arrow.textContent = open?'▾':'▸';
}

/* ---- Calendar post cards: collapsed summary (thumb/status/platforms/
   caption) by default, full edit form + publish controls behind the same
   expand pattern Content Library uses. All the underlying fields/functions
   (fieldsGridHTML, publishBlockHTML, delRow, etc.) are unchanged — this is
   a display wrapper around them, nothing about save/publish behavior moved. */
// A readable name for a calendar slot — used by both the month-grid badges
// and the card header, so "what's what" is visible without opening
// anything. Prefers the assigned content item's name, then the caption
// (covers blog tie-in posts, which have a caption but no content_item_id),
// then the pillar, then a plain fallback. (2026-07-17)
function calSlotLabel(s){
  if(s.content_item_id){
    const ci = CALENDAR_CONTENT.find(c=>c.id===s.content_item_id);
    if(ci && ci.name) return ci.name;
  }
  if(s.caption) return s.caption;
  if(s.pillar) return s.pillar;
  return 'Untitled post';
}
function buildCalendarCard(row){
  const card = document.createElement('div');
  card.className='ccard'; card.dataset.id=row.id;

  const content = CALENDAR_CONTENT.find(ci=>ci.id===row.content_item_id) || null;
  const th = content ? thumbFor(content) : null;
  const box = content ? thumbBox(content) : 'width:70px;height:70px';
  const thumbHTML = th
    ? `<img class="thumb" style="${box}" src="${esc(th)}" referrerpolicy="no-referrer" onerror="imgFail(this,'${esc((content&&content.type)||'')}')">`
    : `<div class="thumb-ph" style="${box}" title="${content?'No preview available from Drive':'No content assigned yet'}">${content?(content.type==='photo'?'🖼️':'🎬'):'➕'}</div>`;

  const pubStatus = row.publish_status || 'Not queued';
  const pubSlug = pubStatus.toLowerCase().replace(/\s+/g,'-');
  const timeLabel = row.slot_time ? formatFriendlyTime(row.slot_time) : '';
  const whenLabel = esc(row.slot_date?fmtDate(row.slot_date):'No date set') + (timeLabel?' · '+esc(timeLabel):'');
  const pillarDot = row.pillar ? `<span class="pillar-dot" style="background:${pillarColor(row.pillar)}" title="${esc(row.pillar)}"></span>` : '';
  const label = calSlotLabel(row);
  // Only show the caption as a second line when it's genuinely extra info
  // beyond the heading (i.e. content is assigned AND has its own caption) —
  // otherwise it'd just repeat what the heading already says.
  const captionPrev = (content && row.caption) ? `<div class="desc-prev">${esc(row.caption)}</div>` : '';
  const previewBtn = content ? `<button class="expand-btn" onclick="event.stopPropagation();openPreview('${content.id}')" title="Preview">👁</button>` : '';

  card.innerHTML = `
    <div class="ccard-head" onclick="toggleContent(this)">
      ${thumbHTML}
      <div class="ccard-meta">
        <div class="ccard-name">${pillarDot}${esc(label)}</div>
        <div class="cal-meta-row" style="margin-top:2px;color:var(--muted);font-size:11px">${whenLabel}</div>
        <div class="ccard-tags">
          <span class="pill status">${esc(row.status||'Planned')}</span>
          <span class="pill status-${pubSlug}">${esc(pubStatus)}</span>
        </div>
        <div class="cal-meta-row">${platformIconsHTML(row.platforms)}</div>
        ${captionPrev}
      </div>
      <div class="expand-col">
        ${previewBtn}
        <button class="expand-btn toggle-arrow">▸</button>
      </div>
    </div>
    <div class="ccard-body hidden">
      ${fieldsGridHTML('calendar',row)}
      ${publishBlockHTML(row)}
      <div class="card-foot"><span class="meta">${row.created_at?('Added '+fmtDate(row.created_at)):''}</span>
        <button class="btn-del" onclick="delRow('calendar','${row.id}',this)">Delete</button></div>
    </div>`;
  return card;
}

/* ---- Preview modal: works from both Content Library and Calendar ---- */
function findContentById(id){
  return CONTENT_ROWS.find(x=>x.id===id) || CALENDAR_CONTENT.find(x=>x.id===id) || null;
}
function openPreview(id){
  const item = findContentById(id);
  if(!item){ toast('Content item not found'); return; }
  document.getElementById('previewTitle').textContent = item.name || '(untitled)';
  const body = document.getElementById('previewBody');
  if(item.storage_url){
    body.innerHTML = item.type==='photo'
      ? `<img src="${esc(item.storage_url)}" referrerpolicy="no-referrer">`
      : `<video src="${esc(item.storage_url)}" controls autoplay></video>`;
  } else if(item.drive_file_id){
    body.innerHTML = `<iframe src="https://drive.google.com/file/d/${esc(item.drive_file_id)}/preview" allow="autoplay" loading="lazy"></iframe>`;
  } else {
    body.innerHTML = `<div class="empty">No preview available — this item has no Drive file or storage URL yet.</div>`;
  }
  document.getElementById('previewModal').classList.remove('hidden');
}
function closePreview(){
  document.getElementById('previewModal').classList.add('hidden');
  document.getElementById('previewBody').innerHTML = ''; // stop any video/iframe playback immediately
}
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closePreview(); });
function updateContentCard(rowId){
  const r = CONTENT_ROWS.find(x=>x.id===rowId); if(!r) return;
  const card = document.querySelector(`.ccard[data-id="${rowId}"]`); if(!card) return;
  const nameEl = card.querySelector('.ccard-name'); if(nameEl) nameEl.textContent = r.name||'(untitled)';
  const tagsEl = card.querySelector('.ccard-tags'); if(tagsEl) tagsEl.innerHTML = tagsHTML(r);
}

/* ---- Posting Calendar: interactive monthly view + inline details ---- */
let currentCalendarDate = new Date();

async function renderCalendar(){
  setActive('calendar');
  const view = document.getElementById('view');
  view.innerHTML = '<div class="empty">Loading calendar…</div>';
  if(!CURRENT_CLIENT_ID){ view.innerHTML = '<div class="empty">No client selected — pick one from the dropdown in the top bar.</div>'; return; }

  const co = await sb.from('va_content_items').select('id,name,drive_file_id,type,pillar,status,dimensions,has_thumbnail').eq('client_id',CURRENT_CLIENT_ID).order('created_at',{ascending:false});
  CALENDAR_CONTENT = co.data || [];

  const c = COLLECTIONS.calendar;
  const {data, error} = await sb.from(c.table).select('*').eq('client_id',CURRENT_CLIENT_ID).order('slot_date',{ascending:true});
  if(error){ view.innerHTML = `<div class="empty">Error: ${esc(error.message)}</div>`; return; }
  CALENDAR_ROWS = data || [];

  view.innerHTML = `
    <div class="tabhead">
      <div>
        <h2>${c.title}</h2>
        <div class="sub">${esc(c.sub)}</div>
      </div>
      <button class="btn-add" onclick="addNewSlotForSelectedDate()">+ Add slot on selected day</button>
    </div>
    <div class="callout">📅 Click any day on the grid to filter, view, or add scheduled posts for that specific date. Use the arrows to change months. Times are formatted in Melbourne local time (AEST/AEDT). Each post's left edge is colour-coded by pillar, and the dot shows publish status — grey not queued, amber processing, green published, red failed. Tap a card below to expand its full details and publish controls.</div>
    
    <div class="panel" style="margin-bottom: 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <button class="btn-sm" onclick="changeMonth(-1)">◀ Previous</button>
        <h3 style="margin:0; font-size:18px;">${currentCalendarDate.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', month: 'long', year: 'numeric' })}</h3>
        <button class="btn-sm" onclick="changeMonth(1)">Next ▶</button>
      </div>
      <div id="calendarGrid" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px; text-align:center;"></div>
    </div>
    
    <div id="selectedDayContainer">
      <h3 id="selectedDayTitle" style="font-size:20px; margin: 10px 0;"></h3>
      <div class="cards" id="calendarCards"></div>
    </div>
  `;

  renderCalendarGrid();
}

// Convert 24h string "17:00:00" or "17:00" to friendly Australian format "5:00 PM"
function formatFriendlyTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function renderCalendarGrid() {
  const grid = document.getElementById('calendarGrid');
  if(!grid) return;
  
  grid.innerHTML = '';
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  daysOfWeek.forEach(d => {
    grid.innerHTML += `<div style="font-weight:600; font-size:11px; text-transform:uppercase; color:var(--muted); padding:4px 0;">${d}</div>`;
  });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  for (let i = 0; i < firstDayIndex; i++) {
    grid.innerHTML += `<div style="background:transparent; height:92px;"></div>`;
  }

  const isoDateString = (dNum) => `${year}-${String(month + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
  const targetDateStr = isoDateString(currentCalendarDate.getDate());

  for (let day = 1; day <= totalDays; day++) {
    const dStr = isoDateString(day);
    const slotsOnDay = CALENDAR_ROWS.filter(r => r.slot_date === dStr);
    const isSelected = dStr === targetDateStr;
    
    let cellBackground = isSelected ? 'var(--paper2)' : 'var(--card)';
    let borderStyle = isSelected ? '2px solid var(--accent)' : '1px solid var(--line)';
    
    // Left edge = pillar color (same palette as Content Library tags), dot =
    // publish status (grey not queued, amber processing/partial, green
    // published, red failed) — lets you scan a whole month for at-risk or
    // unpublished posts without opening each one. Every cell is a fixed
    // height regardless of how many/how long the post names are — text
    // truncates with an ellipsis, and only the first couple of posts show
    // as badges, with a "+N more" line for the rest, so the grid stays
    // uniform instead of some days stretching taller than others. Clicking
    // the day (including the "+more" line) still shows every post for that
    // day in the list below, nothing is hidden, just not all badge-listed.
    const MAX_BADGES = 2;
    const visibleSlots = slotsOnDay.slice(0, MAX_BADGES);
    const extraCount = slotsOnDay.length - visibleSlots.length;
    let badgesHTML = visibleSlots.map(s => {
      const timeLabel = s.slot_time ? `<span style="font-size:9px; font-weight:700; color:var(--accent-deep);">${formatFriendlyTime(s.slot_time)}</span> ` : '';
      const pillarBorder = s.pillar ? pillarColor(s.pillar) : 'var(--line)';
      const pubStatus = s.publish_status || 'Not queued';
      const dotColor = pubStatus==='Published' ? 'var(--good)' : pubStatus==='Failed' ? 'var(--bad)' : (pubStatus==='Processing'||pubStatus==='Partial') ? 'var(--warn)' : 'var(--muted)';
      const label = calSlotLabel(s);
      return `<div style="font-size:10px; background:var(--paper); border: 1px solid var(--line); border-left: 3px solid ${pillarBorder}; border-radius:3px; margin-top:2px; padding:2px 4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:left;" title="${esc(label)} — ${esc(s.status||'')} — ${esc(pubStatus)}">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${dotColor};margin-right:3px;vertical-align:middle"></span>${timeLabel}${esc(label)}
      </div>`;
    }).join('') + (extraCount>0 ? `<div style="font-size:9.5px;font-weight:700;color:var(--muted);margin-top:2px;text-align:left;">+${extraCount} more</div>` : '');

    grid.innerHTML += `
      <div onclick="selectCalendarDay(${day})" style="background:${cellBackground}; border:${borderStyle}; border-radius:5px; padding:6px; height:92px; overflow:hidden; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.15s ease;">
        <div style="font-weight:600; text-align:right; font-size:12px; color:${isSelected ? 'var(--accent-deep)' : 'inherit'};">${day}</div>
        <div style="flex-grow:1; display:flex; flex-direction:column; justify-content:flex-end; overflow:hidden;">${badgesHTML}</div>
      </div>
    `;
  }
  
  showSelectedDaySlots();
}

function changeMonth(dir) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + dir);
  renderCalendarGrid();
}

function selectCalendarDay(day) {
  currentCalendarDate.setDate(day);
  renderCalendarGrid();
}

function showSelectedDaySlots() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const day = currentCalendarDate.getDate();
  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  const localDate = new Date(dStr + 'T00:00:00');
  const displayTitle = localDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('selectedDayTitle').textContent = `Slots scheduled for ${displayTitle}`;
  
  const wrap = document.getElementById('calendarCards');
  if(!wrap) return;
  wrap.innerHTML = '';
  
  const slotsOnDay = CALENDAR_ROWS.filter(r => r.slot_date === dStr);
  
  if (!slotsOnDay.length) {
    wrap.innerHTML = `<div class="empty">No scheduled slots for this day. Click "+ Add slot on selected day" above to set one up.</div>`;
    return;
  }
  
  slotsOnDay.forEach(r => wrap.appendChild(buildCalendarCard(r)));
}

async function addNewSlotForSelectedDate() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const day = currentCalendarDate.getDate();
  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const { error } = await sb.from(COLLECTIONS.calendar.table).insert({
    slot_date: dStr,
    status: 'Planned',
    client_id: CURRENT_CLIENT_ID
  });

  if(error) { toast('Add failed: ' + error.message); return; }
  toast('Added slot for ' + dStr);

  const c = COLLECTIONS.calendar;
  const { data } = await sb.from(c.table).select('*').eq('client_id',CURRENT_CLIENT_ID).order('slot_date', { ascending: true });
  CALENDAR_ROWS = data || [];
  renderCalendarGrid();
}

/* ============================================================
   PERFORMANCE — live Instagram/Facebook/YouTube posts + engagement stats,
   pulled directly from the platforms via the list-posts Edge Function.
   NOT sourced from va_calendar_slots/va_post_stats (portal-tracked-only,
   the old approach) — this is deliberately independent so it also shows
   posts made straight from the phone app, not just ones scheduled here.
   Same source/reasoning as Business → Clients → Performance (js/business.js,
   renderPerformanceTab) — added here 2026-07-21 so VAs and anyone in the
   Workspace section (not just the owner-only Business section) see the
   same reliable picture. See CLAUDE.md's list-posts entry for known gaps
   (Crowncon FB likes/comments/shares permission issue, YouTube OAuth scope).
   ============================================================ */
let PERF_ROWS = [];
let PERF_ALL_POSTS = []; // raw, unfiltered fetch result — month filter is applied client-side against this
let perfSort = {col:'date', dir:'desc'};
let perfMonthFilter = 'all';
let perfSinceLabel = '';
let PERF_WARNINGS = [];
const PERF_LOOKBACK_DAYS = 180;
const PERF_SORT_LABELS = {date:'Date (newest first)', views:'Views', reach:'Reach', likes:'Likes', comments:'Comments', shares:'Shares'};

function monthLabel(key){
  const p = key.split('-'); const d = new Date(+p[0], +p[1]-1, 1);
  return d.toLocaleString('en-US', {month:'long', year:'numeric'});
}

async function renderPerformance(){
  setActive('performance');
  const view = document.getElementById('view');
  view.innerHTML = '<div class="empty">Loading…</div>';
  if(!CURRENT_CLIENT_ID){ view.innerHTML = '<div class="empty">No client selected — pick one from the dropdown in the top bar.</div>'; return; }

  const client = CLIENTS.find(c=>c.id===CURRENT_CLIENT_ID);
  const slug = client && client.slug;
  if(!slug){ view.innerHTML = '<div class="empty">This client has no slug set — can\'t match it to a live social account.</div>'; return; }

  view.innerHTML = '<div class="empty">Loading live posts from Instagram, Facebook & YouTube…</div>';

  const d = new Date(); d.setDate(d.getDate()-PERF_LOOKBACK_DAYS);
  const since = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

  let posts = [], warnings = [];
  try{
    const res = await fetch(`${FUNCTIONS_URL}/list-posts?since=${encodeURIComponent(since)}&clients=${encodeURIComponent(slug)}`);
    if(!res.ok) throw new Error('HTTP '+res.status);
    const d2 = await res.json();
    const entry = d2.clients && d2.clients[slug];
    posts = (entry && entry.posts) || [];
    warnings = (entry && entry.warnings) || [];
  }catch(e){
    view.innerHTML = `<div class="empty">Could not load live platform data — ${esc(e.message)}</div>`;
    return;
  }

  PERF_ALL_POSTS = posts;
  PERF_WARNINGS = warnings;
  perfSinceLabel = since;
  perfMonthFilter = 'all';
  perfSort = {col:'date', dir:'desc'};
  renderPerformanceView();
}

// Rebuilds the whole tab from PERF_ALL_POSTS — no network call, so the
// month/sort dropdowns are instant.
function renderPerformanceView(){
  const view = document.getElementById('view');
  if(!view) return;
  const warnings = PERF_WARNINGS || [];

  const monthKeys = {};
  PERF_ALL_POSTS.forEach(p=>{ if(p.date) monthKeys[p.date.slice(0,7)] = 1; });
  const months = Object.keys(monthKeys).sort().reverse();

  const selStyle = 'padding:7px 10px;border-radius:8px;border:1px solid var(--line,#ddd);background:var(--paper,#fff);font:inherit;font-size:13px;';

  view.innerHTML = `
    <div class="tabhead">
      <div><h2>Performance</h2><div class="sub">Likes, comments, shares, views and reach for everything live since ${esc(perfSinceLabel)} — pulled straight from Instagram, Facebook & YouTube, whether it was posted through this workspace or not.</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <select style="${selStyle}" onchange="setPerfMonthFilter(this.value)">
          <option value="all"${perfMonthFilter==='all'?' selected':''}>All months</option>
          ${months.map(m=>`<option value="${esc(m)}"${perfMonthFilter===m?' selected':''}>${esc(monthLabel(m))}</option>`).join('')}
        </select>
        <select style="${selStyle}" onchange="setPerfSortField(this.value)">
          ${Object.keys(PERF_SORT_LABELS).map(k=>`<option value="${k}"${perfSort.col===k?' selected':''}>Sort: ${PERF_SORT_LABELS[k]}</option>`).join('')}
        </select>
        <button class="btn-add" onclick="refreshAllStats(this)">🔄 Refresh from platforms</button>
      </div>
    </div>
    <div class="callout">📊 Instagram shows likes, comments, shares, views and reach (real Insights data). Facebook shows likes, comments, shares and views for everything — reach too, but only for plain feed/photo/link posts; Facebook Reels/videos show "Not available" for reach since Meta doesn't expose that metric for Reels anymore. YouTube shows views + likes + comments; reach is always "Not available" there since YouTube has no reach concept via this API.</div>
    ${warnings.length?`<div class="callout">${warnings.map(esc).join('<br>')}</div>`:''}
    <div style="overflow-x:auto"><table id="perfTable" style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="text-align:left;border-bottom:2px solid var(--line)">
        <th style="padding:8px 6px;cursor:pointer" onclick="setPerfSort('name')">Post</th>
        <th style="padding:8px 6px;cursor:pointer" onclick="setPerfSort('date')">Date</th>
        <th style="padding:8px 6px;cursor:pointer" onclick="setPerfSort('platform')">Platform</th>
        <th style="padding:8px 6px;cursor:pointer" onclick="setPerfSort('type')">Type</th>
        <th style="padding:8px 6px;cursor:pointer;text-align:right" onclick="setPerfSort('likes')">Likes</th>
        <th style="padding:8px 6px;cursor:pointer;text-align:right" onclick="setPerfSort('comments')">Comments</th>
        <th style="padding:8px 6px;cursor:pointer;text-align:right" onclick="setPerfSort('shares')">Shares</th>
        <th style="padding:8px 6px;cursor:pointer;text-align:right" onclick="setPerfSort('views')">Views</th>
        <th style="padding:8px 6px;cursor:pointer;text-align:right" onclick="setPerfSort('reach')">Reach</th>
      </tr></thead>
      <tbody id="perfBody"></tbody>
    </table></div>`;

  const filtered = perfMonthFilter==='all' ? PERF_ALL_POSTS : PERF_ALL_POSTS.filter(p=>p.date && p.date.slice(0,7)===perfMonthFilter);

  if(!filtered.length){
    document.getElementById('perfBody').innerHTML = `<tr><td colspan="9" class="empty" style="border:none">No posts found on any connected platform in this period.</td></tr>`;
    return;
  }

  PERF_ROWS = filtered.map(p=>{
    let cap = (p.caption||'').replace(/\s+/g,' ').trim();
    if(cap.length>60) cap = cap.slice(0,60)+'…';
    return {
      name: cap || '(no caption)',
      date: p.date,
      platform: p.platform,
      type: p.type || '',
      permalink: p.permalink || null,
      likes: p.likes, comments: p.comments, shares: p.shares, views: p.views, reach: p.reach,
      reachNA: !!p.reach_unavailable,
    };
  });

  renderPerfRows();
}

function setPerfMonthFilter(v){ perfMonthFilter = v; renderPerformanceView(); }
function setPerfSortField(v){ perfSort = {col:v, dir:'desc'}; renderPerformanceView(); }

function setPerfSort(col){
  if(perfSort.col===col) perfSort.dir = perfSort.dir==='desc'?'asc':'desc';
  else { perfSort.col = col; perfSort.dir = 'desc'; }
  renderPerfRows();
}

function renderPerfRows(){
  const body = document.getElementById('perfBody');
  if(!body) return;
  const {col,dir} = perfSort;
  const sorted = [...PERF_ROWS].sort((a,b)=>{
    let av=a[col], bv=b[col];
    const numeric = ['likes','comments','shares','views','reach'].includes(col);
    if(numeric){ av = av==null?-1:av; bv = bv==null?-1:bv; return dir==='asc'? av-bv : bv-av; }
    av = av||''; bv = bv||'';
    return dir==='asc'? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
  if(!sorted.length){ body.innerHTML = `<tr><td colspan="9" class="empty" style="border:none">No published posts with tracked platforms yet.</td></tr>`; return; }
  body.innerHTML = sorted.map(r=>`
    <tr style="border-bottom:1px solid var(--paper2)">
      <td style="padding:7px 6px">${esc(r.name)}</td>
      <td style="padding:7px 6px;color:var(--muted);font-size:12px">${r.date?fmtDate(r.date):''}</td>
      <td style="padding:7px 6px">${r.permalink?`<a href="${esc(r.permalink)}" target="_blank" rel="noopener">${esc(PUBLISH_KEY_LABELS[r.platform]||r.platform)} ↗</a>`:esc(PUBLISH_KEY_LABELS[r.platform]||r.platform)}</td>
      <td style="padding:7px 6px;color:var(--muted);font-size:12px">${esc(r.type||'')}</td>
      <td style="padding:7px 6px;text-align:right">${r.likes!=null?r.likes.toLocaleString():'—'}</td>
      <td style="padding:7px 6px;text-align:right">${r.comments!=null?r.comments.toLocaleString():'—'}</td>
      <td style="padding:7px 6px;text-align:right">${r.shares!=null?r.shares.toLocaleString():'—'}</td>
      <td style="padding:7px 6px;text-align:right">${r.views!=null?r.views.toLocaleString():'—'}</td>
      <td style="padding:7px 6px;text-align:right">${r.reachNA?'<span style="color:var(--muted);font-style:italic">Not available</span>':(r.reach!=null?r.reach.toLocaleString():'—')}</td>
    </tr>`).join('');
}

async function refreshAllStats(btn){
  const orig = btn.textContent; btn.disabled=true; btn.textContent='Refreshing…';
  try{
    await renderPerformance();
    toast('Refreshed from live platforms');
  }catch(e){ toast('Refresh error: '+e.message); }
  finally{ btn.disabled=false; btn.textContent=orig; }
}

function crefInner(row){
  const status = CAL_FILTER[row.id] || 'All';
  const pillar = row.pillar || '';
  let list = CALENDAR_CONTENT.slice();
  if(pillar) list = list.filter(ci=>{ const p=ci.pillar||''; return p===pillar || p==='Background'; });
  if(status!=='All') list = list.filter(ci=>(ci.status||'')===status);
  const val = row.content_item_id || '';
  const ids = new Set(list.map(ci=>ci.id));
  if(val && !ids.has(val)){ const c0=CALENDAR_CONTENT.find(ci=>ci.id===val); if(c0) list=[c0,...list]; }
  let h = `<div class="cref-filter"><span class="flabel">Show</span><select onchange="setCalStatus('${row.id}',this.value)">`;
  CONTENT_STATUSES.forEach(s=>{ h += `<option ${status===s?'selected':''}>${esc(s)}</option>`; });
  h += `</select><span class="cref-note">${pillar?('pillar: '+esc(pillar)):'set the post pillar to filter by pillar'}</span></div>`;
  h += `<select onchange="assignCref('${row.id}',this.value)"><option value="">— none —</option>`;
  list.forEach(ci=>{ h += `<option value="${ci.id}" ${val===ci.id?'selected':''}>${esc(ci.name||'(untitled)')}</option>`; });
  h += `</select>`;
  if(!list.length) h += `<div class="cref-note">No ${status!=='All'?esc(status)+' ':''}videos${pillar?' tagged '+esc(pillar):''}. Try “All”.</div>`;
  const cur = CALENDAR_CONTENT.find(ci=>ci.id===val);
  if(cur){
    const th = cur.drive_file_id?`https://drive.google.com/thumbnail?id=${cur.drive_file_id}&sz=w320`:null;
    h += `<div class="assigned">`;
    if(th) h += `<img class="mini-thumb" src="${esc(th)}" referrerpolicy="no-referrer" onerror="this.remove()">`;
    h += `<span>${esc(cur.name||'(untitled)')}</span>`;
    if(cur.dimensions) h += ` <span class="ar">${esc(cur.dimensions)} px</span>`;
    if(cur.drive_file_id) h += ` · <a href="https://drive.google.com/uc?export=download&id=${cur.drive_file_id}" target="_blank" rel="noopener">⬇ Download</a>`;
    h += ` · <button class="btn-sm" onclick="openPreview('${cur.id}')">👁 Preview</button>`;
    h += `</div>`;
    h += recoLine(cur, `applyRecoToPost('${row.id}','${cur.id}')`);
  }
  return h;
}
function crefInner(row){
  const status = CAL_FILTER[row.id] || 'All';
  const pillar = row.pillar || '';
  let list = CALENDAR_CONTENT.slice();
  if(pillar) list = list.filter(ci=>{ const p=ci.pillar||''; return p===pillar || p==='Background'; });
  if(status!=='All') list = list.filter(ci=>(ci.status||'')===status);
  const val = row.content_item_id || '';
  const ids = new Set(list.map(ci=>ci.id));
  if(val && !ids.has(val)){ const c0=CALENDAR_CONTENT.find(ci=>ci.id===val); if(c0) list=[c0,...list]; }
  let h = `<div class="cref-filter"><span class="flabel">Show</span><select onchange="setCalStatus('${row.id}',this.value)">`;
  CONTENT_STATUSES.forEach(s=>{ h += `<option ${status===s?'selected':''}>${esc(s)}</option>`; });
  h += `</select><span class="cref-note">${pillar?('pillar: '+esc(pillar)):'set the post pillar to filter by pillar'}</span></div>`;
  h += `<select onchange="assignCref('${row.id}',this.value)"><option value="">— none —</option>`;
  list.forEach(ci=>{ h += `<option value="${ci.id}" ${val===ci.id?'selected':''}>${esc(ci.name||'(untitled)')}</option>`; });
  h += `</select>`;
  if(!list.length) h += `<div class="cref-note">No ${status!=='All'?esc(status)+' ':''}videos${pillar?' tagged '+esc(pillar):''}. Try “All”.</div>`;
  const cur = CALENDAR_CONTENT.find(ci=>ci.id===val);
  if(cur){
    const th = cur.drive_file_id?`https://drive.google.com/thumbnail?id=${cur.drive_file_id}&sz=w320`:null;
    h += `<div class="assigned">`;
    if(th) h += `<img class="mini-thumb" src="${esc(th)}" referrerpolicy="no-referrer" onerror="this.remove()">`;
    h += `<span>${esc(cur.name||'(untitled)')}</span>`;
    if(cur.dimensions) h += ` <span class="ar">${esc(cur.dimensions)} px</span>`;
    if(cur.drive_file_id) h += ` · <a href="https://drive.google.com/uc?export=download&id=${cur.drive_file_id}" target="_blank" rel="noopener">⬇ Download</a>`;
    h += ` · <button class="btn-sm" onclick="openPreview('${cur.id}')">👁 Preview</button>`;
    h += `</div>`;
    h += recoLine(cur, `applyRecoToPost('${row.id}','${cur.id}')`);
  }
  return h;
}
function renderCref(rowId){
  const row = CALENDAR_ROWS.find(x=>x.id===rowId);
  const el = document.getElementById('cref-'+rowId);
  if(row && el) el.innerHTML = crefInner(row);
}
function setCalStatus(rowId,val){ CAL_FILTER[rowId]=val; renderCref(rowId); }
async function assignCref(rowId,val){
  const v = val===''?null:val;
  const {error} = await sb.from('va_calendar_slots').update({content_item_id:v}).eq('id',rowId);
  if(error){ toast('Save failed'); return; }
  const row = CALENDAR_ROWS.find(x=>x.id===rowId); if(row) row.content_item_id=v;
  flash(rowId); renderCref(rowId);
}

/* ---- Cover image picker (2026-07-28) ----
   Lets Cover image (va_content_items.cover_image_url / va_calendar_slots.
   cover_image_url) be picked from an already Drive-synced photo instead of
   requiring a hand-typed URL every time. Reuses whichever content list is
   already loaded for the tab that's open — CONTENT_ROWS on the Content
   Library tab, CALENDAR_CONTENT on the Posting Calendar tab (same source
   content_ref/crefInner above already reads) — so no extra fetch. Only
   photo-type items are offered: a cover image needs to be a static image,
   and video content items have no still frame this app can extract. */
function coverRefSource(collId){ return collId==='content' ? CONTENT_ROWS : CALENDAR_CONTENT; }
// Mirrors the exact media-URL resolution social-publish uses server-side
// (item.storage_url, else the Drive direct-download link with confirm=t to
// bypass Drive's virus-scan interstitial — see that function's header
// comment) so a picked photo resolves to a URL Meta/YouTube can actually
// fetch, not just one that opens fine in a browser tab.
function resolveCoverUrl(ci){
  return ci.storage_url || (ci.drive_file_id ? `https://drive.usercontent.google.com/download?id=${ci.drive_file_id}&export=download&confirm=t` : '');
}
function coverRefInner(collId,row){
  const photos = coverRefSource(collId).filter(ci=>ci.type==='photo');
  const val = row.cover_image_url || '';
  // If the stored URL matches what a known synced photo resolves to, show
  // that photo as selected in the dropdown rather than leaving it on
  // "— none —" just because we store a resolved URL, not a content_item id.
  const matched = photos.find(ci=>resolveCoverUrl(ci)===val && val);
  let h = `<select onchange="assignCoverRef('${collId}','${row.id}',this.value)"><option value="">— none / custom URL below —</option>`;
  photos.forEach(ci=>{ h += `<option value="${ci.id}" ${matched&&matched.id===ci.id?'selected':''}>${esc(ci.name||'(untitled photo)')}</option>`; });
  h += `</select>`;
  if(!photos.length) h += `<div class="cref-note">No synced photos yet for this client — sync from Drive on the Content Library tab, or paste an image URL below.</div>`;
  h += `<input type="url" placeholder="or paste an image URL directly" value="${esc(val)}" oninput="queueSave('${collId}','${row.id}','cover_image_url',this.value)" style="margin-top:6px">`;
  if(matched){
    const th = matched.drive_file_id?`https://drive.google.com/thumbnail?id=${matched.drive_file_id}&sz=w320`:null;
    h += `<div class="assigned">`;
    if(th) h += `<img class="mini-thumb" src="${esc(th)}" referrerpolicy="no-referrer" onerror="this.remove()">`;
    h += `<span>${esc(matched.name||'(untitled)')}</span></div>`;
  }
  return h;
}
async function assignCoverRef(collId,rowId,contentItemId){
  let url = '';
  if(contentItemId){
    const ci = coverRefSource(collId).find(x=>x.id===contentItemId);
    url = ci ? resolveCoverUrl(ci) : '';
    if(!url){ toast('That photo has no usable file yet — check it synced correctly.'); return; }
  }
  const table = COLLECTIONS[collId].table;
  const {error} = await sb.from(table).update({cover_image_url:url}).eq('id',rowId);
  if(error){ toast('Save failed: '+error.message); return; }
  const rows = collId==='content' ? CONTENT_ROWS : CALENDAR_ROWS;
  const row = rows.find(x=>x.id===rowId);
  if(row) row.cover_image_url = url;
  flash(rowId);
  const el = document.getElementById(`coverref-${collId}-${rowId}`);
  if(el && row) el.innerHTML = coverRefInner(collId,row);
}

/* Saving */
const saveTimers = {};
function queueSave(id,rowId,field,val){
  const key = rowId+field;
  clearTimeout(saveTimers[key]);
  // Optimistic local update, immediately — not just after the debounced
  // network save below resolves. Without this, switching calendar days (or
  // any other in-memory rebuild) inside the 700ms debounce window would
  // read the stale pre-edit value from CONTENT_ROWS/CALENDAR_ROWS and the
  // field would appear to have reverted, even though the save itself was
  // never lost. (2026-07-17 fix)
  if(id==='content'){ const i=CONTENT_ROWS.findIndex(x=>x.id===rowId); if(i>=0) CONTENT_ROWS[i][field]=val; }
  if(id==='calendar'){ const i=CALENDAR_ROWS.findIndex(x=>x.id===rowId); if(i>=0) CALENDAR_ROWS[i][field]=val; }
  if(id==='blog'){ const i=BLOG_ROWS.findIndex(x=>x.id===rowId); if(i>=0) BLOG_ROWS[i][field]=val; }
  // Generic list tabs (Reviews/Guest Posts/Pinterest/Directories/DM Audit/
  // Reddit Watch/GBP Tasks/Handoff Notes) — same optimistic-patch fix as
  // content/calendar/blog above, so their new dropdown filters don't read a
  // stale value out of COLL_ROWS mid-debounce.
  if(COLL_ROWS[id]){ const i=COLL_ROWS[id].findIndex(x=>x.id===rowId); if(i>=0) COLL_ROWS[id][i][field]=val; }
  saveTimers[key] = setTimeout(()=>saveField(id,rowId,field,val),700);
}
async function saveField(id,rowId,field,val){
  const c = COLLECTIONS[id];
  const fdef = c.fields.find(f=>f.k===field);
  if(field==='rating'){ val = val===''?null:Number(val); }
  else if(field==='content_item_id'){ val = val===''?null:val; }
  else if(field==='slot_time'){ val = val===''?null:val; }
  else if(fdef && fdef.t==='number'){ val = (val===''||val==null)?null:Number(val); }
  else if(fdef && fdef.t==='date'){ val = val===''?null:val; }
  const {error} = await sb.from(c.table).update({[field]:val}).eq('id',rowId);
  if(error){ toast('Save failed: '+error.message); return; }
  flash(rowId);
  if(id==='content'){ const i=CONTENT_ROWS.findIndex(x=>x.id===rowId); if(i>=0) CONTENT_ROWS[i][field]=val; updateContentCard(rowId); }
  if(id==='calendar'){
    const i=CALENDAR_ROWS.findIndex(x=>x.id===rowId);
    if(i>=0) CALENDAR_ROWS[i][field]=val;
    if(field==='pillar') renderCref(rowId);
    if(field==='slot_date' || field==='slot_time' || field==='pillar') { renderCalendarGrid(); }
    if(field==='status') { refreshPublishBlock(rowId); }
  }
  if(id==='blog'){
    const i=BLOG_ROWS.findIndex(x=>x.id===rowId);
    if(i>=0) BLOG_ROWS[i][field]=val;
    // Re-render so a status change immediately drops out of (or into) the
    // active status filter instead of lingering until the tab is reopened.
    if(field==='status') { renderBlogCards(); }
  }
  if(COLL_ROWS[id]){
    const i=COLL_ROWS[id].findIndex(x=>x.id===rowId);
    if(i>=0) COLL_ROWS[id][i][field]=val;
    // Same as blog above — if the edited field is one of this tab's
    // dropdown filters (e.g. Directories' Status), re-render immediately so
    // the card moves in/out of the current filter without waiting for a
    // tab reopen.
    if(filterableFields(id).some(f=>f.k===field)) renderCollCards(id);
  }
}
async function saveMulti(id,rowId,field,opt,checked){
  const c = COLLECTIONS[id];
  const {data} = await sb.from(c.table).select(field).eq('id',rowId).single();
  let arr = (data&&Array.isArray(data[field]))?data[field]:[];
  if(checked){ if(!arr.includes(opt)) arr.push(opt); } else { arr = arr.filter(x=>x!==opt); }
  const {error} = await sb.from(c.table).update({[field]:arr}).eq('id',rowId);
  if(error){ toast('Save failed'); return; }
  flash(rowId);
  // 2026-07-17 fix: this only ever patched CONTENT_ROWS, never
  // CALENDAR_ROWS — so a platform checkbox ticked on a calendar card would
  // save fine to the database but appear unticked again the moment you
  // switched to another day and back, since that rebuild reads from the
  // (stale) in-memory CALENDAR_ROWS array rather than re-fetching.
  if(id==='content'){ const i=CONTENT_ROWS.findIndex(x=>x.id===rowId); if(i>=0) CONTENT_ROWS[i][field]=arr; }
  if(id==='calendar'){ const i=CALENDAR_ROWS.findIndex(x=>x.id===rowId); if(i>=0) CALENDAR_ROWS[i][field]=arr; }
}
async function addRow(id){
  const c = COLLECTIONS[id];
  // Every table is client-scoped now (2026-07-17) — always tag new rows
  // with the currently selected client.
  if(!CURRENT_CLIENT_ID){ toast('Pick a client first'); return; }
  const {error} = await sb.from(c.table).insert({client_id: CURRENT_CLIENT_ID});
  if(error){ toast('Add failed: '+error.message); return; }
  toast('Added');
  if(id==='content') renderContent();
  else if(id==='calendar') renderCalendar();
  else if(id==='blog') renderBlog();
  else renderCollection(id);
}
function driveFolderId(){
  const d = SETTINGS.drive||{};
  const m = String(d.folder_url||'').match(/[-\w]{25,}/);
  if(m) return m[0];
  return d.folder_id || '';
}
async function syncDrive(btn){
  // Client-aware as of 2026-07-17 — always passes clientId explicitly so
  // synced items land under whichever client is selected in the picker,
  // reading that client's own Drive folder from its own Settings.
  if(!CURRENT_CLIENT_ID){ toast('Pick a client first'); return; }
  const fid = driveFolderId();
  if(!fid){ toast('No Drive folder set for this client yet — add one in Brand & Setup.'); return; }
  const orig = btn.textContent; btn.disabled = true; btn.textContent = 'Syncing…';
  try{
    const headers = {'Content-Type':'application/json'};
    if(SYNC_TOKEN) headers['x-sync-token'] = SYNC_TOKEN;
    const endpoint = FUNCTIONS_URL+'/drive-sync?folderId='+encodeURIComponent(fid)+'&clientId='+encodeURIComponent(CURRENT_CLIENT_ID);
    const res = await fetch(endpoint,{method:'POST',headers});
    const d = await res.json().catch(()=>({}));
    if(!res.ok || d.error){ toast('Sync failed: '+(d.error||('HTTP '+res.status))); btn.disabled=false; btn.textContent=orig; return; }
    toast(`Synced — ${d.added} new item${d.added===1?'':'s'} (${d.total_in_folder} in folder)`);
    renderContent();
  }catch(e){ toast('Sync error: '+e.message); btn.disabled=false; btn.textContent=orig; }
}
async function delRow(id,rowId,btn){
  if(!confirm('Delete this item?')) return;
  const c = COLLECTIONS[id];
  const {error} = await sb.from(c.table).delete().eq('id',rowId);
  if(error){ toast('Delete failed'); return; }
  const el = btn.closest('.card,.ccard'); if(el) el.remove(); toast('Deleted');
  if(id==='content'){ CONTENT_ROWS = CONTENT_ROWS.filter(x=>x.id!==rowId); const cc=document.getElementById('ccount'); if(cc) cc.textContent = `${document.querySelectorAll('.ccard').length} item(s)`; }
  if(id==='blog'){ BLOG_ROWS = BLOG_ROWS.filter(x=>x.id!==rowId); }
  if(COLL_ROWS[id]){
    COLL_ROWS[id] = COLL_ROWS[id].filter(x=>x.id!==rowId);
    const cnt=document.getElementById('collCount'); if(cnt) cnt.textContent = `${document.querySelectorAll('#cards .ccard').length} item(s)`;
  }
}
function flash(rowId){
  const card = document.querySelector(`.card[data-id="${rowId}"], .ccard[data-id="${rowId}"]`);
  if(!card) return; card.classList.add('saved');
  setTimeout(()=>card.classList.remove('saved'),600);
}

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard(){
  const view = document.getElementById('view');
  const noClient = !CURRENT_CLIENT_ID;
  const [rev, needsDesc, awaitTim, sched, anchors] = await Promise.all([
    noClient ? Promise.resolve({count:0}) : sb.from('va_reviews').select('id',{count:'exact',head:true}).eq('received',true).eq('client_id',CURRENT_CLIENT_ID),
    noClient ? Promise.resolve({count:0}) : sb.from('va_content_items').select('id',{count:'exact',head:true}).eq('client_id',CURRENT_CLIENT_ID).in('status',['New from Drive','Needs description']),
    noClient ? Promise.resolve({count:0}) : sb.from('va_content_items').select('id',{count:'exact',head:true}).eq('client_id',CURRENT_CLIENT_ID).eq('status','Description written'),
    noClient ? Promise.resolve({count:0}) : sb.from('va_content_items').select('id',{count:'exact',head:true}).eq('client_id',CURRENT_CLIENT_ID).eq('status','Scheduled'),
    noClient ? Promise.resolve({data:[]}) : sb.from('va_anchor_tasks').select('*').eq('client_id',CURRENT_CLIENT_ID).order('sort_order')
  ]);
  const anchorRows = anchors.data||[];
  view.innerHTML = `
    <div class="tabhead"><div><h2>This Week</h2><div class="sub">Protect the five anchor tasks. If a week gets compressed, these are the ones that move search.</div></div></div>
    <div class="stats">
      <div class="stat"><div class="n">${rev.count||0}</div><div class="l">Google reviews</div></div>
      <div class="stat"><div class="n">${needsDesc.count||0}</div><div class="l">Need a description</div></div>
      <div class="stat"><div class="n">${awaitTim.count||0}</div><div class="l">Awaiting Tim approval</div></div>
      <div class="stat"><div class="n">${sched.count||0}</div><div class="l">Scheduled</div></div>
    </div>
    <div class="panel">
      <h3>Anchor tasks</h3>
      <div id="anchorList">${anchorRows.map(a=>`
        <div class="anchor ${a.done?'done':''}">
          <input type="checkbox" ${a.done?'checked':''} onchange="toggleAnchor('${a.id}',this.checked,this)">
          <label>${esc(a.label)}</label>
        </div>`).join('')||'<div class="sub">No anchor tasks set.</div>'}</div>
    </div>
    <div class="panel">
      <h3>The weekly rhythm</h3>
      <div class="docs-links">
        <span>🟩 Mon — Teach (blog tie-in)</span><span>🟦 Wed — Inspire (project/craft)</span><span>🟧 Fri — Prove / Human (review or Tim)</span>
      </div>
      <p class="sub" style="margin-top:12px">3 feed posts/week · Stories most days · 1 short video/week · YouTube around shoot days. Full detail in the Social Posting Plan.</p>
    </div>
    <div class="panel">
      <h3>Reference</h3>
      <div class="docs-links">${((SETTINGS.docs&&SETTINGS.docs.links)||[]).map(d=>`<span>${esc(d.label)}</span>`).join('')}</div>
    </div>`;
}
async function toggleAnchor(id,checked,el){
  await sb.from('va_anchor_tasks').update({done:checked}).eq('id',id);
  el.closest('.anchor').classList.toggle('done',checked);
}

/* ============================================================
   SETTINGS / BRAND
   ============================================================ */
async function renderSettings(){
  setActive('settings');
  const view = document.getElementById('view');
  if(!CURRENT_CLIENT_ID){ view.innerHTML = '<div class="empty">No client selected — pick one from the dropdown in the top bar.</div>'; return; }
  const nap = SETTINGS.nap||{}; const brand = SETTINGS.brand||{}; const drive = SETTINGS.drive||{};
  view.innerHTML = `
    <div class="tabhead"><div><h2>Brand & Setup</h2><div class="sub">Edit the master NAP, brand voice, and Drive folder. Changes save live and update the top bar.</div></div></div>
    <div class="panel"><h3>Master NAP</h3><div class="grid">
      ${napField('name','Business name',nap.name)}
      ${napField('phone','Phone',nap.phone)}
      ${napField('address','Address',nap.address)}
      ${napField('email','Email',nap.email)}
      ${napField('website','Website',nap.website)}
    </div></div>
    <div class="panel"><h3>Brand voice</h3><div class="grid">
      <div class="f full"><label>The golden rule</label><textarea onchange="saveSetting('brand','golden_rule',this.value)">${esc(brand.golden_rule||'')}</textarea></div>
      <div class="f full"><label>Voice</label><textarea onchange="saveSetting('brand','voice',this.value)">${esc(brand.voice||'')}</textarea></div>
    </div></div>
    <div class="panel"><h3>Google Drive folder</h3><div class="grid">
      <div class="f full"><label>Drive folder URL — what "Sync from Drive" reads</label><input type="url" value="${esc(drive.folder_url||'')}" onchange="saveSetting('drive','folder_url',this.value)"><span class="cref-note" style="margin-top:4px">Paste the folder's share link. Must be shared "anyone with the link". The folder ID is detected automatically.</span></div>
    </div></div>
    <div class="panel"><h3>Access</h3>
      <p class="sub">Two passcodes are set in the page file, in the <code>PASSCODES</code> object near the top of the script. The VA's passcode only ever shows them Crowncon in the client picker — they can't switch to your other clients. Your own passcode shows everything. To add a passcode for a new VA/client pairing, add another entry to <code>PASSCODES</code> with that client's slug in its <code>allow</code> list. This is a light UI gate, not bank-grade security — the app's Supabase key is visible in this file's source regardless of passcode, so keep the URL unlisted and don't treat this as a hard security boundary.</p>
    </div>`;
}
function napField(k,l,v){ return `<div class="f"><label>${l}</label><input type="text" value="${esc(v==null?'':v)}" onchange="saveSetting('nap','${k}',this.value)"></div>`; }
async function saveSetting(key,sub,val){
  if(!CURRENT_CLIENT_ID){ toast('Pick a client first'); return; }
  const cur = SETTINGS[key]||{}; cur[sub]=val;
  if(key==='drive' && sub==='folder_url'){ const m=String(val||'').match(/[-\w]{25,}/); cur.folder_id = m?m[0]:''; }
  const {error} = await sb.from('va_settings').upsert(
    {client_id:CURRENT_CLIENT_ID, key:key, value:cur, updated_at:new Date().toISOString()},
    {onConflict:'client_id,key'}
  );
  if(error){ toast('Save failed: '+error.message); return; }
  SETTINGS[key]=cur; renderTopBar(); toast('Saved');
}

/* ============================================================
   HELPERS
   ============================================================ */
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(d){ try{ return new Date(d).toLocaleDateString('en-AU',{day:'numeric',month:'short'}); }catch(e){ return ''; } }
let toastT;
function toast(msg, err){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.toggle('err', !!err); t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'), err?3200:1800); }
