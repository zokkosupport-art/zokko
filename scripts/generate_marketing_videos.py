"""Generate marketing videos for Nafamarket using Sora 2.
Generates 3 short vertical videos for WhatsApp/TikTok/Status."""
import os
import sys
import traceback
from datetime import datetime
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

OUT_DIR = "/app/marketing_videos"
os.makedirs(OUT_DIR, exist_ok=True)

VIDEOS = [
    {
        "name": "01_lancement_nafamarket",
        "prompt": (
            "Cinematic 8-second vertical mobile-phone ad for an African marketplace app. "
            "Vibrant Guinean outdoor market at golden hour in Conakry, colorful textiles (red, green, yellow), "
            "women in traditional pagnes selling fruits and clothes, a smiling young man in a white shirt holds up "
            "a modern smartphone showing a marketplace app interface with orange and green branding. "
            "Camera slowly tilts up from the phone to show the busy market behind. "
            "Warm sunlight, dust particles in the air, authentic West African vibe, joyful atmosphere. "
            "End frame focuses on the phone screen with a glowing 'N' logo. No text overlays."
        ),
        "duration": 8,
        "size": "1280x720",
    },
    {
        "name": "02_tutoriel_vendeur",
        "prompt": (
            "8-second vertical phone-screen recording style. A friendly Guinean entrepreneur in his 30s, "
            "in a small shop in Conakry, holds his smartphone and takes a photo of a colorful Bazin dress "
            "hanging on a mannequin. Close-up of the phone screen as he taps to add a new ad: typing title, "
            "price in GNF, selecting category 'Mode'. Bright natural light, clean modern interface visible. "
            "He smiles confidently. Final shot: the ad appears on the marketplace home page. No text overlays."
        ),
        "duration": 8,
        "size": "1280x720",
    },
    {
        "name": "03_tutoriel_acheteur",
        "prompt": (
            "8-second vertical scene: a young Guinean woman in her 20s, in a bright Conakry living room, "
            "scrolls through a marketplace app on her smartphone. She finds a beautiful traditional outfit, "
            "taps the green WhatsApp button. Cut to her smiling while messaging the seller on WhatsApp. "
            "Final shot: she receives the dress at her door from a delivery man, smiles brightly and waves "
            "at the camera. Warm African home setting, natural light, joyful and trustworthy mood. No text overlays."
        ),
        "duration": 8,
        "size": "1280x720",
    },
]


def run():
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY missing")
        return
    print(f"🎬 Generating {len(VIDEOS)} videos. Start: {datetime.now().isoformat()}")
    for i, v in enumerate(VIDEOS, 1):
        out = os.path.join(OUT_DIR, f"{v['name']}.mp4")
        print(f"\n[{i}/{len(VIDEOS)}] {v['name']} ({v['duration']}s, {v['size']})")
        print(f"   Prompt: {v['prompt'][:120]}...")
        try:
            gen = OpenAIVideoGeneration(api_key=api_key)
            video_bytes = gen.text_to_video(
                prompt=v["prompt"],
                model="sora-2",
                size=v["size"],
                duration=v["duration"],
                max_wait_time=900,
            )
            if video_bytes:
                gen.save_video(video_bytes, out)
                print(f"   ✅ Saved: {out}")
            else:
                print(f"   ❌ No video bytes returned")
        except Exception as e:
            print(f"   ❌ Error: {e}")
            traceback.print_exc()
    print(f"\n🏁 Done. End: {datetime.now().isoformat()}")
    print(f"📁 Videos in: {OUT_DIR}")
    for f in sorted(os.listdir(OUT_DIR)):
        path = os.path.join(OUT_DIR, f)
        size_kb = os.path.getsize(path) // 1024
        print(f"   {f}  ({size_kb} Ko)")


if __name__ == "__main__":
    run()
