"""
SQLite database setup with aiosqlite.
"""
import os
import aiosqlite

# Single connection (initialized on startup)
_db: aiosqlite.Connection | None = None

DB_PATH = os.getenv("DB_PATH", "wondercomic.db")


async def init_db():
    """Initialize the database connection and create tables."""
    global _db
    if _db is None:
        _db = await aiosqlite.connect(DB_PATH)
        _db.row_factory = aiosqlite.Row
        await _db.execute("PRAGMA journal_mode=WAL")
        await _db.execute("PRAGMA foreign_keys=ON")
        await _create_tables(_db)
    return _db


async def _create_tables(db: aiosqlite.Connection):
    """Create tables if they don't exist."""
    await db.executescript("""
        CREATE TABLE IF NOT EXISTS kid_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'local-user',
            name TEXT NOT NULL,
            gender TEXT NOT NULL CHECK(gender IN ('boy', 'girl', 'neutral')),
            skin_tone TEXT NOT NULL,
            hair_color TEXT NOT NULL,
            eye_color TEXT NOT NULL,
            favorite_color TEXT NOT NULL,
            dream TEXT,
            archetype TEXT,
            art_style TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'local-user',
            kid_profile_id INTEGER NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
            title TEXT,
            foreword TEXT,
            character_description TEXT,
            cover_image_prompt TEXT,
            cover_image_path TEXT,
            is_unlocked BOOLEAN NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS panels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
            panel_order INTEGER NOT NULL,
            text TEXT NOT NULL,
            image_prompt TEXT,
            image_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(story_id, panel_order)
        );
    """)
    await db.commit()


async def close_db():
    """Close the database connection."""
    global _db
    if _db:
        await _db.close()
        _db = None


async def get_db():
    """FastAPI dependency that provides a database connection."""
    db = await init_db()
    yield db
