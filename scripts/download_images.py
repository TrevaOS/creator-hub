"""
Downloads profile pics + post thumbnails from the scraper JSON NOW
(CDN URLs expire in hours - run immediately!)

Saves:
  public/data/avatars/<username>.jpg       — profile pic
  public/data/posts/<username>_1.jpg       — post thumbnails
  public/data/posts/<username>_2.jpg
  public/data/posts/<username>_3.jpg

Then rebuilds profiles.json with local paths.
"""

import json, sys, re, time, random, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding="utf-8")

SCRAPER_JSON = sorted(Path("scripts").glob("dataset_instagram-scraper_*.json"), reverse=True)[0]
AVATARS_DIR  = Path("public/data/avatars");  AVATARS_DIR.mkdir(parents=True, exist_ok=True)
POSTS_DIR    = Path("public/data/posts");    POSTS_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH     = Path("public/data/profiles.json")
CSV_PATH     = Path("public/data/influencers.csv")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
    "Referer": "https://www.instagram.com/",
}

def download(url, dest, label=""):
    if dest.exists() and dest.stat().st_size > 500:
        return True
    if not url:
        return False
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        if len(data) < 500:
            return False
        dest.write_bytes(data)
        return True
    except Exception as e:
        return False

def clean(val):
    v = (val or "").strip()
    return "" if v.lower() in ("na","n/a","profile not available","") else v

def get_username_from_csv_row(row):
    import re
    pid = (row.get("Profile ID","") or "").strip().lstrip("@").lower()
    if pid and "/" not in pid and "instagram" not in pid:
        return pid
    url = (row.get("Profile URL","") or "").strip()
    m = re.search(r"instagram\.com/+([^/?#\s]+)", url, re.I)
    if m:
        u = re.split(r"[?#]", m.group(1).strip("/"))[0].lower()
        if u and u not in ("p","reel","stories","explore","accounts"):
            return u
    return None

def detect_social_links(bio, external_url, external_urls):
    links = {}
    # From externalUrls
    for eu in (external_urls or []):
        url = eu.get("url","")
        title = (eu.get("title","") or "").lower()
        if not url: continue
        if "youtube" in url or "youtube" in title:
            links["youtube"] = url
        elif "facebook" in url or "fb.com" in url:
            links["facebook"] = url
        elif "twitter" in url or "x.com" in url:
            links["twitter"] = url
        elif "tiktok" in url:
            links["tiktok"] = url
        elif "snapchat" in url:
            links["snapchat"] = url
        elif "linkedin" in url:
            links["linkedin"] = url
        elif "website" in title or ("instagram" not in url and "l.instagram" not in url):
            links.setdefault("website", url)

    # From externalUrl
    if external_url and not any(external_url in v for v in links.values()):
        url = external_url
        if "youtube" in url:    links.setdefault("youtube", url)
        elif "facebook" in url: links.setdefault("facebook", url)
        elif "twitter" in url or "x.com" in url: links.setdefault("twitter", url)
        elif "tiktok" in url:   links.setdefault("tiktok", url)
        elif "linkedin" in url: links.setdefault("linkedin", url)
        else:                   links.setdefault("website", url)

    # From bio mentions
    bio_lower = (bio or "").lower()
    for platform in ["youtube","facebook","twitter","tiktok","snapchat","linkedin"]:
        if platform in bio_lower and platform not in links:
            # extract handle/url
            m = re.search(rf'{platform}\.com/([^\s\n|]+)', bio_lower)
            if m: links[platform] = f"https://{platform}.com/{m.group(1).strip('@/ ')}"

    return links


print(f"Loading {SCRAPER_JSON}...")
with open(SCRAPER_JSON, encoding="utf-8") as f:
    data = json.load(f)
print(f"  {len(data)} records")

import csv
with open(CSV_PATH, encoding="utf-8-sig", errors="replace") as f:
    csv_rows = list(csv.DictReader(f))
csv_by_username = {get_username_from_csv_row(r): r for r in csv_rows if get_username_from_csv_row(r)}

# ── build download tasks ───────────────────────────────────────────────────────
tasks = []   # (url, dest, label)
records_map = {}

for rec in data:
    username = (rec.get("username") or "").lower()
    if not username: continue

    records_map[username] = rec

    # Profile pic
    pic_url = rec.get("profilePicUrlHD") or rec.get("profilePicUrl") or ""
    if pic_url:
        tasks.append((pic_url, AVATARS_DIR / f"{username}.jpg", f"@{username} pic"))

    # Post thumbnails (up to 3)
    for i, post in enumerate((rec.get("latestPosts") or [])[:3], 1):
        thumb = post.get("displayUrl") or ""
        if thumb:
            tasks.append((thumb, POSTS_DIR / f"{username}_{i}.jpg", f"@{username} post{i}"))

print(f"\n{len(tasks)} images to download")
print("Downloading (this may take a few minutes)...\n")

# ── parallel download ─────────────────────────────────────────────────────────
ok = fail = skip = 0
total = len(tasks)

def do_download(task):
    url, dest, label = task
    result = download(url, dest, label)
    return result, label

with ThreadPoolExecutor(max_workers=12) as ex:
    futures = {ex.submit(do_download, t): t for t in tasks}
    for i, future in enumerate(as_completed(futures), 1):
        success, label = future.result()
        if success:
            ok += 1
        else:
            fail += 1
        if i % 50 == 0 or i == total:
            print(f"  [{i}/{total}] OK:{ok}  Failed:{fail}")

print(f"\nDownload done — OK:{ok}  Failed:{fail}")

# ── rebuild profiles.json with local paths ────────────────────────────────────
print("\nRebuilding profiles.json with local paths...")

def split_tags(v):
    n = (v or "").strip()
    if not n or n.lower() in ("na","n/a"): return []
    seen = set(); out = []
    for p in re.split(r"[,/|]+", n):
        p = p.strip(); k = p.lower()
        if p and k not in seen: seen.add(k); out.append(p)
    return out

def fmtnum(n):
    if not n: return ""
    if n >= 1_000_000: return f"{n/1_000_000:.1f}M"
    if n >= 1_000:     return f"{n/1_000:.0f}K"
    return str(n)

profiles = []
matched = csv_only = 0

for row in csv_rows:
    username = get_username_from_csv_row(row)
    if not username: continue

    s = records_map.get(username)

    # Local file paths (relative to public/)
    avatar_local = f"/data/avatars/{username}.jpg"
    avatar_path  = AVATARS_DIR / f"{username}.jpg"

    profile = {
        # ── identity ──────────────────────────────────────────────────────────
        "handle":           username,
        "username":         username,
        "instagramId":      "",
        "fbid":             "",
        "profileUrl":       f"https://www.instagram.com/{username}/",

        # ── from CSV ──────────────────────────────────────────────────────────
        "fullName":         clean(row.get("Name","")),
        "gender":           clean(row.get("Gender","")),
        "followersRaw":     clean(row.get("Followers","")),
        "avgPlaysRaw":      clean(row.get("Avg. Plays","")),
        "impressionsRaw":   clean(row.get("Impressions","")),
        "area":             clean(row.get("Area/City","")),
        "influencerType":   clean(row.get("Influencer Type","")),
        "response":         clean(row.get("Response","")),
        "cost":             clean(row.get("Cost","")),
        "email":            clean(row.get("Email","")),
        "notes":            clean(row.get("Notes","")),
        "source":           clean(row.get("Source","")),
        "category":         clean(row.get("Category","")),

        # ── scraped defaults ──────────────────────────────────────────────────
        "profilePicLocal":  "",      # /data/avatars/username.jpg
        "profilePicUrl":    "",      # original CDN (may expire)
        "bio":              "",
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
        "externalUrls":     [],
        "socialLinks":      {},      # {youtube, facebook, tiktok, twitter, website}
        "scraped":          False,
        "latestPosts":      [],
    }

    if s:
        profile["instagramId"]       = s.get("id") or ""
        profile["fbid"]              = s.get("fbid") or ""
        profile["username"]          = s.get("username") or username
        profile["profileUrl"]        = s.get("url") or s.get("inputUrl") or profile["profileUrl"]
        profile["fullName"]          = s.get("fullName") or profile["fullName"] or username
        profile["bio"]               = s.get("biography") or ""
        profile["profilePicUrl"]     = s.get("profilePicUrlHD") or s.get("profilePicUrl") or ""
        profile["profilePicLocal"]   = avatar_local if avatar_path.exists() else ""
        profile["followersCount"]    = s.get("followersCount") or 0
        profile["followsCount"]      = s.get("followsCount") or 0
        profile["postsCount"]        = s.get("postsCount") or 0
        profile["igtvVideoCount"]    = s.get("igtvVideoCount") or 0
        profile["highlightReelCount"]= s.get("highlightReelCount") or 0
        profile["isVerified"]        = bool(s.get("verified"))
        profile["isPrivate"]         = bool(s.get("private"))
        profile["isBusinessAccount"] = bool(s.get("isBusinessAccount"))
        profile["joinedRecently"]    = bool(s.get("joinedRecently"))
        profile["businessCategory"]  = s.get("businessCategoryName") or ""
        profile["externalUrl"]       = s.get("externalUrl") or ""
        profile["scraped"]           = True

        # External URLs (cleaned)
        ext_urls = []
        for eu in (s.get("externalUrls") or []):
            if eu.get("url") and "l.instagram.com" not in eu.get("url",""):
                ext_urls.append({"title": eu.get("title",""), "url": eu["url"]})
        profile["externalUrls"] = ext_urls

        # Detect social links
        profile["socialLinks"] = detect_social_links(
            s.get("biography",""),
            s.get("externalUrl",""),
            s.get("externalUrls",[])
        )

        # Posts — local thumbnail paths
        posts = []
        for i, p in enumerate((s.get("latestPosts") or [])[:3], 1):
            thumb_local_path = POSTS_DIR / f"{username}_{i}.jpg"
            thumb_local = f"/data/posts/{username}_{i}.jpg" if thumb_local_path.exists() else ""
            thumb_cdn   = p.get("displayUrl") or ""
            music = p.get("musicInfo") or {}
            mentions_in_caption = p.get("mentions") or []
            posts.append({
                "id":               p.get("id",""),
                "shortCode":        p.get("shortCode",""),
                "url":              p.get("url") or f"https://www.instagram.com/p/{p.get('shortCode','')}/",
                "type":             p.get("type","Image"),
                "productType":      p.get("productType",""),
                # Image URLs — local first, CDN fallback
                "thumbLocal":       thumb_local,
                "thumbCdn":         thumb_cdn,
                "displayUrl":       thumb_local or thumb_cdn,   # what the app uses
                "videoUrl":         p.get("videoUrl",""),
                "images":           p.get("images") or [],
                # Content
                "caption":          (p.get("caption") or "")[:200].strip(),
                "hashtags":         p.get("hashtags") or [],
                "mentions":         mentions_in_caption,
                # Engagement
                "likesCount":       p.get("likesCount") or 0,
                "commentsCount":    p.get("commentsCount") or 0,
                "videoViewCount":   p.get("videoViewCount") or 0,
                # Meta
                "timestamp":        p.get("timestamp",""),
                "locationName":     p.get("locationName",""),
                "locationId":       p.get("locationId",""),
                "isPinned":         bool(p.get("isPinned")),
                "isCommentsDisabled": bool(p.get("isCommentsDisabled")),
                "alt":              p.get("alt",""),
                "dimensionsH":      p.get("dimensionsHeight",0),
                "dimensionsW":      p.get("dimensionsWidth",0),
                # Music
                "musicArtist":      music.get("artist_name",""),
                "musicSong":        music.get("song_name",""),
                "usesOriginalAudio":bool(music.get("uses_original_audio")),
            })
        profile["latestPosts"] = posts
        matched += 1
    else:
        csv_only += 1

    profiles.append(profile)

with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(profiles, f, ensure_ascii=False, indent=2)

print(f"\nprofiles.json written: {len(profiles)} total ({matched} scraped, {csv_only} CSV-only)")
print(f"Avatars saved:  {sum(1 for p in profiles if p.get('profilePicLocal'))}")
print(f"Posts saved:    {sum(1 for p in profiles for post in p.get('latestPosts',[]) if post.get('thumbLocal'))}")
print(f"Output: {OUT_PATH.resolve()}")
