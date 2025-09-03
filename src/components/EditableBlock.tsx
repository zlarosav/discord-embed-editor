import React, { useState, useRef, useEffect } from 'react';
import { renderDiscordMarkdown, enhanceEmojiImages } from '../utils/markdown';
import { EmojiPicker } from './EmojiPicker';

interface Props { value: string | undefined; onChange: (val: string) => void; placeholder?: string; multiline?: boolean; charLimit?: number; linkUrl?: string; disableLinkNavigation?: boolean; suppressLinkStyle?: boolean; editOnSingleClick?: boolean; showEmojiButton?: boolean; }

export const EditableBlock: React.FC<Props> = ({ value, onChange, placeholder, multiline, charLimit, linkUrl, disableLinkNavigation, suppressLinkStyle, editOnSingleClick, showEmojiButton }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement|null>(null);
  const blockRef = useRef<HTMLDivElement|null>(null);

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

  // Cuando se cierra la edición, mantener el flag un breve tiempo para evitar que el clic que cierra abra popup
  useEffect(()=>{
    if(!editOnSingleClick) return;
    if(!editing && blockRef.current && blockRef.current.getAttribute('data-just-activated')==='true'){
      const t = setTimeout(()=>{ blockRef.current && blockRef.current.removeAttribute('data-just-activated'); }, 450);
      return ()=>clearTimeout(t);
    }
  }, [editing, editOnSingleClick]);

  const [showEmoji,setShowEmoji] = useState(false);
  function insertAtCursor(text: string){
    if(!ref.current){
      setDraft(d=>d+text);
      return;
    }
    const el = ref.current as any;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    setDraft(d=>{
      const next = d.slice(0,start)+text+d.slice(end);
      return next;
    });
    // Recolocar cursor justo después del texto insertado
    setTimeout(()=>{
      if(ref.current){
        const pos = start + text.length;
        (ref.current as any).selectionStart = pos;
        (ref.current as any).selectionEnd = pos;
        (ref.current as any).focus();
      }
    },0);
  }

  // Hooks para modo visual (no edición) deben declararse antes de retornos condicionales
  const renderedRef = useRef<HTMLDivElement|null>(null);
  const html = value ? renderDiscordMarkdown(value, { disableEmojis: !showEmojiButton }) : '';
  useEffect(()=>{
    if(!editing && renderedRef.current){
  // Eliminar flags previos para re-procesar (por si quedaron spans sin imagen tras edición)
  renderedRef.current.querySelectorAll('span.d-emoji').forEach(s=>s.removeAttribute('data-img-ready'));
  enhanceEmojiImages(renderedRef.current);
    }
  }, [html, editing]);

  if(editing) {
  if(multiline) {
      return (
  <div className="editable-wrapper" style={{position:'relative', width:'100%'}} ref={wrapperRef}>
        <div style={{position:'relative',display:'flex',alignItems:'flex-start',gap:6,width:'100%'}}>
          <textarea className="auto-resize" style={{flex:1,minWidth:260}} ref={el=>ref.current=el} value={draft} placeholder={placeholder} onChange={e=>setDraft(e.target.value)} onKeyDown={handleKey} />
          {showEmojiButton && (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <button ref={wrapperRef as any} type="button" aria-label="Insertar emoji" style={{background:'#313338',border:'1px solid #3a3c42',borderRadius:6,fontSize:14,padding:'4px 6px',cursor:'pointer'}} onClick={()=>setShowEmoji(s=>!s)}>😊</button>
              {showEmoji && (
                <EmojiPicker anchorRef={wrapperRef as any} onClose={()=>setShowEmoji(false)} onSelect={(sc)=>{ insertAtCursor(sc); }} />
              )}
            </div>
          )}
        </div>
        {remaining && (
          <div style={{position:'absolute',top:-10,right:0,background:'rgba(0,0,0,.45)',padding:'2px 6px',borderRadius:4,fontSize:11}} aria-hidden="true">
            <span className={'counter ' + (draft.length>(charLimit||Infinity)? 'exceed':'')}>{draft.length}/{charLimit}</span>
          </div>
        )}
      </div>
    ); }
    return (
  <div className="editable-wrapper" style={{position:'relative', width:'100%'}} ref={wrapperRef}>
        <div style={{display:'flex',alignItems:'center',gap:6,width:'100%'}}>
          <input style={{flex:1,minWidth:120}} ref={el=>ref.current=el} value={draft} placeholder={placeholder} onChange={e=>setDraft(e.target.value)} onKeyDown={handleKey} />
          {showEmojiButton && (
            <>
              <button ref={wrapperRef as any} type="button" aria-label="Insertar emoji" style={{background:'#313338',border:'1px solid #3a3c42',borderRadius:6,fontSize:14,padding:'4px 6px',cursor:'pointer'}} onClick={()=>setShowEmoji(s=>!s)}>😊</button>
              {showEmoji && (
                <EmojiPicker anchorRef={wrapperRef as any} onClose={()=>setShowEmoji(false)} onSelect={(sc)=>{ insertAtCursor(sc); }} />
              )}
            </>
          )}
        </div>
        {remaining && (
          <div style={{position:'absolute',top:-10,right:0,background:'rgba(0,0,0,.45)',padding:'2px 6px',borderRadius:4,fontSize:11}} aria-hidden="true">
            <span className={'counter ' + (draft.length>(charLimit||Infinity)? 'exceed':'')}>{draft.length}/{charLimit}</span>
          </div>
        )}
      </div>
    );
  }

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
  const content = value? <div ref={renderedRef} className="editable" dangerouslySetInnerHTML={{__html: html}} /> : <span style={{opacity:.4}}>{placeholder}</span>;
  function handleLinkClick(e: React.MouseEvent){
    if(disableLinkNavigation && !(e.metaKey||e.ctrlKey)){
      e.preventDefault();
    }
  }
  function handleSingle(e: React.MouseEvent){
    handleClick(e);
    if(editOnSingleClick && !editing){
      e.stopPropagation();
      setEditing(true);
      const el = (e.currentTarget as HTMLElement);
      el.setAttribute('data-just-activated','true');
      // Removemos después de que la edición se cierre (ver effect abajo)
    }
  }
  return (
  <div ref={blockRef} className="editable-block" data-editing={editing? 'true': 'false'} onClick={handleSingle} onDoubleClick={(e)=>{ if(editOnSingleClick){ /* dejar burbujear para popup */ return; } e.stopPropagation(); if(!editing) setEditing(true); }} tabIndex={0} role="textbox" aria-label={placeholder} style={{cursor:'text'}}>
      {linkUrl && value? (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={"block-link" + (suppressLinkStyle? ' no-color':'')} onClick={handleLinkClick}>{content}</a>
      ): content}
    </div>
  );
};
