-- ============================================================================
-- PROPOSED — NOT YET APPLIED.
--
-- This file exists on disk for review only. Do NOT run `supabase db push`
-- against it until the owner has reviewed and explicitly approved it.
-- Replaces 20260705235457_add_rate_limit_events_proposed.sql (deleted,
-- never applied — this is a revised design after a full independent
-- security/concurrency review, not the first draft, so the misleading
-- "_proposed" suffix was dropped before it could ever land permanently in
-- migration history).
--
-- submit-lead/submit-brief do NOT call this yet. Until this is reviewed,
-- applied, and wired in with a small follow-up Edge Function change, both
-- functions ship WITHOUT rate limiting.
-- ============================================================================
--
-- Why this needs its own migration/RPC rather than a query from the Edge
-- Function: private.leads/private.briefs (and this new table) are not
-- reachable outside the DB-owning role at all (by design), so there is no
-- `SELECT count(*) FROM ...` available to the Edge Function directly. And
-- a plain check-then-insert done as two separate statements is not atomic
-- under concurrency regardless of which schema it targets: two
-- simultaneous requests could both observe count < max and both proceed,
-- letting through more than the intended limit. This migration closes
-- that race with a per-key advisory transaction lock
-- (pg_advisory_xact_lock) — see the concurrency notes on the function
-- itself below for the full trace of why this is actually atomic and not
-- just decoratively so.

create table if not exists private.rate_limit_events (
  id          bigint generated always as identity primary key,
  bucket      text        not null,
  key_hash    text        not null,
  created_at  timestamptz not null default now(),

  constraint rate_limit_events_bucket_length check (char_length(bucket) <= 40),
  constraint rate_limit_events_key_hash_length
    check (char_length(key_hash) between 1 and 128)
);

comment on table private.rate_limit_events is
  'Append-only log of rate-limit-relevant attempts (one row per accepted '
  'check, keyed by a caller-supplied bucket + hashed identity). Rows older '
  'than 1 day are swept probabilistically by '
  'public.internal_check_rate_limit() itself — see that function''s '
  'comment. Not exposed via the Data API; written only through that '
  'function.';

create index if not exists rate_limit_events_lookup_idx
  on private.rate_limit_events (bucket, key_hash, created_at desc);

-- A second index to support the cleanup sweep's `WHERE created_at < ...`
-- scan efficiently once the table has meaningfully more rows than fit
-- comfortably in the lookup index's incidental ordering.
create index if not exists rate_limit_events_created_at_idx
  on private.rate_limit_events (created_at);

-- Note: this table automatically inherits the "no default public grants"
-- posture already set by
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private ...
-- in the search-path hardening migration — no need to repeat that here,
-- it already applies to any future object `postgres` creates in `private`.

alter table private.rate_limit_events enable row level security;
-- Same reasoning as leads/briefs: RLS enabled, zero policies, secondary
-- defense layer behind "no role but the owner has any grant here at all".

create or replace function public.internal_check_rate_limit(
  p_bucket         text,
  p_key_hash       text,
  p_window_seconds int,
  p_max_count      int
)
returns boolean -- true = allowed (and recorded), false = rate-limited (not recorded)
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  v_count int;
begin
  -- Defensive guards against a caller bug (this function is only ever
  -- called by our own Edge Function code, never by a user-controlled
  -- caller, but a silently-accepted empty/nonsensical key would create a
  -- meaningless shared bucket, which is a design smell worth failing
  -- loudly on rather than tolerating).
  if p_key_hash is null or length(p_key_hash) = 0 then
    raise exception 'internal_check_rate_limit: p_key_hash must not be empty';
  end if;
  if p_bucket is null or length(p_bucket) = 0 then
    raise exception 'internal_check_rate_limit: p_bucket must not be empty';
  end if;
  if p_window_seconds < 1 or p_max_count < 1 then
    raise exception 'internal_check_rate_limit: p_window_seconds and p_max_count must be positive';
  end if;

  -- Probabilistic lazy sweep (~2% of calls): keeps the table bounded
  -- without a scheduler/pg_cron dependency. 1 day is comfortably above
  -- every window currently in use (minutes, not hours) — traffic-
  -- proportional by construction, since both inserts and sweep chances
  -- scale with call volume, and unlocked (a plain DELETE against rows
  -- already outside every real window is safe to run concurrently from
  -- multiple callers with no special locking: overlapping deletes just
  -- each remove whatever rows are still present, no error, no deadlock).
  if random() < 0.02 then
    delete from private.rate_limit_events where created_at < now() - interval '1 day';
  end if;

  -- Serializes concurrent check+record attempts for this exact
  -- (bucket, key_hash) pair for the lifetime of this transaction only —
  -- released automatically on commit OR rollback (so a rolled-back
  -- caller transaction correctly undoes both the lock and any event
  -- insert together, never leaving a stuck lock or a phantom row).
  -- Different keys never block each other: hashtextextended gives a
  -- roomy 64-bit lock-id space per key, and even in the astronomically
  -- unlikely case of two different (bucket, key_hash) pairs hashing to
  -- the same lock id, the COUNT query below still filters by the real
  -- bucket/key_hash values — a collision could only ever cost one caller
  -- a transient extra wait, never a wrong count or a cross-user block.
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_key_hash, 0));

  select count(*) into v_count
    from private.rate_limit_events
    where bucket = p_bucket
      and key_hash = p_key_hash
      and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max_count then
    return false;
  end if;

  insert into private.rate_limit_events (bucket, key_hash) values (p_bucket, p_key_hash);
  return true;
end;
$$;

comment on function public.internal_check_rate_limit is
$cmt$Atomic check-and-record rate limiter, unaware of leads/briefs. Callable only by service_role. Edge Functions must call this BEFORE calling internal_submit_lead/internal_submit_brief, and only proceed if it returns true.

Integration contract (enforced by Edge Function code, not by this function):
  - Honeypot-triggering requests must never reach this function at all — they are intercepted entirely inside the Edge Function before any RPC call, so they never consume a slot (they can never create a row either way; there is nothing here to protect against for them).
  - A genuine idempotency-key replay is detected inside internal_submit_lead/internal_submit_brief themselves, not here — this function has no visibility into leads/briefs at all, by design. A retried request may therefore occasionally consume one rate-limit slot for a submission that turns out to be a replay. This is a deliberate, accepted trade-off: adding a separate pre-check RPC just to avoid this rare, low-cost case would add real surface for a marginal gain.
  - When the caller has no reliable identity to key on (e.g. ip_hash is null because x-forwarded-for was absent), the caller should skip the IP-keyed bucket entirely rather than pass an empty/placeholder key here (this function rejects an empty p_key_hash). A second bucket keyed by normalized phone/contact should still be checked in that case, so there is always at least one real limit applied.$cmt$;

revoke all on function public.internal_check_rate_limit(text, text, int, int)
  from public, anon, authenticated;

grant execute on function public.internal_check_rate_limit(text, text, int, int)
  to service_role;

-- ============================================================================
-- Suggested (not yet wired in) call shape from submit-lead, illustrative only:
--
--   if (ipHash) {
--     const { data: ipOk } = await ctx.supabaseAdmin.rpc('internal_check_rate_limit', {
--       p_bucket: 'lead_ip', p_key_hash: ipHash, p_window_seconds: 600, p_max_count: 3,
--     });
--     if (!ipOk) return 429;
--   }
--   const { data: phoneOk } = await ctx.supabaseAdmin.rpc('internal_check_rate_limit', {
--     p_bucket: 'lead_phone', p_key_hash: await hashPhone(phone), p_window_seconds: 600, p_max_count: 5,
--   });
--   if (!phoneOk) return 429;
--   // ... then call internal_submit_lead as before.
--
-- Proposed starting thresholds (product decision, not a schema
-- constraint — tune freely without another migration):
--   lead_ip:       max 3 per 10 minutes  (primary signal)
--   lead_phone:    max 5 per 10 minutes  (looser secondary signal, catches
--                  IP-rotation evasion; phone bucket key is the already-
--                  normalized +7XXXXXXXXXX value, hashed the same way as
--                  ip_hash so no raw phone number is stored in this table)
--   brief_ip:      max 3 per 20 minutes
--   brief_contact: max 5 per 20 minutes  (same reasoning as lead_phone;
--                  contact may be a phone or a handle — hash whichever
--                  normalized form was already computed for storage)
-- ============================================================================
