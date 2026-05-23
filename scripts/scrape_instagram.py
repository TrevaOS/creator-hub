"""
Scrapes Instagram profile data for all 513 influencers.
Saves to: public/data/profiles.json
Resumes automatically — skips already-scraped profiles.

Usage:
    python scripts/scrape_instagram.py

Add your Instagram credentials below before running.
Use a personal/dummy account — not your main business account.
"""

import csv
import json
import re
import time
import random
from pathlib import Path

# ── YOUR INSTAGRAM LOGIN ────────────────────────────────────────────────────────
IG_USERNAME = ""   # e.g. "myaccount123"
IG_PASSWORD = ""   # e.g. "mypassword"
# ───────────────────────────────────────────────────────────────────────────────

CSV_PATH = Path("public/data/influencers.csv")
OUT_PATH = Path("public/data/profiles.json")

# ── helpers ────────────────────────────────────────────────────────────────────

def clean(val: str) -> str:
    v = (val or "").strip()
    return "" if v.lower() in ("na", "n/a", "profile not available", "") else v

def extract_username(profile_id: str, profile_url: str) -> str | None:
    """Extract clean Instagram username from Profile ID or Profile URL.
    Handles:
      - https://www.instagram.com/username/
      - https://www.instagram.com/username?igsh=xxx
      - https://www.instagram.com/username?igsh/   (broken format)
      - https://www.instagram.com//username/       (double slash)
      - plain username in Profile ID column
    """
    # Try Profile ID column first
    pid = clean(profile_id).lstrip("@").strip()
    if pid and "/" not in pid and "instagram" not in pid.lower():
        return pid.lower()

    url = clean(profile_url)
    if not url:
        return None

    # Extract path after instagram.com (handle double slashes)
    m = re.search(r"instagram\.com/+([^/?#\s]+)", url, re.IGNORECASE)
    if m:
        raw = m.group(1).strip("/").lower()
        # Strip any trailing ?igsh junk that got captured
        username = re.split(r"[?#]", raw)[0].strip()
        if username and username not in ("p", "reel", "stories", "explore", "accounts"):
            return username

    return None

def load_existing() -> dict:
    if OUT_PATH.exists():
        try:
            with open(OUT_PATH, encoding="utf-8") as f:
                data = json.load(f)
            return {p["handle"].lower(): p for p in data if p.get("handle")}
        except Exception:
            pass
    return {}

def save(profiles: dict):
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(list(profiles.values()), f, ensure_ascii=False, indent=2)

def read_csv() -> list[dict]:
    with open(CSV_PATH, encoding="utf-8-sig", errors="replace") as f:
        return list(csv.DictReader(f))

def build_csv_only(username: str, row: dict) -> dict:
    """Fallback entry from CSV data only — no scraping."""
    return {
        "handle":         username,
        "fullName":       clean(row.get("Name", "")),
        "profileUrl":     f"https://www.instagram.com/{username}/",
        "gender":         clean(row.get("Gender", "")),
        "followersRaw":   clean(row.get("Followers", "")),
        "followers":      0,
        "following":      0,
        "postCount":      0,
        "category":       clean(row.get("Category", "")),
        "avgPlays":       clean(row.get("Avg. Plays", "")),
        "impressions":    clean(row.get("Impressions", "")),
        "area":           clean(row.get("Area/City", "")),
        "influencerType": clean(row.get("Influencer Type", "")),
        "response":       clean(row.get("Response", "")),
        "cost":           clean(row.get("Cost", "")),
        "email":          clean(row.get("Email", "")),
        "notes":          clean(row.get("Notes", "")),
        "source":         clean(row.get("Source", "")),
        "profilePic":     "",
        "bio":            "",
        "isVerified":     False,
        "isPrivate":      False,
        "scraped":        False,
        "recentPosts":    [],
        "scrapeError":    "",
    }

# ── scraper ────────────────────────────────────────────────────────────────────

_loader = None

def get_loader():
    global _loader
    if _loader is not None:
        return _loader

    import instaloader
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
        print(f"  Logging in as @{IG_USERNAME}...", end=" ")
        L.login(IG_USERNAME, IG_PASSWORD)
        print("OK")
    else:
        print("  ⚠️  No credentials set — anonymous mode (may get 403s)")

    _loader = L
    return L

def scrape(username: str, row: dict) -> dict:
    result = build_csv_only(username, row)
    try:
        import instaloader
        L = get_loader()
        p = instaloader.Profile.from_username(L.context, username)

        result["fullName"]    = p.full_name or result["fullName"]
        result["bio"]         = p.biography or ""
        result["followers"]   = p.followers
        result["following"]   = p.followees
        result["postCount"]   = p.mediacount
        result["profilePic"]  = p.profile_pic_url
        result["isPrivate"]   = p.is_private
        result["isVerified"]  = p.is_verified
        result["scraped"]     = True

        posts = []
        if not p.is_private:
            try:
                for post in p.get_posts():
                    if len(posts) >= 3:
                        break
                    posts.append({
                        "url":       f"https://www.instagram.com/p/{post.shortcode}/",
                        "thumb":     post.url,
                        "caption":   (post.caption or "")[:120],
                        "likes":     post.likes,
                        "timestamp": post.date_utc.isoformat(),
                    })
            except Exception:
                pass

        result["recentPosts"] = posts

    except Exception as e:
        err = str(e)[:120]
        result["scrapeError"] = err
        # If rate-limited, wait longer
        if "429" in err or "Please wait" in err or "challenge" in err.lower():
            print(f"\n  ⏳ Rate limited — waiting 60s...")
            time.sleep(60)

    return result

# ── main ───────────────────────────────────────────────────────────────────────

def main():
    if not IG_USERNAME:
        print("⚠️  WARNING: IG_USERNAME is empty.")
        print("   Instagram blocks anonymous requests. Set credentials at the top of this file.")
        print()

    rows = read_csv()
    existing = load_existing()

    total   = len(rows)
    done    = 0
    skipped = 0
    failed  = 0
    no_user = 0

    print(f"📋  {total} influencers in CSV")
    print(f"✅  {len(existing)} already scraped — resuming")
    print()

    for i, row in enumerate(rows, 1):
        username = extract_username(row.get("Profile ID", ""), row.get("Profile URL", ""))

        if not username:
            print(f"[{i:>3}/{total}] ⚠️  No username — skipping: {row.get('Name','?')}")
            no_user += 1
            continue

        if username in existing:
            print(f"[{i:>3}/{total}] ⏭️  Already done: @{username}")
            skipped += 1
            continue

        print(f"[{i:>3}/{total}] 🔍  @{username}", end=" ... ", flush=True)

        result = scrape(username, row)
        existing[username] = result
        save(existing)

        if result.get("scraped"):
            posts_n = len(result.get("recentPosts", []))
            print(f"✅  {result['followers']:,} followers · {posts_n} posts")
            done += 1
        else:
            print(f"⚠️  CSV only ({result.get('scrapeError','')[:50]})")
            failed += 1

        # Polite delay: 2–4s between requests
        time.sleep(random.uniform(2.0, 4.0))

    print()
    print(f"🏁  Done!")
    print(f"   ✅ Scraped:   {done}")
    print(f"   ⚠️  CSV-only: {failed}")
    print(f"   ⏭️  Skipped:  {skipped}")
    print(f"   ❌ No URL:   {no_user}")
    print(f"📁  Saved to: {OUT_PATH.resolve()}")

if __name__ == "__main__":
    main()
