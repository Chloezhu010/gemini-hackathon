import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getStories, deleteStory, StoryListItem } from '../services/backendApi';
import StorageImage from './StorageImage';

const GalleryPage: React.FC = () => {
  const [stories, setStories] = useState<StoryListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await getStories();
      setStories(data);
    } catch (err) {
      console.error("Failed to load stories", err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to load stories: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault(); // Prevent navigation if triggered within a link (though it's not)
    if (window.confirm('Are you sure you want to delete this story? This cannot be undone.')) {
      try {
        await deleteStory(id);
        setStories(stories.filter(s => s.id !== id));
      } catch (err) {
        console.error("Failed to delete story", err);
        toast.error("Failed to delete story.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black text-gray-800">My Saved Books</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {stories.map(book => (
            <div key={book.id} className="bg-white rounded-[2rem] shadow-xl overflow-hidden group border-2 border-gray-100 hover:border-purple-200 transition-all hover:-translate-y-1 relative">
              <button
                onClick={(e) => handleDelete(e, book.id)}
                className="absolute top-4 right-4 z-30 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete Story"
              >
                🗑️
              </button>
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                {book.cover_image_url ? (
                  <StorageImage
                    src={book.cover_image_url}
                    alt={book.title || 'Untitled Story'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loadingClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-4xl">?</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Link 
                    to={`/book/${book.id}`} 
                    className="px-8 py-3 bg-white text-purple-900 font-black rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-all"
                  >
                    READ NOW
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-black text-gray-800 leading-tight mb-2 line-clamp-2">{book.title || 'Untitled Masterpiece'}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full uppercase tracking-wide">
                    {book.profile.name}
                  </span>
                  {book.profile.archetype && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full uppercase tracking-wide">
                      {book.profile.archetype}
                    </span>
                  )}
                </div>
                <div className="mt-4 text-xs text-gray-400 font-medium">
                  {new Date(book.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
          
          {stories.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              <p className="text-xl font-medium italic">No stories found yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
