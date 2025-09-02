import React from 'react';
import hljs from 'highlight.js/lib/core';
import jsonLang from 'highlight.js/lib/languages/json';
hljs.registerLanguage('json', jsonLang);
import { useEmbedStore } from '../state/embedStore';
import { toDiscordPayload } from '../utils/toDiscordPayload';
import { pushHistory } from './HistoryPanel';
import { validateEmbed } from '../utils/validation';

interface Props { onClose: () => void; }

export const ExportModal: React.FC<Props> = ({ onClose }) => {
  const embed = useEmbedStore(s => s.embed);
  const payload = toDiscordPayload(embed);
  function sortKeys(obj: any): any {
    if(Array.isArray(obj)) return obj.map(sortKeys);
    if(obj && typeof obj === 'object') {
      return Object.keys(obj).sort().reduce((acc,k)=>{ acc[k]=sortKeys(obj[k]); return acc; },{} as any);
    }
    return obj;
  }
  const sorted = sortKeys(payload);
  const json = JSON.stringify(sorted, null, 2);
  const valid = validateEmbed(embed).valid;
  function download() {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'embed.json'; a.click();
    URL.revokeObjectURL(url);
    // guardar en historial sólo si válido
    if(valid && sorted.embeds && sorted.embeds[0]){
      pushHistory(sorted.embeds[0]);
    }
  }
  const highlighted = React.useMemo(()=> hljs.highlight(json, { language: 'json' }).value, [json]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Exportar JSON">
        <h2>Exportar JSON</h2>
        {!valid && <div className="error-text">Embed inválido; corrige antes de usar en Discord.</div>}
  <pre className="code-block"><code className="code-inner hljs lang-json" dangerouslySetInnerHTML={{__html: highlighted}} /></pre>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} className="popup-btn ghost">Cerrar</button>
          <button onClick={download} disabled={!valid} className="popup-btn">Descargar</button>
        </div>
      </div>
    </div>
  );
};
