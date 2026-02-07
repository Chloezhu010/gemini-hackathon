"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


# --- Kid Profile Models ---

class KidProfileCreate(BaseModel):
    """Input for creating a kid profile."""
    name: str
    gender: Literal["boy", "girl", "neutral"]
    skin_tone: str
    hair_color: str
    eye_color: str
    favorite_color: str
    dream: Optional[str] = None
    archetype: Optional[str] = None
    art_style: Optional[str] = None
    photo_base64: Optional[str] = None  # For multimodal character analysis


class KidProfileResponse(BaseModel):
    """Kid profile in responses."""
    id: int
    name: str
    gender: str
    skin_tone: str
    hair_color: str
    eye_color: str
    favorite_color: str
    dream: Optional[str] = None
    archetype: Optional[str] = None
    art_style: Optional[str] = None
    created_at: datetime


# --- Panel Models ---

class PanelCreate(BaseModel):
    """Panel data for saving."""
    panel_order: int
    text: str
    image_prompt: Optional[str] = None
    image_base64: Optional[str] = None


class PanelResponse(BaseModel):
    """Panel data in response."""
    id: int
    panel_order: int
    text: str
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None


# --- Story Models ---

class StoryCreate(BaseModel):
    """Complete story data for saving."""
    profile: KidProfileCreate
    title: Optional[str] = None
    foreword: Optional[str] = None
    character_description: Optional[str] = None
    cover_image_prompt: Optional[str] = None
    cover_image_base64: Optional[str] = None
    panels: list[PanelCreate] = []


class StoryListItem(BaseModel):
    """Story summary for list view."""
    id: int
    title: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_unlocked: bool = True
    created_at: datetime
    # Nested profile info
    profile: KidProfileResponse


class StoryResponse(BaseModel):
    """Full story details."""
    id: int
    title: Optional[str] = None
    foreword: Optional[str] = None
    character_description: Optional[str] = None
    cover_image_prompt: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_unlocked: bool = True
    created_at: datetime
    updated_at: datetime
    # Nested objects
    profile: KidProfileResponse
    panels: list[PanelResponse] = []


class StoryUpdatePanels(BaseModel):
    """Request to update story panels."""
    is_unlocked: bool = True
    panels: list[PanelCreate] = []
    cover_image_base64: Optional[str] = None


class UpdatePanelImageRequest(BaseModel):
    """Request to update a single panel's image."""
    image_base64: str


# --- Generation Request/Response Models ---

class GenerateStoryScriptRequest(BaseModel):
    """Request to generate a story script."""
    profile: KidProfileCreate


class GeneratedPanel(BaseModel):
    """A generated panel from the story script (also used as Gemini structured output schema)."""
    id: str = Field(description="Panel identifier, e.g. '1', '2', '3'")
    text: str = Field(description="The narrative text for this panel, 8-12 words")
    imagePrompt: str = Field(description="Detailed image prompt for this panel with cinematic direction")


class GenerateStoryScriptResponse(BaseModel):
    """Response containing the generated story script (also used as Gemini structured output schema)."""
    title: str = Field(description="The title of the comic book story")
    foreword: str = Field(description="A short foreword, max 30 words")
    characterDescription: str = Field(description="Detailed description of all characters including their appearance and outfits")
    coverImagePrompt: str = Field(description="Image prompt for the cover showing the hero and companion")
    panels: List[GeneratedPanel] = Field(description="List of story panels")


class GenerateAndSaveStoryRequest(BaseModel):
    """Generate script, images, and save story."""
    profile: KidProfileCreate


class GenerateAndSaveStoryResponse(BaseModel):
    """Complete story with images."""
    story: StoryResponse


class GeneratePanelImageRequest(BaseModel):
    """Request to generate a panel image."""
    prompt: str
    cast_guide: str
    style: str | None = None


class GeneratePanelImageResponse(BaseModel):
    """Response containing the generated image."""
    image_base64: str


class EditPanelImageRequest(BaseModel):
    """Request to edit a panel image."""
    image_base64: str
    original_prompt: str
    edit_prompt: str
    cast_guide: str
    style: str | None = None


class EditPanelImageResponse(BaseModel):
    """Response containing the edited image."""
    image_base64: str
