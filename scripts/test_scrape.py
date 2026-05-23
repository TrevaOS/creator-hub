"""
Quick test — scrapes 3 profiles and prints what we get.
Run this first to verify your credentials work before running the full scraper.

Usage:
    python scripts/test_scrape.py
"""
import instaloader

# ── YOUR INSTAGRAM LOGIN ────────────────────────────────────────────────────────
IG_USERNAME = ""   # e.g. "myaccount123"
IG_PASSWORD = ""   # e.g. "mypassword"
# ───────────────────────────────────────────────────────────────────────────────

# Mix of URL formats to test extraction
TEST_URLS = [
    "https://www.instagram.com/whatstrendingbengaluru/",
    "https://www.instagram.com/ibengaluru/",
    "https://www.instagram.com/spoorthi_udimane?igsh=MW11Y3NoNGcxZWdtbg==",
]

import re

def extract_username(url: str) -> str | None:
    m = re.search(r"instagram\.com/([^/?#\s]+)", url, re.IGNORECASE)
    if m:
        u = m.group(1).strip("/").lower()
        if u not in ("p", "reel", "stories", "explore"):
            return u
    return None

L = instaloader.Instaloader(
    download_pictures=False,
    download_videos=False,
    download_video_thumbnails=False,
    download_geotags=False,
    download_comments=False,
    save_metadata=False,
    compress_json=False,
    quiet=True,
    request_timeout=20,
)

if IG_USERNAME:
    print(f"Logging in as @{IG_USERNAME}...")
    L.login(IG_USERNAME, IG_PASSWORD)
    print("Login OK\n")
else:
    print("⚠️  No credentials — trying anonymous (likely to fail)\n")

for url in TEST_URLS:
    username = extract_username(url)
    print(f"--- URL: {url}")
    print(f"    Username extracted: @{username}")
    if not username:
        print("    ❌ Could not extract username")
        continue
    try:
        p = instaloader.Profile.from_username(L.context, username)
        print(f"    ✅ Name:      {p.full_name}")
        print(f"    ✅ Followers: {p.followers:,}")
        print(f"    ✅ Private:   {p.is_private}")
        print(f"    ✅ Verified:  {p.is_verified}")
        print(f"    ✅ Bio:       {(p.biography or '')[:60]}")
        print(f"    ✅ Pic URL:   {p.profile_pic_url[:70]}...")
        if not p.is_private:
            posts = []
            for post in p.get_posts():
                posts.append(post.shortcode)
                if len(posts) >= 3:
                    break
            print(f"    ✅ Posts:     {len(posts)} fetched")
            for s in posts:
                print(f"         https://www.instagram.com/p/{s}/")
    except Exception as e:
        print(f"    ❌ Error: {e}")
    print()
