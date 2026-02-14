import { useState, useEffect, useRef } from 'react';
import { Camera, Trash2, Plus, X } from 'lucide-react';
import { PhotoEntry, savePhoto, getAllPhotos, deletePhoto } from '@/utils/storage';

const Gallery = () => {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [selected, setSelected] = useState<PhotoEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAllPhotos().then((p) => setPhotos(p.sort((a, b) => b.date.localeCompare(a.date))));
  }, []);

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async () => {
        const entry: PhotoEntry = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          data: reader.result as string,
          date: new Date().toISOString(),
        };
        await savePhoto(entry);
        setPhotos((prev) => [entry, ...prev]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    await deletePhoto(id);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelected(null);
  };

  return (
    <section className="py-8 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <Camera className="mx-auto mb-2 text-primary" size={32} />
        <h2 className="font-display text-3xl text-foreground mb-2">Nos Souvenirs</h2>
        <p className="text-muted-foreground font-body">Les moments qui comptent le plus 📸</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdd} />

      <button
        onClick={() => fileRef.current?.click()}
        className="mx-auto mb-6 flex items-center gap-2 romantic-gradient text-primary-foreground px-6 py-3 rounded-full
          hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
      >
        <Plus size={18} /> Ajouter une photo
      </button>

      {photos.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground font-body">Aucun souvenir encore... Ajoute votre première photo ! 💕</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative group cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-xl
                transition-all duration-300 hover:scale-[1.02] aspect-square"
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => setSelected(photo)}
            >
              <img src={photo.data} alt="Souvenir" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selected.data} alt="Souvenir" className="w-full rounded-2xl shadow-2xl" />
            <div className="absolute top-3 right-3 flex gap-2">
              <button onClick={() => handleDelete(selected.id)} className="p-2 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform">
                <Trash2 size={18} />
              </button>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full bg-card text-foreground hover:scale-110 transition-transform">
                <X size={18} />
              </button>
            </div>
            <p className="text-center text-primary-foreground/80 text-sm mt-2">
              {new Date(selected.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
