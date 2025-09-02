import React from 'react';
import { useEmbedStore } from '../state/embedStore';

export interface SavedEmbedItem {
  id: string;
  savedAt: string; // ISO
  embed: any; // exported embed payload (single embed object)
}

const HISTORY_KEY = 'embed_download_history';

function loadHistory(): SavedEmbedItem[] {
  try { const raw = localStorage.getItem(HISTORY_KEY); if(!raw) return []; return JSON.parse(raw); } catch { return []; }
}
function saveHistory(items: SavedEmbedItem[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0,10))); } catch {}
}

export function pushHistory(embed: any){
  const items = loadHistory();
  const item: SavedEmbedItem = { id: crypto.randomUUID? crypto.randomUUID(): Math.random().toString(36).slice(2), savedAt: new Date().toISOString(), embed };
  const newItems = [item, ...items].slice(0,10);
  saveHistory(newItems);
  // Notificar a listeners que el historial cambió
  window.dispatchEvent(new CustomEvent('embed-history-updated'));
}

export const HistoryPanel: React.FC = () => {
  const importJSON = useEmbedStore(s => s.importJSON);
  const current = useEmbedStore(s => s.embed);
  const [items, setItems] = React.useState<SavedEmbedItem[]>(() => loadHistory());

  function handleLoad(it: SavedEmbedItem) {
    // Guardar embed actual antes de reemplazar
    if(current) pushHistory(current);
    importJSON({ embeds: [it.embed] });
    setItems(loadHistory());
  }
  function handleClear() { saveHistory([]); setItems([]); }
  React.useEffect(() => {
    function refresh(){ setItems(loadHistory()); }
    function onStorage(e: StorageEvent) { if (e.key === HISTORY_KEY) refresh(); }
    window.addEventListener('storage', onStorage);
    window.addEventListener('embed-history-updated', refresh as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('embed-history-updated', refresh as EventListener);
    };
  }, []);
  return (
    <aside className="history-panel" aria-label="Historial de descargas de embed">
      <div className="history-header">
        <h3 style={{margin:0,fontSize:14}}>Historial</h3>
        {items.length > 0 && <button className="clear-btn" onClick={handleClear} title="Vaciar historial">Vaciar</button>}
      </div>
      {items.length === 0 && <div className="history-empty">No hay descargas aún</div>}
      <ul className="history-list">
        {items.map(it => {
          const title = it.embed.title || 'Sin título';
          const descRaw: string = it.embed.description || '';
          const desc = descRaw.length > 200 ? descRaw.slice(0,200)+'…' : descRaw;
          const d = new Date(it.savedAt);
          const fecha = d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'2-digit'}) + ' ' + d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
          const fieldCount = (it.embed.fields?.length)||0;
          const color = it.embed.color ? '#' + (it.embed.color as number).toString(16).padStart(6,'0') : '#5865f2';
          return (
            <li key={it.id} className="history-item">
              <button className="history-load history-card" onClick={() => handleLoad(it)} title="Cargar este embed nuevamente">
                <div className="hist-row">
                  <span className="hist-title" aria-label="Título">{title}</span>
                  <span className="hist-date" aria-label="Fecha">{fecha}</span>
                </div>
                {desc && <div className="hist-desc" aria-label="Descripción previsualizada">{desc}</div>}
                <div className="hist-meta" aria-label="Metadatos" style={{display:'flex',justifyContent:'flex-start',gap:8,fontSize:10,opacity:.8,marginTop:4}}>
                  <span>{fieldCount} field{fieldCount!==1?'s':''}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};