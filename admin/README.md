# Beets & Co — Merged Workspace

One app, three groups, role-gated. Deploy the whole folder together (same directory).

## Files
- `index.html` — shell: gate, header, grouped nav. Loads everything below.
- `js/workspace.js` — the Crowncon Ops engine (collections, calendar, performance, publish, Drive sync) + the new nav-group/role/module routing.
- `js/command.js` — Command → Projects (pm_projects / pm_actions / weekly_*), ported from dashboard.html. Global scope — ignores the client picker.
- `js/tax.js` + `css/tax.css` — Command → Tax / BAS (unmodified; renders inside the Command wrapper).
- `js/business.js` — Business → Clients (records, phases, deliverables, recap, monthly snapshots) and Business → Leads (n8n scraper + outreach), ported from admin-portal-work.html.
- `css/command.css` / `css/business.css` — ported styles, scoped under `.cmd-root` / `.biz-root` so they can't collide with the workspace theme.
- `Client_Portal.html` — unchanged; still the separate client-facing file (Business → Clients "preview" links point here).

## Access
- Workspace passcodes: `PASSCODES` at the top of `js/workspace.js` (owner + VA, same as before).
- Business tabs additionally ask for the **Supabase admin (service) key** once per session — the clients table is RLS-locked to the anon key on purpose. The key lives in sessionStorage only.
- ⚠️ The old admin-portal had the service-role key **hardcoded in the file**. It has been removed from this build — **rotate the service key in Supabase → Settings → API** before deploying anywhere.

## Leads / n8n
The scraper webhook URL defaults to `http://localhost:5678/...`. When n8n is hosted (Oracle box), set it once in the browser console:
`localStorage.setItem('bc_n8n_url', 'https://your-n8n-host/webhook/lead-scraper-ondemand')`

## Not yet done (agreed next steps)
1. Client_Portal calendar → read from `va_calendar_slots` (retire the admin `posts` table).
2. Unify performance sources (`va_post_stats` vs `va_post_performance` view) and feed snapshots from it.
3. Batch outreach emails → server-side (n8n polls `pending_emails` on a schedule) so the tab doesn't need to stay open.
4. Google Calendar checks (lives in the Cowork project).
5. Proper Supabase Auth + RLS to replace client-side passcodes.
