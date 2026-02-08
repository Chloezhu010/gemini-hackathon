import React, { useState } from 'react';
import { toast } from 'sonner';
import { editPanelImage, getImageUrl } from '../services/backendApi';
import { KidProfile, ComicPanelData } from '../types';
import { SketchyButton } from './design-system/Primitives';

interface Props {
  panel: ComicPanelData;
  onUpdate: (updatedPanel: ComicPanelData) => void;
  charDesc?: string;
  profile?: KidProfile | null;
}

const ComicPanel: React.FC<Props> = ({ panel, onUpdate, charDesc = "", profile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Resolve image URL: data URLs pass through, filenames get backend URL
  const resolvedImageUrl = panel.imageUrl
    ? (panel.imageUrl.startsWith('data:') ? panel.imageUrl : getImageUrl(panel.imageUrl))
    : undefined;
  const isDataUrl = panel.imageUrl?.startsWith('data:') ?? false;

  const handleEdit = async () => {
    if (!panel.imageUrl || !editPrompt) return;

    setIsProcessing(true);

    try {
      // Pass the resolved URL (or data URL) to the edit function
      const sourceUrl = resolvedImageUrl || panel.imageUrl;
      const newImageUrl = await editPanelImage(
        sourceUrl,
        editPrompt,
        panel.imagePrompt,
        charDesc,
        profile?.artStyle
      );
      onUpdate({ ...panel, imageUrl: newImageUrl });
      setIsEditing(false);
      setEditPrompt('');
    } catch (err: unknown) {
      console.error(err);
      toast.error("Oops! Magic failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden group">
      {/* Full-bleed Image Container */}
      <div className="relative flex-1 bg-brand-surface">
        {panel.isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-brand-surface border-t-brand-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest animate-pulse">Painting Scene...</p>
          </div>
        ) : resolvedImageUrl ? (
          <>
            <img src={resolvedImageUrl} alt="Comic scene" className="w-full h-full object-cover block transition-opacity duration-500" />
            {isDataUrl && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-3 right-3 bg-white/40 backdrop-blur-md p-2.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:bg-white/90 transition-all duration-200 text-lg border border-white/50 z-40"
                title="Edit Scene"
              >
                🪄
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 font-black uppercase text-xs tracking-widest">
             Awaiting Vision
          </div>
        )}
      </div>

      {/* Floating Text Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-white via-white/90 to-transparent z-30 flex items-end justify-center min-h-[140px]">
        <p className="font-serif italic text-xl md:text-2xl text-brand-dark text-center leading-relaxed tracking-tight max-w-md drop-shadow-sm">
          {panel.text || "..."}
        </p>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-brand-dark/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl border-6 border-brand-accent animate-in zoom-in duration-300">
            <h3 className="text-3xl font-black text-brand-primary mb-2">Magic Revision</h3>
            <p className="text-base text-gray-400 mb-6 font-medium italic">Request a change for this specific scene.</p>
            <textarea
              className="w-full border-2 border-brand-surface rounded-2xl p-6 mb-8 text-lg font-bold focus:border-brand-accent focus:outline-none bg-brand-surface resize-none shadow-inner"
              rows={3}
              placeholder="e.g. Add a curious little robot looking at the map..."
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              disabled={isProcessing}
            />
            <div className="flex space-x-4">
              <SketchyButton
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl text-gray-400 border-gray-200"
                disabled={isProcessing}
                style={{ borderRadius: '1rem' }}
              >
                Close
              </SketchyButton>
              <SketchyButton
                onClick={handleEdit}
                className="flex-1 rounded-xl text-lg shadow-lg"
                disabled={isProcessing || !editPrompt}
                style={{ borderRadius: '1rem' }}
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'Apply Magic ✨'
                )}
              </SketchyButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComicPanel;
