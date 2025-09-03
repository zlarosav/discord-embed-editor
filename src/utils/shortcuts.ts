// Gestión de atajos reutilizable.
export interface ShortcutContext {
  surround: (wrapper: string) => void;
  finalize: () => void;
}

export function handleEditorShortcut(e: React.KeyboardEvent, ctx: ShortcutContext, opts: { multiline?: boolean }){
  const { multiline } = opts;
  if(e.key==='Escape'){ e.preventDefault(); ctx.finalize(); return; }
  if(multiline && e.key==='Enter' && e.shiftKey){ return; }
  if(!multiline && e.key==='Enter'){ e.preventDefault(); ctx.finalize(); }
  if(multiline && e.key==='Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey){ e.preventDefault(); ctx.finalize(); }
  if(multiline && e.key==='Enter' && (e.metaKey || e.ctrlKey)){ e.preventDefault(); ctx.finalize(); }
  if((e.metaKey||e.ctrlKey) && !e.shiftKey){
    const k = e.key.toLowerCase();
    if(k==='b'){ e.preventDefault(); ctx.surround('**'); }
    if(k==='i'){ e.preventDefault(); ctx.surround('*'); }
    if(k==='u'){ e.preventDefault(); ctx.surround('__'); }
    if(k==='e'){ e.preventDefault(); ctx.surround('`'); }
    if(k==='s'){ e.preventDefault(); ctx.surround('||'); }
  }
  if((e.metaKey||e.ctrlKey) && e.shiftKey && e.key.toLowerCase()==='c'){
    e.preventDefault();
    // Insertamos bloque de código completo sustituyendo el draft (gestión se hace en EditableBlock)
    ctx.surround('```\n'); // EditableBlock adaptará caso especial – este es placeholder semántico
  }
}
