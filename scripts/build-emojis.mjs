// Genera dataset unificado desde discord_emojis.json (archivo actualizado con categorías y listas de nombres por emoji)
// Salida: src/data/emojis-full.json con forma { categories: [ { key, label, emojis: [ { name, char, names:[] } ] } ] }
// Donde 'name' es el alias primario (primer elemento en names) y 'names' incluye todos los shortcodes aceptados.
import fs from 'fs';
import path from 'path';

const source = path.resolve('discord_emojis.json');
if(!fs.existsSync(source)){
  console.error('No se encontró discord_emojis.json');
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(source,'utf8'));

function labelFor(key){
  return key.replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
}

const categories = [];
for(const [key, arr] of Object.entries(raw)){
  if(!Array.isArray(arr)) continue;
  const cat = { key: key, label: labelFor(key), emojis: [] }; 
  for(const entry of arr){
    if(!entry?.surrogates || !entry?.names?.length) continue;
    const primary = entry.names[0];
    if(cat.emojis.some(e=>e.char===entry.surrogates)) continue; // evitar duplicado base
    const hasDiv = !!entry.hasDiversity && Array.isArray(entry.diversityChildren);
    const toCodepoints = (str)=>[...str].map(ch=>ch.codePointAt(0).toString(16)).join('-');
    let diversity;
    if(hasDiv){
      diversity = entry.diversityChildren.map((child)=>{
        // Detectar tono real mirando cualquiera de los nombres *_toneX
        let tone = 0;
        if(Array.isArray(child.names)){
          for(const n of child.names){
            const m = n.match(/_tone([1-5])\b/);
            if(m){ tone = parseInt(m[1],10); break; }
          }
        }
        if(!tone) tone = 0; // fallback (aunque debería existir)
        return {
          tone,
          char: child.surrogates,
          names: child.names,
          codepoints: toCodepoints(child.surrogates)
        };
      }).filter(v=>v.tone>0);
    }
    const allNames = [...entry.names, ...(diversity? diversity.flatMap(d=> d.names || []): [])];
    cat.emojis.push({ name: primary, char: entry.surrogates, names: entry.names, codepoints: toCodepoints(entry.surrogates), hasDiversity: hasDiv, diversity, allNames });
  }
  categories.push(cat);
}

const out = { categories };
const target = path.resolve('src','data','emojis-full.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2));
console.log('Generated', target, 'categories:', categories.length, 'emojis total (primary count):', categories.reduce((a,c)=>a+c.emojis.length,0));
