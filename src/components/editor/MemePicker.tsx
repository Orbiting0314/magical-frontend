import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { getMemes } from '../../api/memes';
import { MEME_CATEGORIES } from '../../types';
import type { Meme, MemeCategory } from '../../types';

interface MemePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (meme: Meme) => void;
}

export default function MemePicker({ open, onClose, onSelect }: MemePickerProps) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MemeCategory | 'all'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMemes(debouncedSearch || undefined, category !== 'all' ? category : undefined)
      .then(setMemes)
      .catch(() => setMemes([]))
      .finally(() => setLoading(false));
  }, [open, debouncedSearch, category]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-white rounded-xl shadow-2xl w-[720px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">Insert Meme</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-5 pt-3 pb-2 space-y-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search memes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
              autoFocus
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {MEME_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  category === cat.value
                    ? 'bg-amber-100 text-amber-800 font-medium'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Loading...</div>
          ) : memes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              No memes found
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 pt-1">
              {memes.map((meme) => (
                <button
                  key={meme._id}
                  onClick={() => {
                    onSelect(meme);
                    onClose();
                  }}
                  className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-amber-400 hover:shadow-md transition-all bg-gray-50 aspect-square"
                  title={meme.name}
                >
                  <img
                    src={meme.url}
                    alt={meme.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white leading-tight truncate">{meme.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-gray-100 text-[11px] text-gray-400">
          {memes.length} meme{memes.length !== 1 ? 's' : ''} available -- click to insert
        </div>
      </div>
    </div>
  );
}
