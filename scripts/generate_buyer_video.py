"""Generate ONLY the missing 3rd video (buyer tutorial) for Zokko."""
import os
import traceback
from datetime import datetime
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

from emergentintegrations.llm.openai.video_generation import OpenAIVideoGeneration

OUT_DIR = "/app/marketing_videos"
PUB_DIR = "/app/frontend/public/marketing"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(PUB_DIR, exist_ok=True)

VIDEO = {
    "name": "03_tutoriel_acheteur_zokko",
    "prompt": (
        "8-second horizontal cinematic scene. A young Guinean woman in her 20s, "
        "in a bright Conakry living room with warm African decor, scrolls through "
        "a marketplace app on her smartphone. She finds a beautiful traditional Bazin outfit, "
        "taps a bright green WhatsApp button on screen. Cut to her smiling while messaging "
        "the seller on WhatsApp. Final shot: she receives the dress at her door from a "
        "delivery man on a motorcycle, smiles brightly and waves at the camera. "
        "Warm natural light, joyful and trustworthy mood, authentic Guinean home setting. "
        "No text overlays."
    ),
    "duration": 8,
    "size": "1280x720",
}


def run():
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    print(f"🎬 Generating buyer tutorial video. Start: {datetime.now().isoformat()}")
    out = os.path.join(OUT_DIR, f"{VIDEO['name']}.mp4")
    try:
        gen = OpenAIVideoGeneration(api_key=api_key)
        video_bytes = gen.text_to_video(
            prompt=VIDEO["prompt"],
            model="sora-2",
            size=VIDEO["size"],
            duration=VIDEO["duration"],
            max_wait_time=900,
        )
        if video_bytes:
            gen.save_video(video_bytes, out)
            # Copy to public
            pub_out = os.path.join(PUB_DIR, f"{VIDEO['name']}.mp4")
            import shutil
            shutil.copy(out, pub_out)
            print(f"✅ Saved: {out}")
            print(f"✅ Published: {pub_out}")
        else:
            print("❌ No video bytes returned")
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
    print(f"🏁 End: {datetime.now().isoformat()}")


if __name__ == "__main__":
    run()
