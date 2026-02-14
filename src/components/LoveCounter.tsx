import { useEffect, useState } from 'react';
import { Heart, Calendar } from 'lucide-react';
import { getRelationshipDate } from '@/utils/storage';
import heroImage from '@/assets/hero-romantic.jpg';

const LoveCounter = ({ onExplore }: { onExplore: () => void }) => {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const start = new Date(getRelationshipDate()).getTime();
      const diff = Date.now() - start;
      setDays(Math.floor(diff / 86400000));
      setHours(Math.floor((diff % 86400000) / 3600000));
      setMinutes(Math.floor((diff % 3600000) / 60000));
      setSeconds(Math.floor((diff % 60000) / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Hero background */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Notre amour" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-background" />
      </div>

      <div className="relative z-10 text-center max-w-lg animate-fade-in">
        <Heart className="mx-auto mb-4 text-primary animate-pulse-heart" size={48} fill="currentColor" />
        <h1 className="font-display text-4xl md:text-5xl text-primary-foreground mb-3 drop-shadow-lg">
          Notre Amour
        </h1>
        <p className="text-primary-foreground/90 text-lg mb-8 font-body drop-shadow">
          Chaque jour avec toi est un cadeau 💕
        </p>

        <p className="text-primary-foreground/80 text-sm mb-6 font-body drop-shadow">
          Créé par Mouhadji
        </p>

        {/* Counter */}
        <div className="glass-card p-6 mb-8 inline-block">
          <p className="text-sm text-muted-foreground mb-3 flex items-center justify-center gap-2">
            <Calendar size={14} /> Ensemble depuis
          </p>
          <div className="flex gap-4 justify-center">
            {[
              { val: days, label: 'jours' },
              { val: hours, label: 'heures' },
              { val: minutes, label: 'min' },
              { val: seconds, label: 'sec' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <span className="block text-3xl md:text-4xl font-display text-primary">
                  {item.val}
                </span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={onExplore}
            className="romantic-gradient text-primary-foreground px-8 py-3 rounded-full font-body text-lg
              hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
          >
            Découvrir nos souvenirs ✨
          </button>
        </div>
      </div>
    </section>
  );
};

export default LoveCounter;
