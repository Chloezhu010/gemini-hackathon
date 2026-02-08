import { useState } from 'react';
import {
  generateAndSaveStory,
  updatePanelImage,
  StoryDetailResponse,
} from '../services/backendApi';
import { KidProfile, Story, ComicPanelData } from '../types';

function mapApiStory(data: StoryDetailResponse): Story {
  return {
    title: data.title || '',
    foreword: data.foreword || '',
    characterDescription: data.character_description || '',
    coverImagePrompt: data.cover_image_prompt || '',
    coverImageUrl: data.cover_image_url || undefined,
    panels: data.panels.map(p => ({
      id: String(p.id),
      text: p.text,
      imagePrompt: p.image_prompt || '',
      imageUrl: p.image_url || undefined,
      isGenerating: false,
    })),
  };
}

export const useStoryGenerator = () => {
  const [story, setStory] = useState<Story | null>(null);
  const [savedStoryId, setSavedStoryId] = useState<number | null>(null);

  const generateStory = async (p: KidProfile) => {
    // Convert camelCase to snake_case for API
    const profileForApi = {
      name: p.name,
      gender: p.gender,
      skin_tone: p.skinTone,
      hair_color: p.hairColor,
      eye_color: p.eyeColor,
      favorite_color: p.favoriteColor,
      dream: p.dream,
      archetype: p.archetype,
      art_style: p.artStyle,
      photo_base64: p.photoUrl?.startsWith('data:')
        ? p.photoUrl.split(',')[1]
        : undefined,
    };

    // Single API call: generate script + generate images + save to DB
    const result = await generateAndSaveStory(profileForApi);

    setSavedStoryId(result.story.id);
    setStory(mapApiStory(result.story));
  };

  const updatePanel = async (updated: ComicPanelData) => {
    if (!story) return;

    const panelOrder = story.panels.findIndex(p => p.id === updated.id);

    setStory({
      ...story,
      panels: story.panels.map(p => p.id === updated.id ? updated : p)
    });

    if (savedStoryId && panelOrder !== -1 && updated.imageUrl) {
      try {
        await updatePanelImage(savedStoryId, panelOrder, updated.imageUrl);
        console.log(`Panel ${panelOrder} saved to backend`);
      } catch (err) {
        console.error('Failed to save panel edit:', err);
      }
    }
  };

  return {
    story,
    setStory,
    savedStoryId,
    setSavedStoryId,
    generateStory,
    updatePanel,
  };
};
