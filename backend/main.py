"""
FastAPI main application with CORS and API routes.
"""
import traceback
from pathlib import Path
from dotenv import load_dotenv

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import aiosqlite

# Load .env from project root (parent of backend/)
load_dotenv(Path(__file__).parent.parent / ".env")

from database import get_db, init_db, close_db
from models import (
    StoryCreate,
    StoryResponse,
    StoryListItem,
    StoryUpdatePanels,
    UpdatePanelImageRequest,
    GenerateStoryScriptRequest,
    GenerateStoryScriptResponse,
    GenerateAndSaveStoryRequest,
    GenerateAndSaveStoryResponse,
    GeneratePanelImageRequest,
    GeneratePanelImageResponse,
    EditPanelImageRequest,
    EditPanelImageResponse,
    PanelCreate,
)
import crud
from gemini_service import (
    generate_story_script as gen_script,
    generate_panel_image as gen_panel_image,
    edit_panel_image as edit_image,
)
from config import get_config, safe_error_detail


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage database lifecycle."""
    config = get_config()
    print(f"Starting WonderComic API with frontend URL: {config.frontend_url}")

    await init_db()
    yield
    await close_db()


app = FastAPI(title="WonderComic API", version="1.0.0", lifespan=lifespan)

# CORS for frontend
config = get_config()
allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
]
if config.frontend_url not in allowed_origins:
    allowed_origins.append(config.frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Serve images as static files
images_dir = Path(__file__).parent / "images"
images_dir.mkdir(exist_ok=True)
app.mount("/images", StaticFiles(directory=str(images_dir)), name="images")


# --- Health Check ---

@app.get("/health")
async def health_check(db: aiosqlite.Connection = Depends(get_db)):
    """Health check for uptime monitoring."""
    checks = {}
    healthy = True

    try:
        cursor = await db.execute("SELECT 1")
        await cursor.fetchone()
        checks["database"] = "ok"
    except Exception as e:
        print(f"Health check database error: {e}")
        checks["database"] = "unavailable"
        healthy = False

    status_code = 200 if healthy else 503
    return JSONResponse(
        status_code=status_code,
        content={"status": "healthy" if healthy else "unhealthy", "version": "1.0.0", "checks": checks},
    )


# --- API Endpoints ---

@app.post("/api/stories", response_model=StoryResponse)
async def create_story(
    story: StoryCreate,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Create a new story with profile and panels."""
    result = await crud.create_story(db, story)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create story")
    return result


@app.get("/api/stories", response_model=list[StoryListItem])
async def list_stories(
    db: aiosqlite.Connection = Depends(get_db),
):
    """Get all stories (summary view)."""
    return await crud.list_stories(db)


@app.get("/api/stories/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: int,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Get a single story with all its panels."""
    story = await crud.get_story_by_id(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@app.patch("/api/stories/{story_id}", response_model=StoryResponse)
async def update_story(
    story_id: int,
    update: StoryUpdatePanels,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Update story panels."""
    result = await crud.update_story_panels(db, story_id, update)
    if not result:
        raise HTTPException(status_code=404, detail="Story not found")
    return result


@app.patch("/api/stories/{story_id}/panels/{panel_order}", status_code=204)
async def update_panel_image(
    story_id: int,
    panel_order: int,
    update: UpdatePanelImageRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Update a single panel's image after editing."""
    success = await crud.update_panel_image(db, story_id, panel_order, update.image_base64)
    if not success:
        raise HTTPException(status_code=404, detail="Panel not found")
    return None


@app.delete("/api/stories/{story_id}", status_code=204)
async def delete_story(
    story_id: int,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Delete a story and its panels."""
    deleted = await crud.delete_story(db, story_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Story not found")
    return None


# --- Generation Endpoints ---

@app.post("/api/stories/generate", response_model=GenerateAndSaveStoryResponse)
async def generate_and_save_story(
    request: GenerateAndSaveStoryRequest,
    db: aiosqlite.Connection = Depends(get_db),
):
    """Generate story script + images and save to DB."""
    # 1. Generate story script via Gemini
    try:
        result = await gen_script(
            name=request.profile.name,
            gender=request.profile.gender,
            skin_tone=request.profile.skin_tone,
            hair_color=request.profile.hair_color,
            eye_color=request.profile.eye_color,
            favorite_color=request.profile.favorite_color,
            dream=request.profile.dream,
            archetype=request.profile.archetype,
            art_style=request.profile.art_style,
            photo_base64=request.profile.photo_base64,
        )
    except Exception as e:
        print(f"Story script generation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=safe_error_detail(e, "Story generation failed"))

    # 2. Generate images (cover + all panels)
    all_panels = result["panels"]
    art_style = request.profile.art_style
    char_desc = result["characterDescription"]

    try:
        cover_image_base64 = await gen_panel_image(
            prompt=result["coverImagePrompt"],
            cast_guide=char_desc,
            style=art_style,
        )

        panel_images: dict[int, str] = {}
        for i in range(len(all_panels)):
            panel_images[i] = await gen_panel_image(
                prompt=all_panels[i]["imagePrompt"],
                cast_guide=char_desc,
                style=art_style,
            )
    except Exception as e:
        print(f"Image generation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=safe_error_detail(e, "Image generation failed"))

    # 3. Save story to DB with images
    try:
        story_data = StoryCreate(
            profile=request.profile,
            title=result["title"],
            foreword=result["foreword"],
            character_description=result["characterDescription"],
            cover_image_prompt=result["coverImagePrompt"],
            cover_image_base64=cover_image_base64,
            panels=[
                PanelCreate(
                    panel_order=idx,
                    text=p["text"],
                    image_prompt=p["imagePrompt"],
                    image_base64=panel_images.get(idx),
                )
                for idx, p in enumerate(all_panels)
            ],
        )
        saved = await crud.create_story(db, story_data)
    except Exception as e:
        print(f"Story save error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to save story")

    return GenerateAndSaveStoryResponse(story=saved)


@app.post("/api/generate/story-script", response_model=GenerateStoryScriptResponse)
async def generate_story_script(
    request: GenerateStoryScriptRequest,
):
    """Generate a story script using Gemini AI."""
    try:
        result = await gen_script(
            name=request.profile.name,
            gender=request.profile.gender,
            skin_tone=request.profile.skin_tone,
            hair_color=request.profile.hair_color,
            eye_color=request.profile.eye_color,
            favorite_color=request.profile.favorite_color,
            dream=request.profile.dream,
            archetype=request.profile.archetype,
            art_style=request.profile.art_style,
            photo_base64=request.profile.photo_base64,
        )
        return result
    except Exception as e:
        print(f"Story script generation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=safe_error_detail(e, "Story generation failed"))


@app.post("/api/generate/panel-image", response_model=GeneratePanelImageResponse)
async def generate_panel_image_endpoint(
    request: GeneratePanelImageRequest,
):
    """Generate a comic panel image using Gemini AI."""
    try:
        image_base64 = await gen_panel_image(
            prompt=request.prompt,
            cast_guide=request.cast_guide,
            style=request.style,
        )
        return {"image_base64": image_base64}
    except Exception as e:
        print(f"Panel image generation error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=safe_error_detail(e, "Image generation failed"))


@app.post("/api/generate/edit-image", response_model=EditPanelImageResponse)
async def edit_panel_image_endpoint(
    request: EditPanelImageRequest,
):
    """Edit an existing comic panel image using Gemini AI."""
    try:
        image_base64 = await edit_image(
            image_base64=request.image_base64,
            original_prompt=request.original_prompt,
            edit_prompt=request.edit_prompt,
            cast_guide=request.cast_guide,
            style=request.style,
        )
        return {"image_base64": image_base64}
    except Exception as e:
        print(f"Edit image error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=safe_error_detail(e, "Image editing failed"))
