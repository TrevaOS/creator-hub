-- =============================================
-- Creator Hub Supabase Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  tagline TEXT,
  location TEXT,
  niche_tags TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- SOCIAL ACCOUNTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','youtube','twitter','linkedin','tiktok','spotify','pinterest')),
  handle TEXT,
  url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all social accounts" ON public.social_accounts
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own social accounts" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- DASHBOARD MODULES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.dashboard_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  carousel_enabled BOOLEAN DEFAULT false,
  spotify_url TEXT,
  spotify_enabled BOOLEAN DEFAULT false,
  reels_enabled BOOLEAN DEFAULT false,
  collab_badges_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dashboard_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all modules" ON public.dashboard_modules
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own modules" ON public.dashboard_modules
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- CAROUSEL IMAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.carousel_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all carousel images" ON public.carousel_images
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own carousel images" ON public.carousel_images
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- COLLAB BRANDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.collab_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collab_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all collab brands" ON public.collab_brands
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own collab brands" ON public.collab_brands
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- DEALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_name TEXT NOT NULL,
  brand_logo TEXT,
  category TEXT,
  location TEXT,
  niche_tags TEXT[] DEFAULT '{}',
  requirement TEXT,
  deliverables TEXT,
  platform TEXT,
  payout_min INTEGER DEFAULT 0,
  payout_max INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open deals" ON public.deals
  FOR SELECT USING (true);

-- =============================================
-- ACCEPTED DEALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.accepted_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','completed','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, user_id)
);

ALTER TABLE public.accepted_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accepted deals" ON public.accepted_deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own accepted deals" ON public.accepted_deals
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their deals" ON public.messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM public.accepted_deals
      WHERE accepted_deals.deal_id = messages.deal_id
      AND accepted_deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- SEED DATA — Sample Deals
-- =============================================
INSERT INTO public.deals (brand_name, brand_logo, category, location, niche_tags, requirement, deliverables, platform, payout_min, payout_max, status)
VALUES
  ('StyleCo', 'https://api.dicebear.com/7.x/initials/svg?seed=StyleCo', 'Fashion', 'Mumbai, India', ARRAY['fashion','lifestyle'], 'Min 10K followers on Instagram. Fashion-focused content preferred.', '2 Reels + 3 Stories', 'instagram', 15000, 25000, 'open'),
  ('TechGear Pro', 'https://api.dicebear.com/7.x/initials/svg?seed=TechGearPro', 'Technology', 'Bangalore, India', ARRAY['tech','gadgets'], 'YouTube channel with 5K+ subs. Tech review experience needed.', '1 Video Review + Community Post', 'youtube', 20000, 40000, 'open'),
  ('FitLife', 'https://api.dicebear.com/7.x/initials/svg?seed=FitLife', 'Fitness', 'Delhi, India', ARRAY['fitness','health','wellness'], 'Active fitness creator. Minimum 8K Instagram followers.', '4 Stories + 1 Reel', 'instagram', 8000, 12000, 'open'),
  ('GourmetBites', 'https://api.dicebear.com/7.x/initials/svg?seed=GourmetBites', 'Food', 'Chennai, India', ARRAY['food','cooking','lifestyle'], 'Food content creator. Recipe videos preferred.', '2 Videos + 5 Posts', 'instagram,youtube', 10000, 18000, 'open'),
  ('TravelEscape', 'https://api.dicebear.com/7.x/initials/svg?seed=TravelEscape', 'Travel', 'Hyderabad, India', ARRAY['travel','adventure'], 'Travel vlogger with YouTube presence. 3K+ subs.', '1 Vlog + 3 Reels', 'youtube,instagram', 25000, 50000, 'open');
