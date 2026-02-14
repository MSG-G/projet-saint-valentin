import { useState } from 'react';
import { Heart, Lock } from 'lucide-react';
import { getProfileNamePublic, verifyAndUnlock } from '@/utils/storage';

interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen = ({ onUnlock }: LockScreenProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const name = getProfileNamePublic('');

  const handleDigit = (digit: string) => {
    if (code.length >= 4) return;
    const newCode = code + digit;
    setCode(newCode);
    setError(false);

    if (newCode.length === 4) {
      (async () => {
        const ok = await verifyAndUnlock(newCode);
        if (ok) {
          setUnlocking(true);
          setTimeout(onUnlock, 800);
        } else {
          setError(true);
          setTimeout(() => {
            setCode('');
            setError(false);
          }, 600);
        }
      })();
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center romantic-gradient overflow-hidden">
      {/* Floating hearts */}
      {Array.from({ length: 20 }, (_, i) => (
        <span
          key={i}
          className="absolute text-primary-foreground/20 pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            fontSize: `${14 + Math.random() * 24}px`,
            animation: `float-heart ${7 + Math.random() * 8}s ease-in-out ${Math.random() * 10}s infinite`,
          }}
        >
          ❤
        </span>
      ))}
      <div className={`flex flex-col items-center transition-all duration-700 relative z-10 ${unlocking ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`}>
        <Heart
          className={`mb-4 text-primary-foreground ${unlocking ? 'animate-pulse-heart' : ''}`}
          size={56}
          fill="currentColor"
        />
        <h1 className="font-display text-3xl text-primary-foreground mb-2">Notre Amour</h1>
        <p className="text-primary-foreground/80 text-sm mb-2 font-body">
          {name ? `Salut ${name} 💕` : 'Salut mon amour 💕'}
        </p>
        <p className="text-primary-foreground/70 text-xs mb-6 font-body">Créé par Mouhadji</p>
        <p className="text-primary-foreground/80 text-sm mb-8 font-body">Entre le code secret 💕</p>

        {/* Dots */}
        <div className="flex gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 border-primary-foreground/60 transition-all duration-200 ${
                i < code.length
                  ? 'bg-primary-foreground scale-110'
                  : 'bg-transparent'
              } ${error ? 'border-destructive animate-[shake_0.3s_ease-in-out]' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','←'].map((key) => (
            key === '' ? <div key="empty" /> :
            <button
              key={key}
              onClick={() => key === '←' ? handleDelete() : handleDigit(key)}
              className="w-16 h-16 rounded-full bg-primary-foreground/20 text-primary-foreground text-xl font-display
                hover:bg-primary-foreground/30 active:scale-95 transition-all duration-150
                flex items-center justify-center backdrop-blur-sm"
            >
              {key === '←' ? <Lock size={18} /> : key}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-primary-foreground/80 text-sm animate-fade-in">
            Code incorrect, réessaie mon amour 💔
          </p>
        )}
      </div>
    </div>
  );
};

export default LockScreen;
