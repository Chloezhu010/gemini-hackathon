"""
Gemini API service for story and image generation.
"""
import os
import asyncio
import random
import base64
from google import genai
from google.genai import types

from models import GenerateStoryScriptResponse

# Initialize client with API key from environment
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))


ART_STYLES = {
    "Watercolor": "Soft dreamy watercolor with gentle washes, visible paper texture, no heavy outlines.",
    "Pencil Sketch": "Hand-drawn colored pencil sketch with visible strokes and soft pastel colors.",
    "Digital Pop": "Vibrant modern digital vector art with clean lines, flat bold colors, high contrast.",
}
DEFAULT_STYLE = "Bold black ink outlines, vibrant flat colors, clean cel-shading. No 3D, no gradients, no text in images."


def get_style_prompt(style: str | None) -> str:
    return ART_STYLES.get(style, DEFAULT_STYLE)


def extract_image_from_response(response) -> str:
    """Extract base64 image from Gemini response.

    Args:
        response: The Gemini API response object

    Returns:
        Base64 encoded image string

    Raises:
        ValueError: If no image is found in the response
    """
    if not response.candidates:
        raise ValueError("No candidates in response - prompt may have been blocked")

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            return base64.b64encode(part.inline_data.data).decode('utf-8')

    # Log the text response if no image was generated
    text_parts = [p.text for p in response.candidates[0].content.parts if hasattr(p, 'text') and p.text]
    if text_parts:
        print(f"Gemini returned text instead of image: {text_parts}")
        raise ValueError(f"No image generated. Model response: {text_parts[0][:200]}")

    raise ValueError("Failed to generate image - no image data in response")


async def with_retry(fn, max_retries: int = 3, base_delay: float = 2.0):
    """Retry utility with exponential backoff for rate limit and server errors."""
    last_error = None
    for i in range(max_retries):
        try:
            return await fn()
        except Exception as err:
            last_error = err
            error_msg = str(err)
            is_rate_limit = "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg
            is_server_error = "503" in error_msg or "UNAVAILABLE" in error_msg or "overloaded" in error_msg.lower()
            if (is_rate_limit or is_server_error) and i < max_retries - 1:
                delay = base_delay * (2 ** i) + random.random()
                error_type = "Rate limit" if is_rate_limit else "Server overloaded"
                print(f"{error_type}. Retrying in {delay:.1f}s... (Attempt {i + 1}/{max_retries})")
                await asyncio.sleep(delay)
                continue
            raise err
    raise last_error


async def generate_story_script(
    name: str,
    gender: str,
    skin_tone: str,
    hair_color: str,
    eye_color: str,
    favorite_color: str,
    dream: str | None = None,
    archetype: str | None = None,
    art_style: str | None = None,
    photo_base64: str | None = None,
) -> dict:
    """Generate a 10-panel story script."""

    async def _generate():
        hero_desc = f"The child in the attached photo ({gender})" if photo_base64 else f"A {gender} child with {skin_tone} skin, {hair_color} hair, {eye_color} eyes"
        theme = f"{archetype or 'adventure'} adventure about {dream or 'discovering something amazing'}"

        prompt = f"""Create a 10-panel children's comic story. Simple vocabulary, 6-10 words per panel.

HERO: {hero_desc}, depicted as a 5-6 year old. Do NOT age up.
THEME: {theme}. Favorite color: {favorite_color}. Art style: {art_style or 'classic comic'}.
STRUCTURE: Panels 1-3 setup, 4-7 conflict, 8-10 resolution.

In characterDescription, describe the hero + a companion with physical traits and outfits for visual consistency.
In coverImagePrompt, use a dynamic cinematic composition (no side-by-side posing).
In each panel imagePrompt, use cinematic angles and show characters interacting — NEVER facing the camera.
Foreword: max 30 words. Use hero's name "{name}" only in story text, not image prompts."""

        contents = prompt
        if photo_base64:
            image_data = types.Part.from_bytes(
                data=base64.b64decode(photo_base64),
                mime_type="image/png",
            )
            contents = [image_data, prompt]

        response = await client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents,
            config={
                "response_mime_type": "application/json",
                "response_schema": GenerateStoryScriptResponse,
            },
        )

        result = GenerateStoryScriptResponse.model_validate_json(response.text)
        return result.model_dump()

    return await with_retry(_generate)


async def generate_panel_image(prompt: str, cast_guide: str, style: str | None = None) -> str:
    """Generate a comic panel image, returns base64 encoded image."""

    async def _generate():
        full_prompt = f"""Children's comic panel. {get_style_prompt(style)}
Characters: {cast_guide}. Hero is a 5-6 year old child — do NOT age up.
Scene: {prompt}.
Cinematic angles, characters interact with each other/world — NEVER face the camera. Full-bleed, borderless."""

        response = await client.aio.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=full_prompt,
            config=types.GenerateContentConfig(
                response_modalities=["image", "text"],
            ),
        )

        return extract_image_from_response(response)

    return await with_retry(_generate)


async def edit_panel_image(image_base64: str, original_prompt: str, edit_prompt: str, cast_guide: str, style: str | None = None) -> str:
    """Edit an existing comic panel image, returns base64 encoded image."""

    async def _generate():
        cast_note = f" Maintain character consistency: {cast_guide}." if cast_guide and cast_guide.strip() else ""
        full_prompt = f"""Edit this comic panel. Original scene: {original_prompt}
Requested edit: {edit_prompt}
{get_style_prompt(style)}{cast_note}
Preserve composition and style. Characters must NOT face the camera."""

        # Prepare image data
        image_data = types.Part.from_bytes(
            data=base64.b64decode(image_base64),
            mime_type="image/png",
        )

        response = await client.aio.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[image_data, full_prompt],
            config=types.GenerateContentConfig(
                response_modalities=["image", "text"],
            ),
        )

        return extract_image_from_response(response)

    return await with_retry(_generate)
