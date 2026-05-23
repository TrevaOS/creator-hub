"""
Downloads Instagram profile pictures for all 513 influencers.
Uses instaloader with profile_pic_only=True — no login required for public accounts.

Saves:
  - Images to public/data/avatars/<username>.jpg
  - Index to public/data/avatars.json  {"username": "/data/avatars/username.jpg", ...}

Usage:
    python scripts/scrape_profile_pics.py

Resumes automatically — already-downloaded profiles are skipped.
"""

import csv
import json
import os
import re
import time
import random
import shutil
from pathlib import Path

import instaloader

# ── ADD YOUR INSTAGRAM LOGIN HERE ──────────────────────────────────────────────
# Instagram now requires login for ALL requests (even public profiles).
# Use a personal/dummy account — not your main business account.
IG_USERNAME = ""   # e.g. "myaccount123"
IG_PASSWORD = ""   # e.g. "mypassword"
# ───────────────────────────────────────────────────────────────────────────────

CSV_PATH    = Path("public/data/influencers.csv")
AVATARS_DIR = Path("public/data/avatars")
INDEX_PATH  = Path("public/data/avatars.json")
TEMP_DIR    = Path("public/data/avatars/_tmp")

AVATARS_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# ── helpers ────────────────────────────────────────────────────────────────────

def clean(val):
    v = (val or "").strip()
    return "" if v.lower() in ("na", "n/a", "profile not available", "") else v

def extract_username(profile_id, profile_url):
    pid = clean(profile_id).lstrip("@").strip()
    if pid and "/" not in pid and "instagram" not in pid.lower():
        return pid.lower()
    url = clean(profile_url)
    if not url:
        return None
    m = re.search(r"instagram\.com/+([^/?#\s]+)", url, re.IGNORECASE)
    if m:
        raw = m.group(1).strip("/").lower()
        username = re.split(r"[?#]", raw)[0].strip()
        if username and username not in ("p", "reel", "stories", "explore", "accounts"):
            return username
    return None

def load_index():
    if INDEX_PATH.exists():
        with open(INDEX_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_index(index):
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

def read_csv():
    with open(CSV_PATH, encoding="utf-8-sig", errors="replace") as f:
        return list(csv.DictReader(f))

def find_downloaded_pic(username):
    """
    instaloader saves profile pic as: <username>/<timestamp>_UTC_profile_pic.jpg
    Find it and move to our avatars folder.
    """
    user_dir = TEMP_DIR / username
    if not user_dir.exists():
        return None
    for f in user_dir.iterdir():
        if "profile_pic" in f.name and f.suffix in (".jpg", ".jpeg", ".png", ".webp"):
            return f
    # Also check current dir (instaloader default)
    for f in Path(".").glob(f"{username}/*profile_pic*"):
        return f
    return None

# ── main ───────────────────────────────────────────────────────────────────────

def main():
    rows = read_csv()
    index = load_index()

    L = instaloader.Instaloader(
        dirname_pattern=str(TEMP_DIR / "{target}"),
        filename_pattern="{target}_{date_utc}_UTC_profile_pic",
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

    total   = len(rows)
    done    = 0
    skipped = 0
    failed  = 0
    no_user = 0

    if not IG_USERNAME:
        print("ERROR: Set IG_USERNAME and IG_PASSWORD at the top of this file.")
        print("Instagram requires login for ALL requests since 2024.")
        return

    print(f"Logging in as @{IG_USERNAME}...", end=" ")
    L.login(IG_USERNAME, IG_PASSWORD)
    print("OK")
    print(f"Total: {total} | Done: {len(index)} | Starting...")
    print()

    for i, row in enumerate(rows, 1):
        username = extract_username(row.get("Profile ID", ""), row.get("Profile URL", ""))

        if not username:
            print(f"[{i:>3}/{total}] NO USERNAME: {row.get('Name','?')[:25]}")
            no_user += 1
            continue

        dest = AVATARS_DIR / f"{username}.jpg"

        if username in index and index[username] and dest.exists():
            print(f"[{i:>3}/{total}] SKIP  @{username}")
            skipped += 1
            continue

        print(f"[{i:>3}/{total}] @{username} ...", end=" ", flush=True)

        try:
            profile = instaloader.Profile.from_username(L.context, username)

            if profile.is_private:
                print("PRIVATE - skip")
                index[username] = ""
                save_index(index)
                failed += 1
                time.sleep(random.uniform(1.0, 2.0))
                continue

            # Download profile pic only
            L.download_profilepic(profile)

            # Find the downloaded file
            pic_file = find_downloaded_pic(username)

            if pic_file and pic_file.exists():
                shutil.copy2(pic_file, dest)
                index[username] = f"/data/avatars/{username}.jpg"
                save_index(index)
                size_kb = dest.stat().st_size // 1024
                print(f"OK  ({size_kb}kb)")
                done += 1
            else:
                print("DOWNLOADED BUT FILE NOT FOUND")
                index[username] = ""
                save_index(index)
                failed += 1

        except instaloader.exceptions.ProfileNotExistsException:
            print("NOT FOUND")
            index[username] = ""
            save_index(index)
            failed += 1

        except instaloader.exceptions.LoginRequiredException:
            print("PRIVATE (login required)")
            index[username] = ""
            save_index(index)
            failed += 1

        except Exception as e:
            err = str(e)[:70]
            print(f"ERROR: {err}")
            if "429" in err or "Too Many" in err or "Please wait" in err:
                print("   Rate limited - waiting 60s...")
                time.sleep(60)
            failed += 1

        # Polite delay between requests
        time.sleep(random.uniform(2.0, 4.0))

    print()
    print(f"DONE - OK: {done} | Failed: {failed} | Skipped: {skipped} | No URL: {no_user}")
    print(f"Images in: {AVATARS_DIR.resolve()}")
    print(f"Index at:  {INDEX_PATH.resolve()}")

if __name__ == "__main__":
    main()
