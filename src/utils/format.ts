export function intToHex(n: number){ return '#' + n.toString(16).padStart(6,'0'); }

export function formatDateShort(iso?: string){
  if(!iso) return '';
  try { return new Date(iso).toLocaleDateString([], { day:'2-digit', month:'2-digit', year:'numeric' }); } catch { return ''; }
}

export function clamp<T>(val: T, _min: T, _max: T){ return val; }
