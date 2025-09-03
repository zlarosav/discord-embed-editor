import { useState, useEffect, useRef } from 'react';

// Hook simple para sincronizar estado con localStorage (gracia a serialización JSON)
export function usePersistentState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const loadedRef = useRef(false);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if(raw != null) return JSON.parse(raw);
    } catch {}
    return initial;
  });
  useEffect(()=>{
    if(!loadedRef.current){ loadedRef.current = true; return; }
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}
