import { useState, useEffect, useRef } from 'react';
import { PenLine, Edit3, Save } from 'lucide-react';
import { getLetter, saveLetter } from '@/utils/storage';

const DEFAULT_LETTER = `Mon amour,

Si tu lis ces mots, c'est que je voulais que tu saches à quel point tu comptes pour moi.

Chaque matin, quand je pense à toi, mon cœur se remplit de joie. Tu es la personne qui donne un sens à mes journées, celle qui transforme les moments ordinaires en souvenirs extraordinaires.

Je me souviens de notre première rencontre, de ce moment où tout a changé. Depuis ce jour, tu as coloré ma vie de la plus belle des façons.

Je t'aime pour ta douceur, pour ta force, pour ta façon unique de voir le monde. Je t'aime pour les petites choses : ton rire, tes regards, tes mots doux murmurés.

Ce site est un petit morceau de mon cœur que je t'offre. Chaque page est une preuve de mon amour pour toi.

Je t'aime, aujourd'hui et pour toujours.

Ton amour,
Mouhadji ❤️`;

const LoveLetter = () => {
  const [letter, setLetter] = useState(() => getLetter(DEFAULT_LETTER));
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(letter);
  const indexRef = useRef(0);

  useEffect(() => {
    if (editing) return;
    setDisplayed('');
    indexRef.current = 0;
    setTyping(true);

    const interval = setInterval(() => {
      if (indexRef.current < letter.length) {
        setDisplayed(letter.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setTyping(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [letter, editing]);

  const handleSave = () => {
    setLetter(editText);
    saveLetter(editText);
    setEditing(false);
  };

  const skipTyping = () => {
    setDisplayed(letter);
    setTyping(false);
    indexRef.current = letter.length;
  };

  return (
    <section className="py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <PenLine className="mx-auto mb-2 text-primary" size={32} />
        <h2 className="font-display text-3xl text-foreground mb-2">Ma Lettre d'Amour</h2>
        <p className="text-muted-foreground font-body">Écrite avec tout mon cœur 💌</p>
      </div>

      {editing ? (
        <div className="glass-card p-6 animate-fade-in">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={16}
            className="w-full bg-transparent text-foreground font-body leading-relaxed resize-none focus:outline-none"
            autoFocus
          />
          <div className="flex gap-3 mt-4 justify-center">
            <button onClick={handleSave} className="flex items-center gap-2 romantic-gradient text-primary-foreground px-6 py-2 rounded-full hover:scale-105 transition-transform">
              <Save size={16} /> Sauvegarder
            </button>
            <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 relative">
          {/* Paper texture effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-romantic-cream/30 to-transparent rounded-2xl pointer-events-none" />

          <div className="relative z-10">
            <pre className="font-body text-foreground leading-relaxed whitespace-pre-wrap text-base md:text-lg">
              {displayed}
              {typing && <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-0.5 align-text-bottom" />}
            </pre>

            {typing && (
              <button
                onClick={skipTyping}
                className="mt-4 text-muted-foreground text-sm hover:text-foreground transition-colors font-body"
              >
                Voir tout le texte →
              </button>
            )}
          </div>

          {!typing && (
            <div className="mt-6 text-center animate-fade-in">
              <div className="flex justify-center gap-2 mb-4">
                {['❤️', '💕', '✨', '💌', '🌹'].map((e, i) => (
                  <span key={i} className="text-xl animate-pulse-heart" style={{ animationDelay: `${i * 200}ms` }}>{e}</span>
                ))}
              </div>
              <button
                onClick={() => { setEditText(letter); setEditing(true); }}
                className="flex items-center gap-2 mx-auto text-muted-foreground hover:text-primary transition-colors font-body text-sm"
              >
                <Edit3 size={14} /> Modifier la lettre
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default LoveLetter;
