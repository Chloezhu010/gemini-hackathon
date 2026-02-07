
export interface KidProfile {
  name: string;
  gender: 'boy' | 'girl' | 'neutral';
  skinTone: string;
  hairColor: string;
  eyeColor: string;
  favoriteColor: string;
  dream: string;
  personality: string;
  archetype?: string;
  photoUrl?: string;
  artStyle?: string;
}

export interface ComicPanelData {
  id: string;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface Story {
  title: string;
  foreword: string;
  characterDescription: string;
  coverImagePrompt: string;
  coverImageUrl?: string;
  panels: ComicPanelData[];
}
