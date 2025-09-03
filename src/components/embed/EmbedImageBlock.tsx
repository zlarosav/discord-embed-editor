import React from 'react';
import { useEmbedStore, DEFAULT_IMAGE_URL } from '../../state/embedStore';

interface Props { onRemove: (part: string) => void; onPopup: (type:any)=>void; }
export const EmbedImageBlock: React.FC<Props> = ({ onRemove, onPopup }) => {
  const embed = useEmbedStore(s=>s.embed);
  if(!embed.image) return null;
  return (
    <div className="block-wrapper embed-image image-holder" role="group" aria-label="Imagen" onClick={()=>onPopup('image')} onDoubleClick={(e)=>{ e.stopPropagation(); if(embed.image?.url){ window.open(embed.image.url,'_blank'); } }}>
      <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); onRemove('image'); }}>✕</button>
      <img src={embed.image.url || DEFAULT_IMAGE_URL} alt="image" />
    </div>
  );
};
