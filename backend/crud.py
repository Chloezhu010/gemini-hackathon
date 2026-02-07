"""
CRUD operations for database entities (async SQLite).
"""
import os
import base64
import uuid

import aiosqlite

from models import (
    KidProfileCreate, KidProfileResponse,
    PanelCreate, PanelResponse,
    StoryCreate, StoryResponse, StoryListItem, StoryUpdatePanels,
)

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

USER_ID = "local-user"


# --- Helpers ---

def save_base64_image(base64_data: str, prefix: str = "img") -> str | None:
    """Save base64 image to local images/ directory and return filename."""
    if not base64_data:
        return None

    # Remove data URL prefix if present
    if "," in base64_data:
        base64_data = base64_data.split(",")[1]

    try:
        image_bytes = base64.b64decode(base64_data)
    except Exception:
        return None

    filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
    filepath = os.path.join(IMAGES_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return filename


def delete_local_image(filename: str | None) -> None:
    """Delete a local image file."""
    if not filename:
        return
    filepath = os.path.join(IMAGES_DIR, filename)
    try:
        os.unlink(filepath)
    except FileNotFoundError:
        pass


# --- Kid Profile CRUD ---

async def create_kid_profile(db: aiosqlite.Connection, profile: KidProfileCreate) -> int:
    """Create a kid profile and return its ID."""
    cursor = await db.execute("""
        INSERT INTO kid_profiles (
            name, gender, skin_tone, hair_color, eye_color,
            favorite_color, dream, archetype, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (profile.name, profile.gender, profile.skin_tone, profile.hair_color,
         profile.eye_color, profile.favorite_color, profile.dream,
         profile.archetype, USER_ID),
    )
    await db.commit()
    return cursor.lastrowid


async def get_kid_profile(db: aiosqlite.Connection, profile_id: int) -> KidProfileResponse | None:
    """Get a kid profile by ID."""
    cursor = await db.execute("SELECT * FROM kid_profiles WHERE id = ?", (profile_id,))
    row = await cursor.fetchone()
    if not row:
        return None
    return KidProfileResponse(
        id=row["id"],
        name=row["name"],
        gender=row["gender"],
        skin_tone=row["skin_tone"],
        hair_color=row["hair_color"],
        eye_color=row["eye_color"],
        favorite_color=row["favorite_color"],
        dream=row["dream"],
        archetype=row["archetype"],
        created_at=row["created_at"],
    )


# --- Panel CRUD ---

async def create_panels(db: aiosqlite.Connection, story_id: int, panels: list[PanelCreate]) -> None:
    """Create panels for a story."""
    for panel in panels:
        panel_filename = None
        if panel.image_base64:
            panel_filename = save_base64_image(panel.image_base64, f"panel_{story_id}")

        await db.execute("""
            INSERT INTO panels (story_id, panel_order, text, image_prompt, image_path)
            VALUES (?, ?, ?, ?, ?)
        """, (story_id, panel.panel_order, panel.text, panel.image_prompt, panel_filename))
    await db.commit()


async def get_panels_for_story(db: aiosqlite.Connection, story_id: int) -> list[PanelResponse]:
    """Get all panels for a story."""
    cursor = await db.execute("""
        SELECT * FROM panels WHERE story_id = ? ORDER BY panel_order
    """, (story_id,))
    rows = await cursor.fetchall()

    return [
        PanelResponse(
            id=row["id"],
            panel_order=row["panel_order"],
            text=row["text"],
            image_prompt=row["image_prompt"],
            image_url=row["image_path"],
        )
        for row in rows
    ]


# --- Story CRUD ---

async def create_story(db: aiosqlite.Connection, story: StoryCreate) -> StoryResponse:
    """Create a story with profile and panels."""
    profile_id = await create_kid_profile(db, story.profile)

    cover_filename = None
    if story.cover_image_base64:
        cover_filename = save_base64_image(story.cover_image_base64, "cover")

    cursor = await db.execute("""
        INSERT INTO stories (
            kid_profile_id, title, foreword, character_description,
            cover_image_prompt, cover_image_path, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (profile_id, story.title, story.foreword, story.character_description,
         story.cover_image_prompt, cover_filename, USER_ID),
    )
    await db.commit()

    story_id = cursor.lastrowid

    await create_panels(db, story_id, story.panels)

    return await get_story_by_id(db, story_id)


async def get_story_by_id(db: aiosqlite.Connection, story_id: int) -> StoryResponse | None:
    """Get a complete story with profile and panels."""
    cursor = await db.execute("SELECT * FROM stories WHERE id = ?", (story_id,))
    row = await cursor.fetchone()

    if not row:
        return None

    profile = await get_kid_profile(db, row["kid_profile_id"])
    panels = await get_panels_for_story(db, story_id)

    return StoryResponse(
        id=row["id"],
        title=row["title"],
        foreword=row["foreword"],
        character_description=row["character_description"],
        cover_image_prompt=row["cover_image_prompt"],
        cover_image_url=row["cover_image_path"],
        is_unlocked=bool(row["is_unlocked"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        profile=profile,
        panels=panels,
    )


async def list_stories(db: aiosqlite.Connection) -> list[StoryListItem]:
    """Get all stories with summary info."""
    cursor = await db.execute("""
        SELECT id, title, cover_image_path, is_unlocked, created_at, kid_profile_id
        FROM stories
        ORDER BY created_at DESC
    """)
    rows = await cursor.fetchall()

    results = []
    for row in rows:
        profile = await get_kid_profile(db, row["kid_profile_id"])
        results.append(StoryListItem(
            id=row["id"],
            title=row["title"],
            cover_image_url=row["cover_image_path"],
            is_unlocked=bool(row["is_unlocked"]),
            created_at=row["created_at"],
            profile=profile,
        ))
    return results


async def delete_story(db: aiosqlite.Connection, story_id: int) -> bool:
    """Delete a story and its associated images. Returns True if deleted."""
    cursor = await db.execute(
        "SELECT cover_image_path FROM stories WHERE id = ?", (story_id,)
    )
    story_row = await cursor.fetchone()
    if not story_row:
        return False

    panel_cursor = await db.execute(
        "SELECT image_path FROM panels WHERE story_id = ?", (story_id,)
    )
    panel_rows = await panel_cursor.fetchall()

    # Collect all image paths for deletion
    image_paths = []
    if story_row["cover_image_path"]:
        image_paths.append(story_row["cover_image_path"])
    for row in panel_rows:
        if row["image_path"]:
            image_paths.append(row["image_path"])

    # Delete from database (cascades to panels)
    await db.execute("DELETE FROM stories WHERE id = ?", (story_id,))
    await db.commit()

    # Delete local image files
    for path in image_paths:
        delete_local_image(path)

    return True


async def update_story_panels(
    db: aiosqlite.Connection, story_id: int, update: StoryUpdatePanels
) -> StoryResponse | None:
    """Update story and panel images."""
    cursor = await db.execute("SELECT id FROM stories WHERE id = ?", (story_id,))
    row = await cursor.fetchone()
    if not row:
        return None

    await db.execute("""
        UPDATE stories
        SET is_unlocked = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (update.is_unlocked, story_id))

    # Update cover image if provided
    if update.cover_image_base64:
        cover_filename = save_base64_image(update.cover_image_base64, "cover")
        if cover_filename:
            await db.execute("""
                UPDATE stories SET cover_image_path = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (cover_filename, story_id))

    # Update panel images
    for panel in update.panels:
        if panel.image_base64:
            panel_filename = save_base64_image(panel.image_base64, f"panel_{story_id}")
            await db.execute("""
                UPDATE panels
                SET image_path = ?
                WHERE story_id = ? AND panel_order = ?
            """, (panel_filename, story_id, panel.panel_order))

    await db.commit()
    return await get_story_by_id(db, story_id)


async def update_panel_image(
    db: aiosqlite.Connection, story_id: int, panel_order: int, image_base64: str
) -> bool:
    """Update a single panel's image. Returns True if successful."""
    cursor = await db.execute("""
        SELECT p.id FROM panels p
        WHERE p.story_id = ? AND p.panel_order = ?
    """, (story_id, panel_order))
    row = await cursor.fetchone()
    if not row:
        return False

    panel_filename = save_base64_image(image_base64, f"panel_{story_id}")
    await db.execute("""
        UPDATE panels
        SET image_path = ?
        WHERE story_id = ? AND panel_order = ?
    """, (panel_filename, story_id, panel_order))

    await db.execute("""
        UPDATE stories
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (story_id,))

    await db.commit()
    return True
