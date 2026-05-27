import re
import os
import requests

SOURCE_URL = os.environ.get("SOURCE_URL")
LOCAL_PLAYLIST = "playlist.m3u"

headers = {
    "User-Agent": "Mozilla/5.0"
}

print("Fetching source playlist...")

response = requests.get(SOURCE_URL, headers=headers)

print("Status Code:", response.status_code)

source_text = response.text

print("Source Length:", len(source_text))

# =========================
# FETCH COOKIES FROM SOURCE
# =========================

cookie_map = {}

source_pattern = re.compile(
    r'tvg-id="(\d+)".*?cookie=(__hdnea__=[^&\n\r]+)',
    re.DOTALL
)

for match in source_pattern.finditer(source_text):
    channel_id = match.group(1)
    cookie = match.group(2)

    cookie_map[channel_id] = cookie

print("Fetched Cookies:", len(cookie_map))

# =========================
# READ LOCAL PLAYLIST
# =========================

with open(LOCAL_PLAYLIST, "r", encoding="utf-8") as f:
    local_text = f.read()

print("Local Playlist Length:", len(local_text))

# =========================
# UPDATE COOKIES
# =========================

updated_count = 0

block_pattern = re.compile(
    r'(tvg-id="(\d+)".*?#EXTHTTP:\{"cookie":")(__hdnea__=[^"]+)("\})',
    re.DOTALL
)

def replace_cookie(match):
    global updated_count

    prefix = match.group(1)
    channel_id = match.group(2)
    old_cookie = match.group(3)
    suffix = match.group(4)

    if channel_id in cookie_map:
        new_cookie = cookie_map[channel_id]

        if old_cookie != new_cookie:
            updated_count += 1
            print(f"Updating ID {channel_id}")

            return prefix + new_cookie + suffix

    return match.group(0)

updated_text = block_pattern.sub(replace_cookie, local_text)

# =========================
# SAVE FILE
# =========================

with open(LOCAL_PLAYLIST, "w", encoding="utf-8") as f:
    f.write(updated_text)

print("Updated Channels:", updated_count)

if updated_count == 0:
    print("No changes found")
else:
    print("Playlist updated successfully")
