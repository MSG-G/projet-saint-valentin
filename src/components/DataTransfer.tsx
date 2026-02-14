import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportBundle, getProfileName, importBundle, saveProfileName } from '@/utils/storage';

const downloadTextFile = (filename: string, text: string) => {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const DataTransfer = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [name, setName] = useState(() => getProfileName(''));

  const doExport = async () => {
    setBusy('export');
    setStatus(null);
    try {
      const json = await exportBundle();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(`notre-amour-backup-${stamp}.json`, json);
      setStatus('Export terminé.');
    } catch (e) {
      setStatus(`Export échoué: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const doImport = async (file: File) => {
    setBusy('import');
    setStatus(null);
    try {
      const text = await file.text();
      await importBundle(text);
      setStatus('Import terminé. Recharge la page puis déverrouille avec le code.');
    } catch (e) {
      setStatus(`Import échoué: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="py-8 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-8 animate-fade-in">
        <h2 className="font-display text-3xl text-foreground mb-2">Partage / Sauvegarde</h2>
        <p className="text-muted-foreground font-body">
          Exporte un fichier chiffré pour le transférer sur un autre appareil, ou importe un fichier existant.
        </p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-body text-muted-foreground">Prénom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveProfileName(name)}
            placeholder="Ex: Sarah"
            className="w-full p-3 rounded-xl bg-background border border-border text-foreground font-body focus:ring-2 focus:ring-primary/30 focus:outline-none"
          />
        </div>

        <button
          onClick={doExport}
          disabled={busy !== null}
          className="w-full flex items-center justify-center gap-2 romantic-gradient text-primary-foreground px-6 py-3 rounded-full hover:scale-[1.01] transition-all duration-200 shadow-md disabled:opacity-60"
        >
          <Download size={18} /> Exporter
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          aria-label="Importer une sauvegarde"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = '';
          }}
        />

        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-full hover:bg-secondary/80 transition-all duration-200 shadow disabled:opacity-60"
        >
          <Upload size={18} /> Importer
        </button>

        {status && <p className="text-sm text-muted-foreground font-body text-center">{status}</p>}
      </div>
    </section>
  );
};

export default DataTransfer;
