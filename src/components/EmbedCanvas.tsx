import React, { useLayoutEffect, useRef } from 'react';
import { useEmbedStore, DEFAULT_ICON_URL, DEFAULT_IMAGE_URL } from '../state/embedStore';
import { PropertyPopup } from './PropertyPopup';
import { validateEmbed } from '../utils/validation';
import { EditableBlock } from './EditableBlock';
import { FieldList } from './FieldList';

type PopupType = 'author'|'title'|'footer'|'image'|'thumbnail'|'timestamp'|null;

export const EmbedCanvas: React.FC = () => {
  const embed = useEmbedStore(s => s.embed);
  const update = useEmbedStore(s => s.updateEmbed);
  const [showPicker, setShowPicker] = React.useState(false);
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
      case 'timestamp': update({ timestamp: undefined }); break;
    }
  }

  const avatarPresets = [ { label: 'Ninguno', value: '' } ];
  const [authorIconPicker, setAuthorIconPicker] = React.useState(false);
  const [footerIconPicker, setFooterIconPicker] = React.useState(false);
  return (
  <div ref={cardRef} className={"embed-card" + (narrow? ' embed-narrow':'')} aria-label="Vista previa del embed">
      <div className="embed-color-bar" onClick={()=>setShowPicker(v=>!v)} style={{background: embed.color? intToHex(embed.color): '#5865f2', position:'relative'}} aria-label="Cambiar color">
        {showPicker && <div className="color-pop" onClick={e=>e.stopPropagation()}>
          <input type="color" value={intToHex(embed.color || 0x5865f2)} onChange={e=>update({ color: parseInt(e.target.value.replace('#',''),16) })} />
          <button onClick={()=>setShowPicker(false)}>Cerrar</button>
        </div>}
      </div>
  <div className={"embed-inner" + (embed.thumbnail? ' has-thumbnail':'')}>
        <div className="embed-layout-row">
          <div className="embed-body">
            {embed.author && (
              <div className="block-wrapper" style={embed.author?.name && embed.author.name.length>256? {borderColor:'#ff5f56'}: undefined} onClick={(e)=>{ if((e.target as HTMLElement).closest('.editable')) return; setPopup('author'); }}>
                <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); remove('author'); }}>✕</button>
                <div className="embed-author">
                  {embed.author.icon_url && <img src={embed.author.icon_url} alt="author" />}
                  <EditableBlock value={embed.author?.name} linkUrl={embed.author?.url} onChange={v=>update({ author: { ...(embed.author||{}), name: v } })} placeholder="Author name" charLimit={256} />
                </div>
              </div>
            )}
            {embed.title !== undefined && (
              <div className="block-wrapper" style={embed.title && embed.title.length>256? {borderColor:'#ff5f56'}: undefined} onClick={()=>setPopup('title')}>
                <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); remove('title'); }}>✕</button>
                <div className="embed-title">
                  <EditableBlock value={embed.title} linkUrl={embed.url} onChange={v=>update({ title: v })} placeholder="Title" charLimit={256} />
                </div>
              </div>
            )}
            {embed.description !== undefined && (
              <div className="block-wrapper desc-block" style={embed.description && embed.description.length>4096? {borderColor:'#ff5f56'}: undefined}>
                <button className="block-remove" onClick={()=>remove('description')}>✕</button>
                <div className="embed-description">
                  <EditableBlock value={embed.description} onChange={v=>update({ description: v })} placeholder="Description" multiline charLimit={4096} />
                </div>
              </div>
            )}
            <FieldList />
          </div>
          {embed.thumbnail && (
            <div className="thumb-block" onClick={(e)=>{ e.stopPropagation(); setPopup('thumbnail'); }} onDoubleClick={(e)=>{ e.stopPropagation(); if(embed.thumbnail?.url){ window.open(embed.thumbnail.url,'_blank'); } }}>
              <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); remove('thumbnail'); }}>✕</button>
              <img src={embed.thumbnail.url || DEFAULT_ICON_URL} alt="thumbnail" />
            </div>
          )}
        </div>
        {/* Bloques de ancho completo por debajo de la fila con thumbnail */}
        {embed.image && (
          <div className="block-wrapper embed-image image-holder" role="group" aria-label="Imagen" onClick={()=>setPopup('image')} onDoubleClick={(e)=>{ e.stopPropagation(); if(embed.image?.url){ window.open(embed.image.url,'_blank'); } }}>
            <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); remove('image'); }}>✕</button>
            <img src={embed.image.url || DEFAULT_IMAGE_URL} alt="image" />
            {embed.image.url && <ImageHint id="image-hint" url={embed.image.url} />}
          </div>
        )}
        {embed.footer && (
          <div className="block-wrapper" style={embed.footer?.text && embed.footer.text.length>2048? {borderColor:'#ff5f56'}: undefined} onClick={(e)=>{ if((e.target as HTMLElement).closest('.editable')) return; setPopup('footer'); }}>
            <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); remove('footer'); }}>✕</button>
            <div className="embed-footer">
              {embed.footer.icon_url && <img src={embed.footer.icon_url} alt="footer icon" />}
              <EditableBlock value={embed.footer?.text} onChange={v=>update({ footer: { ...(embed.footer||{}), text: v } })} placeholder="Footer" charLimit={2048} />
              {embed.timestamp && <span onClick={(e)=>{ e.stopPropagation(); setPopup('timestamp'); }} style={{cursor:'pointer'}} title="Editar timestamp">• {new Date(embed.timestamp).toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'numeric'})}</span>}
              {embed.timestamp && <button className="block-remove" style={{position:'static'}} onClick={()=>remove('timestamp')}>✕</button>}
            </div>
          </div>
        )}
      </div>
      {popup && <PropertyPopup type={popup} avatarPresets={avatarPresets} embed={embed} onClose={()=>setPopup(null)} onUpdate={update} />}
    </div>
  );
};

function intToHex(n: number){ return '#' + n.toString(16).padStart(6,'0'); }

interface ImageHintProps { id: string; url: string; small?: boolean; }
const MAX_HINT_LENGTH = 120; // evitar mensajes largos
const sizeRegex = /(\b|_)(\d{2,4})x(\d{2,4})(\b|_)/i;
const querySizeRegex = /[?&](width|height|size)=([0-9]{2,4})/i;
const weightRegex = /(\d+(?:\.\d+)?)(kb|mb)/i;
const ImageHint: React.FC<ImageHintProps> = ({ id, url, small }) => {
  const lower = url.toLowerCase();
  let notes: string[] = [];
  if(sizeRegex.test(lower) || querySizeRegex.test(lower)) notes.push('Dimensiones incluidas');
  if(weightRegex.test(lower)) notes.push('Tamaño estimado indicado');
  const text = notes.join(' · ');
  if(!text) return null;
  return <div id={id} style={{fontSize:small?9:10,color:'#bbb',marginTop:4}}>{text.slice(0,MAX_HINT_LENGTH)}</div>;
};
