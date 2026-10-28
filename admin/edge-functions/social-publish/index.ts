// social-publish
//
// Publishes va_calendar_slots rows to Instagram (feed / Reel / Trial Reel /
// Story), Facebook (feed / Story / Reel), and YouTube (long-form / Short).
//
// Two ways to call this function:
//   1. Manual — POST { slotId } — publishes exactly that one slot (used by
//      the "🚀 Publish now" button in the Ops Workspace calendar tab).
//   2. Cron — POST { cron: true } — looks up every slot that is due (its
//      scheduled date/time has arrived, in Australia/Melbourne time) and
//      hasn't published yet, and publishes each one in turn. This is what
//      the pg_cron job "auto-publish-scheduled-posts" calls every 15 minutes
//      so that scheduling a post actually results in it going out on its own
//      — no manual click required. Results (Published/Processing/Partial/
//      Failed + permalinks) are written back to va_calendar_slots exactly
//      like the manual path, so the existing status pill in the calendar UI
//      reflects auto-published posts too.
//
//      Cron due-check: slot_date <= today, and if slot_date === today then
//      slot_time <= now (Melbourne). Slots already "Published" are skipped;
//      slots that previously "Failed" are also skipped (so a bad token/config
//      doesn't get silently retried every 15 minutes forever) — those need a
//      manual "Publish now" click once the underlying issue is fixed. Slots
//      stuck in "Processing" (async video processing didn't finish inside
//      this function's poll window) are ALWAYS retried regardless of the
//      workflow `status` field — see the note inline below (2026-07-17 fix).
//      "Partial" slots (one platform hard-failed while at least one other
//      succeeded) are also excluded from silent auto-retry — see the
//      2026-07-21 fix note inline below.
//      At most 5 slots are processed per cron run to stay inside the
//      function's execution time budget; stragglers are picked up on the
//      next run.
//
//      REQUIRES the pg_net Postgres extension to be installed (the cron job
//      calls net.http_post to reach this function) — confirmed enabled
//      2026-07-17 after being missing entirely and silently failing every
//      cron tick since 2026-07-15. If auto-publish ever goes quiet again,
//      check `select * from cron.job_run_details where jobid=1 order by
//      start_time desc limit 5;` first — a `schema "net" does not exist`
//      error there means the extension got disabled again.
//
//      APPROVAL GATE — this is deliberate and must not be removed: cron only
//      auto-publishes a slot whose workflow `status` is "Tim approved" or
//      "Scheduled". "Planned" / "Asset ready" / "Caption written" slots are
//      never touched by cron, even if a content item and platforms are set,
//      because that content hasn't been signed off yet. Final approval on
//      all content stays with Han/Tim — cron only executes what's already
//      been approved, it never decides what's ready. The manual "Publish
//      now" button intentionally has no such gate (clicking it IS the
//      approval), so this check only applies to the automatic path — EXCEPT
//      for slots already "Processing" (see above): those already passed the
//      gate once to get into that state, so a later workflow-status change
//      must never orphan them mid-publish.
//
// Collaborators: up to 3 IG usernames (comma-separated) are sent to
// Instagram's media-container endpoint so the post goes out as a collab
// invite. Only supported for IG feed / Reel / Trial Reel — Instagram does
// not support collaborators on Stories, so it's never sent for those.
// Two places to set it, checked in this order:
//   1. va_calendar_slots.collaborators — set on the Posting Calendar card.
//      Wins if present, since it's specific to that scheduled post (e.g. the
//      same video reposted later with a different collaborator).
//   2. va_content_items.collaborators — set on the Content Library card.
//      Used as the default when the calendar slot doesn't override it.
//
// Tagged accounts (2026-07-28) — DIFFERENT from collaborators above, do not
// confuse the two: this is Meta's `user_tags` mechanism — a plain @mention
// tag on the media, with no invite/accept step and no "Posted with
// @so-and-so" credit line. Same slot-overrides-item resolution order as
// collaborators (va_calendar_slots.tagged_accounts wins over
// va_content_items.tagged_accounts), same feed/Reel/Trial-Reel-only scope
// (Stories don't support it either). Up to 20 usernames per Meta's limit,
// though realistically 1-3 is normal use. For IMAGE posts Meta requires an
// x/y placement per tag — since this app has no visual tagging UI, every
// tag is placed at dead-center (x:0.5, y:0.5); good enough to get the tag on
// the post, not meant to be pixel-precise. For video (Reels) no x/y is
// needed/accepted. NOT implemented for Facebook — Meta's Page-post `tags`
// param only tags other Facebook Pages (not people), needs the tagged
// Page's separate approval, and is a fundamentally different mechanism from
// IG user_tags — deliberately left out rather than guessing at a shaky
// implementation against a live client account. NOT implemented for
// YouTube — there's no "tag another channel" concept in the YouTube Data API.
//
// Cover image (2026-07-28): va_calendar_slots.cover_image_url /
// va_content_items.cover_image_url (same slot-overrides-item resolution as
// above) — a publicly accessible image URL used as the custom cover/
// thumbnail. NOT the same field as va_content_items.thumbnail_url, which is
// the Drive-synced preview thumbnail shown only in this app's own content
// library card and never sent to any platform. IMPORTANT — this only ever
// applies to VIDEO content, never to a plain photo post: a cover is the
// static frame representing a video in a feed/grid, and a photo post has no
// such distinct "thumbnail" slot to override — the photo itself IS the post,
// and Meta's APIs simply don't accept a cover param on a feed photo. Applies to:
//   - Any Instagram platform where the content is a VIDEO, except Stories —
//     `cover_url` on the media container. This includes "IG feed" videos,
//     not just "IG Reel"/"IG Trial Reel": Meta's Content Publishing API
//     already treats a feed VIDEO as media_type REELS under the hood (see
//     the `video_media_type` local below) even when the user only ticked
//     "IG feed", so the cover must follow that same effective media type,
//     not the platform's literal config label. **2026-07-28 fix:** the
//     initial version of this gated cover_url on `config.mediaType==="REELS"`
//     literally, which is only set on the "IG Reel"/"IG Trial Reel" config
//     objects — "IG feed" has no mediaType at all and relies on the same
//     `config.mediaType || "REELS"` fallback used for the media_type param
//     itself, so a video posted to plain "IG feed" silently never got its
//     cover set. Fixed by computing the effective media type once and
//     reusing it for both the media_type param and the cover_url gate.
//   - FB Reel: no equivalent param in Meta's video_reels resumable-upload
//     flow, so this does a best-effort follow-up call after a successful
//     publish (POST /{video_id}?thumb=<url>) — UNVERIFIED against a live
//     Explorer test like the rest of this file's FB Reel code already is;
//     wrapped so a failure here never fails the underlying publish, it just
//     adds a warning.
//   - YouTube (long-form + Short): `videos.thumbnails.set` — a real,
//     documented endpoint, called after a successful upload. Requires the
//     channel to be verified for custom thumbnails; if it isn't (or the
//     fetch/upload fails for any reason), this is swallowed into a warning
//     rather than failing the whole publish — the video itself still goes
//     out fine with YouTube's auto-generated thumbnail.
//   - Not applicable to IG feed/Story PHOTOS, FB feed/Story, or IG Stories
//     (video or photo) — none of those have a separate "cover" concept from
//     the media itself in Meta's API.
//
// Follow-up comment (2026-07-30): va_calendar_slots.follow_up_comment — an
// optional string, auto-posted as a REPLY comment on the post immediately
// after a successful publish (hashtags, a CTA link, etc. — several
// schedulers offer this as a separate "first comment" field, distinct from
// the caption itself). Supported for Instagram feed/Reel/Trial Reel and
// Facebook feed/Reel only. NOT implemented for Stories (no comments
// concept on either platform) or YouTube (comment insertion needs a
// separate OAuth scope — youtube.force-ssl — not present in this app's
// existing refresh tokens; deliberately left out rather than guessing).
// See postFollowUpComment() below for the Instagram permission-scope
// caveat (instagram_business_manage_comments is not in this app's current
// onboarding scope list, so this may silently fail for already-onboarded
// clients until their tokens are reissued). Always best-effort — a failed
// comment never fails or rolls back the underlying publish, it's only
// surfaced as a warning string, same pattern as thumbnail_warning above.
//
// MULTI-CLIENT CREDENTIALS (2026-07-16): every slot now carries a client_id
// (va_calendar_slots.client_id). Before publishing, getCredsForClient(slot.client_id)
// looks up public.va_social_accounts for a row matching that client — that
// table holds each client's own Meta Page ID, IG Business Account ID, and
// tokens (RLS-locked to service_role only; the browser-side Ops Workspace
// and Admin Portal can never read it, only edge functions can). If no row
// exists for a client, credentials fall back to the legacy global env
// secrets below — this is what keeps Han's original personal-account
// connection working untouched as the default/test account, with no
// va_social_accounts row needed for it at all.
//
// Legacy/fallback secrets (Supabase Dashboard → Edge Functions → social-publish → Secrets):
//   META_PAGE_ID          — Facebook Page ID (numeric)
//   META_IG_ACCESS_TOKEN  — Page token scoped for Instagram: instagram_business_basic,
//                           instagram_business_content_publish (+ pages_show_list/read_engagement)
//   META_FB_ACCESS_TOKEN  — Page token scoped for Facebook: pages_manage_posts,
//                           pages_manage_engagement, pages_show_list, pages_read_engagement
//   META_IG_BUSINESS_ID   — Instagram Business Account ID linked to that Page
//   YT_CLIENT_ID          — Google Cloud OAuth Client ID
//   YT_CLIENT_SECRET      — Google Cloud OAuth Client Secret
//   YT_REFRESH_TOKEN      — long-lived refresh token from the youtube.upload consent flow
//                           (expires every 7 days while the Google Cloud project is
//                           in Testing mode — re-authorize and update this secret if
//                           uploads suddenly start failing with an invalid_grant error)
//
// To onboard a new client: add their Page/IG IDs + tokens as a row in
// va_social_accounts keyed by their clients.id. Nothing else in this file
// needs to change — the lookup is automatic based on which client the slot
// belongs to.
//
// TWO SEPARATE META TOKENS PER CLIENT, DELIBERATELY. Meta's app dashboard
// makes it genuinely hard to get instagram_business_* and pages_manage_posts
// onto one token via Graph API Explorer's picker (it's unreliable about
// surfacing both sets together). Splitting them avoids that fight entirely —
// each token only ever needs the scopes its own platform actually uses.
// (Backwards-compatible: if only one token is set for a client, both fall
// back to it.)
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.
//
// KNOWN LIMITATIONS (read before trusting this beyond testing):
//   - Media source: uses content_item.storage_url if present, else falls
//     back to a Drive direct-download link. Fine for quick tests, NOT reliable for
//     real video assets. Build the Storage-mirroring step before relying on
//     this for real CrownCon content.
//   - FB Reel / FB Story use Meta's resumable upload flow (start → upload via
//     file_url reference → finish → poll status). Built from official
//     docs/sample code, not from a manually-verified Explorer test.
//   - FB Stories ignore caption text entirely (Meta doesn't support it) — no
//     caption is sent for that format.
//   - Carousels (2026-08-24): IG feed only — Meta has no Reel/Story carousel
//     equivalent, and FB carousel uses a different API shape not implemented
//     here. content_item.type === "carousel" stores its media as a plain
//     array of direct URLs in carousel_urls (jsonb, 2-10 entries) rather
//     than the single storage_url/drive_file_id every other type uses — see
//     publishInstagramCarousel() below. Each entry must already be a
//     public, directly-fetchable image/video URL (same reliability caveat
//     as storage_url above — no per-child Drive-fallback resolution).
//   - Trial Reels use graduation_strategy: MANUAL — you decide when/whether to
//     fully publish each one, rather than Meta auto-graduating by performance.
//   - Video processing is async. Instagram/Reel/Story polls for ~45s; if not
//     ready, saves progress per-platform and returns "still processing".
//   - YouTube is a fundamentally different mechanism — the function actually
//     fetches and re-streams the video's bytes to Google, rather than handing
//     over a URL reference like every Meta endpoint does. Real risk of timing
//     out on long/large videos given Supabase's function execution limits.
//     Least proven path in this file — test carefully.
//   - Facebook's permalink_url field sometimes comes back as a relative path
//     (e.g. "/reel/123.../") instead of a full URL — confirmed 2026-07-17 on
//     an FB feed Reel post. absoluteFbUrl() below always normalizes it to a
//     full facebook.com URL before it's stored, so the UI never links back
//     to the Ops Workspace's own domain by accident.
//   - DUPLICATE-POST SAFEGUARD (2026-07-21): retries — a manual "Publish now"
//     re-click, or cron re-picking up a Processing slot — used to re-run the
//     ENTIRE requested platform list from scratch every time, including
//     platforms that had already succeeded on an earlier attempt. If a
//     multi-platform post had one slow/failing platform (e.g. IG Reel still
//     processing or erroring) while another had already gone live (e.g. FB
//     Reel), every retry re-posted to FB Reel again — a real duplicate-post
//     risk on exactly the "tick multiple platforms" flow. Fixed below: any
//     platform whose stored result already has `published_at` and no
//     `error` is now skipped on retry and its prior result is carried
//     forward unchanged. Paired with a cron-side fix — see runDueSlots().
//   - INCREMENTAL SAVE (2026-07-30): a real incident — a slot with 4
//     platforms ticked (IG Reel, IG Story, YT Short, FB Story) actually
//     published successfully everywhere, but the whole function got killed
//     by Supabase's execution-time limit partway through (~151s, sequential
//     per-platform polling/upload adds up fast with 3-4 platforms). Because
//     the DB write only used to happen once, at the very end of the entire
//     loop, NOTHING was saved — the slot stayed stuck at "Not queued" with
//     zero record that anything had gone live, and had to be reconciled by
//     hand from the platforms themselves. Fixed below: platform_post_ids is
//     now saved after every single platform in the loop, not just at the
//     end — so a timeout can now only ever lose the *unwritten* platforms,
//     never ones already confirmed live.
//   - DUPLICATE-POST TIMEOUT FIX (2026-08-24): the incremental-save fix
//     below (2026-07-30) only ever saves a platform's result AFTER that
//     platform's publish call returns — it does nothing if the timeout
//     hits WHILE that call is still in flight (e.g. mid-poll, or during the
//     permalink/follow-up-comment fetch right after Meta already accepted
//     the post). That's exactly what happened 2026-07-30: a 4-platform slot
//     went live everywhere, the function got killed before saving anything,
//     the slot still looked "Not queued", and the next 15-minute cron tick
//     would have republished the whole thing from scratch had it not been
//     caught and fixed by hand (see slot d8ca2f33's publish_error for the
//     full account) — a real duplicate-Reel risk, not a hypothetical one.
//     Fixed two ways, both in publishOneSlot(): (1) every requested
//     platform now publishes concurrently instead of one-at-a-time, so a
//     multi-platform slot takes roughly as long as its slowest platform
//     instead of the sum of all of them, making the timeout far less likely
//     to be hit at all; (2) a publish_started_at claim lock is set before
//     any platform calls begin and cleared once the whole attempt finishes
//     — if the function does still die mid-flight, the lock stays in place
//     for up to 5 minutes, so cron's next tick refuses to touch the slot a
//     second time instead of blindly re-publishing it. Per-platform saves
//     now go through merge_platform_post_ids() (an atomic jsonb ||
//     merge in Postgres) rather than each task overwriting the whole
//     platform_post_ids object, since with concurrent platforms that would
//     risk one save's result clobbering another's under network reordering.
//   - DRIVE VIRUS-SCAN INTERSTITIAL (2026-07-21): confirmed root cause of a
//     real incident — for a ~100MB file, the old fallback URL
//     (drive.google.com/uc?export=download) returned Google Drive's "can't
//     scan this file for viruses" HTML confirmation page instead of the
//     video (Drive does this for any file it can't virus-scan, which in
//     practice means most real video files). Meta's servers fetching that
//     URL got HTML and failed with a generic "processing error"/"transfer
//     failed". Worse, YouTube's path fetches the URL itself and re-streams
//     whatever it gets — so it silently uploaded the ~2KB HTML interstitial
//     AS the video, YouTube accepted it and returned a real video ID (so
//     this code recorded it as "Published"), and the video then showed as
//     unavailable because it was never real video data. Fixed below by
//     requesting the download from drive.usercontent.google.com with
//     confirm=t, which bypasses the interstitial and returns the actual
//     file — verified against a real 100MB file (got the correct MP4 magic
//     bytes and full byte length back). A content-type check was also added
//     to publishToYouTube() as defense-in-depth so a non-video response can
//     never silently get uploaded as a "successful" video again.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH = "https://graph.facebook.com/v25.0";



// Legacy/fallback env secrets — used when a client has no va_social_accounts
// row yet. This is deliberately what keeps Han's personal FB/IG connection
// working as-is; see getCredsForClient() below.
const FALLBACK_PAGE_ID = Deno.env.get("META_PAGE_ID") || "";
const FALLBACK_IG_ACCESS_TOKEN = Deno.env.get("META_IG_ACCESS_TOKEN") || Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const FALLBACK_FB_ACCESS_TOKEN = Deno.env.get("META_FB_ACCESS_TOKEN") || Deno.env.get("META_PAGE_ACCESS_TOKEN") || "";
const FALLBACK_IG_BUSINESS_ID = Deno.env.get("META_IG_BUSINESS_ID") || "";
const FALLBACK_YT_CLIENT_ID = Deno.env.get("YT_CLIENT_ID") || "";
const FALLBACK_YT_CLIENT_SECRET = Deno.env.get("YT_CLIENT_SECRET") || "";
const FALLBACK_YT_REFRESH_TOKEN = Deno.env.get("YT_REFRESH_TOKEN") || "";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Facebook's Graph API occasionally returns permalink_url as a root-relative
// path (e.g. "/reel/1565170635400924/") instead of an absolute URL. Left
// as-is, the Ops Workspace's <a href> resolves that against its own origin
// (e.g. beetsandco.com.au/reel/...) instead of Facebook. Always normalize
// to a full facebook.com URL before storing.
function absoluteFbUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return "https://www.facebook.com" + (url.startsWith("/") ? url : "/" + url);
}

// ---------------------------------------------------------------------------
// Per-client credential resolution. Every publish/stat call is for a specific
// va_calendar_slots row, which carries client_id. This looks up that client's
// own Meta Page/IG + YouTube credentials from va_social_accounts; if the
// client has no row there yet, it falls back to the legacy global secrets
// (today's personal/test account) so nothing breaks for clients that haven't
// been onboarded with their own credentials yet.
// ---------------------------------------------------------------------------
type MetaCreds = {
  pageId: string;
  igBusinessId: string;
  igAccessToken: string;
  fbAccessToken: string;
  ytClientId: string;
  ytClientSecret: string;
  ytRefreshToken: string;
};

async function getCredsForClient(clientId: string | null | undefined): Promise<MetaCreds> {
  if (clientId) {
    const { data } = await sb.from("va_social_accounts").select("*").eq("client_id", clientId).maybeSingle();
    if (data) {
      // NULL vs empty-string matters here, deliberately. NULL means "not
      // configured yet" and still inherits the legacy/personal fallback
      // (this is what lets Crowncon's YouTube fields stay unset and keep
      // using Han's already-working personal YouTube setup). An explicit
      // empty string means "onboarded but this platform is intentionally
      // NOT connected for this client" — it must NEVER fall back to Han's
      // personal accounts. Use this for any client (e.g. Here & Now) where
      // a platform hasn't been wired up on purpose, not by oversight.
      return {
        pageId: data.meta_page_id ?? FALLBACK_PAGE_ID,
        igBusinessId: data.meta_ig_business_id ?? FALLBACK_IG_BUSINESS_ID,
        igAccessToken: data.meta_ig_access_token ?? data.meta_fb_access_token ?? FALLBACK_IG_ACCESS_TOKEN,
        fbAccessToken: data.meta_fb_access_token ?? data.meta_ig_access_token ?? FALLBACK_FB_ACCESS_TOKEN,
        ytClientId: data.yt_client_id ?? FALLBACK_YT_CLIENT_ID,
        ytClientSecret: data.yt_client_secret ?? FALLBACK_YT_CLIENT_SECRET,
        ytRefreshToken: data.yt_refresh_token ?? FALLBACK_YT_REFRESH_TOKEN,
      };
    }
  }
  return {
    pageId: FALLBACK_PAGE_ID,
    igBusinessId: FALLBACK_IG_BUSINESS_ID,
    igAccessToken: FALLBACK_IG_ACCESS_TOKEN,
    fbAccessToken: FALLBACK_FB_ACCESS_TOKEN,
    ytClientId: FALLBACK_YT_CLIENT_ID,
    ytClientSecret: FALLBACK_YT_CLIENT_SECRET,
    ytRefreshToken: FALLBACK_YT_REFRESH_TOKEN,
  };
}

// 2026-07-30: best-effort follow-up comment, posted immediately after a
// successful publish. Distinct from the caption — this is a *reply* comment
// (hashtags, a CTA link, etc.), the kind several schedulers offer as a
// separate "first comment" field. Instagram feed/Reel/Trial Reel + Facebook
// feed/Reel only — Stories have no comments concept, and YouTube comment
// insertion needs a separate OAuth scope not present in our existing
// refresh tokens, so it's intentionally not attempted there.
// NOTE: Instagram's /comments endpoint requires the
// instagram_business_manage_comments permission scope, which is NOT in this
// app's documented onboarding scope list (see the Business Manager
// onboarding steps in CLAUDE.md) — so this may silently fail for
// already-onboarded clients (Crowncon, Here & Now) until their tokens are
// reissued with that scope added. Facebook's /comments endpoint should work
// as-is, since it's already covered by the existing pages_manage_engagement
// scope this app requests. Never throws — failure is pushed onto the
// warnings array by the caller, the underlying publish is never rolled back.
async function postFollowUpComment(mediaOrPostId: string, accessToken: string, message: string): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({ message, access_token: accessToken });
    const res = await fetch(`${GRAPH}/${mediaOrPostId}/comments`, { method: "POST", body: params });
    const data = await res.json();
    if (data.error) {
      return `Follow-up comment failed: ${data.error.message || JSON.stringify(data.error)}`;
    }
  } catch (e) {
    return `Follow-up comment failed: ${e instanceof Error ? e.message : String(e)}`;
  }
  return undefined;
}

type IGVariant = { network: "instagram"; key: string; mediaType?: "REELS" | "STORIES"; requiresVideo?: boolean; trial?: boolean };
type FBVariant = { network: "facebook"; key: string; variant: "feed" | "story" | "reel"; requiresVideo?: boolean };
type YTVariant = { network: "youtube"; key: string; requiresVideo: true; short?: boolean };
const PLATFORM_CONFIG: Record<string, IGVariant | FBVariant | YTVariant> = {
  "IG feed":       { network: "instagram", key: "ig_feed" },
  "IG Reel":       { network: "instagram", key: "ig_reel", mediaType: "REELS", requiresVideo: true },
  "IG Trial Reel": { network: "instagram", key: "ig_trial_reel", mediaType: "REELS", requiresVideo: true, trial: true },
  "IG Story":      { network: "instagram", key: "ig_story", mediaType: "STORIES" },
  "FB feed":       { network: "facebook", key: "fb_feed", variant: "feed" },
  "FB Story":      { network: "facebook", key: "fb_story", variant: "story" },
  "FB Reel":       { network: "facebook", key: "fb_reel", variant: "reel", requiresVideo: true },
  "YT long-form":  { network: "youtube", key: "yt_long", requiresVideo: true },
  "YT Short":      { network: "youtube", key: "yt_short", requiresVideo: true, short: true },
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-sync-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}
async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// Up to 3 IG usernames, comma-separated. Stray "@" prefixes and blank
// entries are cleaned up. Takes a raw string (caller decides whether that's
// the slot's or the content item's collaborators field).
function parseCollaborators(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim().replace(/^@/, ""))
    .filter(Boolean)
    .slice(0, 3);
}

// Same cleanup as parseCollaborators but for the `tagged_accounts` field —
// a separate, higher-cap list (Meta's user_tags allows up to 20) since this
// is a plain @mention tag, not a collab invite. Kept as its own function
// (rather than reusing parseCollaborators with a variable cap) so the two
// concepts stay visibly distinct in the code, matching how they're stored
// in visibly distinct columns.
function parseTaggedAccounts(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim().replace(/^@/, ""))
    .filter(Boolean)
    .slice(0, 20);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // no/invalid body — fall through to the error below
  }

  if (body && body.slotId) {
    const result = await publishOneSlot(body.slotId);
    return json(result.body, result.status);
  }

  if (body && body.cron) {
    return await runDueSlots();
  }

  if (body && body.checkCollaborators) {
    return await checkCollaboratorStatus(body.checkCollaborators);
  }

  if (body && body.checkUsername) {
    return await checkUsername(body.checkUsername, body.clientId);
  }

  return json({ error: "Expected JSON body: { slotId } for a single post, { cron: true } to auto-publish due posts, { checkCollaborators: slotId } to check Meta's actual invite status, or { checkUsername: 'handle', clientId? } to verify a username resolves to a real IG account before using it as a collaborator." }, 400);
});

// ---------------------------------------------------------------------------
// Read-only lookup via the Business Discovery API — resolves a public IG
// username to an account without creating or publishing anything. Used to
// diagnose "Invalid user id" errors from the `collaborators` param: that
// error means Meta couldn't resolve one of the usernames (typo, account
// doesn't exist, or it's a personal account not eligible for collab tags).
// Optional clientId scopes the lookup to that client's own IG account;
// omitted, it uses the fallback/legacy credentials.
// ---------------------------------------------------------------------------
async function checkUsername(username: string, clientId?: string) {
  const clean = String(username).trim().replace(/^@/, "");
  const creds = await getCredsForClient(clientId);
  const res = await fetch(
    `${GRAPH}/${creds.igBusinessId}?fields=business_discovery.username(${encodeURIComponent(clean)}){username,id,name}&access_token=${creds.igAccessToken}`
  );
  const data = await res.json();
  if (!res.ok) {
    return json({ username: clean, found: false, error: data?.error?.message || "Lookup failed" });
  }
  return json({ username: clean, found: !!data.business_discovery, account: data.business_discovery || null });
}

// ---------------------------------------------------------------------------
// Read-only check against Meta's real collaborator status for an already-
// published slot. Meta's docs: after a container with `collaborators` is
// published, invited users get a message asking them to accept; this reads
// back GET /<IG_MEDIA_ID>/collaborators, which reports invite_status
// (Pending/Accepted) for each user Meta actually registered as an invitee.
// If a user never enabled "let others tag you as collaborator", Meta won't
// register them here at all — this is how we tell a real invite from
// something that just looked like one.
// ---------------------------------------------------------------------------
async function checkCollaboratorStatus(slotId: string) {
  const { data: slot, error } = await sb.from("va_calendar_slots").select("platform_post_ids, client_id").eq("id", slotId).single();
  if (error || !slot) return json({ error: "Slot not found: " + (error?.message || slotId) }, 404);

  const ids = (slot.platform_post_ids as Record<string, any>) || {};
  const igKeys = ["ig_feed", "ig_reel", "ig_trial_reel"]; // carousel publishes under ig_feed too, so it's already covered here
  const found = igKeys.map((k) => ({ key: k, media_id: ids[k]?.media_id })).filter((e) => e.media_id);

  if (!found.length) {
    return json({ error: "No published Instagram feed/Reel media found on this slot yet — publish it first." }, 400);
  }

  const creds = await getCredsForClient(slot.client_id);
  const results: Record<string, any> = {};
  for (const entry of found) {
    const res = await fetch(`${GRAPH}/${entry.media_id}/collaborators?access_token=${creds.igAccessToken}`);
    const data = await res.json();
    results[entry.key] = res.ok ? (data.data || []) : { error: data?.error?.message || "Could not fetch collaborator status." };
  }

  return json({ ok: true, media: found, results });
}

// ---------------------------------------------------------------------------
// Cron entry point — find slots that are due and haven't published yet.
// ---------------------------------------------------------------------------
async function runDueSlots() {
  const melbDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"
  const melbTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Australia/Melbourne", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date()); // "HH:MM:SS"

  const { data: candidates, error } = await sb
    .from("va_calendar_slots")
    .select("id, slot_date, slot_time, status, publish_status, content_item_id, platforms, client_id")
    .not("content_item_id", "is", null)
    .lte("slot_date", melbDate)
    .order("slot_date", { ascending: true });

  if (error) return json({ error: "Could not load due slots: " + error.message }, 500);

  // Approval gate: cron only ever touches slots Han/Tim have actually signed
  // off on. See the header comment — this is intentional and must stay.
  const APPROVED_STATUSES = new Set(["Tim approved", "Scheduled"]);

  const due = (candidates || []).filter((s) => {
    const publishStatus = s.publish_status || "Not queued";
    if (publishStatus === "Published") return false;
    if (publishStatus === "Failed") return false; // don't silently retry — needs a manual look + "Publish now"
    // "Partial" means one platform hard-failed while at least one other
    // already succeeded. Auto-retrying this silently every 15 minutes used
    // to be safe only because of the duplicate-post bug fixed 2026-07-21 —
    // even now that already-succeeded platforms are never re-posted, a
    // partial failure still means something needs a human look (bad token,
    // permanently invalid media, etc.), so it's excluded here just like
    // "Failed" — a manual "Publish now" click is required to retry it.
    if (publishStatus === "Partial") return false;
    if (!Array.isArray(s.platforms) || !s.platforms.length) return false;
    // Already mid-publish (e.g. Instagram/Facebook video still processing
    // when our poll window ran out) — always keep retrying this until it
    // resolves, regardless of what the workflow `status` has since been
    // changed to (e.g. marked "Posted" after seeing it go live elsewhere).
    // Reaching "Processing" already required passing the approval gate
    // once; it should never get silently orphaned here. (2026-07-17 fix)
    if (publishStatus === "Processing") return true;
    if (!APPROVED_STATUSES.has(s.status)) return false;
    if (s.slot_date === melbDate && s.slot_time && s.slot_time > melbTime) return false; // not time yet today
    return true;
  }).slice(0, 5); // cap per run — next cron tick (15 min later) picks up the rest

  if (!due.length) {
    return json({ ok: true, processed: 0, message: "No due slots to publish." });
  }

  const outcomes = [];
  for (const slot of due) {
    const result = await publishOneSlot(slot.id);
    outcomes.push({ slotId: slot.id, status: result.status, ...result.body });
  }
  return json({ ok: true, processed: outcomes.length, outcomes });
}

// ---------------------------------------------------------------------------
// Shared single-slot publish flow — used by both the manual { slotId } call
// and the cron loop above. Returns { status, body } instead of a Response so
// runDueSlots() can reuse it in a loop.
// ---------------------------------------------------------------------------
async function publishOneSlot(slotId: string): Promise<{ status: number; body: any }> {
  const { data: slot, error: slotErr } = await sb.from("va_calendar_slots").select("*").eq("id", slotId).single();
  if (slotErr || !slot) return { status: 404, body: { error: "Slot not found: " + (slotErr?.message || slotId) } };
  // Ordered carousel slides (2026-10-07): slot.carousel_item_ids is a jsonb
  // array of va_content_items ids whose ORDER is the slide order. 2+ ids turns
  // the slot into a carousel (IG feed) / multi-photo post (FB feed).
  const slideIds: string[] = Array.isArray(slot.carousel_item_ids) ? slot.carousel_item_ids.filter((x: any) => typeof x === "string" && x) : [];
  const slotCarousel = slideIds.length >= 2;
  const leadItemId = slot.content_item_id || (slotCarousel ? slideIds[0] : null);
  if (!leadItemId) return { status: 400, body: { error: "No content assigned to this slot yet." } };

  const { data: item, error: itemErr } = await sb.from("va_content_items").select("*").eq("id", leadItemId).single();
  if (itemErr || !item) return { status: 404, body: { error: "Assigned content item not found." } };

  // Resolve this slot's client's own Meta/YouTube credentials (falls back to
  // the legacy global secrets if the client has no va_social_accounts row).
  const creds = await getCredsForClient(slot.client_id);

  // Carousel items store an array of direct media URLs in carousel_urls
  // instead of the single storage_url/drive_file_id every other type uses —
  // see the KNOWN LIMITATIONS header note and publishInstagramCarousel()
  // below. mediaUrl stays null for these; only carouselUrls is used.
  const isCarousel = slotCarousel || item.type === "carousel";
  let mediaUrl: string | null = null;
  let usingDriveFallback = false;
  let carouselUrls: string[] = [];
  let carouselTypes: ("video" | "image")[] | undefined;

  if (slotCarousel) {
    if (slideIds.length > 10) {
      return { status: 400, body: { error: "Carousels support a maximum of 10 slides — this slot has " + slideIds.length + "." } };
    }
    const { data: slideRows, error: slideErr } = await sb.from("va_content_items").select("*").in("id", slideIds);
    if (slideErr) return { status: 500, body: { error: "Could not load carousel slides: " + slideErr.message } };
    const byId = new Map<string, any>((slideRows || []).map((r: any) => [r.id, r]));
    carouselUrls = [];
    carouselTypes = [];
    // Walk slideIds front to back — this loop is what guarantees slide order
    // matches the order chosen in the admin (a DB `in` query returns rows in
    // arbitrary order, so never rely on slideRows' own order).
    for (const id of slideIds) {
      const r = byId.get(id);
      if (!r) return { status: 400, body: { error: "A carousel slide's content item no longer exists (id " + id + ") — re-pick the slides." } };
      const u = r.storage_url || (r.drive_file_id ? `https://drive.usercontent.google.com/download?id=${r.drive_file_id}&export=download&confirm=t` : null);
      if (!u) return { status: 400, body: { error: `Slide ${carouselUrls.length + 1} (${r.name || id}) has no usable media URL.` } };
      carouselUrls.push(u);
      carouselTypes.push(r.type === "video" ? "video" : "image");
    }
  } else if (isCarousel) {
    carouselUrls = Array.isArray(item.carousel_urls)
      ? item.carousel_urls.filter((u: any) => typeof u === "string" && u.trim())
      : [];
    if (carouselUrls.length < 2) {
      return { status: 400, body: { error: "Carousel content items need at least 2 URLs saved in carousel_urls (max 10)." } };
    }
    if (carouselUrls.length > 10) {
      return { status: 400, body: { error: "Instagram carousels support a maximum of 10 items — carousel_urls has " + carouselUrls.length + "." } };
    }
  } else {
    // confirm=t bypasses Google Drive's "can't scan this file for viruses"
    // interstitial page — without it, drive.google.com/uc?export=download
    // returns that HTML warning page instead of the file for any video Drive
    // won't auto-scan (in practice, most real videos). See the 2026-07-21
    // header note — this silently broke IG/FB Story uploads and caused a
    // "Published" YouTube video that was actually just the warning page.
    mediaUrl =
      item.storage_url || (item.drive_file_id ? `https://drive.usercontent.google.com/download?id=${item.drive_file_id}&export=download&confirm=t` : null);
    if (!mediaUrl) return { status: 400, body: { error: "No usable media URL — assign content with a Drive file or storage_url." } };
    usingDriveFallback = !item.storage_url;
  }

  const requested: string[] = Array.isArray(slot.platforms) ? slot.platforms : [];
  const toPublish = requested.filter((p) => PLATFORM_CONFIG[p]);
  const skipped = requested.filter((p) => !PLATFORM_CONFIG[p]);
  if (!toPublish.length) {
    return { status: 400, body: { error: `None of the requested platforms are supported yet (${requested.join(", ") || "none set"}).` } };
  }

  const existingIds = (slot.platform_post_ids as Record<string, any>) || {};
  const results: Record<string, any> = { ...existingIds };
  const warnings: string[] = skipped.map((p) => `Skipped ${p} — not supported by this function yet.`);
  if (usingDriveFallback) warnings.push("Using Drive fallback link for media — unreliable for large video.");

  // Slot-level collaborators/tagged-accounts/cover-image/follow-up-comment
  // all win over the content item's default — see the header comment for
  // why. follow_up_comment has no content-item fallback (it's calendar-slot
  // only, unlike the other three — a fixed per-item default comment isn't a
  // real use case the way a default cover image is).
  const collaboratorsRaw: string | null = slot.collaborators || item.collaborators || null;
  const taggedAccountsRaw: string | null = slot.tagged_accounts || item.tagged_accounts || null;
  const coverImageUrl: string | null = slot.cover_image_url || item.cover_image_url || null;
  const followUpComment = (slot.follow_up_comment || "").trim();

  // CLAIM LOCK (2026-08-24) — see publish_started_at column comment and the
  // PARALLEL DISPATCH note below. Everything above this point is read-only
  // validation; nothing has called out to Meta/YouTube yet, so it's safe to
  // return early without any cleanup if the claim fails. A claim is "stale"
  // (reclaimable) after 5 minutes — comfortably longer than a real publish
  // run ever takes, short enough that a genuinely-dead run isn't stuck
  // forever. This directly closes the gap that caused the 2026-07-30
  // incident: the function timed out mid-publish (content already live on
  // all 4 platforms) without saving anything, so the slot still looked
  // "Not queued" and the next 15-minute cron tick republished it from
  // scratch, creating duplicates. Now that second attempt is refused
  // outright while the first might still be running.
  const staleThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: claimed, error: claimErr } = await sb
    .from("va_calendar_slots")
    .update({ publish_started_at: new Date().toISOString() })
    .eq("id", slotId)
    .or(`publish_started_at.is.null,publish_started_at.lt.${staleThreshold}`)
    .select("id");
  if (claimErr) return { status: 500, body: { error: "Could not claim this slot for publishing: " + claimErr.message } };
  if (!claimed || !claimed.length) {
    return { status: 409, body: { error: "This slot is already being published (started within the last 5 minutes) — wait for it to finish, or try again shortly if it's genuinely stuck." } };
  }

  // PARALLEL DISPATCH (2026-08-24) — platforms used to publish one at a time
  // in a sequential for-loop, which meant a slot with several platforms
  // ticked (IG Reel + IG Story + YT Short + FB Story, say) could add up to
  // well over Supabase's execution-time limit — exactly what happened
  // 2026-07-30. Running every platform concurrently instead means the whole
  // slot now takes roughly as long as its SLOWEST platform, not the sum of
  // all of them, making that timeout far less likely to ever be hit again.
  // Each task saves its own result the moment it's known, via the
  // merge_platform_post_ids() Postgres function — a single atomic
  // `platform_post_ids = platform_post_ids || {key: value}` update. That's
  // required (not just nice-to-have) under real concurrency: if every task
  // instead wrote the whole shared in-memory `results` object like the old
  // sequential version did, two saves racing on the network could land out
  // of order and an earlier (slower) write could silently clobber a later
  // one's already-saved key. The per-key jsonb merge is safe regardless of
  // arrival order since Postgres serializes concurrent UPDATEs on one row.
  const platformTasks = toPublish.map(async (label) => {
    const config = PLATFORM_CONFIG[label];
    const prior = existingIds[config.key];
    // DUPLICATE-POST SAFEGUARD (2026-07-21) — see header comment. A retry
    // must never redo a platform that already succeeded on an earlier
    // attempt of this same slot; only `published_at` (set exclusively by a
    // successful publish, never by an in-progress/"processing" marker)
    // counts as success here.
    if (prior && prior.published_at && !prior.error) {
      results[config.key] = prior;
      return;
    }
    let outcome: any;
    try {
      if (isCarousel) {
        // Carousels only exist as one shape on one endpoint — IG feed.
        // Every other platform/variant (Reel, Story, FB, YouTube) throws
        // here, same pattern as the requiresVideo gate below.
        const carouselOk = (config.network === "instagram" && config.key === "ig_feed") || (config.network === "facebook" && config.variant === "feed");
        if (!carouselOk) {
          throw new Error(`${label} doesn't support carousel content — carousels can only publish to IG feed (carousel) or FB feed (multi-photo post).`);
        }
      } else if (config.requiresVideo && item.type !== "video") {
        throw new Error(`${label} requires a video content item — this one's a ${item.type}.`);
      }
      if (config.network === "instagram") {
        outcome = isCarousel
          ? await publishInstagramCarousel(carouselUrls, slot.caption || "", existingIds[config.key], collaboratorsRaw, taggedAccountsRaw, followUpComment, creds, carouselTypes)
          : await publishToInstagram(item, mediaUrl!, slot.caption || "", config, existingIds[config.key], collaboratorsRaw, taggedAccountsRaw, coverImageUrl, followUpComment, creds);
        if (outcome.comment_warning) warnings.push(`${label}: ${outcome.comment_warning}`);
      } else if (config.network === "youtube") {
        outcome = await publishToYouTube(item, mediaUrl, slot.caption || "", config.short || false, coverImageUrl, creds, slot.yt_settings);
        if (outcome.thumbnail_warning) warnings.push(`${label}: ${outcome.thumbnail_warning}`);
      } else if (config.variant === "feed") {
        outcome = isCarousel
          ? await publishFacebookCarousel(carouselUrls, carouselTypes, slot.caption || "", followUpComment, creds)
          : await publishFacebookFeed(item, mediaUrl, slot.caption || "", followUpComment, creds);
        if (outcome.comment_warning) warnings.push(`${label}: ${outcome.comment_warning}`);
      } else if (config.variant === "reel") {
        outcome = await publishFacebookReel(mediaUrl, slot.caption || "", existingIds[config.key], coverImageUrl, followUpComment, creds);
        if (outcome.thumbnail_warning) warnings.push(`${label}: ${outcome.thumbnail_warning}`);
        if (outcome.comment_warning) warnings.push(`${label}: ${outcome.comment_warning}`);
      } else {
        outcome = await publishFacebookStory(item, mediaUrl, existingIds[config.key], creds);
      }
    } catch (e) {
      outcome = { ...(existingIds[config.key] || {}), error: String(e.message || e) };
      warnings.push(`${label}: ${e.message || e}`);
    }
    results[config.key] = outcome;
    try {
      await sb.rpc("merge_platform_post_ids", { p_slot_id: slotId, p_patch: { [config.key]: outcome } });
    } catch {
      // best-effort — the final update once every task settles writes the
      // full `results` object as a safety net, same as before.
    }
  });

  await Promise.allSettled(platformTasks);

  const expectedKeys = toPublish.map((p) => PLATFORM_CONFIG[p].key);
  const succeeded = expectedKeys.filter((k) => (results[k]?.permalink || results[k]?.published) && !results[k]?.error);
  const stillProcessing = expectedKeys.some((k) => results[k]?.status === "processing");
  const anyError = expectedKeys.some((k) => results[k]?.error);

  let publishStatus = "Failed";
  if (succeeded.length === expectedKeys.length) publishStatus = "Published";
  else if (stillProcessing) publishStatus = "Processing";
  else if (succeeded.length > 0) publishStatus = "Partial";

  const update: Record<string, any> = {
    publish_status: publishStatus,
    platform_post_ids: results,
    publish_error: warnings.length ? warnings.join(" | ") : null,
    // Release the claim lock now that this attempt has fully finished (in
    // whatever state — Published/Partial/Processing/Failed all reach here).
    // A "Processing" result already carries its own creation_id/video_id
    // per-platform so a later retry resumes rather than re-creates, so it's
    // safe to unlock immediately rather than waiting out the 5-minute
    // staleness window. Only a hard kill/timeout that never reaches this
    // line leaves the lock in place — exactly the case it exists to guard.
    publish_started_at: null,
  };
  if (publishStatus === "Published") update.status = "Posted";

  await sb.from("va_calendar_slots").update(update).eq("id", slotId);

  return {
    status: 200,
    body: {
      ok: !anyError || succeeded.length > 0,
      publish_status: publishStatus,
      results,
      warnings,
      message:
        publishStatus === "Published" ? "Published to all requested formats." :
        publishStatus === "Processing" ? "Still processing — click Publish again shortly." :
        publishStatus === "Partial" ? "Published to some formats, not all — check warnings. Already-published formats are safe to leave; retrying will only retry the failed one(s)." :
        "Publish failed — check warnings.",
    },
  };
}

// ---------------------------------------------------------------------------
// Instagram: container -> poll -> publish
// ---------------------------------------------------------------------------
async function publishToInstagram(item: any, mediaUrl: string, caption: string, config: IGVariant, existing: any, collaboratorsRaw: string | null | undefined, taggedAccountsRaw: string | null | undefined, coverImageUrl: string | null | undefined, followUpComment: string, creds: MetaCreds) {
  let creationId = existing?.status === "processing" ? existing.creation_id : null;

  if (!creationId) {
    const params = new URLSearchParams({ access_token: creds.igAccessToken });
    if (caption && config.mediaType !== "STORIES") params.set("caption", caption);

    if (item.type === "video") {
      // Effective media type actually sent to Meta — "IG feed" has no
      // mediaType in PLATFORM_CONFIG and relies on this same fallback, so a
      // video posted to plain feed is really posted as media_type REELS
      // under the hood. The cover_url gate below must follow this same
      // effective value, not config.mediaType directly, or a feed video's
      // cover silently never gets set (2026-07-28 fix).
      const videoMediaType = config.mediaType || "REELS";
      params.set("video_url", mediaUrl);
      params.set("media_type", videoMediaType);
      if (coverImageUrl && videoMediaType !== "STORIES") params.set("cover_url", coverImageUrl);
    } else {
      params.set("image_url", mediaUrl);
      if (config.mediaType === "STORIES") params.set("media_type", "STORIES");
      // No cover concept for a plain photo post — the photo itself is the
      // media, there's nothing separate to override (see header comment).
    }
    if (config.trial) {
      params.set("trial_params", JSON.stringify({ graduation_strategy: "MANUAL" }));
    }
    // Collaborators (up to 3 IG usernames, real collab invite) and tagged
    // accounts (up to 20, plain @mention tag — see header comment for the
    // difference) — both feed/Reel/Trial Reel only. Instagram doesn't
    // support either on Stories, so neither is ever sent for those.
    if (config.mediaType !== "STORIES") {
      const collaborators = parseCollaborators(collaboratorsRaw);
      if (collaborators.length) params.set("collaborators", JSON.stringify(collaborators));

      const tagged = parseTaggedAccounts(taggedAccountsRaw);
      if (tagged.length) {
        // Photos require an x/y placement per tag; video (Reels) doesn't use
        // one. No per-tag placement UI exists in this app yet, so every photo
        // tag is placed dead-center — enough to land the tag on the post.
        const userTags = item.type === "video"
          ? tagged.map((username) => ({ username }))
          : tagged.map((username) => ({ username, x: 0.5, y: 0.5 }));
        params.set("user_tags", JSON.stringify(userTags));
      }
    }

    const createRes = await fetch(`${GRAPH}/${creds.igBusinessId}/media?${params}`, { method: "POST" });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData?.error?.message || "container creation failed");
    creationId = createData.id;
  }

  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    // `status` (in addition to `status_code`) sometimes carries a human-
    // readable reason from Meta on ERROR — surfaced below instead of a flat
    // generic message so an ERROR result is actually diagnosable.
    const statusRes = await fetch(`${GRAPH}/${creationId}?fields=status_code,status&access_token=${creds.igAccessToken}`);
    const statusData = await statusRes.json();
    if (!statusRes.ok) throw new Error(statusData?.error?.message || "status check failed");

    if (statusData.status_code === "FINISHED") {
      const pubRes = await fetch(
        `${GRAPH}/${creds.igBusinessId}/media_publish?creation_id=${creationId}&access_token=${creds.igAccessToken}`,
        { method: "POST" }
      );
      const pubData = await pubRes.json();
      if (!pubRes.ok) throw new Error(pubData?.error?.message || "publish failed");

      const permRes = await fetch(`${GRAPH}/${pubData.id}?fields=permalink&access_token=${creds.igAccessToken}`);
      const permData = await permRes.json();

      // Follow-up comment — feed/Reel/Trial Reel only, never on Stories
      // (Instagram Stories have no comments concept at all).
      let comment_warning: string | undefined;
      if (followUpComment && config.mediaType !== "STORIES") {
        comment_warning = await postFollowUpComment(pubData.id, creds.igAccessToken, followUpComment);
      }

      return { media_id: pubData.id, permalink: permData.permalink || null, published_at: new Date().toISOString(), ...(comment_warning ? { comment_warning } : {}) };
    }
    if (statusData.status_code === "ERROR") {
      throw new Error(`Instagram reported a processing error on this media${statusData.status ? `: ${statusData.status}` : "."}`);
    }
    await sleep(3000);
  }
  return { creation_id: creationId, status: "processing" };
}

// ---------------------------------------------------------------------------
// Instagram Carousel (2026-08-24) — IG feed only, no Reel/Story/FB
// equivalent (see KNOWN LIMITATIONS header note). Each child is created as
// its own media container with is_carousel_item:true, then referenced by id
// in a parent container with media_type:CAROUSEL. Video children must reach
// FINISHED before the parent can be created — createCarouselChild() polls
// for that; image children are polled too (harmless, usually instant) for
// a single consistent code path. No per-child caption/cover/collaborator —
// those all live on the parent container, same as Meta's API.
// ---------------------------------------------------------------------------
function guessCarouselChildType(url: string): "video" | "image" {
  const path = url.split("?")[0].toLowerCase();
  return /\.(mp4|mov|m4v|webm)$/.test(path) ? "video" : "image";
}

async function createCarouselChild(url: string, igBusinessId: string, accessToken: string, typeHint?: "video" | "image"): Promise<string> {
  const type = typeHint || guessCarouselChildType(url);
  const params = new URLSearchParams({ access_token: accessToken, is_carousel_item: "true" });
  if (type === "video") params.set("video_url", url);
  else params.set("image_url", url);

  const createRes = await fetch(`${GRAPH}/${igBusinessId}/media?${params}`, { method: "POST" });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(createData?.error?.message || `carousel child container failed for ${url}`);
  const id = createData.id;

  for (let i = 0; i < 15; i++) {
    const statusRes = await fetch(`${GRAPH}/${id}?fields=status_code,status&access_token=${accessToken}`);
    const statusData = await statusRes.json();
    if (!statusRes.ok) throw new Error(statusData?.error?.message || "carousel child status check failed");
    if (statusData.status_code === "FINISHED") return id;
    if (statusData.status_code === "ERROR") {
      throw new Error(`Instagram reported a processing error on a carousel child${statusData.status ? `: ${statusData.status}` : "."}`);
    }
    await sleep(2000);
  }
  throw new Error(`Carousel child (${type}) never finished processing in time: ${url}`);
}

async function publishInstagramCarousel(urls: string[], caption: string, existing: any, collaboratorsRaw: string | null | undefined, taggedAccountsRaw: string | null | undefined, followUpComment: string, creds: MetaCreds, types?: ("video" | "image")[]) {
  let creationId = existing?.status === "processing" ? existing.creation_id : null;

  if (!creationId) {
    // Sequential, not Promise.all — matches the deliberately-sequential
    // style used everywhere else in this file, and avoids hammering Meta's
    // rate limits with N simultaneous container-creation calls.
    const childIds: string[] = [];
    // Sequential and in array order — `children` below is joined in this same
    // order, and Instagram shows carousel slides in `children` order.
    for (let i = 0; i < urls.length; i++) {
      childIds.push(await createCarouselChild(urls[i], creds.igBusinessId, creds.igAccessToken, types?.[i]));
    }

    const params = new URLSearchParams({
      access_token: creds.igAccessToken,
      media_type: "CAROUSEL",
      children: childIds.join(","),
    });
    if (caption) params.set("caption", caption);

    const collaborators = parseCollaborators(collaboratorsRaw);
    if (collaborators.length) params.set("collaborators", JSON.stringify(collaborators));
    const tagged = parseTaggedAccounts(taggedAccountsRaw);
    if (tagged.length) params.set("user_tags", JSON.stringify(tagged.map((username) => ({ username }))));

    const createRes = await fetch(`${GRAPH}/${creds.igBusinessId}/media?${params}`, { method: "POST" });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(createData?.error?.message || "carousel container creation failed");
    creationId = createData.id;
  }

  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    const statusRes = await fetch(`${GRAPH}/${creationId}?fields=status_code,status&access_token=${creds.igAccessToken}`);
    const statusData = await statusRes.json();
    if (!statusRes.ok) throw new Error(statusData?.error?.message || "carousel status check failed");

    if (statusData.status_code === "FINISHED") {
      const pubRes = await fetch(
        `${GRAPH}/${creds.igBusinessId}/media_publish?creation_id=${creationId}&access_token=${creds.igAccessToken}`,
        { method: "POST" }
      );
      const pubData = await pubRes.json();
      if (!pubRes.ok) throw new Error(pubData?.error?.message || "carousel publish failed");

      const permRes = await fetch(`${GRAPH}/${pubData.id}?fields=permalink&access_token=${creds.igAccessToken}`);
      const permData = await permRes.json();

      let comment_warning: string | undefined;
      if (followUpComment) {
        comment_warning = await postFollowUpComment(pubData.id, creds.igAccessToken, followUpComment);
      }

      return { media_id: pubData.id, permalink: permData.permalink || null, published_at: new Date().toISOString(), ...(comment_warning ? { comment_warning } : {}) };
    }
    if (statusData.status_code === "ERROR") {
      throw new Error(`Instagram reported a processing error on the carousel${statusData.status ? `: ${statusData.status}` : "."}`);
    }
    await sleep(3000);
  }
  return { creation_id: creationId, status: "processing" };
}

// ---------------------------------------------------------------------------
// YouTube: fundamentally different mechanism from everything above — Google
// requires the function to actually fetch and re-push the video's bytes,
// not just hand over a URL for their servers to fetch. NEW / LEAST PROVEN.
// Risk: long/large videos may exceed Supabase's function execution time limit,
// since the whole file streams through this function rather than being
// referenced by URL.
// ---------------------------------------------------------------------------
async function getYouTubeAccessToken(creds: MetaCreds): Promise<string> {
  const params = new URLSearchParams({
    client_id: creds.ytClientId,
    client_secret: creds.ytClientSecret,
    refresh_token: creds.ytRefreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || "YouTube token refresh failed");
  return data.access_token;
}

// Best-effort custom-thumbnail set for an already-uploaded YouTube video.
// Never throws — a failure here (channel not eligible for custom
// thumbnails, bad image URL, etc.) must never undo an otherwise-successful
// upload. Returns a warning string on failure, undefined on success/skip.
async function setYouTubeThumbnail(videoId: string, coverImageUrl: string, accessToken: string): Promise<string | undefined> {
  try {
    const imgRes = await fetch(coverImageUrl);
    if (!imgRes.ok || !imgRes.body) return `could not fetch cover image (HTTP ${imgRes.status})`;
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    if (!/^image\//i.test(contentType)) return `cover image URL did not return an image (got "${contentType}")`;

    const res = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": contentType },
      body: imgRes.body,
      // @ts-ignore — required by some fetch implementations for streamed request bodies
      duplex: "half",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return `custom thumbnail rejected — ${errData?.error?.message || `HTTP ${res.status}`} (channel may not be verified for custom thumbnails)`;
    }
    return undefined;
  } catch (e) {
    return `custom thumbnail failed — ${e.message || e}`;
  }
}

// Per-post YouTube options (2026-10-07): va_calendar_slots.yt_settings (jsonb),
// edited in the admin's "YouTube settings" panel. A missing/blank key is simply
// not sent, so YouTube/the channel's own default applies — a slot with no
// yt_settings publishes exactly as it did before this existed.
//   title, privacy (public|unlisted|private), made_for_kids, ai_content,
//   paid_promo, public_stats, embeddable ('yes'|'no'), notify_subscribers
//   ('no' only), category (categoryId), tags (comma-separated), language,
//   recording_date (YYYY-MM-DD), license (youtube|creativeCommon).
// Not settable through the Data API at all: age restriction, automatic
// chapters/places/concepts, collaborators, Shorts remixing, comment settings,
// caption certification. Playlists need the broader `youtube` OAuth scope the
// stored refresh tokens don't carry.
async function publishToYouTube(item: any, mediaUrl: string, caption: string, isShort: boolean, coverImageUrl: string | null | undefined, creds: MetaCreds, ytSettings?: any) {
  const yt: Record<string, any> = ytSettings && typeof ytSettings === "object" ? ytSettings : {};
  const yn = (v: any): boolean | undefined => (v === "yes" ? true : v === "no" ? false : undefined);
  const accessToken = await getYouTubeAccessToken(creds);

  const sourceRes = await fetch(mediaUrl);
  if (!sourceRes.ok || !sourceRes.body) throw new Error("Could not fetch source video for YouTube upload.");
  // Defense-in-depth (2026-07-21): this function re-streams whatever bytes
  // mediaUrl returns straight to YouTube with no other validation — if the
  // source ever serves an error/interstitial page instead of the real file
  // (as Google Drive's virus-scan warning page did, see header note), a
  // non-video response must never be uploaded as if it were a real video.
  const sourceContentType = sourceRes.headers.get("content-type") || "";
  if (!/^video\//i.test(sourceContentType)) {
    throw new Error(`Source URL did not return a video (got content-type "${sourceContentType || "unknown"}") — refusing to upload it to YouTube.`);
  }
  const contentLength = sourceRes.headers.get("content-length") || undefined;

  // Default title = content name + the standard hashtags (edit per post in the
  // admin's YouTube settings). Name is trimmed first so the hashtags always fit.
  const DEFAULT_HASHTAGS = "#demolition #construction #excavator #satisfying";
  const title = yt.title
    ? String(yt.title).slice(0, 100)
    : `${String(item.name || "Untitled").trim().slice(0, 100 - DEFAULT_HASHTAGS.length - 1).trim()} ${DEFAULT_HASHTAGS}`;
  const description = isShort ? `${caption || ""}\n\n#Shorts`.trim() : caption || "";

  // Step 1: open a resumable upload session with the video's metadata.
  const tags = String(yt.tags || "construction, demolition").split(",").map((t) => t.trim()).filter(Boolean);
  let tagBudget = 480; // YouTube's 500-char cap counts separators/quoting; stay under it
  const safeTags = tags.filter((t) => (tagBudget -= t.length + 2) >= 0);
  const snippet: Record<string, any> = { title, description, categoryId: /^\d+$/.test(String(yt.category || "")) ? String(yt.category) : "22" };
  if (safeTags.length) snippet.tags = safeTags;
  const lang = String(yt.language || "en-AU");
  snippet.defaultLanguage = lang; snippet.defaultAudioLanguage = lang;

  const status: Record<string, any> = { privacyStatus: ["public", "unlisted", "private"].includes(yt.privacy) ? yt.privacy : "public" };
  const kids = yn(yt.made_for_kids || "no"); if (kids !== undefined) status.selfDeclaredMadeForKids = kids;
  const synthetic = yn(yt.ai_content || "no"); if (synthetic !== undefined) status.containsSyntheticMedia = synthetic;
  const embeddable = yn(yt.embeddable); if (embeddable !== undefined) status.embeddable = embeddable;
  const publicStats = yn(yt.public_stats); if (publicStats !== undefined) status.publicStatsViewable = publicStats;
  if (yt.license === "creativeCommon" || yt.license === "youtube") status.license = yt.license;

  const bodyObj: Record<string, any> = { snippet, status };
  const parts = ["snippet", "status"];
  const paid = yn(yt.paid_promo); // "No" is YouTube's own default, so only an explicit "yes" is sent
  if (paid === true) { bodyObj.paidProductPlacementDetails = { hasPaidProductPlacement: paid }; parts.push("paidProductPlacementDetails"); }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(yt.recording_date || ""))) { bodyObj.recordingDetails = { recordingDate: `${yt.recording_date}T00:00:00Z` }; parts.push("recordingDetails"); }

  const initQuery = new URLSearchParams({ uploadType: "resumable", part: parts.join(",") });
  if (yt.notify_subscribers === "no") initQuery.set("notifySubscribers", "false");

  const initRes = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/videos?${initQuery}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        ...(contentLength ? { "X-Upload-Content-Length": contentLength } : {}),
      },
      body: JSON.stringify(bodyObj),
    }
  );
  if (!initRes.ok) {
    const errData = await initRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "Failed to start YouTube upload session");
  }
  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error("YouTube didn't return an upload session URL.");

  // Step 2: stream the video bytes straight through — fetched from mediaUrl,
  // pushed directly into the PUT body, never buffered fully in memory.
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: contentLength ? { "Content-Length": contentLength } : {},
    body: sourceRes.body,
    // @ts-ignore — required by some fetch implementations for streamed request bodies
    duplex: "half",
  });
  const putData = await putRes.json().catch(() => ({}));
  if (!putRes.ok) throw new Error(putData?.error?.message || "YouTube video upload failed");

  // Custom cover/thumbnail — best-effort, never fails the upload itself.
  // See setYouTubeThumbnail() and the header comment for why this can
  // legitimately fail (channel not verified for custom thumbnails, etc.).
  let thumbnail_warning: string | undefined;
  if (coverImageUrl && putData.id) {
    thumbnail_warning = await setYouTubeThumbnail(putData.id, coverImageUrl, accessToken);
  }

  return {
    video_id: putData.id,
    permalink: putData.id ? `https://youtube.com/watch?v=${putData.id}` : null,
    published_at: new Date().toISOString(),
    ...(thumbnail_warning ? { thumbnail_warning } : {}),
  };
}
// ---------------------------------------------------------------------------
// Facebook multi-photo post (2026-10-07) — Facebook's organic equivalent of a
// carousel. Photos only. Each photo is uploaded unpublished, one at a time and
// in slide order, then a single /feed post attaches them via attached_media in
// that same order (attached_media[0] is the first photo shown). NEW / not yet
// verified against a live Page — failures surface per-platform like any other.
// ---------------------------------------------------------------------------
async function publishFacebookCarousel(urls: string[], types: ("video" | "image")[] | undefined, caption: string, followUpComment: string, creds: MetaCreds) {
  if (types?.some((t) => t === "video")) {
    throw new Error("Facebook multi-photo posts can't include videos — remove the video slide(s) or untick FB feed.");
  }
  const photoIds: string[] = [];
  for (const u of urls) {
    const params = new URLSearchParams({ url: u, published: "false", access_token: creds.fbAccessToken });
    const r = await fetch(`${GRAPH}/${creds.pageId}/photos?${params}`, { method: "POST" });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Facebook photo upload failed for slide ${photoIds.length + 1}`);
    photoIds.push(d.id);
  }
  const feed = new URLSearchParams({ access_token: creds.fbAccessToken });
  if (caption) feed.set("message", caption);
  photoIds.forEach((id, i) => feed.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })));
  const res = await fetch(`${GRAPH}/${creds.pageId}/feed`, { method: "POST", body: feed });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Facebook multi-photo post failed");

  const postId = data.id;
  const permRes = await fetch(`${GRAPH}/${postId}?fields=permalink_url&access_token=${creds.fbAccessToken}`);
  const permData = await permRes.json();

  let comment_warning: string | undefined;
  if (followUpComment) comment_warning = await postFollowUpComment(postId, creds.fbAccessToken, followUpComment);

  return { post_id: postId, permalink: absoluteFbUrl(permData.permalink_url), published_at: new Date().toISOString(), ...(comment_warning ? { comment_warning } : {}) };
}

// ---------------------------------------------------------------------------
// Facebook feed: single-step photo/video post (unchanged, proven working)
// ---------------------------------------------------------------------------
async function publishFacebookFeed(item: any, mediaUrl: string, caption: string, followUpComment: string, creds: MetaCreds) {
  const endpoint = item.type === "video" ? "videos" : "photos";
  const params = new URLSearchParams({ access_token: creds.fbAccessToken });
  if (item.type === "video") { params.set("file_url", mediaUrl); params.set("description", caption); }
  else { params.set("url", mediaUrl); params.set("caption", caption); }

  const res = await fetch(`${GRAPH}/${creds.pageId}/${endpoint}?${params}`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Facebook post failed — check pages_manage_posts is on the token");

  const postId = data.post_id || data.id;
  const permRes = await fetch(`${GRAPH}/${postId}?fields=permalink_url&access_token=${creds.fbAccessToken}`);
  const permData = await permRes.json();

  let comment_warning: string | undefined;
  if (followUpComment) {
    comment_warning = await postFollowUpComment(postId, creds.fbAccessToken, followUpComment);
  }

  return { post_id: postId, permalink: absoluteFbUrl(permData.permalink_url), published_at: new Date().toISOString(), ...(comment_warning ? { comment_warning } : {}) };
}

// ---------------------------------------------------------------------------
// Facebook Reel: resumable upload (start -> upload via file_url -> finish -> poll)
// NEW / LEAST PROVEN — built from Meta's official sample Postman collection,
// not from a hands-on Explorer test like everything else in this file.
// ---------------------------------------------------------------------------
async function publishFacebookReel(mediaUrl: string, caption: string, existing: any, coverImageUrl: string | null | undefined, followUpComment: string, creds: MetaCreds) {
  let videoId = existing?.status === "processing" ? existing.video_id : null;

  if (!videoId) {
    const startRes = await fetch(`${GRAPH}/${creds.pageId}/video_reels?upload_phase=start&access_token=${creds.fbAccessToken}`, { method: "POST" });
    const startData = await startRes.json();
    if (!startRes.ok) throw new Error(startData?.error?.message || "reel upload session failed to start");
    videoId = startData.video_id;

    const uploadRes = await fetch(startData.upload_url, {
      method: "POST",
      headers: { Authorization: `OAuth ${creds.fbAccessToken}`, file_url: mediaUrl },
    });
    if (!uploadRes.ok) {
      const uploadErrText = await uploadRes.text().catch(() => "");
      throw new Error(`reel video transfer from URL failed${uploadErrText ? `: ${uploadErrText.slice(0, 300)}` : ""}`);
    }

    const finishParams = new URLSearchParams({
      upload_phase: "finish", video_id: videoId, video_state: "PUBLISHED",
      description: caption, access_token: creds.fbAccessToken,
    });
    const finishRes = await fetch(`${GRAPH}/${creds.pageId}/video_reels?${finishParams}`, { method: "POST" });
    const finishData = await finishRes.json();
    if (!finishRes.ok) throw new Error(finishData?.error?.message || "reel publish (finish phase) failed");
  }

  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    const statusRes = await fetch(`${GRAPH}/${videoId}?fields=status&access_token=${creds.fbAccessToken}`);
    const statusData = await statusRes.json();
    const state = statusData?.status?.video_status;
    if (state === "ready" || state === "PUBLISHED") {
      const permRes = await fetch(`${GRAPH}/${videoId}?fields=permalink_url&access_token=${creds.fbAccessToken}`);
      const permData = await permRes.json();
      // Custom cover/thumbnail — best-effort, unverified against a live
      // Explorer test (see header comment). A failure here never undoes the
      // Reel publish itself, it's just surfaced as a warning.
      let thumbnail_warning: string | undefined;
      if (coverImageUrl) {
        try {
          const thumbRes = await fetch(`${GRAPH}/${videoId}?thumb=${encodeURIComponent(coverImageUrl)}&access_token=${creds.fbAccessToken}`, { method: "POST" });
          if (!thumbRes.ok) {
            const thumbData = await thumbRes.json().catch(() => ({}));
            thumbnail_warning = `custom cover rejected — ${thumbData?.error?.message || `HTTP ${thumbRes.status}`}`;
          }
        } catch (e) {
          thumbnail_warning = `custom cover failed — ${e.message || e}`;
        }
      }
      // Follow-up comment — same best-effort pattern as the cover above.
      let comment_warning: string | undefined;
      if (followUpComment) {
        comment_warning = await postFollowUpComment(videoId, creds.fbAccessToken, followUpComment);
      }
      return { video_id: videoId, permalink: absoluteFbUrl(permData.permalink_url), published_at: new Date().toISOString(), ...(thumbnail_warning ? { thumbnail_warning } : {}), ...(comment_warning ? { comment_warning } : {}) };
    }
    if (state === "error") throw new Error("Facebook reported a processing error on this Reel.");
    await sleep(3000);
  }
  return { video_id: videoId, status: "processing" };
}

// ---------------------------------------------------------------------------
// Facebook Story: photo (two-step) or video (resumable, same shape as Reel).
// NEW / LEAST PROVEN. Captions are never sent — Facebook Stories don't
// support post text and silently ignore it, so we don't pretend otherwise.
// ---------------------------------------------------------------------------
async function publishFacebookStory(item: any, mediaUrl: string, existing: any, creds: MetaCreds) {
  if (item.type !== "video") {
    const uploadParams = new URLSearchParams({ url: mediaUrl, published: "false", access_token: creds.fbAccessToken });
    const uploadRes = await fetch(`${GRAPH}/${creds.pageId}/photos?${uploadParams}`, { method: "POST" });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData?.error?.message || "story photo upload failed");

    const pubRes = await fetch(`${GRAPH}/${creds.pageId}/photo_stories?photo_id=${uploadData.id}&access_token=${creds.fbAccessToken}`, { method: "POST" });
    const pubData = await pubRes.json();
    if (!pubRes.ok) throw new Error(pubData?.error?.message || "story publish failed");
    return { story_id: pubData.id || pubData.post_id, permalink: null, published: true, published_at: new Date().toISOString() };
  }

  let videoId = existing?.status === "processing" ? existing.video_id : null;
  if (!videoId) {
    const startRes = await fetch(`${GRAPH}/${creds.pageId}/video_stories?upload_phase=start&access_token=${creds.fbAccessToken}`, { method: "POST" });
    const startData = await startRes.json();
    if (!startRes.ok) throw new Error(startData?.error?.message || "story upload session failed to start");
    videoId = startData.video_id;

    const uploadRes = await fetch(startData.upload_url, {
      method: "POST",
      headers: { Authorization: `OAuth ${creds.fbAccessToken}`, file_url: mediaUrl },
    });
    if (!uploadRes.ok) {
      const uploadErrText = await uploadRes.text().catch(() => "");
      throw new Error(`story video transfer from URL failed${uploadErrText ? `: ${uploadErrText.slice(0, 300)}` : ""}`);
    }

    const finishRes = await fetch(
      `${GRAPH}/${creds.pageId}/video_stories?upload_phase=finish&video_id=${videoId}&access_token=${creds.fbAccessToken}`,
      { method: "POST" }
    );
    const finishData = await finishRes.json();
    if (!finishRes.ok) throw new Error(finishData?.error?.message || "story publish (finish phase) failed");
  }

  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    const statusRes = await fetch(`${GRAPH}/${videoId}?fields=status&access_token=${creds.fbAccessToken}`);
    const statusData = await statusRes.json();
    const state = statusData?.status?.video_status;
    if (state === "ready" || state === "PUBLISHED") {
      return { video_id: videoId, permalink: null, published: true, published_at: new Date().toISOString() };
    }
    if (state === "error") throw new Error("Facebook reported a processing error on this Story.");
    await sleep(3000);
  }
  return { video_id: videoId, status: "processing" };
}
