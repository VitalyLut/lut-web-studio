-- LUT Web Studio — backend foundation
--
-- Creates an internal, non-API-exposed "private" schema holding raw form
-- submissions (leads, briefs), plus two narrow SECURITY DEFINER RPC
-- functions in `public` that are the ONLY write path into it.
--
-- Why the RPC layer exists (architecture correction from the first draft
-- of this migration): `private` is deliberately absent from
-- supabase/config.toml [api].schemas, so PostgREST/Data API never routes
-- to it for ANY role, including service_role — a standard supabase-js call
-- like `supabase.schema("private").from("leads").insert(...)` would fail
-- regardless of key used, because PostgREST refuses to even resolve a
-- non-exposed schema. A future Edge Function therefore cannot write to
-- `private.leads`/`private.briefs` directly through the normal REST/RPC
-- client. The fix is NOT to expose `private` (that would defeat the whole
-- point) — it's two narrow functions living in the already-exposed
-- `public` schema, reachable via the standard `/rest/v1/rpc/...` endpoint,
-- with EXECUTE revoked from anon/authenticated/public and granted only to
-- service_role. SECURITY DEFINER lets them act on `private` tables (they
-- run with the privileges of their owner, who created/owns the `private`
-- schema) without service_role needing — or getting — any direct grant on
-- `private` itself. Net result: service_role's entire footprint on this
-- feature is "EXECUTE on 2 functions with a fixed, typed parameter list."
-- It has no standing SELECT/INSERT/UPDATE/DELETE on the tables at all.
--
-- This is a forward-only migration tracked by the Supabase migration
-- history table. It is written defensively (if not exists / or replace)
-- so an accidental re-run is a no-op rather than an error, but it is not
-- designed or intended to be applied twice against the same database.
--
-- Rollback: see the down-migration notes at the bottom of this file
-- (not auto-applied — supabase CLI migrations are forward-only; rollback
-- must be run manually as its own migration if ever needed).

-- =========================================================================
-- 1. Schema
-- =========================================================================

create schema if not exists private;

comment on schema private is
  'Internal tables for raw form submissions (leads, briefs). Deliberately '
  'excluded from [api].schemas — never reachable via the Data API under any '
  'role. The only write path in is public.internal_submit_lead / '
  'public.internal_submit_brief, callable solely by service_role.';

-- =========================================================================
-- 2. ID generation — pure candidate generator, no retry logic here.
--
-- These functions each return ONE candidate value. They do not loop or
-- retry, and they are not granted to anyone directly (they are only ever
-- called from inside the SECURITY DEFINER functions in section 5, which
-- run as their owner and so already have implicit rights to call them).
-- Retry-on-collision lives in the SECURITY DEFINER submit functions
-- themselves (section 5) — see the file-level comment above and section 5
-- for why that boundary was chosen over retrying in the Edge Function.
-- =========================================================================

create or replace function private.generate_readable_suffix(p_length int default 6)
returns text
language plpgsql
volatile
as $$
declare
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_result text := '';
  i int;
begin
  for i in 1..p_length loop
    v_result := v_result || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
  end loop;
  return v_result;
end;
$$;

comment on function private.generate_readable_suffix(int) is
  'Returns one random p_length-character candidate suffix from a '
  'visually-unambiguous alphabet (no 0/O/1/I). Not unique by itself.';

-- One candidate lead_number, e.g. LWS-L-260706-K7M2QD
create or replace function private.generate_lead_number()
returns text
language sql
volatile
as $$
  select 'LWS-L-' || to_char(now(), 'YYMMDD') || '-' || private.generate_readable_suffix(6);
$$;

comment on function private.generate_lead_number() is
  'Candidate value for leads.lead_number, used as the column DEFAULT. Not '
  'guaranteed unique on its own — the UNIQUE constraint plus the retry loop '
  'in public.internal_submit_lead() are the actual guarantee.';

-- One candidate brief_number, e.g. LWS-B-260706-K7M2QD
create or replace function private.generate_brief_number()
returns text
language sql
volatile
as $$
  select 'LWS-B-' || to_char(now(), 'YYMMDD') || '-' || private.generate_readable_suffix(6);
$$;

comment on function private.generate_brief_number() is
  'Candidate value for briefs.brief_number, used as the column DEFAULT. Not '
  'guaranteed unique on its own — the UNIQUE constraint plus the retry loop '
  'in public.internal_submit_brief() are the actual guarantee.';

-- =========================================================================
-- 3. private.leads — short popup/modal submissions
-- =========================================================================

create table if not exists private.leads (
  id                uuid        primary key default gen_random_uuid(),
  lead_number       text        not null unique default private.generate_lead_number(),
  created_at        timestamptz not null default now(),

  name              text        not null,
  phone             text        not null,
  project_type      text        not null,

  source            text        not null default 'unknown',
  page_url          text        not null,
  status            text        not null default 'new',

  user_agent        text        null,
  utm_source        text        null,
  utm_medium        text        null,
  utm_campaign      text        null,
  utm_term          text        null,
  utm_content       text        null,
  ip_hash           text        null,

  idempotency_key   uuid        null,

  -- Technical metadata only (e.g. request timing, header snapshot used for
  -- diagnostics). Must never contain name/phone or any other copy of
  -- personal data already stored in dedicated columns above — this is a
  -- process rule enforced by the future Edge Function, not something a
  -- CHECK constraint can verify on arbitrary JSON.
  request_meta      jsonb       null,

  constraint leads_name_length
    check (char_length(name) between 1 and 120),
  constraint leads_phone_format
    check (phone ~ '^\+7\d{10}$'),
  constraint leads_project_type_allowed
    check (project_type in ('landing', 'corporate', 'ecommerce', 'service', 'redesign', 'tilda-upgrade')),
  constraint leads_source_allowed
    check (source in ('hero', 'trust', 'configurator', 'journey', 'footer', 'portfolio', 'unknown')),
  constraint leads_page_url_length
    check (char_length(page_url) <= 2048),
  constraint leads_status_allowed
    check (status in ('new', 'contacted', 'qualified', 'converted', 'spam', 'archived')),
  constraint leads_user_agent_length
    check (user_agent is null or char_length(user_agent) <= 500),
  constraint leads_utm_source_length
    check (utm_source is null or char_length(utm_source) <= 150),
  constraint leads_utm_medium_length
    check (utm_medium is null or char_length(utm_medium) <= 150),
  constraint leads_utm_campaign_length
    check (utm_campaign is null or char_length(utm_campaign) <= 150),
  constraint leads_utm_term_length
    check (utm_term is null or char_length(utm_term) <= 150),
  constraint leads_utm_content_length
    check (utm_content is null or char_length(utm_content) <= 150)
);

comment on table private.leads is
  'Short popup/modal lead submissions. Written exclusively via '
  'public.internal_submit_lead() — never directly by service_role, and '
  'never by the browser.';
comment on column private.leads.request_meta is
  'Technical metadata only (timing, diagnostics). Never a copy of name, '
  'phone, or any personal-data field already stored elsewhere in this row.';

create index if not exists leads_created_at_idx
  on private.leads (created_at desc);
create index if not exists leads_status_idx
  on private.leads (status);
create index if not exists leads_phone_idx
  on private.leads (phone);
create unique index if not exists leads_idempotency_key_unique_idx
  on private.leads (idempotency_key)
  where idempotency_key is not null;

alter table private.leads enable row level security;
-- No policies created intentionally: RLS enabled + zero policies denies
-- all access to every role except the table owner and roles with the
-- BYPASSRLS attribute. Note this is now a secondary defense layer — the
-- primary one is that no role except the table owner (who also owns the
-- SECURITY DEFINER functions below) has any grant on this table at all.

-- =========================================================================
-- 4. private.briefs — full 7-step brief submissions
-- =========================================================================

create table if not exists private.briefs (
  id                uuid        primary key default gen_random_uuid(),
  brief_number      text        not null unique default private.generate_brief_number(),
  created_at        timestamptz not null default now(),

  name              text        not null,
  contact           text        not null,
  contact_type      text        not null default 'unknown',
  comment           text        null,
  answers           jsonb       not null,

  source            text        not null default 'brief',
  page_url          text        not null,
  status            text        not null default 'new',

  user_agent        text        null,
  utm_source        text        null,
  utm_medium        text        null,
  utm_campaign      text        null,
  utm_term          text        null,
  utm_content       text        null,
  ip_hash           text        null,

  idempotency_key   uuid        null,

  -- Same rule as private.leads.request_meta: technical metadata only.
  request_meta      jsonb       null,

  constraint briefs_name_length
    check (char_length(name) between 1 and 120),
  constraint briefs_contact_length
    check (char_length(contact) between 1 and 190),
  constraint briefs_contact_type_allowed
    check (contact_type in ('phone', 'handle', 'unknown')),
  constraint briefs_comment_length
    check (comment is null or char_length(comment) <= 2000),
  constraint briefs_answers_required_keys
    check (
      answers ? 'format' and
      answers ? 'stage' and
      answers ? 'goal' and
      answers ? 'content' and
      answers ? 'timing' and
      answers ? 'channel'
    ),
  -- Brief currently has exactly one entry point (the standalone on-page
  -- quiz). Widen this list in a future migration if a second entry point
  -- for briefs is ever introduced.
  constraint briefs_source_allowed
    check (source in ('brief')),
  constraint briefs_page_url_length
    check (char_length(page_url) <= 2048),
  constraint briefs_status_allowed
    check (status in ('new', 'contacted', 'qualified', 'converted', 'spam', 'archived')),
  constraint briefs_user_agent_length
    check (user_agent is null or char_length(user_agent) <= 500),
  constraint briefs_utm_source_length
    check (utm_source is null or char_length(utm_source) <= 150),
  constraint briefs_utm_medium_length
    check (utm_medium is null or char_length(utm_medium) <= 150),
  constraint briefs_utm_campaign_length
    check (utm_campaign is null or char_length(utm_campaign) <= 150),
  constraint briefs_utm_term_length
    check (utm_term is null or char_length(utm_term) <= 150),
  constraint briefs_utm_content_length
    check (utm_content is null or char_length(utm_content) <= 150)
);

comment on table private.briefs is
  'Full 7-step brief submissions. Written exclusively via '
  'public.internal_submit_brief() — never directly by service_role, and '
  'never by the browser.';
comment on column private.briefs.request_meta is
  'Technical metadata only (timing, diagnostics). Never a copy of name, '
  'contact, or the answers payload already stored elsewhere in this row.';

create index if not exists briefs_created_at_idx
  on private.briefs (created_at desc);
create index if not exists briefs_status_idx
  on private.briefs (status);
create unique index if not exists briefs_idempotency_key_unique_idx
  on private.briefs (idempotency_key)
  where idempotency_key is not null;

alter table private.briefs enable row level security;
-- Same reasoning as private.leads: RLS enabled, zero policies, secondary
-- defense layer behind "no role but the owner has any grant here at all".

-- =========================================================================
-- 5. Narrow SECURITY DEFINER RPC entry points (public schema)
--
-- These are the ONLY way anything outside this schema can write a row into
-- private.leads / private.briefs. They:
--   - take explicit, typed parameters — never a raw jsonb blob blindly
--     inserted. The caller (Edge Function) is expected to have ALREADY done
--     CORS, rate limiting, honeypot handling, validation, normalization and
--     idempotency-key generation before calling this. This function's job
--     is a minimal atomic write of already-trustworthy data, not a second
--     validation pass — though table CHECK constraints still apply as a
--     defense-in-depth backstop against a buggy caller.
--   - never accept `status`: every row starts 'new'; nothing calling this
--     function can force a different status at insert time.
--   - handle idempotency_key as a distinct, deliberate code path — a
--     pre-check SELECT before attempting insert, so an idempotent replay
--     returns the existing lead_number/brief_number rather than erroring
--     or generating a new one. A unique_violation on the *idempotency_key*
--     index (only possible if two concurrent requests race past the
--     pre-check) is caught separately from a unique_violation on the
--     *_number column and handled the same way: look up and return the
--     existing row, never insert a duplicate.
--   - retry ONLY on a genuine lead_number/brief_number collision (an
--     essentially-never-but-possible random suffix clash within the same
--     day), disambiguated from an idempotency_key collision via
--     GET STACKED DIAGNOSTICS ... CONSTRAINT_NAME — not by treating every
--     SQLSTATE 23505 the same way. This retry lives here, in the DB
--     function, rather than in the Edge Function, precisely because only
--     the DB function can reliably tell these two conflict types apart
--     without parsing PostgREST's error text.
--   - are SECURITY DEFINER with a pinned `search_path` (private, pg_temp —
--     deliberately NOT including `public`) to close the classic
--     search-path-hijack hole: an unqualified identifier inside this
--     function can never resolve to an object planted in `public` by a
--     lower-privileged role. Every reference to a private-schema object is
--     also explicitly schema-qualified as belt-and-suspenders.
--   - are owned by the migration-running role (the same role `private`
--     itself is owned by), so as SECURITY DEFINER they already have full
--     rights on `private.leads`/`private.briefs` — no separate GRANT on
--     those tables to service_role is needed, or created, below.
-- =========================================================================

create or replace function public.internal_submit_lead(
  p_name            text,
  p_phone           text,
  p_project_type    text,
  p_source          text,
  p_page_url        text,
  p_user_agent      text default null,
  p_utm_source      text default null,
  p_utm_medium      text default null,
  p_utm_campaign    text default null,
  p_utm_term        text default null,
  p_utm_content     text default null,
  p_ip_hash         text default null,
  p_idempotency_key uuid default null,
  p_request_meta    jsonb default null
)
returns table (lead_number text, created_at timestamptz, is_duplicate boolean)
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  v_existing_lead_number text;
  v_existing_created_at  timestamptz;
  v_constraint            text;
  v_attempt                int;
  v_max_attempts constant int := 5;
begin
  -- Deliberate replay of an already-processed idempotency_key: return the
  -- original row, do not insert again.
  if p_idempotency_key is not null then
    select l.lead_number, l.created_at
      into v_existing_lead_number, v_existing_created_at
      from private.leads l
      where l.idempotency_key = p_idempotency_key;

    if found then
      return query select v_existing_lead_number, v_existing_created_at, true;
      return;
    end if;
  end if;

  for v_attempt in 1..v_max_attempts loop
    begin
      return query
        insert into private.leads (
          name, phone, project_type, source, page_url, user_agent,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content,
          ip_hash, idempotency_key, request_meta
        )
        values (
          p_name, p_phone, p_project_type, p_source, p_page_url, p_user_agent,
          p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term, p_utm_content,
          p_ip_hash, p_idempotency_key, p_request_meta
        )
        returning leads.lead_number, leads.created_at, false;
      return;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;

        if v_constraint = 'leads_idempotency_key_unique_idx' then
          -- Lost a race with a concurrent identical request that committed
          -- between our pre-check and our insert attempt.
          select l.lead_number, l.created_at
            into v_existing_lead_number, v_existing_created_at
            from private.leads l
            where l.idempotency_key = p_idempotency_key;

          -- Defensive-only: under the default READ COMMITTED isolation this
          -- row is always found (its commit is exactly what caused the
          -- conflict we just caught). This guards against a future
          -- isolation-level change (REPEATABLE READ/SERIALIZABLE) making
          -- this SELECT use a snapshot older than that commit — fail loudly
          -- instead of silently returning NULL fields.
          if not found then
            raise exception
              'internal_submit_lead: idempotency_key % conflicted but no row found — check transaction isolation level',
              p_idempotency_key;
          end if;

          return query select v_existing_lead_number, v_existing_created_at, true;
          return;
        elsif v_constraint = 'leads_lead_number_key' then
          -- Genuine lead_number collision: loop again, a fresh candidate is
          -- drawn automatically by the column DEFAULT on the next attempt.
          continue;
        else
          raise;
        end if;
    end;
  end loop;

  raise exception 'internal_submit_lead: exhausted % attempts generating a unique lead_number', v_max_attempts;
end;
$$;

comment on function public.internal_submit_lead is
  'Sole write path into private.leads. Callable only by service_role '
  '(EXECUTE revoked from public/anon/authenticated below). Expects the '
  'caller to have already validated, normalized and rate-limited the '
  'request; performs a minimal atomic insert plus idempotency/ID-collision '
  'handling only.';

-- Parameter order matters here: PostgreSQL requires every parameter that
-- has a DEFAULT to come after every parameter that doesn't. Required
-- fields (name/contact/answers/page_url) are listed first; everything
-- optional follows. Edge Functions call this by name (JSON object), not
-- positionally, so this ordering has no effect on how it's invoked.
create or replace function public.internal_submit_brief(
  p_name            text,
  p_contact         text,
  p_answers         jsonb,
  p_page_url        text,
  p_contact_type    text default 'unknown',
  p_comment         text default null,
  p_source          text default 'brief',
  p_user_agent      text default null,
  p_utm_source      text default null,
  p_utm_medium      text default null,
  p_utm_campaign    text default null,
  p_utm_term        text default null,
  p_utm_content     text default null,
  p_ip_hash         text default null,
  p_idempotency_key uuid default null,
  p_request_meta    jsonb default null
)
returns table (brief_number text, created_at timestamptz, is_duplicate boolean)
language plpgsql
security definer
set search_path = private, pg_temp
as $$
declare
  v_existing_brief_number text;
  v_existing_created_at   timestamptz;
  v_constraint             text;
  v_attempt                 int;
  v_max_attempts constant int := 5;
begin
  if p_idempotency_key is not null then
    select b.brief_number, b.created_at
      into v_existing_brief_number, v_existing_created_at
      from private.briefs b
      where b.idempotency_key = p_idempotency_key;

    if found then
      return query select v_existing_brief_number, v_existing_created_at, true;
      return;
    end if;
  end if;

  for v_attempt in 1..v_max_attempts loop
    begin
      return query
        insert into private.briefs (
          name, contact, contact_type, comment, answers, source, page_url,
          user_agent, utm_source, utm_medium, utm_campaign, utm_term,
          utm_content, ip_hash, idempotency_key, request_meta
        )
        values (
          p_name, p_contact, p_contact_type, p_comment, p_answers, p_source, p_page_url,
          p_user_agent, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term,
          p_utm_content, p_ip_hash, p_idempotency_key, p_request_meta
        )
        returning briefs.brief_number, briefs.created_at, false;
      return;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;

        if v_constraint = 'briefs_idempotency_key_unique_idx' then
          select b.brief_number, b.created_at
            into v_existing_brief_number, v_existing_created_at
            from private.briefs b
            where b.idempotency_key = p_idempotency_key;

          -- Defensive-only: see the matching comment in
          -- internal_submit_lead() — guards against a future isolation
          -- level change, not a bug under the current default.
          if not found then
            raise exception
              'internal_submit_brief: idempotency_key % conflicted but no row found — check transaction isolation level',
              p_idempotency_key;
          end if;

          return query select v_existing_brief_number, v_existing_created_at, true;
          return;
        elsif v_constraint = 'briefs_brief_number_key' then
          continue;
        else
          raise;
        end if;
    end;
  end loop;

  raise exception 'internal_submit_brief: exhausted % attempts generating a unique brief_number', v_max_attempts;
end;
$$;

comment on function public.internal_submit_brief is
  'Sole write path into private.briefs. Callable only by service_role '
  '(EXECUTE revoked from public/anon/authenticated below). Expects the '
  'caller to have already validated, normalized and rate-limited the '
  'request; performs a minimal atomic insert plus idempotency/ID-collision '
  'handling only.';

-- =========================================================================
-- 6. Grants / revokes — deny-by-default
--
-- private schema: nothing is granted to anon/authenticated/public/
-- service_role. Not even service_role — it never touches `private`
-- directly, only through the SECURITY DEFINER functions above, which run
-- as their owner and so already have implicit rights.
--
-- public schema: the two new RPC functions get EXECUTE revoked from
-- everyone, then granted back only to service_role. Function creation in
-- PostgreSQL grants EXECUTE to PUBLIC by default — that default is exactly
-- what would let the anon key call these from the browser if left
-- unrevoked, so the explicit revoke below is not optional cosmetics.
-- =========================================================================

revoke all on schema private from anon, authenticated, public, service_role;
revoke all on all tables in schema private from anon, authenticated, public, service_role;
revoke all on all functions in schema private from anon, authenticated, public, service_role;

revoke all on function public.internal_submit_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, uuid, jsonb
) from public, anon, authenticated;

revoke all on function public.internal_submit_brief(
  text, text, jsonb, text, text, text, text, text, text, text, text, text, text, text, uuid, jsonb
) from public, anon, authenticated;

grant execute on function public.internal_submit_lead(
  text, text, text, text, text, text, text, text, text, text, text, text, uuid, jsonb
) to service_role;

grant execute on function public.internal_submit_brief(
  text, text, jsonb, text, text, text, text, text, text, text, text, text, text, text, uuid, jsonb
) to service_role;

-- No DELETE path exists anywhere in this migration, for any role,
-- including service_role: nothing in this project currently needs to
-- delete a lead/brief row. Add it explicitly in a future migration if a
-- real deletion workflow (e.g. GDPR-style erasure) is designed.

-- =========================================================================
-- 7. Default privileges — hardening for FUTURE objects in `private`
--
-- IMPORTANT scope note: `ALTER DEFAULT PRIVILEGES` without `FOR ROLE` sets
-- the default privileges applied to objects created in the future *by the
-- role executing this statement*. Supabase CLI migrations (both `supabase
-- db push` against the linked hosted project, and local `supabase start`)
-- run as the `postgres` role, and `private` schema/tables/functions above
-- were created by that same role — so `for role postgres` below is
-- explicit about exactly whose future objects this protects: anything the
-- migration role itself creates later in `private`. It does NOT retroactively
-- change privileges on the objects created earlier in this same file (those
-- already got explicit revokes in section 6) and it would NOT protect a
-- table created in `private` by some other role/connection — if that ever
-- happens, that role needs its own `ALTER DEFAULT PRIVILEGES FOR ROLE`
-- statement.
--
-- The meaningful case here is FUNCTIONS: PostgreSQL grants EXECUTE to
-- PUBLIC automatically on every newly created function unless a default
-- privilege rule says otherwise. TABLES do not get an equivalent automatic
-- PUBLIC grant, so the table line below is defensive documentation rather
-- than closing a real hole — kept anyway for an explicit, readable posture.
-- =========================================================================

alter default privileges for role postgres in schema private
  revoke all on tables from public;

alter default privileges for role postgres in schema private
  revoke all on sequences from public;

alter default privileges for role postgres in schema private
  revoke execute on functions from public;

-- =========================================================================
-- Manual rollback plan (NOT executed by this migration; forward-only).
-- Safe today (nothing else references `private` or the two RPC functions
-- yet). Would need to become a targeted migration instead of a blunt drop
-- once Edge Functions / private.notification_deliveries exist on top of it.
--
--   drop function if exists public.internal_submit_lead(
--     text, text, text, text, text, text, text, text, text, text, text, text, uuid, jsonb
--   );
--   drop function if exists public.internal_submit_brief(
--     text, text, jsonb, text, text, text, text, text, text, text, text, text, text, text, uuid, jsonb
--   );
--   drop schema private cascade;
-- =========================================================================
