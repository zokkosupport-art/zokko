"""Generate Zokko logo variations with an elephant (Guinea national symbol)."""
import asyncio
import os
import base64
import sys
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

OUTPUT_DIR = Path("/app/frontend/public/branding")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PROMPTS = {
    "zokko_logo_main": (
        "Design a modern, minimalist flat vector logo for a mobile marketplace app called 'ZOKKO'. "
        "The logo features a stylized geometric elephant head (symbol of Guinea) facing forward, "
        "with clean rounded lines and bold simple shapes. "
        "The elephant should be in vibrant orange (#F97316) - the brand color. "
        "Below the elephant, the wordmark 'ZOKKO' is written in bold, modern sans-serif font in dark navy (#0F172A). "
        "Pure white background. Centered composition. "
        "Professional app logo style, similar to Airbnb or Jumia logos. "
        "High quality, crisp edges, no text other than 'ZOKKO', no shadows, no gradients, flat design. "
        "Square format."
    ),
    "zokko_logo_icon": (
        "Design a modern app icon (no text) for a marketplace app. "
        "Features a stylized geometric elephant head (symbol of Guinea) in vibrant orange (#F97316) on a clean white rounded-square background. "
        "Minimalist flat design, bold simple shapes, friendly and approachable. "
        "The elephant should be facing forward with a slight smile, ears spread wide. "
        "Style similar to modern iOS/Android app icons. High contrast, crisp edges, no shadows, no gradients. "
        "Square 1:1 format suitable for an app icon."
    ),
    "zokko_logo_horizontal": (
        "Design a horizontal logo lockup for a brand called 'ZOKKO'. "
        "On the left: a small minimalist geometric elephant head icon in vibrant orange (#F97316). "
        "On the right: the wordmark 'ZOKKO' in bold modern sans-serif font, dark navy color (#0F172A). "
        "Pure white background, centered vertically. "
        "Clean professional brand identity, flat vector style, no shadows, no gradients. "
        "Wide horizontal format."
    ),
}


async def generate(name: str, prompt: str):
    api_key = os.getenv("EMERGENT_LLM_KEY")
    chat = LlmChat(
        api_key=api_key,
        session_id=f"zokko-logo-{name}",
        system_message="You are an expert brand designer specialized in creating clean, modern, minimalist logos for African tech startups.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=prompt)
    text, images = await chat.send_message_multimodal_response(msg)
    print(f"[{name}] text response: {text[:120] if text else 'None'}")
    if not images:
        print(f"[{name}] No image returned")
        return None
    for i, img in enumerate(images):
        ext = "png"
        out = OUTPUT_DIR / f"{name}.{ext}"
        out.write_bytes(base64.b64decode(img["data"]))
        print(f"[{name}] saved -> {out}")
        return str(out)
    return None


async def main():
    targets = sys.argv[1:] or list(PROMPTS.keys())
    for name in targets:
        prompt = PROMPTS.get(name)
        if not prompt:
            print(f"Unknown: {name}")
            continue
        try:
            await generate(name, prompt)
        except Exception as e:
            print(f"[{name}] error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
