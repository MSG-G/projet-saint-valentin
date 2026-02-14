import { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { getImportantDates, saveImportantDates, ImportantDate } from '@/utils/storage';

const ImportantDates = () => {
  const [dates, setDates] = useState<ImportantDate[]>(getImportantDates);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newEmoji, setNewEmoji] = useState('❤️');

  const getDaysFromNow = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.ceil((target - now) / 86400000);
  };

  const handleAdd = () => {
    if (!newLabel.trim() || !newDate) return;
    const entry: ImportantDate = { id: Date.now().toString(), label: newLabel.trim(), date: newDate, emoji: newEmoji };
    const updated = [...dates, entry];
    setDates(updated);
    saveImportantDates(updated);
    setNewLabel(''); setNewDate(''); setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    const updated = dates.filter((d) => d.id !== id);
    setDates(updated);
    saveImportantDates(updated);
  };

  return (
    <section className="py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <Calendar className="mx-auto mb-2 text-primary" size={32} />
        <h2 className="font-display text-3xl text-foreground mb-2">Dates Importantes</h2>
        <p className="text-muted-foreground font-body">Les moments gravés dans nos cœurs 🗓️</p>
      </div>

      <button
        onClick={() => setShowAdd(!showAdd)}
        className="mx-auto mb-6 flex items-center gap-2 romantic-gradient text-primary-foreground px-6 py-3 rounded-full
          hover:scale-105 active:scale-95 transition-all duration-200 shadow-md font-body"
      >
        <Plus size={18} /> Ajouter une date
      </button>

      {showAdd && (
        <div className="glass-card p-5 mb-6 animate-scale-in">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Nom de l'événement..."
            className="w-full p-3 rounded-xl bg-background border border-border text-foreground font-body mb-3 focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 p-3 rounded-xl bg-background border border-border text-foreground font-body focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
            <select
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="p-3 rounded-xl bg-background border border-border text-foreground text-xl focus:ring-2 focus:ring-primary/30 focus:outline-none"
            >
              {['❤️','💕','💋','🌹','💍','🎂','✨','🥂'].map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <button onClick={handleAdd} className="mt-3 w-full py-2 rounded-full romantic-gradient text-primary-foreground font-body hover:scale-[1.02] transition-all">
            Ajouter 💕
          </button>
        </div>
      )}

      <div className="space-y-3">
        {dates
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((d, i) => {
            const diff = getDaysFromNow(d.date);
            return (
              <div
                key={d.id}
                className="glass-card p-4 flex items-center gap-4 animate-fade-in group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-3xl">{d.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-display text-lg text-foreground">{d.label}</h3>
                  <p className="text-sm text-muted-foreground font-body">
                    {new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`font-display text-xl ${diff > 0 ? 'text-primary' : 'text-romantic-gold'}`}>
                    {diff === 0 ? "Aujourd'hui !" : diff > 0 ? `J-${diff}` : `il y a ${Math.abs(diff)}j`}
                  </span>
                </div>
                <button onClick={() => handleDelete(d.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
      </div>
    </section>
  );
};

export default ImportantDates;
