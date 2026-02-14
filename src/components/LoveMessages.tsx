import { useState } from 'react';
import { Mail, Heart, Shuffle, Plus, X } from 'lucide-react';
import { getLoveMessages, saveLoveMessages, LoveMessage } from '@/utils/storage';

const CATEGORIES = {
  sad: { label: 'Quand tu es triste 😢', color: 'bg-secondary' },
  miss: { label: 'Quand tu me manques 💭', color: 'bg-romantic-blush' },
  surprise: { label: 'Message surprise 💝', color: 'bg-romantic-cream' },
} as const;

const LoveMessages = () => {
  const [messages, setMessages] = useState<LoveMessage[]>(getLoveMessages);
  const [filter, setFilter] = useState<'all' | 'sad' | 'miss' | 'surprise'>('all');
  const [randomMsg, setRandomMsg] = useState<LoveMessage | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCat, setNewCat] = useState<'sad' | 'miss' | 'surprise'>('surprise');

  const filtered = filter === 'all' ? messages : messages.filter((m) => m.category === filter);

  const handleRandom = () => {
    const pool = filtered.length > 0 ? filtered : messages;
    if (pool.length === 0) return;
    setRandomMsg(pool[Math.floor(Math.random() * pool.length)]);
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    const msg: LoveMessage = { id: Date.now().toString(), text: newText.trim(), category: newCat };
    const updated = [...messages, msg];
    setMessages(updated);
    saveLoveMessages(updated);
    setNewText('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    setMessages(updated);
    saveLoveMessages(updated);
  };

  return (
    <section className="py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <Mail className="mx-auto mb-2 text-primary" size={32} />
        <h2 className="font-display text-3xl text-foreground mb-2">Messages d'Amour</h2>
        <p className="text-muted-foreground font-body">Des mots doux pour chaque moment 💌</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {(['all', 'sad', 'miss', 'surprise'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 ${
              filter === cat
                ? 'romantic-gradient text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-primary/10'
            }`}
          >
            {cat === 'all' ? 'Tous 💕' : CATEGORIES[cat].label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center mb-6">
        <button onClick={handleRandom} className="flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-accent-foreground hover:scale-105 transition-all font-body text-sm shadow">
          <Shuffle size={16} /> Message aléatoire
        </button>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-5 py-2 rounded-full romantic-gradient text-primary-foreground hover:scale-105 transition-all font-body text-sm shadow">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Random popup */}
      {randomMsg && (
        <div className="glass-card p-6 mb-6 text-center animate-scale-in">
          <Heart className="mx-auto mb-3 text-primary animate-pulse-heart" size={32} fill="currentColor" />
          <p className="font-body text-lg text-foreground italic">"{randomMsg.text}"</p>
          <button onClick={() => setRandomMsg(null)} className="mt-3 text-muted-foreground text-sm hover:text-primary transition-colors">Fermer</button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="glass-card p-5 mb-6 animate-scale-in">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Écris ton message d'amour..."
            className="w-full p-3 rounded-xl bg-background border border-border text-foreground font-body resize-none h-24 focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          <div className="flex gap-2 mt-3 flex-wrap">
            {(['sad', 'miss', 'surprise'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewCat(cat)}
                className={`px-3 py-1 rounded-full text-xs font-body transition-all ${
                  newCat === cat ? 'romantic-gradient text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {CATEGORIES[cat].label}
              </button>
            ))}
          </div>
          <button onClick={handleAdd} className="mt-3 w-full py-2 rounded-full romantic-gradient text-primary-foreground font-body hover:scale-[1.02] transition-all">
            Envoyer avec amour 💌
          </button>
        </div>
      )}

      {/* Messages list */}
      <div className="space-y-3">
        {filtered.map((msg, i) => (
          <div
            key={msg.id}
            className="glass-card p-4 flex items-start gap-3 animate-fade-in group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Heart className="text-primary mt-1 flex-shrink-0" size={16} fill="currentColor" />
            <div className="flex-1">
              <p className="font-body text-foreground">{msg.text}</p>
              <span className="text-xs text-muted-foreground mt-1 block">{CATEGORIES[msg.category].label}</span>
            </div>
            <button onClick={() => handleDelete(msg.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LoveMessages;
