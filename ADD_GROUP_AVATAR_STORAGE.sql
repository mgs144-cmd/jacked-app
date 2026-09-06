-- Group avatar STORAGE policies (optional — only if you upload from the client, not via /api/group-avatar)
--
-- Supabase SQL Editor often returns:
--   ERROR 42501: must be owner of table objects
-- because storage.objects is owned by supabase_storage_admin, not your SQL role.
--
-- RECOMMENDED: Use the app API route instead (no storage policies needed):
--   1. Supabase → Project Settings → API → copy "service_role" secret
--   2. Vercel → Project → Settings → Environment Variables
--   3. Add SUPABASE_SERVICE_ROLE_KEY = (that secret), redeploy
--   4. Locally add the same to .env.local
--
-- OPTIONAL (Dashboard): Storage → images → New policy → For full customization:
--   Policy name: Group members upload group avatars
--   Allowed operation: INSERT
--   Target roles: authenticated
--   WITH CHECK expression:
--
--     bucket_id = 'images'
--     AND (storage.foldername(name))[1] = 'group-avatars'
--     AND public.jacked_auth_is_group_member(((storage.foldername(name))[2])::uuid)
--
-- Repeat for UPDATE and DELETE with the same USING / WITH CHECK (use jacked_auth_is_group_member).
-- Requires FIX_GROUP_RLS_CREATE.sql (jacked_auth_is_group_member).

-- Helper (safe to run in SQL Editor — public schema only):
CREATE OR REPLACE FUNCTION public.jacked_group_id_from_storage_path(object_name text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parts text[];
  gid text;
BEGIN
  parts := storage.foldername(object_name);
  IF parts IS NULL OR coalesce(array_length(parts, 1), 0) < 2 OR parts[1] IS DISTINCT FROM 'group-avatars' THEN
    RETURN NULL;
  END IF;
  gid := parts[2];
  RETURN gid::uuid;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.jacked_group_id_from_storage_path(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jacked_group_id_from_storage_path(text) TO authenticated;
