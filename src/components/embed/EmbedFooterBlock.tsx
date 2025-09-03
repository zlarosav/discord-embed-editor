import React from 'react';
import { useEmbedStore } from '../../state/embedStore';
import { EditableBlock } from '../EditableBlock';

interface Props { onRemove: (part: string) => void; onPopup: (type:any)=>void; }
export const EmbedFooterBlock: React.FC<Props> = ({ onRemove, onPopup }) => {
  const embed = useEmbedStore(s=>s.embed);
  const update = useEmbedStore(s=>s.updateEmbed);
  if(!(embed.footer || embed.timestamp)) return null;
  return (
    <div className="block-wrapper" style={embed.footer?.text && embed.footer.text.length>2048? {borderColor:'#ff5f56'}: undefined}>
      <button className="block-remove" onClick={(e)=>{ e.stopPropagation();
        if(embed.timestamp && (!embed.footer?.text || embed.footer.text.trim()==='')){ update({ footer: undefined, timestamp: undefined }); }
        else onRemove('footer');
      }}>✕</button>
      <button className="block-remove block-link-edit" style={{right:30}} title="Editar icono" onClick={(e)=>{ e.stopPropagation(); onPopup('footer'); }}>🔗</button>
      <div className="embed-footer">
        {embed.footer?.icon_url && <img src={embed.footer.icon_url} alt="footer icon" />}
        <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:4,minWidth:0}}>
          <div style={{flex: (embed.footer?.text && embed.footer.text.trim().length>10)? '1 1 auto':'0 0 auto', maxWidth:'100%'}}>
            <EditableBlock value={embed.footer?.text} onChange={v=>{
              if(v.trim()==='' && !embed.timestamp){ update({ footer: undefined }); return; }
              update({ footer: { ...(embed.footer||{}), text: v } });
            }} placeholder="Footer" charLimit={2048} editOnSingleClick />
          </div>
          {embed.timestamp && <span onClick={(e)=>{ e.stopPropagation(); onPopup('timestamp'); }} style={{cursor:'pointer'}} title="Editar timestamp">• {new Date(embed.timestamp).toLocaleDateString([], {day:'2-digit', month:'2-digit', year:'numeric'})}</span>}
          {embed.timestamp && <button className="block-remove" style={{position:'static'}} onClick={()=>{
            if(!embed.footer?.text || embed.footer.text.trim()===''){
              update({ footer: undefined, timestamp: undefined });
            } else { update({ timestamp: undefined }); }
          }}>✕</button>}
        </div>
      </div>
    </div>
  );
};
