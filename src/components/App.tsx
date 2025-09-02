import React from 'react';
import { useEmbedStore, EmbedStoreState } from '../state/embedStore';
import { ComponentPalette } from './ComponentPalette';
import { EmbedCanvas } from './EmbedCanvas';
import { CharacterMeter } from './CharacterMeter';
import { HistoryPanel, pushHistory } from './HistoryPanel';
import { ExportModal } from './ExportModal';
import { validateEmbed } from '../utils/validation';
import { toDiscordPayload } from '../utils/toDiscordPayload';

export const App: React.FC = () => {
  const embed = useEmbedStore((s: EmbedStoreState)=>s.embed);
  const update = useEmbedStore((s: EmbedStoreState)=>s.updateEmbed);
  const reset = useEmbedStore((s: EmbedStoreState)=>s.reset);
  const importJSON = useEmbedStore((s: EmbedStoreState)=>s.importJSON);
  const exportJSON = useEmbedStore((s: EmbedStoreState)=>s.exportJSON);
  const [showExport, setShowExport] = React.useState(false);
  const validation = validateEmbed(embed);
  const [theme,setTheme] = React.useState<'dark'|'light'>(()=> (localStorage.getItem('app_theme') as 'dark'|'light') || 'dark');

  React.useEffect(()=>{
    document.body.classList.toggle('light', theme==='light');
    localStorage.setItem('app_theme', theme);
  },[theme]);

  function handleAdd(type: string){
    if(type==='color') return; // se maneja con picker
    if(type==='timestamp') update({ timestamp: new Date().toISOString() });
    if(type==='field') useEmbedStore.getState().addField();
    if(type==='thumbnail' && !embed.thumbnail) update({ thumbnail: { url: '' } });
    if(type==='image' && !embed.image) update({ image: { url: '' } });
    if(type==='author' && !embed.author) update({ author: { name: '' } });
    if(type==='footer' && !embed.footer) update({ footer: { text: '' } });
    if(type==='title' && !embed.title) update({ title: '' });
    if(type==='description' && !embed.description) update({ description: '' });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]; if(!file) return;
    file.text().then(t => { try{ 
      // Guardar embed actual antes de reemplazar
      if(embed) pushHistory(embed);
      importJSON(JSON.parse(t)); 
    } catch{ alert('JSON inválido'); } });
  }

  return (
  <div className="layout" onDragOver={e=>{ if(e.dataTransfer.types.includes('text/embed-block')) e.preventDefault(); }} onDrop={e=>{
      const type = e.dataTransfer.getData('text/embed-block');
      if(!type) return;
      handleAdd(type); // Drop en el espacio general (fuera del canvas)
    }}>
      <aside className="sidebar" aria-label="Paleta de componentes">
        <h1 style={{fontSize:18}}>Discord Embed Editor</h1>
  <ComponentPalette onAdd={handleAdd} />
        <CharacterMeter />
        <div className="actions-bar">
          <button onClick={()=>setShowExport(true)} disabled={!validation.valid} className="primary-btn">Guardar</button>
          <label className="primary-btn file-btn" style={{cursor:'pointer'}}>
            Cargar
            <input type="file" accept="application/json" style={{display:'none'}} onChange={handleImport} />
          </label>
          <button className="primary-btn secondary" onClick={()=>{ if(confirm('¿Desea borrar los cambios? No se podrán recuperar.')) reset(); }}>Reiniciar</button>
        </div>
      </aside>
      <div className="sidebar-footer" style={{position:'fixed',bottom:8,left:16,right:16,display:'flex',justifyContent:'space-between',alignItems:'flex-end',width:268}}>
        <a href="https://github.com/zlarosav/discord-embed-editor" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,textDecoration:'none',color:'var(--gh-color,#ccc)',background:'var(--gh-bg,#313338)',padding:'4px 8px',borderRadius:6,border:'1px solid #3a3c42',fontSize:12}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.39 7.86 10.92.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.29-1.68-1.29-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.04 1.78 2.72 1.26 3.39.96.11-.75.41-1.26.74-1.55-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.07 11.07 0 0 1 2.9-.39c.99 0 1.99.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.09 0 4.44-2.69 5.41-5.25 5.7.42.36.79 1.07.79 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.68.8.56A10.51 10.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>
          GitHub
        </a>
        <button className="theme-toggle-btn" onClick={()=>setTheme(t=> t==='dark'?'light':'dark')} aria-label="Alternar tema">
          {theme==='dark'? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13a1 1 0 0 0-1.05-.14 8.05 8.05 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8.59 8.59 0 0 1 .25-2A1 1 0 0 0 8.4 2.36 10.14 10.14 0 1 0 22 14.6a1 1 0 0 0-.36-1.6Z"/></svg>
              <span style={{fontSize:11}}>Claro</span>
            </>
          ):(
            <>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84 5.35 3.43 3.93 4.85l1.41 1.41 1.42-1.42ZM4 13H2v-2h2v2Zm10-9.06h-2v2h2v-2Zm7.07.91-1.41-1.42-1.42 1.42 1.42 1.41 1.41-1.41ZM17.24 18.16l1.41 1.41 1.42-1.41-1.42-1.42-1.41 1.42ZM20 13v-2h2v2h-2ZM12 18.07h-2v2h2v-2ZM7 12a5 5 0 1 1 5 5 5 5 0 0 1-5-5Z"/></svg>
              <span style={{fontSize:11}}>Oscuro</span>
            </>
          )}
        </button>
      </div>
      <main className="canvas-wrapper" aria-label="Canvas" onDragOver={e=>{ if(e.dataTransfer.types.includes('text/embed-block')) e.preventDefault(); }} onDrop={e=>{ e.stopPropagation(); const type = e.dataTransfer.getData('text/embed-block'); if(type) handleAdd(type); }}>
        <EmbedCanvas />
      </main>
      <HistoryPanel />
      {showExport && <ExportModal onClose={()=>setShowExport(false)} />}
    </div>
  );
};
