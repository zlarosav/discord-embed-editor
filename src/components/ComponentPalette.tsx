import React from 'react';
import { useEmbedStore } from '../state/embedStore';

interface PaletteProps { onAdd: (type: string) => void; }

const blocks = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'field', label: 'Field' },
  { key: 'author', label: 'Author' },
  { key: 'footer', label: 'Footer' },
  { key: 'thumbnail', label: 'Thumbnail' },
  { key: 'image', label: 'Image' },
  { key: 'timestamp', label: 'Timestamp' }
];

export const ComponentPalette: React.FC<PaletteProps> = ({ onAdd }) => {
  const fieldCount = useEmbedStore(s => s.embed.fields.length);
  return (
    <div>
      <h3>Paleta</h3>
      <p style={{fontSize:12, color:'#aaa'}}>Arrastra el componente al embed.</p>
      <div className="palette-group">
        {blocks.map(b => {
          const isField = b.key==='field';
          const label = isField? `Field (${fieldCount}/25)` : b.label;
          return (
            <div key={b.key} className={"palette-item" + (isField && fieldCount>=25? ' disabled':'')} draggable={!(isField && fieldCount>=25)} onDragStart={e=>{
              if(isField && fieldCount>=25) { e.preventDefault(); return; }
              e.dataTransfer.setData('text/embed-block', b.key);
            }} role="button" tabIndex={0} aria-label={`Arrastrar ${b.label}`}>{label}{isField && fieldCount>=25 && <span style={{fontSize:10,marginLeft:6,opacity:.7}}>(máx)</span>}</div>
          );
        })}
      </div>
    </div>
  );
};
