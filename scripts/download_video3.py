"""Download an already-generated Sora 2 video by ID (avoids regeneration cost)."""
import os
import requests
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

VIDEO_ID = "video_6a0d00aa96a88193a0aaafb64acfea170389daba17e69450"
OUT_PATH = "/app/marketing_videos/03_tutoriel_acheteur_zokko.mp4"
PUB_PATH = "/app/frontend/public/marketing/03_tutoriel_acheteur_zokko.mp4"

api_key = os.environ.get("EMERGENT_LLM_KEY")
url = f"https://integrations.emergentagent.com/llm/openai/v1/videos/{VIDEO_ID}/content"
headers = {"Authorization": f"Bearer {api_key}"}

print(f"⬇️  Downloading {VIDEO_ID}...")
r = requests.get(url, headers=headers, timeout=180, stream=True)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    with open(OUT_PATH, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    import shutil
    shutil.copy(OUT_PATH, PUB_PATH)
    size_kb = os.path.getsize(OUT_PATH) // 1024
    print(f"✅ Saved: {OUT_PATH} ({size_kb} Ko)")
    print(f"✅ Published: {PUB_PATH}")
else:
    print(f"❌ Failed: {r.text[:500]}")
