/**
 * Backend API service for story persistence.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_BASE = `${API_BASE_URL}/api`;

/**
 * Get full image URL from a storage filename.
 * Images are served as static files from the backend /images/ path.
 */
export function getImageUrl(filename: string | null | undefined): string | undefined {
    if (!filename) return undefined;
    if (filename.startsWith('data:') || filename.startsWith('http')) return filename;
    return `${API_BASE_URL}/images/${filename}`;
}

/**
 * Wrapper for fetch with JSON content type.
 */
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export interface KidProfileResponse {
    id: number;
    name: string;
    gender: 'boy' | 'girl' | 'neutral';
    skin_tone: string;
    hair_color: string;
    eye_color: string;
    favorite_color: string;
    dream: string | null;
    archetype: string | null;
    art_style: string | null;
    created_at: string;
}

export interface PanelResponse {
    id: number;
    panel_order: number;
    text: string;
    image_prompt: string | null;
    image_url: string | null;
}

export interface StoryDetailResponse {
    id: number;
    title: string | null;
    foreword: string | null;
    character_description: string | null;
    cover_image_prompt: string | null;
    cover_image_url: string | null;
    is_unlocked: boolean;
    created_at: string;
    updated_at: string;
    profile: KidProfileResponse;
    panels: PanelResponse[];
}

export interface StoryListItem {
    id: number;
    title: string | null;
    cover_image_url: string | null;
    is_unlocked: boolean;
    created_at: string;
    profile: KidProfileResponse;
}

export interface SaveStoryParams {
    profile: {
        name: string;
        gender: 'boy' | 'girl' | 'neutral';
        skin_tone: string;
        hair_color: string;
        eye_color: string;
        favorite_color: string;
        dream?: string;
        archetype?: string;
    };
    title?: string;
    foreword?: string;
    character_description?: string;
    cover_image_prompt?: string;
    cover_image_base64?: string;
    panels: Array<{
        panel_order: number;
        text: string;
        image_prompt?: string;
        image_base64?: string;
    }>;
}

/**
 * Save a complete story to the backend.
 */
export async function saveStory(params: SaveStoryParams): Promise<number> {
    const response = await apiFetch(`${API_BASE}/stories`, {
        method: 'POST',
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error(`Failed to save story: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
}

export interface UpdateStoryParams {
    is_unlocked: boolean;
    panels: Array<{
        panel_order: number;
        text: string;
        image_prompt?: string;
        image_base64?: string;
    }>;
}

/**
 * Update story panels.
 */
export async function updateStory(storyId: number, params: UpdateStoryParams): Promise<void> {
    const response = await apiFetch(`${API_BASE}/stories/${storyId}`, {
        method: 'PATCH',
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        throw new Error(`Failed to update story: ${response.statusText}`);
    }
}

/**
 * Update a single panel's image after editing.
 */
export async function updatePanelImage(
    storyId: number,
    panelOrder: number,
    imageBase64: string
): Promise<void> {
    const response = await apiFetch(`${API_BASE}/stories/${storyId}/panels/${panelOrder}`, {
        method: 'PATCH',
        body: JSON.stringify({ image_base64: imageBase64 }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update panel image: ${response.statusText}`);
    }
}

/**
 * Get list of all saved stories.
 */
export async function getStories(): Promise<StoryListItem[]> {
    const response = await apiFetch(`${API_BASE}/stories`);

    if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get a single story with all its panels.
 */
export async function getStory(storyId: number): Promise<StoryDetailResponse> {
    const response = await apiFetch(`${API_BASE}/stories/${storyId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch story: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Delete a story.
 */
export async function deleteStory(storyId: number): Promise<void> {
    const response = await apiFetch(`${API_BASE}/stories/${storyId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete story: ${response.statusText}`);
    }
}

// --- Generation API ---

export interface KidProfileForGeneration {
    name: string;
    gender: 'boy' | 'girl' | 'neutral';
    skin_tone: string;
    hair_color: string;
    eye_color: string;
    favorite_color: string;
    dream?: string;
    archetype?: string;
    art_style?: string;
    photo_base64?: string;  // Pure base64, no data URL prefix
}

export interface GeneratedPanel {
    id: string;
    text: string;
    imagePrompt: string;
}

export interface GeneratedStoryScript {
    title: string;
    foreword: string;
    characterDescription: string;
    coverImagePrompt: string;
    panels: GeneratedPanel[];
}

export interface GenerateAndSaveStoryResponse {
    story: StoryDetailResponse;
}

/**
 * Generate story script + images and save to DB.
 */
export async function generateAndSaveStory(
    profile: KidProfileForGeneration
): Promise<GenerateAndSaveStoryResponse> {
    const response = await apiFetch(`${API_BASE}/stories/generate`, {
        method: 'POST',
        body: JSON.stringify({ profile }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to generate story: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Generate a story script using Gemini AI.
 */
export async function generateStoryScript(
    profile: KidProfileForGeneration
): Promise<GeneratedStoryScript> {
    const response = await apiFetch(`${API_BASE}/generate/story-script`, {
        method: 'POST',
        body: JSON.stringify({ profile }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to generate story: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Generate a comic panel image using Gemini AI.
 */
export async function generatePanelImage(
    prompt: string,
    castGuide: string,
    artStyle?: string
): Promise<string> {
    const response = await apiFetch(`${API_BASE}/generate/panel-image`, {
        method: 'POST',
        body: JSON.stringify({
            prompt,
            cast_guide: castGuide,
            style: artStyle,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    return `data:image/png;base64,${data.image_base64}`;
}

/**
 * Convert an image URL to base64.
 */
async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Extract base64 part after the comma
            resolve(dataUrl.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Edit an existing comic panel image using Gemini AI.
 */
export async function editPanelImage(
    imageSource: string,
    editPrompt: string,
    originalPrompt: string,
    castGuide: string,
    style?: string
): Promise<string> {
    let pureBase64: string;

    if (imageSource.startsWith('data:')) {
        pureBase64 = imageSource.split(',')[1];
    } else if (imageSource.startsWith('http')) {
        pureBase64 = await urlToBase64(imageSource);
    } else {
        pureBase64 = imageSource;
    }

    const response = await apiFetch(`${API_BASE}/generate/edit-image`, {
        method: 'POST',
        body: JSON.stringify({
            image_base64: pureBase64,
            original_prompt: originalPrompt,
            edit_prompt: editPrompt,
            cast_guide: castGuide,
            style: style,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Failed to edit image: ${response.statusText}`);
    }

    const data = await response.json();
    return `data:image/png;base64,${data.image_base64}`;
}
