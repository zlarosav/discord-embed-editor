import React, { useState } from 'react';
import clsx from 'clsx';
import { useEmbedStore, EmbedField } from '../state/embedStore';
import { EditableBlock } from './EditableBlock';

export const FieldList: React.FC = () => {
  const { fields } = useEmbedStore(s => s.embed);
  const updateField = useEmbedStore(s => s.updateField);
  const removeField = useEmbedStore(s => s.removeField);
  const reorder = useEmbedStore(s => s.reorderField);
  const anyInline = fields.some(f=>f.inline);
  const [dragId, setDragId] = useState<string|null>(null);

  function onDragStart(id: string){ setDragId(id); }
  function onDragOver(e: React.DragEvent, overId: string){
    if(!dragId || dragId===overId) return;
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }
  function onDragLeave(e: React.DragEvent){ e.currentTarget.classList.remove('drag-over'); }
  function onDrop(e: React.DragEvent, overId: string){
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if(!dragId || dragId===overId) return;
    const fromIdx = fields.findIndex(f=>f.id===dragId);
    const toIdx = fields.findIndex(f=>f.id===overId);
    if(fromIdx===-1 || toIdx===-1) return;
    const dir = fromIdx > toIdx ? 'up':'down';
    // simple: mover paso a paso
    let currentIdx = fromIdx;
    while(currentIdx !== toIdx){
      reorder(fields[currentIdx].id, dir as any);
      currentIdx += dir==='up'? -1: 1;
    }
  }

  return (
    <div className={"fields-grid " + (anyInline? 'inline-true':'') }>
      {fields.map(f => (
                <div key={f.id} className={clsx('field-block', { inline: f.inline })}>
                  <div className="field-actions-overlay">
                    <button className="mini-btn" title="Eliminar" onClick={(e)=>{ e.stopPropagation(); removeField(f.id); }}>✕</button>
                    <button className={clsx('mini-btn', f.inline && 'active')} title="Inline" onClick={(e)=>{ e.stopPropagation(); updateField(f.id,{ inline: !f.inline }); }}>/</button>
                    
                  </div>
                  <div className="field-inner">
                    <div className="field-head">
                      <EditableBlock value={f.name} onChange={v=>updateField(f.id,{ name: v })} placeholder="Field title" charLimit={256} showEmojiButton />
                    </div>
                    <div className="field-value">
                      <EditableBlock value={f.value} onChange={v=>updateField(f.id,{ value: v })} placeholder="Field value" multiline charLimit={1024} showEmojiButton />
                    </div>
                  </div>
                </div>
      ))}
    </div>
  );
};
