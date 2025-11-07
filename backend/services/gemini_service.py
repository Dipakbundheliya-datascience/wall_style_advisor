# services/gemini_service.py
import google.generativeai as genai
from PIL import Image
from io import BytesIO
import base64
import requests
import os
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("Set GEMINI_API_KEY in .env")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash-image")

        print("✅ Gemini 2.5 Flash Image initialized for AI generation!")

    def generate_wall_art(self, wall_image_data: bytes, artworks):
        print("Generating realistic wall art with Gemini + Imagen 3...")

        if not artworks:
            return self._fallback(wall_image_data)

        try:
            return self._generate_with_gemini(wall_image_data, artworks)
        except Exception as e:
            print(f"Gemini/Imagen failed: {e}")
            return self._pil_composite(wall_image_data, artworks)

    def _generate_with_gemini(self, wall_bytes: bytes, artworks):
        """Use Gemini 2.5 Flash Image to generate realistic composite - matches test.py"""
        # Select the most relevant artwork (first one - already sorted by matcher)
        art = artworks[0]
        title = art.get('title', 'artwork')
        artist = art.get('artist', 'unknown artist')
        url = art['image_url']

        print(f"📥 Downloading artwork: {title} by {artist}")

        # Download artwork
        r = requests.get(url, timeout=15)
        if r.status_code != 200:
            raise Exception("Failed to download artwork")
        art_bytes = r.content

        # Convert to PIL Images - EXACT same as test.py
        wall_img = Image.open(BytesIO(wall_bytes))
        art_img = Image.open(BytesIO(art_bytes))

        print(f"🖼️  Original Wall size: {wall_img.size}, Artwork size: {art_img.size}")

        # Store original dimensions for verification
        original_wall_size = wall_img.size

        # Use the EXACT same prompt as test.py (proven to work)
        prompt = """
        You are a professional interior designer and photorealistic image editor.
        Your task is to add the given artwork onto the uploaded wall image in the most realistic way possible.

        Rules:
        Do NOT remove, crop, replace, or modify any existing objects in the wall image (TV, frames, shelves, plants, lamps, decor, switches, textures).
        The artwork must be placed only where a real painting could naturally hang.
        Identify the visible empty wall space and locate the most suitable position without covering any objects.

        Placement Guidelines:
        Position at typical gallery eye-level (approx. center horizontally and vertically relative to empty space).
        Artwork size should be around ~35% of wall height.
        Add a simple, thin white wooden frame.
        Preserve original wall texture, light direction, shadows, and perspective.
        Blend realistically so it looks physically mounted on the wall.
        Ensure photorealism: correct shadows, reflections, wall depth, and lighting color temperature.

        Output:
        Generate a realistic edited wall image with the artwork properly mounted, without altering anything else in the original image.
        """

        print("🚀 Sending to Gemini 2.5 Flash Image... (5-15 sec)")

        # EXACT same call as test.py
        response = self.model.generate_content(
            [prompt, wall_img, art_img]
            # Note: Don't use response_mime_type for image generation
        )

        # Extract generated image - EXACT same logic as test.py
        saved = False
        if response.parts:
            for part in response.parts:
                if hasattr(part, 'inline_data') and part.inline_data and hasattr(part.inline_data, 'data') and part.inline_data.data:
                    img_bytes = part.inline_data.data
                    if len(img_bytes) > 0:
                        # Check the dimensions of the generated image
                        generated_img = Image.open(BytesIO(img_bytes))
                        print(f"✅ Gemini AI SUCCESS! Generated {len(img_bytes)} bytes")
                        print(f"📐 Generated image size: {generated_img.size} (Original was: {original_wall_size})")

                        # If Gemini resized it, we'll still use it but log it
                        if generated_img.size != original_wall_size:
                            print(f"⚠️  WARNING: Gemini changed image dimensions from {original_wall_size} to {generated_img.size}")

                        img_b64 = base64.b64encode(img_bytes).decode()
                        
                        return f"data:image/jpeg;base64,{img_b64}"

        raise Exception("No image data found in Gemini response")

    def _pil_composite(self, wall_bytes: bytes, artworks):
        try:
            wall = Image.open(BytesIO(wall_bytes)).convert('RGB')
            if wall.width > 1200:
                wall.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

            spacing = wall.width // (len(artworks) + 1)
            h = int(wall.height * 0.4)

            for i, art in enumerate(artworks):
                r = requests.get(art['image_url'], timeout=10)
                if r.status_code == 200:
                    img = Image.open(BytesIO(r.content)).convert('RGB')
                    aspect = img.width / img.height
                    w = int(h * aspect)
                    img = img.resize((w, h), Image.Resampling.LANCZOS)

                    frame = Image.new('RGB', (w + 40, h + 40), 'white')
                    frame.paste(img, (20, 20))

                    x = spacing * (i + 1) - w // 2
                    y = (wall.height - h) // 2
                    wall.paste(frame, (x - 20, y - 20))

            buf = BytesIO()
            wall.save(buf, format="JPEG", quality=95)
            return f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode()}"
        except Exception as e:
            print(f"PIL failed: {e}")
            return self._fallback(wall_bytes)

    def _fallback(self, data: bytes):
        return f"data:image/jpeg;base64,{base64.b64encode(data).decode()}"