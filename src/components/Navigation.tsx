import { Heart, Camera, Mail, Home, MoreHorizontal } from 'lucide-react';

type Tab = 'home' | 'gallery' | 'messages';

interface NavigationProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  onOpenMore: () => void;
  moreOpen: boolean;
}

const tabs: { id: Tab; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Accueil' },
  { id: 'gallery', icon: Camera, label: 'Photos' },
  { id: 'messages', icon: Mail, label: 'Messages' },
];

const Navigation = ({ active, onChange, onOpenMore, moreOpen }: NavigationProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border">
      <div className="max-w-2xl mx-auto flex py-2 px-2 gap-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 ${
              active === id
                ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon size={18} fill={active === id ? 'currentColor' : 'none'} />
            <span className="text-[9px] font-body whitespace-nowrap">{label}</span>
          </button>
        ))}

        <button
          onClick={onOpenMore}
          className={`flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 ${
            moreOpen
              ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          aria-label="Plus"
        >
          <MoreHorizontal size={18} fill={moreOpen ? 'currentColor' : 'none'} />
          <span className="text-[9px] font-body whitespace-nowrap">Plus</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
