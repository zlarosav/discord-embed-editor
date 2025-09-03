import React from 'react';
import { useEmbedStore } from '../../state/embedStore';
import { EditableBlock } from '../EditableBlock';

interface Props { onRemove: (part: string) => void; onPopup: (type: any)=>void; }
export const EmbedHeaderBlocks: React.FC<Props> = ({ onRemove, onPopup }) => {
  const embed = useEmbedStore(s=>s.embed);
  const update = useEmbedStore(s=>s.updateEmbed);
  return (
    <>
      {embed.author && (
        <div className="block-wrapper" style={embed.author?.name && embed.author.name.length>256? {borderColor:'#ff5f56'}: undefined}>
          <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); onRemove('author'); }}>✕</button>
          <button className="block-remove block-link-edit" style={{right:30}} title="Editar enlace/icono" onClick={(e)=>{ e.stopPropagation(); onPopup('author'); }}>🔗</button>
          <div className="embed-author">
            {embed.author.icon_url && <img src={embed.author.icon_url} alt="author" />}
            <EditableBlock value={embed.author?.name} linkUrl={embed.author?.url} onChange={v=>update({ author: { ...(embed.author||{}), name: v } })} placeholder="Author name" charLimit={256} disableLinkNavigation suppressLinkStyle editOnSingleClick />
          </div>
        </div>
      )}
      {embed.title !== undefined && (
        <div className="block-wrapper" style={embed.title && embed.title.length>256? {borderColor:'#ff5f56'}: undefined}>
          <button className="block-remove" onClick={(e)=>{ e.stopPropagation(); onRemove('title'); }}>✕</button>
          <button className="block-remove block-link-edit" style={{right:30}} title="Editar enlace" onClick={(e)=>{ e.stopPropagation(); onPopup('title'); }}>🔗</button>
          <div className="embed-title">
            <EditableBlock value={embed.title} linkUrl={embed.url} onChange={v=>update({ title: v })} placeholder="Title" charLimit={256} disableLinkNavigation editOnSingleClick showEmojiButton />
          </div>
        </div>
      )}
      {embed.description !== undefined && (
        <div className="block-wrapper desc-block" style={embed.description && embed.description.length>4096? {borderColor:'#ff5f56'}: undefined}>
          <button className="block-remove" onClick={()=>onRemove('description')}>✕</button>
          <div className="embed-description">
            <EditableBlock value={embed.description} onChange={v=>update({ description: v })} placeholder="Description" multiline charLimit={4096} showEmojiButton />
          </div>
        </div>
      )}
    </>
  );
};
