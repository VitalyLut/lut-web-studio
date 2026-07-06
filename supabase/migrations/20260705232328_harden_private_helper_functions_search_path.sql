-- Hardening: pin search_path on the 3 private ID-generator helper
-- functions flagged by Supabase Security Advisor as
-- `function_search_path_mutable`:
--   - private.generate_readable_suffix(integer)
--   - private.generate_lead_number()
--   - private.generate_brief_number()
--
-- Analysis (why `search_path = ''` is the correct, minimal fix, and why
-- it changes nothing observable):
--   - All three remain SECURITY INVOKER (unchanged) — they run with the
--     caller's privileges, so pinning search_path here is not closing a
--     privilege-escalation hole (there isn't one for INVOKER functions);
--     it silences a legitimate defense-in-depth lint that applies to any
--     function regardless of DEFINER/INVOKER status.
--   - generate_readable_suffix() only calls pg_catalog builtins
--     (substr/floor/random/length) — no user-schema references at all.
--   - generate_lead_number()/generate_brief_number() call
--     private.generate_readable_suffix(6) — already schema-qualified in
--     the existing function body (see the original migration) — and
--     to_char(now(), ...) — pg_catalog. Neither has any unqualified
--     reference to a non-pg_catalog object.
--   - pg_catalog is ALWAYS implicitly searched by Postgres regardless of
--     the search_path setting (searched first if not explicitly listed),
--     so `search_path = ''` does not break resolution of now()/to_char/
--     substr/floor/random/length, and does not affect the already
--     schema-qualified private.generate_readable_suffix(6) call either.
--   - Net effect: identical behavior, identical IDs generated, identical
--     signatures, identical grants (ALTER FUNCTION ... SET search_path
--     only touches the function's config array, nothing else) — purely
--     silences the Advisor warning by removing the theoretical
--     ambiguity it flags.
--
-- This migration does not touch private.leads, private.briefs,
-- public.internal_submit_lead, or public.internal_submit_brief — their
-- search_path was already pinned (private, pg_temp) in the original
-- migration and is untouched here.

alter function private.generate_readable_suffix(integer) set search_path = '';
alter function private.generate_lead_number() set search_path = '';
alter function private.generate_brief_number() set search_path = '';
