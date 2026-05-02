-- ============================================================
-- Creator Hub: Follows system + image visibility + stats
-- Run this in Supabase SQL Editor
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Follows table (creator A follows creator B)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_follows (
  id          bigserial PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT creator_follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_follows_follower  ON public.creator_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_creator_follows_following ON public.creator_follows(following_id);

-- ------------------------------------------------------------
-- 2. Add follower/following/posts counts to creator_profiles
-- ------------------------------------------------------------
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS hub_follower_count  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hub_following_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hub_posts_count     integer NOT NULL DEFAULT 0;

-- ------------------------------------------------------------
-- 3. Add is_public flag to carousel images
-- ------------------------------------------------------------
ALTER TABLE public.creator_carousel_images
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- ------------------------------------------------------------
-- 4. Trigger: auto-update hub_follower_count on creator_follows insert/delete
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- increment follower count on the person being followed
    UPDATE public.creator_profiles
      SET hub_follower_count = hub_follower_count + 1
      WHERE auth_user_id = NEW.following_id;
    -- increment following count on the person doing the following
    UPDATE public.creator_profiles
      SET hub_following_count = hub_following_count + 1
      WHERE auth_user_id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_profiles
      SET hub_follower_count = GREATEST(hub_follower_count - 1, 0)
      WHERE auth_user_id = OLD.following_id;
    UPDATE public.creator_profiles
      SET hub_following_count = GREATEST(hub_following_count - 1, 0)
      WHERE auth_user_id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_creator_follows_counts ON public.creator_follows;
CREATE TRIGGER trg_creator_follows_counts
AFTER INSERT OR DELETE ON public.creator_follows
FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- ------------------------------------------------------------
-- 5. Trigger: auto-update hub_posts_count on carousel images insert/delete
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_posts_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creator_profiles
      SET hub_posts_count = hub_posts_count + 1
      WHERE auth_user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creator_profiles
      SET hub_posts_count = GREATEST(hub_posts_count - 1, 0)
      WHERE auth_user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_creator_posts_count ON public.creator_carousel_images;
CREATE TRIGGER trg_creator_posts_count
AFTER INSERT OR DELETE ON public.creator_carousel_images
FOR EACH ROW EXECUTE FUNCTION public.update_posts_count();

-- ------------------------------------------------------------
-- 6. Backfill hub_posts_count for existing images
-- ------------------------------------------------------------
UPDATE public.creator_profiles cp
SET hub_posts_count = (
  SELECT COUNT(*) FROM public.creator_carousel_images ci
  WHERE ci.user_id = cp.auth_user_id
);

-- ------------------------------------------------------------
-- 7. RLS policies for creator_follows
-- ------------------------------------------------------------
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_authenticated" ON public.creator_follows;
CREATE POLICY "follows_select_authenticated"
  ON public.creator_follows FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON public.creator_follows;
CREATE POLICY "follows_insert_own"
  ON public.creator_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete_own" ON public.creator_follows;
CREATE POLICY "follows_delete_own"
  ON public.creator_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- ------------------------------------------------------------
-- 8. RLS: allow all authenticated users to read public carousel images
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "carousel_images_select_public" ON public.creator_carousel_images;
CREATE POLICY "carousel_images_select_public"
  ON public.creator_carousel_images FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

COMMIT;
