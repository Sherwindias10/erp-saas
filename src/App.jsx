import { useEffect, useMemo, useState } from 'react';
import { Heart, ImagePlus, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

const initialImages = [
  {
    id: crypto.randomUUID(),
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    title: 'Dashboard Analytics',
    favorite: false
  },
  {
    id: crypto.randomUUID(),
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    title: 'Team Collaboration',
    favorite: true
  },
  {
    id: crypto.randomUUID(),
    src: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80',
    title: 'Operations Planning',
    favorite: false
  }
];

export default function SaaSERPPlatform() {
  const [images, setImages] = useState(initialImages);
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const filteredImages = useMemo(() => {
    return images.filter((image) => {
      const queryMatch = image.title.toLowerCase().includes(query.toLowerCase());
      const favoriteMatch = favoritesOnly ? image.favorite : true;
      return queryMatch && favoriteMatch;
    });
  }, [favoritesOnly, images, query]);

  const selectedIndex = filteredImages.findIndex((image) => image.id === selectedId);
  const selectedImage = selectedIndex >= 0 ? filteredImages[selectedIndex] : null;

  useEffect(() => {
    const handleKeyboardNavigation = (event) => {
      if (!selectedImage) return;
      if (event.key === 'Escape') setSelectedId(null);
      if (event.key === 'ArrowRight') {
        const next = filteredImages[(selectedIndex + 1) % filteredImages.length];
        setSelectedId(next.id);
      }
      if (event.key === 'ArrowLeft') {
        const prev = filteredImages[(selectedIndex - 1 + filteredImages.length) % filteredImages.length];
        setSelectedId(prev.id);
      }
    };

    window.addEventListener('keydown', handleKeyboardNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardNavigation);
  }, [filteredImages, selectedImage, selectedIndex]);

  const toggleFavorite = (id) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, favorite: !img.favorite } : img)));
  };

  const onUpload = (event) => {
    const files = Array.from(event.target.files || []);
    const uploaded = files
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: crypto.randomUUID(),
        src: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, ''),
        favorite: false
      }));

    if (uploaded.length) {
      setImages((prev) => [...uploaded, ...prev]);
    }
    event.target.value = '';
  };

  const moveSelection = (direction) => {
    if (!selectedImage) return;
    const target = direction === 'next'
      ? filteredImages[(selectedIndex + 1) % filteredImages.length]
      : filteredImages[(selectedIndex - 1 + filteredImages.length) % filteredImages.length];
    setSelectedId(target.id);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Interactive Image Workspace</h1>
            <p className="text-slate-600">Search, favorite, preview, and upload images in a user-friendly gallery.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            <ImagePlus size={18} /> Upload Images
            <input type="file" multiple accept="image/*" className="hidden" onChange={onUpload} />
          </label>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
            <Search size={18} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search images..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-56 outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setFavoritesOnly((prev) => !prev)}
            className={`rounded-lg border px-4 py-2 ${favoritesOnly ? 'border-rose-500 bg-rose-50 text-rose-700' : 'bg-white'}`}
          >
            Favorites only
          </button>
          <span className="text-sm text-slate-600">{filteredImages.length} image(s)</span>
        </div>

        <main className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((image) => (
            <article key={image.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <button type="button" onClick={() => setSelectedId(image.id)} className="block w-full text-left">
                <img src={image.src} alt={image.title} className="h-56 w-full object-cover" />
              </button>
              <div className="flex items-center justify-between p-3">
                <p className="truncate font-medium">{image.title}</p>
                <button
                  type="button"
                  onClick={() => toggleFavorite(image.id)}
                  className={`rounded-md p-2 ${image.favorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                  aria-label="Toggle favorite"
                >
                  <Heart fill={image.favorite ? 'currentColor' : 'none'} size={18} />
                </button>
              </div>
            </article>
          ))}
        </main>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button className="absolute right-4 top-4 rounded-full bg-white p-2" onClick={() => setSelectedId(null)}>
            <X size={20} />
          </button>
          <button className="absolute left-4 rounded-full bg-white p-2" onClick={() => moveSelection('prev')}>
            <ChevronLeft size={20} />
          </button>
          <img src={selectedImage.src} alt={selectedImage.title} className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain" />
          <button className="absolute right-4 rounded-full bg-white p-2" onClick={() => moveSelection('next')}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
