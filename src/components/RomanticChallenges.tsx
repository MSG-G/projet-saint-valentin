import { useState } from 'react';
import { Trophy, Heart, Check } from 'lucide-react';
import { getChallenges, saveChallenges, Challenge } from '@/utils/storage';

const RomanticChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>(getChallenges);
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const completedCount = challenges.filter((c) => c.done).length;

  const toggleChallenge = (id: string) => {
    const updated = challenges.map((c) => {
      if (c.id !== id) return c;
      const newDone = !c.done;
      if (newDone) {
        setCelebrating(id);
        setTimeout(() => setCelebrating(null), 1500);
      }
      return { ...c, done: newDone };
    });
    setChallenges(updated);
    saveChallenges(updated);
  };

  return (
    <section className="py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <Trophy className="mx-auto mb-2 text-romantic-gold" size={32} />
        <h2 className="font-display text-3xl text-foreground mb-2">Défis Romantiques</h2>
        <p className="text-muted-foreground font-body">Des petits gestes qui font tout 🎁</p>
      </div>

      {/* Progress */}
      <div className="glass-card p-4 mb-6 text-center">
        <p className="font-body text-foreground mb-2">
          <span className="text-primary font-display text-2xl">{completedCount}</span>
          <span className="text-muted-foreground"> / {challenges.length} défis accomplis</span>
        </p>
        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full romantic-gradient rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / challenges.length) * 100}%` }}
          />
        </div>
        {completedCount === challenges.length && challenges.length > 0 && (
          <p className="mt-3 text-primary font-body animate-pulse-heart">
            Félicitations ! Tous les défis sont accomplis ! 🎉💕
          </p>
        )}
      </div>

      {/* Challenges list */}
      <div className="space-y-3">
        {challenges.map((challenge, i) => (
          <div
            key={challenge.id}
            className={`glass-card p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 animate-fade-in
              ${challenge.done ? 'opacity-80' : 'hover:scale-[1.01]'}
              ${celebrating === challenge.id ? 'ring-2 ring-primary shadow-xl' : ''}
            `}
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={() => toggleChallenge(challenge.id)}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              challenge.done ? 'romantic-gradient' : 'border-2 border-border'
            }`}>
              {challenge.done && <Check size={16} className="text-primary-foreground" />}
            </div>
            <p className={`flex-1 font-body transition-all ${
              challenge.done ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {challenge.text}
            </p>
            {celebrating === challenge.id && (
              <div className="flex gap-1">
                {['❤️','✨','💕'].map((e, j) => (
                  <span key={j} className="animate-pulse-heart text-xl" style={{ animationDelay: `${j * 200}ms` }}>{e}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default RomanticChallenges;
