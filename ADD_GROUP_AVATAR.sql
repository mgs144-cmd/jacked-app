-- Group profile photo — run in Supabase SQL Editor

ALTER TABLE lifting_groups ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN lifting_groups.avatar_url IS 'Optional group chat icon URL (storage)';

CREATE OR REPLACE FUNCTION public.set_group_avatar_url(p_group_id uuid, p_avatar_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_group_id IS NULL THEN
    RAISE EXCEPTION 'group id required';
  END IF;
  IF NOT public.jacked_auth_is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'not a group member';
  END IF;
  UPDATE lifting_groups
  SET avatar_url = NULLIF(trim(p_avatar_url), '')
  WHERE id = p_group_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_group_avatar_url(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_group_avatar_url(uuid, text) TO authenticated;

-- Storage policies on storage.objects cannot be created in SQL Editor on hosted Supabase
-- (ERROR 42501: must be owner of table objects). Group photo uploads use /api/group-avatar
-- with SUPABASE_SERVICE_ROLE_KEY instead — see ADD_GROUP_AVATAR_STORAGE.sql for setup.
