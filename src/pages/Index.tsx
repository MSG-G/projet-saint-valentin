import { useMemo, useState } from 'react';
import { isUnlocked } from '@/utils/storage';
import LockScreen from '@/components/LockScreen';
import LoveCounter from '@/components/LoveCounter';
import Gallery from '@/components/Gallery';
import LoveMessages from '@/components/LoveMessages';
import ImportantDates from '@/components/ImportantDates';
import RomanticChallenges from '@/components/RomanticChallenges';
import ReasonsILoveYou from '@/components/ReasonsILoveYou';
import LoveLetter from '@/components/LoveLetter';
import CoupleQuiz from '@/components/CoupleQuiz';
import Navigation from '@/components/Navigation';
import FloatingHearts from '@/components/FloatingHearts';
import DataTransfer from '@/components/DataTransfer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { getProfileName } from '@/utils/storage';

type Tab = 'home' | 'gallery' | 'messages' | 'dates' | 'challenges' | 'reasons' | 'letter' | 'quiz' | 'transfer';

const Index = () => {
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [tab, setTab] = useState<Tab>('home');
  const [moreOpen, setMoreOpen] = useState(false);

  const navTab: 'home' | 'gallery' | 'messages' =
    tab === 'home' || tab === 'gallery' || tab === 'messages' ? tab : 'home';

  const moreItems = useMemo(
    () => [
      { id: 'dates' as const, label: 'Dates importantes' },
      { id: 'challenges' as const, label: 'Défis romantiques' },
      { id: 'reasons' as const, label: "Pourquoi je t'aime" },
      { id: 'letter' as const, label: "Lettre d'amour" },
      { id: 'quiz' as const, label: 'Quiz' },
      { id: 'transfer' as const, label: 'Partage / Sauvegarde' },
    ],
    [],
  );

  if (!unlocked) {
    return (
      <LockScreen
        onUnlock={() => {
          setUnlocked(true);
          const name = getProfileName('');
          toast({
            title: name ? `Bienvenue ${name} 💕` : 'Bienvenue 💕',
            description: "Content de te revoir.\nOn continue notre histoire ?\n— Mouhadji",
          });
        }}
      />
    );
  }

  const openMore = () => {
    setMoreOpen(true);
  };

  const closeMore = () => {
    setMoreOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <FloatingHearts />
      <div className="relative z-10">
        {tab === 'home' && <LoveCounter onExplore={() => setTab('gallery')} />}
        {tab === 'gallery' && <Gallery />}
        {tab === 'messages' && <LoveMessages />}
        {tab === 'dates' && <ImportantDates />}
        {tab === 'challenges' && <RomanticChallenges />}
        {tab === 'reasons' && <ReasonsILoveYou />}
        {tab === 'letter' && <LoveLetter />}
        {tab === 'quiz' && <CoupleQuiz />}
        {tab === 'transfer' && <DataTransfer />}
      </div>

      <Dialog open={moreOpen} onOpenChange={(open) => (open ? openMore() : closeMore())}>
        <DialogContent className="max-w-2xl w-[95vw] !top-auto !bottom-24 !translate-y-0 overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <div className="space-y-2">
            <h2 className="font-display text-2xl mb-2">Plus</h2>
            {moreItems.map((item) => (
              <button
                key={item.id}
                className="w-full glass-card p-4 text-left hover:scale-[1.01] transition-all duration-200"
                onClick={() => {
                  setTab(item.id);
                  closeMore();
                }}
              >
                <span className="font-body">{item.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Navigation
        active={navTab}
        onChange={(next) => {
          setTab(next);
          closeMore();
        }}
        onOpenMore={openMore}
        moreOpen={moreOpen}
      />
    </div>
  );
};

export default Index;
