// Pequeña utilidad para validar que un JSON coincide con el formato exportado
// { embeds: [ { ...embedObject } ] }
// No valida límites de longitud; sólo estructura básica.

export interface RawExportPayload { embeds: any[] }

const ALLOWED_EMBED_KEYS = new Set([
  'title','description','url','timestamp','color',
  'footer','author','thumbnail','image','fields'
]);

export function isExportPayload(data: any): data is RawExportPayload {
  if(!data || typeof data !== 'object') return false;
  if(!Array.isArray((data as any).embeds)) return false;
  if(!(data as any).embeds.length) return false;
  const first = (data as any).embeds[0];
  if(!first || typeof first !== 'object') return false;
  // Claves desconocidas => inválido (toleramos que existan solo las permitidas)
  for(const k of Object.keys(first)) {
    if(!ALLOWED_EMBED_KEYS.has(k)) return false;
  }
  // Si tiene fields debe ser array de objetos con name/value
  if(first.fields) {
    if(!Array.isArray(first.fields)) return false;
    for(const f of first.fields) {
      if(!f || typeof f !== 'object') return false;
      if(typeof f.name !== 'string' || typeof f.value !== 'string') return false;
      if('inline' in f && typeof f.inline !== 'boolean') return false;
    }
  }
  return true;
}

export function explainInvalid(data: any): string | null {
  if(!data || typeof data !== 'object') return 'Raíz no es un objeto';
  if(!Array.isArray(data.embeds)) return 'Falta array embeds';
  if(!data.embeds.length) return 'Array embeds vacío';
  const first = data.embeds[0];
  if(!first || typeof first !== 'object') return 'Primer embed inválido';
  for(const k of Object.keys(first)) {
    if(!ALLOWED_EMBED_KEYS.has(k)) return 'Clave no permitida: '+k;
  }
  if(first.fields) {
    if(!Array.isArray(first.fields)) return 'fields no es un array';
    for(const f of first.fields) {
      if(!f || typeof f !== 'object') return 'Field inválido';
      if(typeof f.name !== 'string' || typeof f.value !== 'string') return 'Field sin name/value string';
      if('inline' in f && typeof f.inline !== 'boolean') return 'inline debe ser boolean';
    }
  }
  return null;
}
