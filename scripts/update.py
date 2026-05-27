import re
import os
import requests

SOURCE_URL = os.environ.get("SOURCE_URL")
LOCAL_PLAYLIST = "playlist.m3u"

headers = {
    "User-Agent": "Mozilla/5.0"
}

print("Fetching source playlist...")

response = requests.get(SOURCE_URL, headers=headers, timeout=30)
source_text = response.text

print("Source fetched")

# id -> cookie mapping
cookie_map = {}

# Source format parser
source_pattern = re.compile(
    r'tvg-id="(\d+)".*?cookie=(__hdnea__=[^&\n\r]+)',
    re.DOTALL
)

for match in source_pattern.finditer(source_text):
    channel_id = match.group(1)
    cookie = match.group(2)

    cookie_map[channel_id] = cookie

print(f"Found {len(cookie_map)} cookies")

# Read local playlist
with open(LOCAL_PLAYLIST, "r", encoding="utf-8") as f:
    local_data = f.read()

# Replace cookies in playlist.m3u
block_pattern = re.compile(
    r'(tvg-id="(\d+)".*?#EXTHTTP:\{"cookie":")(__hdnea__=[^"]+)("\})',
    re.DOTALL
)

updated_count = 0

def replace_cookie(match):
    global updated_count

    full_prefix = match.group(1)
    channel_id = match.group(2)
    old_cookie = match.group(3)
    suffix = match.group(4)

    if channel_id in cookie_map:
        updated_count += 1
        new_cookie = cookie_map[channel_id]
        print(f"Updated ID {channel_id}")
        return full_prefix + new_cookie + suffix

    return match.group(0)

updated_playlist = block_pattern.sub(replace_cookie, local_data)

with open(LOCAL_PLAYLIST, "w", encoding="utf-8") as f:
    f.write(updated_playlist)

print(f"Done. Updated {updated_count} channels.")
