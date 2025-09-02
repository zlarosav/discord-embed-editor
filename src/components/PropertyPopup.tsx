import React, { useEffect, useRef } from 'react';
import { EmbedData } from '../state/embedStore';

interface Props {
  type: 'author'|'title'|'footer'|'image'|'thumbnail'|'timestamp';
  embed: EmbedData;
  avatarPresets: { label: string; value: string }[];
  onUpdate: (patch: Partial<EmbedData>) => void;
  onClose: () => void;
}

export const PropertyPopup: React.FC<Props> = ({ type, embed, onUpdate, onClose, avatarPresets }) => {
  const ref = useRef<HTMLDivElement|null>(null);
  const [closing,setClosing] = React.useState(false);
  function requestClose(){
    if(closing) return;
    setClosing(true);
    setTimeout(()=>onClose(),150); // coincide con animación popupOut
  }
  useEffect(()=>{
    function handler(e: MouseEvent){
      if(ref.current && !ref.current.contains(e.target as Node)) requestClose();
    }
    window.addEventListener('mousedown', handler);
    function keyHandler(e: KeyboardEvent){
      if(e.key==='Escape') requestClose();
      if(e.key==='Tab' && ref.current){
        const focusables = ref.current.querySelectorAll<HTMLElement>('button, [href], input');
        if(focusables.length){
          const first = focusables[0];
            const last = focusables[focusables.length-1];
            if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
            else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
        }
      }
    }
    window.addEventListener('keydown', keyHandler);
    // focus primer input
    setTimeout(()=>{ if(ref.current){ const inp = ref.current.querySelector<HTMLElement>('input,button'); inp?.focus(); } },0);
    return ()=>window.removeEventListener('mousedown', handler);
  },[onClose]);

  let title = '';
  let body: React.ReactNode = null;

  if(type==='title'){
    title = 'Título';
    body = (
      <div className="popup-grid">
        <label>URL
          <input value={embed.url||''} onChange={e=>onUpdate({ url: e.target.value||undefined })} placeholder="https://..." />
        </label>
      </div>
    );
  }
  if(type==='author'){
    title = 'Author';
    body = (
      <div className="popup-grid">
        <label>URL (enlace)
          <input value={embed.author?.url||''} onChange={e=>onUpdate({ author: { ...(embed.author||{}), url: e.target.value||undefined } })} placeholder="https://..." />
        </label>
        <label>Icon URL
          <input value={embed.author?.icon_url||''} onChange={e=>onUpdate({ author: { ...(embed.author||{}), icon_url: e.target.value||undefined } })} placeholder="https://..." />
        </label>
      </div>
    );
  }
  if(type==='footer'){
    title = 'Footer';
    body = (
      <div className="popup-grid">
        <label>Icon URL
          <input value={embed.footer?.icon_url||''} onChange={e=>onUpdate({ footer: { ...(embed.footer||{}), icon_url: e.target.value||undefined } })} placeholder="https://..." />
        </label>
      </div>
    );
  }
  if(type==='image'){
    title = 'Image';
    body = (
      <div className="popup-grid">
        <label>URL
          <input value={embed.image?.url||''} onChange={e=>onUpdate({ image: { url: e.target.value } })} placeholder="https://..." />
        </label>
      </div>
    );
  }
  if(type==='thumbnail'){
    title = 'Thumbnail';
    body = (
      <div className="popup-grid">
        <label>URL
          <input value={embed.thumbnail?.url||''} onChange={e=>onUpdate({ thumbnail: { url: e.target.value } })} placeholder="https://..." />
        </label>
      </div>
    );
  }
  if(type==='timestamp'){
    title = 'Timestamp';
    const iso = embed.timestamp || new Date().toISOString();
    // Estado local para evitar commits en cada tecla y sólo aplicar cuando el valor es válido completo
    const [localValue, setLocalValue] = React.useState<string>(() => iso.slice(0,16)); // YYYY-MM-DDTHH:MM
    useEffect(()=>{
      // Si cambia desde fuera (ej: botón Ahora o Quitar) sincronizar
      if(embed.timestamp){
        const next = embed.timestamp.slice(0,16);
        setLocalValue(next);
      } else {
        setLocalValue('');
      }
    },[embed.timestamp]);
    function commitIfValid(v: string){
      if(!v){ onUpdate({ timestamp: undefined }); return; }
      // Validar formato mínimo completo
      if(v.length===16){
        const dt = new Date(v);
        if(!isNaN(dt.getTime())){
          onUpdate({ timestamp: dt.toISOString() });
        }
      }
    }
    body = (
      <div className="popup-grid">
        <label>Fecha y hora
          <input type="datetime-local" value={localValue} onChange={e=>{ setLocalValue(e.target.value); }} onBlur={()=>commitIfValid(localValue)} />
        </label>
        <div style={{display:'flex',gap:8}}>
          <button type="button" className="popup-btn" onClick={()=>{ const now = new Date().toISOString(); onUpdate({ timestamp: now }); }}>Ahora</button>
          {embed.timestamp && <button type="button" className="popup-btn danger" onClick={()=>{ onUpdate({ timestamp: undefined }); }}>Quitar</button>}
        </div>
      </div>
    );
  }

  return (
    <>
  <div className="popup-backdrop" />
  <div className={"property-popup" + (closing? ' popup-exit':'')} ref={ref} role="dialog" aria-modal="true" aria-label={title}>
      <div className="property-popup-header">
        <strong>{title}</strong>
  <button onClick={requestClose} aria-label="Cerrar" className="popup-btn ghost">✕</button>
      </div>
      <div className="property-popup-body">{body}</div>
      {type!== 'timestamp' && (
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className="popup-btn" onClick={requestClose}>Guardar</button>
        </div>
      )}
    </div>
    </>
  );
};
