// Genera mapping alias -> nombre CLDR normalizado (dataset interno) basado en DISCORD_EMOJIS_LIST.md
// Usa node-emoji para resolver cada alias a un carácter y luego lo mapea al nombre unicode del paquete unicode-emoji-json.
import fs from 'fs';
import path from 'path';
import * as nodeEmoji from 'node-emoji';
import dataGroups from 'unicode-emoji-json/data-by-group.json' assert { type: 'json' };

const mdFile = path.resolve('DISCORD_EMOJIS_LIST.md');
if(!fs.existsSync(mdFile)){
  console.error('No se encontró DISCORD_EMOJIS_LIST.md, se omite generación de alias');
  process.exit(0);
}

// Construir mapa char -> canonicalName (nuestro formato normalizado con underscores)
function normName(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
const charToName = new Map();
for(const group of dataGroups){
  for(const e of group.emojis){
    if(!e?.emoji || !e?.name) continue;
    const baseName = normName(e.name);
    if(!charToName.has(e.emoji)) charToName.set(e.emoji, baseName);
  }
}

// Extraer todos los aliases `:alias:` del markdown
const md = fs.readFileSync(mdFile, 'utf8');
const aliasSet = new Set();
for(const m of md.matchAll(/`:(.+?):`/g)){ aliasSet.add(m[1]); }

// Generar mapping alias -> canonicalName empleando char \n
const mapping = {};
for(const alias of aliasSet){
  const ch = nodeEmoji.get(alias);
  if(!ch || ch === alias) continue; // no resuelto
  // Algunos métodos devuelven múltiples caracteres (VS16 etc); intentamos reducir a un emoji base presente en dataset
  // Intentar matches exactos (cadena completa) y luego primer codepoint si falla.
  let canonical = charToName.get(ch);
  if(!canonical){
    // eliminar variantes VS16
    const stripped = ch.replace(/\uFE0F/g,'');
    canonical = charToName.get(stripped);
  }
  if(!canonical){
    // probar primer codepoint (para secuencias compuestas que no soportamos actualmente)
    const first = Array.from(ch)[0];
    canonical = charToName.get(first);
  }
  if(canonical){
    if(alias !== canonical){
      mapping[alias] = canonical; // sólo registrar cuando difieren para mantener archivo compacto
    }
  }
}

// Mezclar con archivo existente manual si hay (para no perder ajustes manuales) y priorizar manual.
const target = path.resolve('src','data','emoji-aliases.json');
let existing = {};
if(fs.existsSync(target)){
  try { existing = JSON.parse(fs.readFileSync(target,'utf8')); } catch { existing = {}; }
}
const out = { ...mapping, ...existing }; // existing pisa mapping
// Ordenar keys para difs limpios
const sortedKeys = Object.keys(out).sort();
const ordered = {};
for(const k of sortedKeys){ ordered[k]=out[k]; }
fs.writeFileSync(target, JSON.stringify(ordered, null, 2));
console.log('Generado alias file', target, 'total aliases:', sortedKeys.length);
