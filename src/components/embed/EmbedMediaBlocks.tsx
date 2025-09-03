import React from 'react';
import { useEmbedStore, DEFAULT_ICON_URL } from '../../state/embedStore';

interface Props { onRemove: (part: string) => void; onPopup: (type:any)=>void; }
export const EmbedMediaBlocks: React.FC<Props> = ({ onRemove, onPopup }) => {
  const embed = useEmbedStore(s=>s.embed);
  return (
    <>
      {embed.thumbnail && (
        <div className="thumb-block" onClick={(e)=>{ e.stopPropagation(); onPopup('thumbnail'); }} onDoubleClick={(e)=>{ e.stopPropagation(); if(embed.thumbnail?.url){ window.open(embed.thumbnail.url,'_blank'); } }}>
          <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); onRemove('thumbnail'); }}>✕</button>
          <img src={embed.thumbnail.url || DEFAULT_ICON_URL} alt="thumbnail" />
        </div>
      )}
  {/* La imagen principal se renderiza fuera de este contenedor (full width) */}
    </>
  );
};
