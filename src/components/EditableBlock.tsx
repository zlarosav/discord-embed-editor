import React, { useState, useRef, useEffect } from 'react';
import { renderDiscordMarkdown } from '../utils/markdown';

interface Props { value: string | undefined; onChange: (val: string) => void; placeholder?: string; multiline?: boolean; charLimit?: number; linkUrl?: string; disableLinkNavigation?: boolean; suppressLinkStyle?: boolean; }

export const EditableBlock: React.FC<Props> = ({ value, onChange, placeholder, multiline, charLimit, linkUrl, disableLinkNavigation, suppressLinkStyle }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => { if(editing && ref.current) ref.current.focus(); }, [editing]);
  useEffect(() => { setDraft(value || ''); }, [value]);
  useEffect(()=>{ // auto-resize
    if(multiline && editing && ref.current){
      const ta = ref.current as HTMLTextAreaElement;
      ta.style.height = 'auto';
      ta.style.height = Math.min(800, ta.scrollHeight) + 'px';
    }
  }, [draft, editing, multiline]);

  function finish(confirm: boolean) {
    if(confirm) onChange(draft);
    else setDraft(value || '');
    setEditing(false);
  }

  function surround(wrap: string){
    if(!ref.current) return;
    const start = (ref.current as any).selectionStart ?? 0;
    const end = (ref.current as any).selectionEnd ?? 0;
    const before = draft.slice(0,start);
    const selected = draft.slice(start,end);
    const after = draft.slice(end);
    const updated = before + wrap + selected + wrap + after;
    setDraft(updated);
    setTimeout(()=>{ if(ref.current){ (ref.current as any).selectionStart = start+wrap.length; (ref.current as any).selectionEnd = end+wrap.length;} },0);
  }
  function handleKey(e: React.KeyboardEvent) {
    if(e.key==='Escape'){ finish(false); }
    if(multiline && e.key==='Enter' && e.shiftKey){ // newline normal
      return; // permitir salto
    }
    if(!multiline && e.key==='Enter'){ e.preventDefault(); finish(true); }
    if(multiline && e.key==='Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey){ e.preventDefault(); finish(true); }
    if(multiline && e.key==='Enter' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); finish(true); }
    if((e.metaKey||e.ctrlKey) && !e.shiftKey){
  if(e.key.toLowerCase()==='b'){ e.preventDefault(); surround('**'); }
  if(e.key.toLowerCase()==='i'){ e.preventDefault(); surround('*'); }
  if(e.key.toLowerCase()==='u'){ e.preventDefault(); surround('__'); }
  if(e.key.toLowerCase()==='e'){ e.preventDefault(); surround('`'); } // inline code
  if(e.key.toLowerCase()==='s'){ e.preventDefault(); surround('||'); } // spoiler
    }
    // Bloque de código: Ctrl+Shift+C
    if((e.metaKey||e.ctrlKey) && e.shiftKey && e.key.toLowerCase()==='c'){
      e.preventDefault();
      setDraft(d=>`\n\n\
\`\`\`\n${d}\n\`\`\`\n`);
    }
  }

  const remaining = charLimit? (draft.length + '/' + charLimit) : undefined;

  // Guardar automáticamente al hacer clic fuera
  useEffect(()=>{
    if(!editing) return;
    function outside(e: MouseEvent){
      if(wrapperRef.current && !wrapperRef.current.contains(e.target as Node)){
        finish(true);
      }
    }
    document.addEventListener('mousedown', outside);
    return ()=>document.removeEventListener('mousedown', outside);
  }, [editing, draft]);

  if(editing) {
    if(multiline) {
      const longest = draft.split('\n').reduce((m,l)=>Math.max(m,l.length),0);
      const estWidth = Math.min(375, Math.max(120, longest * 7.2 + 24));
      return (
  <div className="editable-wrapper" style={{position:'relative'}} ref={wrapperRef}>
        <textarea className="auto-resize" style={{width: estWidth}} ref={el=>ref.current=el} value={draft} placeholder={placeholder} onChange={e=>setDraft(e.target.value)} onKeyDown={handleKey} />
        {remaining && (
          <div style={{position:'absolute',top:-10,right:0,background:'rgba(0,0,0,.45)',padding:'2px 6px',borderRadius:4,fontSize:11}} aria-hidden="true">
            <span className={'counter ' + (draft.length>(charLimit||Infinity)? 'exceed':'')}>{draft.length}/{charLimit}</span>
          </div>
        )}
      </div>
    ); }
    return (
  <div className="editable-wrapper" style={{position:'relative'}} ref={wrapperRef}>
        <input ref={el=>ref.current=el} value={draft} placeholder={placeholder} onChange={e=>setDraft(e.target.value)} onKeyDown={handleKey} />
        {remaining && (
          <div style={{position:'absolute',top:-10,right:0,background:'rgba(0,0,0,.45)',padding:'2px 6px',borderRadius:4,fontSize:11}} aria-hidden="true">
            <span className={'counter ' + (draft.length>(charLimit||Infinity)? 'exceed':'')}>{draft.length}/{charLimit}</span>
          </div>
        )}
      </div>
    );
  }

  const html = value ? renderDiscordMarkdown(value) : '';
  function handleClick(e: React.MouseEvent){
    const target = e.target as HTMLElement;
    if(target.classList.contains('spoiler')){
      const hidden = target.getAttribute('data-hidden')==='true';
      target.setAttribute('data-hidden', hidden? 'false':'true');
    }
    if(target.classList.contains('mention-remove')){
      e.stopPropagation();
      const span = target.closest('.mention-token');
      if(span){
        const token = span.getAttribute('data-mention') || '';
        if(value){
          const updated = value.replace(token,'');
          onChange(updated.trim());
        }
      }
    }
  }
  const content = value? <div className="editable" dangerouslySetInnerHTML={{__html: html}} /> : <span style={{opacity:.4}}>{placeholder}</span>;
  function handleLinkClick(e: React.MouseEvent){
    if(disableLinkNavigation && !(e.metaKey||e.ctrlKey)){
      e.preventDefault();
    }
  }
  function handleSingle(e: React.MouseEvent){
    // Consumir el clic para que el contenedor no abra popup, pero no entrar en modo edición todavía
    e.stopPropagation();
    handleClick(e);
  }
  return (
    <div className="editable-block" onClick={handleSingle} onDoubleClick={(e)=>{ e.stopPropagation(); if(!editing) setEditing(true); }} tabIndex={0} role="textbox" aria-label={placeholder} style={{cursor:'text'}}>
      {linkUrl && value? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={"block-link" + (suppressLinkStyle? ' no-color':'')} onClick={handleLinkClick}>{content}</a>
      ): content}
    </div>
  );
};
