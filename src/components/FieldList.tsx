import React from 'react';
import clsx from 'clsx';
import { useEmbedStore } from '../state/embedStore';
import { EditableBlock } from './EditableBlock';

const FieldItem: React.FC<{ id: string; name: string; value: string; inline: boolean; onUpdate: typeof useEmbedStore.getState extends any ? (id:string, patch:any)=>void : any; onRemove:(id:string)=>void; }> = React.memo(({ id, name, value, inline, onUpdate, onRemove }) => {
  return (
    <div className={clsx('field-block', { inline })}>
      <div className="field-actions-overlay">
        <button className="mini-btn" title="Eliminar" onClick={(e)=>{ e.stopPropagation(); onRemove(id); }}>✕</button>
        <button className={clsx('mini-btn', inline && 'active')} title="Inline" onClick={(e)=>{ e.stopPropagation(); onUpdate(id,{ inline: !inline }); }}>/</button>
      </div>
      <div className="field-inner">
        <div className="field-head">
          <EditableBlock value={name} onChange={v=>onUpdate(id,{ name: v })} placeholder="Field title" charLimit={256} showEmojiButton />
        </div>
        <div className="field-value">
          <EditableBlock value={value} onChange={v=>onUpdate(id,{ value: v })} placeholder="Field value" multiline charLimit={1024} showEmojiButton />
        </div>
      </div>
    </div>
  );
});

export const FieldList: React.FC = () => {
  const fields = useEmbedStore(s => s.embed.fields);
  const updateField = useEmbedStore(s => s.updateField);
  const removeField = useEmbedStore(s => s.removeField);
  const anyInline = fields.some(f=>f.inline);

  return (
    <div className={"fields-grid " + (anyInline? 'inline-true':'') }>
  {fields.map(f => <FieldItem key={f.id} id={f.id} name={f.name} value={f.value} inline={f.inline} onUpdate={updateField as any} onRemove={removeField} />)}
    </div>
  );
};
