"""
Converts Apify Instagram scraper JSON → public/data/profiles.json
Maps EVERY field from the scraper JSON onto each influencer profile.
Merges with CSV so all 513 creators appear (scraped data where available).

Usage:  python scripts/build_profiles.py
"""
import csv, json, re, glob, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

CSV_PATH = Path("public/data/influencers.csv")
OUT_PATH = Path("public/data/profiles.json")

json_files = sorted(glob.glob("scripts/dataset_instagram-scraper_*.json"), reverse=True)
if not json_files:
    print("ERROR: No dataset_instagram-scraper_*.json found in scripts/")
    sys.exit(1)

SCRAPER_JSON = json_files[0]
print(f"Using: {SCRAPER_JSON}")

# ── helpers ────────────────────────────────────────────────────────────────────

def clean(val):
    v = (val or "").strip()
    return "" if v.lower() in ("na", "n/a", "profile not available", "") else v

def extract_username(row):
    pid = clean(row.get("Profile ID","")).lstrip("@").lower()
    if pid and "/" not in pid and "instagram" not in pid:
        return pid
    url = clean(row.get("Profile URL",""))
    if not url:
        return None
    m = re.search(r"instagram\.com/+([^/?#\s]+)", url, re.I)
    if m:
        u = re.split(r"[?#]", m.group(1).strip("/"))[0].lower()
        if u and u not in ("p","reel","stories","explore","accounts"):
            return u
    return None

def split_tags(val):
    n = clean(val)
    if not n: return []
    seen = set()
    out = []
    for p in re.split(r"[,/|]+", n):
        p = p.strip()
        k = p.lower()
        if p and k not in seen:
            seen.add(k); out.append(p)
    return out

def fmt_num(n):
    if not n or n == 0: return ""
    if n >= 1_000_000: return f"{n/1_000_000:.1f}M"
    if n >= 1_000:     return f"{n/1_000:.0f}K"
    return str(n)

# ── load data ──────────────────────────────────────────────────────────────────

with open(SCRAPER_JSON, encoding="utf-8") as f:
    scraped_list = json.load(f)

by_username = {(r.get("username") or "").lower(): r for r in scraped_list if r.get("username")}
print(f"Scraped: {len(by_username)} | CSV rows loading...")

with open(CSV_PATH, encoding="utf-8-sig", errors="replace") as f:
    csv_rows = list(csv.DictReader(f))
print(f"CSV: {len(csv_rows)} rows")

# ── merge ──────────────────────────────────────────────────────────────────────

profiles = []
matched = csv_only = 0

for row in csv_rows:
    username = extract_username(row)
    if not username:
        continue

    s = by_username.get(username)  # scraped record (may be None)

    # ── base from CSV ──────────────────────────────────────────────────────────
    profile = {
        # identity
        "handle":           username,
        "username":         username,
        "profileUrl":       f"https://www.instagram.com/{username}/",

        # from CSV
        "fullName":         clean(row.get("Name", "")),
        "gender":           clean(row.get("Gender", "")),
        "followersRaw":     clean(row.get("Followers", "")),
        "avgPlaysRaw":      clean(row.get("Avg. Plays", "")),
        "impressionsRaw":   clean(row.get("Impressions", "")),
        "area":             clean(row.get("Area/City", "")),
        "influencerType":   clean(row.get("Influencer Type", "")),
        "response":         clean(row.get("Response", "")),
        "cost":             clean(row.get("Cost", "")),
        "email":            clean(row.get("Email", "")),
        "notes":            clean(row.get("Notes", "")),
        "source":           clean(row.get("Source", "")),
        "category":         clean(row.get("Category", "")),

        # scraped fields (defaults)
        "id":               "",
        "fbid":             "",
        "fullNameScraped":  "",
        "bio":              "",
        "profilePicUrl":    "",
        "profilePicUrlHD":  "",
        "followersCount":   0,
        "followsCount":     0,
        "postsCount":       0,
        "igtvVideoCount":   0,
        "highlightReelCount": 0,
        "isVerified":       False,
        "isPrivate":        False,
        "isBusinessAccount":False,
        "joinedRecently":   False,
        "businessCategory": "",
        "externalUrl":      "",
        "externalUrls":     [],   # [{title, url}]
        "scraped":          False,
        "latestPosts":      [],
    }

    if s:
        # ── map EVERY field from scraper JSON ──────────────────────────────────
        profile["id"]                 = s.get("id") or ""
        profile["fbid"]               = s.get("fbid") or ""
        profile["username"]           = s.get("username") or username
        profile["profileUrl"]         = s.get("url") or s.get("inputUrl") or profile["profileUrl"]
        profile["fullNameScraped"]    = s.get("fullName") or ""
        profile["fullName"]           = s.get("fullName") or profile["fullName"] or username
        profile["bio"]                = s.get("biography") or ""
        profile["profilePicUrl"]      = s.get("profilePicUrl") or ""
        profile["profilePicUrlHD"]    = s.get("profilePicUrlHD") or s.get("profilePicUrl") or ""
        profile["followersCount"]     = s.get("followersCount") or 0
        profile["followsCount"]       = s.get("followsCount") or 0
        profile["postsCount"]         = s.get("postsCount") or 0
        profile["igtvVideoCount"]     = s.get("igtvVideoCount") or 0
        profile["highlightReelCount"] = s.get("highlightReelCount") or 0
        profile["isVerified"]         = bool(s.get("verified"))
        profile["isPrivate"]          = bool(s.get("private"))
        profile["isBusinessAccount"]  = bool(s.get("isBusinessAccount"))
        profile["joinedRecently"]     = bool(s.get("joinedRecently"))
        profile["businessCategory"]   = s.get("businessCategoryName") or ""
        profile["externalUrl"]        = s.get("externalUrl") or ""
        profile["scraped"]            = True

        # external URLs (title + url pairs)
        ext_urls = []
        for eu in (s.get("externalUrls") or []):
            if eu.get("url"):
                ext_urls.append({"title": eu.get("title") or "", "url": eu["url"]})
        profile["externalUrls"] = ext_urls

        # ── map latestPosts — ALL post fields ──────────────────────────────────
        posts = []
        for p in (s.get("latestPosts") or []):
            thumb = p.get("displayUrl") or ""
            if not thumb:
                continue

            # images array (for carousel posts)
            images = []
            for img in (p.get("images") or []):
                if isinstance(img, str) and img:
                    images.append(img)
                elif isinstance(img, dict) and img.get("url"):
                    images.append(img["url"])

            # music info
            music = p.get("musicInfo") or {}

            posts.append({
                "id":               p.get("id") or "",
                "shortCode":        p.get("shortCode") or "",
                "url":              p.get("url") or f"https://www.instagram.com/p/{p.get('shortCode','')}/",
                "type":             p.get("type") or "Image",       # Image / Video
                "productType":      p.get("productType") or "",     # clips / igtv / feed
                "displayUrl":       thumb,
                "videoUrl":         p.get("videoUrl") or "",
                "images":           images,                          # carousel images
                "caption":          (p.get("caption") or "")[:200].strip(),
                "hashtags":         p.get("hashtags") or [],
                "mentions":         p.get("mentions") or [],
                "likesCount":       p.get("likesCount") or 0,
                "commentsCount":    p.get("commentsCount") or 0,
                "videoViewCount":   p.get("videoViewCount") or 0,
                "timestamp":        p.get("timestamp") or "",
                "locationName":     p.get("locationName") or "",
                "locationId":       p.get("locationId") or "",
                "isPinned":         bool(p.get("isPinned")),
                "isCommentsDisabled": bool(p.get("isCommentsDisabled")),
                "alt":              p.get("alt") or "",
                "dimensionsH":      p.get("dimensionsHeight") or 0,
                "dimensionsW":      p.get("dimensionsWidth") or 0,
                "musicArtist":      music.get("artist_name") or "",
                "musicSong":        music.get("song_name") or "",
                "usesOriginalAudio":bool(music.get("uses_original_audio")),
            })

        profile["latestPosts"] = posts
        matched += 1
    else:
        csv_only += 1

    profiles.append(profile)

# ── save ───────────────────────────────────────────────────────────────────────

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(profiles, f, ensure_ascii=False, indent=2)

print(f"\nDone!")
print(f"  Matched (full scraped data): {matched}")
print(f"  CSV only (no scrape):        {csv_only}")
print(f"  Total profiles written:      {len(profiles)}")
print(f"  Output: {OUT_PATH.resolve()}")
