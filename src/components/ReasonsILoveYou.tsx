import { useState } from 'react';
import { Heart, Plus, Trash2, Sparkles } from 'lucide-react';
import { getReasons, saveReasons, type Reason } from '@/utils/storage';

const DEFAULT_REASONS: Reason[] = [
  { id: '1', text: "Ton sourire qui illumine tout", emoji: '😊' },
  { id: '2', text: "Ta façon de me regarder", emoji: '👀' },
  { id: '3', text: "Ton rire contagieux", emoji: '😂' },
  { id: '4', text: "Ta gentillesse envers tout le monde", emoji: '💖' },
  { id: '5', text: "Ta force et ton courage", emoji: '💪' },
  { id: '6', text: "Les petites attentions que tu me fais", emoji: '🎁' },
  { id: '7', text: "Nos fous rires ensemble", emoji: '🤣' },
  { id: '8', text: "Ta voix quand tu me dis je t'aime", emoji: '🥰' },
  { id: '9', text: "Ton parfum qui me fait fondre", emoji: '🌸' },
  { id: '10', text: "Le fait que tu sois toi, tout simplement", emoji: '✨' },
];

const EMOJIS = ['❤️', '💕', '🌹', '💖', '😍', '🥰', '✨', '🎀', '💫', '🦋'];

const ReasonsILoveYou = () => {
  const [reasons, setReasons] = useState<Reason[]>(() => getReasons(DEFAULT_REASONS));
  const [newText, setNewText] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addReason = () => {
    if (!newText.trim()) return;
    const reason: Reason = {
      id: Date.now().toString(),
      text: newText.trim(),
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    };
    const updated = [...reasons, reason];
    setReasons(updated);
    saveReasons(updated);
    setNewText('');
    setAdding(false);
  };

  const deleteReason = (id: string) => {
    const updated = reasons.filter((r) => r.id !== id);
    setReasons(updated);
    saveReasons(updated);
  };

  return (
    <section className="py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <Sparkles className="mx-auto mb-2 text-romantic-gold" size={32} />
        <h2 className="font-display text-3xl text-foreground mb-2">Pourquoi je t'aime</h2>
        <p className="text-muted-foreground font-body">
          {reasons.length} raisons et ce n'est que le début 💕
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {reasons.map((reason, i) => {
          const revealed = revealedIds.has(reason.id);
          return (
            <div
              key={reason.id}
              onClick={() => toggleReveal(reason.id)}
              className={`glass-card p-5 cursor-pointer transition-all duration-500 animate-fade-in group relative
                ${revealed ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : 'hover:scale-[1.02] hover:shadow-lg'}
              `}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className={`text-2xl transition-transform duration-500 ${revealed ? 'scale-125' : ''}`}>
                  {reason.emoji}
                </span>
                <div className="flex-1">
                  {revealed ? (
                    <p className="font-body text-foreground leading-relaxed animate-fade-in">
                      {reason.text}
                    </p>
                  ) : (
                    <p className="font-body text-muted-foreground italic">
                      Touche pour découvrir... 💝
                    </p>
                  )}
                </div>
              </div>
              {revealed && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteReason(reason.id); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              )}
              {revealed && (
                <div className="absolute -top-2 -right-2 flex gap-0.5">
                  {['❤️', '✨'].map((e, j) => (
                    <span key={j} className="animate-pulse-heart text-sm" style={{ animationDelay: `${j * 300}ms` }}>{e}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div className="glass-card p-4 animate-fade-in">
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addReason()}
            placeholder="Écris une raison..."
            className="w-full bg-transparent border-b border-border/50 py-2 px-1 text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button onClick={addReason} className="romantic-gradient text-primary-foreground px-4 py-2 rounded-full text-sm hover:scale-105 transition-transform">
              Ajouter 💕
            </button>
            <button onClick={() => setAdding(false)} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mx-auto flex items-center gap-2 romantic-gradient text-primary-foreground px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
        >
          <Plus size={18} /> Ajouter une raison
        </button>
      )}
    </section>
  );
};

export default ReasonsILoveYou;
