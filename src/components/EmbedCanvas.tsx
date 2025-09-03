import React, { useLayoutEffect, useRef } from 'react';
import { useEmbedStore } from '../state/embedStore';
import { PropertyPopup } from './PropertyPopup';
import { validateEmbed } from '../utils/validation';
import { FieldList } from './FieldList';
import { EmbedHeaderBlocks } from './embed/EmbedHeaderBlocks';
import { EmbedMediaBlocks } from './embed/EmbedMediaBlocks';
import { EmbedImageBlock } from './embed/EmbedImageBlock';
import { EmbedFooterBlock } from './embed/EmbedFooterBlock';
import { intToHex } from '../utils/format';
import { useOutsideClick } from '../hooks/useOutsideClick';

type PopupType = 'author'|'title'|'footer'|'image'|'thumbnail'|'timestamp'|null;

export const EmbedCanvas: React.FC = () => {
  const embed = useEmbedStore(s => s.embed);
  const update = useEmbedStore(s => s.updateEmbed);
  const [showPicker, setShowPicker] = React.useState(false);
  const colorRef = React.useRef<HTMLDivElement|null>(null);
  useOutsideClick(colorRef, ()=> setShowPicker(false), { enabled: showPicker });
  const [popup, setPopup] = React.useState<PopupType>(null);
  const validation = validateEmbed(embed);
  function exceed(key: string, limit: number){ return key.length>limit; }
  const cardRef = useRef<HTMLDivElement|null>(null);
  const [narrow, setNarrow] = React.useState(false);
  const [clampedHeight, setClampedHeight] = React.useState<number|undefined>(undefined);

  useLayoutEffect(()=>{
    if(!cardRef.current) return;
    const inner = cardRef.current.querySelector('.embed-inner') as HTMLElement | null;
    if(!inner) return;
    // Dejar crecer altura natural => no setear height explícita
    setClampedHeight(undefined);
    // Heurística narrow: sin imagen y sin más de 3 bloques text + total chars corto + <=3 fields inline
    const textLen = (embed.title?.length||0)+(embed.description?.length||0)+(embed.author?.name?.length||0)+(embed.footer?.text?.length||0);
    const fewFields = embed.fields.length<=3 && embed.fields.every(f=>f.inline);
    const fewBlocks = textLen < 280 && !embed.image && !embed.thumbnail && fewFields;
    setNarrow(fewBlocks);
  }, [embed]);

  function remove(part: string){
    switch(part){
      case 'author': update({ author: undefined }); break;
      case 'title': update({ title: undefined }); break;
      case 'description': update({ description: undefined }); break;
      case 'footer': update({ footer: undefined }); break;
      case 'thumbnail': update({ thumbnail: undefined }); break;
      case 'image': update({ image: undefined }); break;
      case 'timestamp': {
        // Si no hay texto en footer, eliminar footer completo también
        if(!embed.footer?.text || embed.footer.text.trim()===''){
          update({ footer: undefined, timestamp: undefined });
        } else {
          update({ timestamp: undefined });
        }
        break;
      }
    }
  }

  const avatarPresets = [ { label: 'Ninguno', value: '' } ]; // (placeholder para futura funcionalidad)
  return (
  <div ref={cardRef} className={"embed-card" + (narrow? ' embed-narrow':'')} aria-label="Vista previa del embed">
      <div className="embed-color-bar" ref={colorRef} onClick={()=>setShowPicker(v=>!v)} style={{background: embed.color? intToHex(embed.color): '#5865f2', position:'relative'}} aria-label="Cambiar color" role="button" tabIndex={0}
        onKeyDown={e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); setShowPicker(v=>!v); } }}>
        {showPicker && (
          <div className="color-pop enhanced" role="dialog" aria-label="Selector de color" onClick={e=>e.stopPropagation()}>
            <div className="color-pop-header">
              <strong>Color del Embed</strong>
              <button className="popup-btn ghost sm" onClick={()=>setShowPicker(false)} aria-label="Cerrar selector">✕</button>
            </div>
            <div className="color-pop-body">
              <div className="color-preview" style={{background:intToHex(embed.color||0x5865f2)}} />
              <input
                aria-label="Elegir color"
                type="color"
                value={intToHex(embed.color || 0x5865f2)}
                onChange={e=>update({ color: parseInt(e.target.value.replace('#',''),16) })}
              />
              <input
                aria-label="Valor hexadecimal"
                className="hex-input"
                value={intToHex(embed.color || 0x5865f2)}
                onChange={e=>{
                  const v = e.target.value.replace(/[^#0-9a-fA-F]/g,'').slice(0,7);
                  if(/^#[0-9a-fA-F]{6}$/.test(v)){ update({ color: parseInt(v.slice(1),16) }); }
                  e.target.value = v;
                }}
              />
              <div className="color-presets" aria-label="Presets">
                {['#5865f2','#2b2d31','#57f287','#fee75c','#ed4245','#eb459e','#00aff4'].map(p => (
                  <button key={p} type="button" className={"preset" + (intToHex(embed.color||0x5865f2)===p? ' active':'')} style={{background:p}} aria-label={`Preset ${p}`} onClick={()=>update({ color: parseInt(p.slice(1),16) })} />
                ))}
              </div>
            </div>
            <div className="color-pop-footer">
              <button className="popup-btn" onClick={()=>setShowPicker(false)}>Hecho</button>
            </div>
          </div>
        )}
      </div>
  <div className={"embed-inner" + (embed.thumbnail? ' has-thumbnail':'')}>
        <div className="embed-layout-row">
          <div className="embed-body">
            <EmbedHeaderBlocks onRemove={remove} onPopup={setPopup} />
            <FieldList />
          </div>
          <EmbedMediaBlocks onRemove={remove} onPopup={setPopup} />
        </div>
  <EmbedImageBlock onRemove={remove} onPopup={setPopup} />
  <EmbedFooterBlock onRemove={remove} onPopup={setPopup} />
      </div>
      {popup && <PropertyPopup type={popup} avatarPresets={avatarPresets} embed={embed} onClose={()=>setPopup(null)} onUpdate={update} />}
    </div>
  );
};

// ImageHint removido en refactor; reintroducir si se requiere feedback de metadatos.
