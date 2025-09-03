import { useEffect } from 'react';

interface Options { enabled?: boolean; include?: Array<React.RefObject<HTMLElement>>; onEscape?: boolean; }

// Hook reutilizable para detectar click fuera y ESC.
export function useOutsideClick(ref: React.RefObject<HTMLElement|null>, handler: (e: MouseEvent | KeyboardEvent) => void, opts: Options = {}){
  const { enabled = true, include = [], onEscape = true } = opts;
  useEffect(()=>{
    if(!enabled) return;
    function out(e: MouseEvent){
      const el = ref.current; if(!el) return;
      const target = e.target as Node;
      if(el.contains(target)) return; // dentro principal
      for(const extra of include){ if(extra.current && extra.current.contains(target)) return; }
      handler(e);
    }
    function esc(e: KeyboardEvent){ if(onEscape && e.key==='Escape'){ handler(e); } }
    document.addEventListener('mousedown', out);
    document.addEventListener('keydown', esc);
    return ()=>{ document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc); };
  }, [enabled, handler, include, onEscape, ref]);
}
