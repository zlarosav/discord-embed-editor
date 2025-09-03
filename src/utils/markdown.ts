import { marked } from 'marked';
import hljs from 'highlight.js';
import twemoji from '@twemoji/api';
// Carga diferida del dataset completo para reducir el bundle inicial.
// Se importa dinámicamente sólo al primer render que requiera emojis.
let emojiLoadPromise: Promise<any> | null = null;
let emojiDataCache: any = null;
async function ensureEmojiData(){
  if(emojiDataCache) return emojiDataCache;
  if(!emojiLoadPromise){
    emojiLoadPromise = import('../data/emojis-full.json')
      .then(m=>{ emojiDataCache = m.default; return emojiDataCache; })
      .catch(e=>{ console.warn('[emoji] fallo al cargar dataset', e); return null; });
  }
  return emojiLoadPromise;
}

// Configuración extendida para estilo Discord.
marked.setOptions({ breaks: true, gfm: true });
// Renderer custom para bloques de código estilo Discord (sin botón copy) y extensión underline
const renderer = new marked.Renderer();
const langMap: Record<string,string> = {
  js:'javascript', jsx:'javascript', mjs:'javascript', cjs:'javascript',
  ts:'typescript', tsx:'typescript',
  py:'python', rb:'ruby', rs:'rust', cs:'csharp', csharp:'csharp',
  sh:'bash', zsh:'bash', bash:'bash', ps:'powershell', ps1:'powershell',
  html:'xml', xml:'xml', yml:'yaml', yaml:'yaml', md:'markdown', json:'json',
  c:'c', h:'c', cpp:'cpp', cxx:'cpp', hpp:'cpp', php:'php', go:'go', java:'java', kt:'kotlin', kotlin:'kotlin', swift:'swift'
};
renderer.code = (code, infoString) => {
  const raw = (infoString||'').trim();
  const key = raw.split(/\s+/)[0].toLowerCase();
  const mapped = langMap[key] || key;
  let highlighted = code;
  let used = '';
  if(mapped && hljs.getLanguage(mapped)){
    try { highlighted = hljs.highlight(code, { language: mapped }).value; used = mapped; } catch { used=''; }
  } else {
    try { const auto = hljs.highlightAuto(code); highlighted = auto.value; used = auto.language||''; } catch { used=''; }
  }
  const cls = 'code-inner hljs' + (used? ' lang-'+used:'');
  return `<pre class="code-block"><code class="${cls}">${highlighted}</code></pre>`;
};
// Extensión para subrayado estilo Discord: __texto__ -> <u>texto</u>
// Debe ejecutarse antes que la regla built-in de strong para capturar los dobles underscores.
const underlineExtension = {
  name: 'underline',
  level: 'inline' as const,
  start(src: string) {
    return src.indexOf('__');
  },
  tokenizer(this: any, src: string) {
    // Evitar capturar triple o más underscores al inicio (se delega a otros tokens / literal)
    const rule = /^__([^_\n][\s\S]*?[^_\n])__|(?!^)^__(?!__)__$/; // primera alternativa captura contenido
    // Simpler custom rule: __...__ no greedy, permitir espacios y formato interno
    const match = /^__([\s\S]+?)__(?!_)/.exec(src);
    if (match) {
      // Evitar procesar si el contenido está vacío o sólo espacios
      if(match[1].trim().length===0) return undefined;
      return {
        type: 'underline',
        raw: match[0],
        text: match[1],
        tokens: this.lexer.inlineTokens(match[1], [])
      };
    }
    return undefined;
  },
  renderer(this: any, token: any) {
    const inner = this.parser.parseInline(token.tokens);
    return `<u>${inner}</u>`;
  }
};

marked.use({ renderer, extensions: [underlineExtension] });

// Construir alias a partir del dataset (cada emoji tiene names[] donde el primero es primario)
interface FullCat { emojis: { name:string; char:string; names?:string[]; hasDiversity?:boolean; diversity?: { tone:number; char:string; names?:string[] }[] }[] }
// Estructuras perezosas (se rellenan una sola vez)
const EMOJI_PRIMARY: Record<string,string> = {}; // alias -> primary
const EMOJI_CHAR: Record<string,string> = {}; // primary/alias -> char
export const EMOJI_ALIAS_MAP = EMOJI_PRIMARY;
export const EMOJI_ALIAS_INVERSE: Record<string,string> = {};
let emojiInit = false;
let emojiLoadScheduled = false;
const EMOJI_DATASET_FLAG = 'emojiDatasetLoaded';
const hadLoadedBefore = typeof window !== 'undefined' && (()=>{ try { return !!localStorage.getItem(EMOJI_DATASET_FLAG); } catch { return false; } })();

// Conjunto mínimo embebido (frecuentes + usados en tests) para respuesta inmediata sin inflar bundle.
// Formato: [primary, char, aliases[]]
const PRELOAD: Array<[string,string,string[]?]> = [
  ['green_circle','🟢',['greencircle']],
  ['heart','❤️',['red_heart','love']],
  ['smile','😄',['smiley','happy']],
  ['innocent','😇',['halo']]
];
for(const [primary,char,aliases] of PRELOAD){
  if(!EMOJI_CHAR[primary]) EMOJI_CHAR[primary] = char;
  EMOJI_PRIMARY[primary] = primary;
  for(const al of (aliases||[])){
    EMOJI_PRIMARY[al] = primary;
    if(!EMOJI_CHAR[al]) EMOJI_CHAR[al] = char;
  }
  if(!EMOJI_ALIAS_INVERSE[primary]) EMOJI_ALIAS_INVERSE[primary] = primary;
}
async function initEmojiMaps(){
  if(emojiInit) return;
  let data: any = null;
  try { if(performance?.mark) performance.mark('emoji-dataset-load-start'); } catch {}
  data = await ensureEmojiData();
  try { if(performance?.mark){ performance.mark('emoji-dataset-load-end'); performance.measure('emoji-dataset-load','emoji-dataset-load-start','emoji-dataset-load-end'); } } catch {}
  if(!data) { emojiInit = true; return; }
  try {
    const cats = data.categories as FullCat[];
    for(const c of cats){
      for(const e of c.emojis){
        if(!EMOJI_CHAR[e.name]) EMOJI_CHAR[e.name] = e.char;
        const list = e.names && e.names.length ? e.names : [e.name];
        const primary = list[0];
        for(const alias of list){ EMOJI_PRIMARY[alias] = primary; }
        if(e.hasDiversity && Array.isArray(e.diversity)){
          for(const v of e.diversity){
            if(!v?.char) continue;
            const vNames = v.names || [];
            for(const vn of vNames){
              EMOJI_PRIMARY[vn] = primary;
              if(!EMOJI_CHAR[vn]) EMOJI_CHAR[vn] = v.char;
            }
          }
        }
      }
    }
    for(const [alias, primary] of Object.entries(EMOJI_PRIMARY)){
      if(!EMOJI_ALIAS_INVERSE[primary]) EMOJI_ALIAS_INVERSE[primary] = primary;
    }
  } catch(e){ console.warn('[emoji] init error', e); }
  emojiInit = true;
  // Persistir bandera para próximas sesiones
  try { if(typeof localStorage !== 'undefined') localStorage.setItem(EMOJI_DATASET_FLAG,'1'); } catch {}
}

function scheduleFullEmojiLoad(){
  if(emojiInit || emojiLoadScheduled) return;
  emojiLoadScheduled = true;
  const runner = ()=>{ initEmojiMaps(); };
  // Si ya se cargó en una sesión previa, priorizar carga temprana.
  if(hadLoadedBefore){
    setTimeout(runner,0);
    return;
  }
  if(typeof (globalThis as any).requestIdleCallback === 'function'){
    (globalThis as any).requestIdleCallback(runner, { timeout: 2000 });
  } else {
    setTimeout(runner, 50);
  }
}

export function renderDiscordMarkdown(raw: string, opts?: { disableEmojis?: boolean }): string {
  // Recortar sólo líneas completamente vacías al inicio y final para evitar padding extra
  const trimmedRaw = raw.replace(/^[\n\r]+|[\n\r]+$/g,'');
  // Construir diccionario de nombre -> char (dataset completo generado en build)
  const manualEmoji: Record<string,string> = EMOJI_CHAR; // primary o alias->char
  function resolvePrimary(name:string){ return EMOJI_PRIMARY[name] || (manualEmoji[name]? name : undefined); }
  // Si aún no inicializamos, disparar (sin await) la carga para futuras llamadas.
  if(!emojiInit && !opts?.disableEmojis){ scheduleFullEmojiLoad(); }
  // Parser de emojis con retroceso y dos pasadas
  let withEmojis: string = trimmedRaw;
  if(!opts?.disableEmojis){
    const src = trimmedRaw;
    let acc = '';
    let i = 0;
    while(i < src.length){
      if(src[i] !== ':'){ acc += src[i++]; continue; }
      const positions: number[] = [];
      for(let j=i+1;j<src.length && positions.length<25;j++) if(src[j] === ':') positions.push(j);
      if(!positions.length){ acc += ':'; i++; continue; }
      let matched = false;
      let firstClose = positions[0];
      for(const end of positions){
        const candidate = src.slice(i+1,end);
        if(/^[a-z0-9_+-]{2,}$/i.test(candidate)){
          const key = candidate.toLowerCase();
          const primary = resolvePrimary(key);
          if(primary){
            const chosen = manualEmoji[key] || manualEmoji[primary];
            if(chosen){
              acc += `<span class=\"d-emoji\" data-name=\"${primary}\">${chosen}</span>`;
              i = end + 1;
              matched = true;
              break;
            }
          }
        }
      }
      if(!matched){
        // Lookahead: intentar emoji válido inmediatamente después del token inválido
        // Intentar solapamiento: el ':' de cierre podría ser inicio de siguiente emoji válido
        let after = src.slice(firstClose); // incluye ':' de cierre previo
        let overlapped = true; // asumimos intento solapado
        let m2 = /^:([a-z0-9_+-]{2,}):/i.exec(after);
        if(!m2){
          // No había solapamiento real; avanzar uno y volver a intentar
            after = src.slice(firstClose+1);
            overlapped = false;
            m2 = /^:([a-z0-9_+-]{2,}):/i.exec(after);
        }
        if(m2){
          const key2 = m2[1].toLowerCase();
          const primary2 = resolvePrimary(key2);
            if(primary2){
              const chosen2 = manualEmoji[key2] || manualEmoji[primary2];
              if(chosen2){
                acc += src.slice(i, firstClose+1); // token inválido intacto (incluye ':')
                acc += `<span class=\"d-emoji\" data-name=\"${primary2}\">${chosen2}</span>`;
                // Si hubo solapamiento (after inicia en firstClose) consumimos todo el match excepto el ':' inicial ya emitido.
                i = firstClose + (overlapped ? m2[0].length : 1 + m2[0].length);
                continue;
              }
            }
        }
        acc += src.slice(i, firstClose+1);
        i = firstClose + 1;
      }
    }
    withEmojis = acc.replace(/:([a-z0-9_+-]{2,}):/gi, (m,name)=>{
      const key = name.toLowerCase();
      const primary = resolvePrimary(key);
      if(primary){
        const chosen = manualEmoji[key] || manualEmoji[primary];
        if(chosen) return `<span class=\"d-emoji\" data-name=\"${primary}\">${chosen}</span>`;
      }
      return m;
    });
  }
  const lines = withEmojis.split(/\n/);
  const out: string[] = [];
  let inCode = false;
  let inQuoteRun = false;
  for(let i=0;i<lines.length;i++){
    const rawLine = lines[i];
    let line = rawLine; // mutable
    if(/^```/.test(line.trim())) inCode = !inCode;
    const isQuote = /^>\s?/.test(line);
    const isBlank = line.trim()==='';
    if(isQuote){
      if(!inQuoteRun){ out.push('@@BQ_OPEN@@'); inQuoteRun = true; }
      // remover prefijo '> '
      line = line.replace(/^>\s?/, '');
      if(line.trim()===''){ line='\u200b'; }
    } else if(inQuoteRun && !isQuote){
      // cerramos antes de procesar la línea actual (enQuoteRun termina exactamente al primer no-quote, incluso blanco)
      out.push('@@BQ_CLOSE@@');
      inQuoteRun = false;
    }
    if(!inCode && !isQuote && isBlank){
      // línea vacía normal preservada
      out.push('@@EMPTY_LINE@@');
      continue;
    }
    if(!isBlank || isQuote){
      out.push(line);
    }
  }
  if(inQuoteRun){ out.push('@@BQ_CLOSE@@'); inQuoteRun=false; }
  const normalized = out.join('\n');
  // Colocar placeholders para menciones angulares que Marked interpretaría como HTML
  const angularMentionPattern = /<@!?\d+>|<@&\d+>|<#\d+>/g;
  const angularMentions: string[] = [];
  const tokenized = normalized.replace(angularMentionPattern, m => `@@MEN_${angularMentions.push(m)-1}@@`);
  const spoilerPattern = /\|\|([\s\S]*?)\|\|/g; // soporta multilínea
  const replaced = tokenized.replace(spoilerPattern, (_m, inner) => `@@SPOILER_OPEN@@${inner}@@SPOILER_CLOSE@@`);
  const parsed = marked.parse(replaced, { async: false });
  const htmlStr = typeof parsed === 'string' ? parsed : '';
  let finalHtml = htmlStr
    .split('@@SPOILER_OPEN@@').join('<span class="spoiler" data-hidden="true">')
    .split('@@SPOILER_CLOSE@@').join('</span>')
  .replace(/(^|\s|>)@(everyone|here)(?=\b)/g, (_m, pre, token) => `${pre}<span class="mention-token" data-mention="@${token}">@${token}</span>`);
  // Reemplazar placeholders por spans de mención
  finalHtml = finalHtml.replace(/@@MEN_(\d+)@@/g, (_m, idxStr) => {
    const original = angularMentions[Number(idxStr)] || '';
    return `<span class=\"mention-token\" data-mention=\"${original}\">${original}</span>`;
  });
  // Blockquotes: sustituir tokens por tags (limpiar posibles envolturas <p>)
  finalHtml = finalHtml
    .replace(/<p>@@BQ_OPEN@@<\/p>/g,'@@BQ_OPEN@@')
    .replace(/<p>@@BQ_CLOSE@@<\/p>/g,'@@BQ_CLOSE@@')
    .replace(/@@BQ_OPEN@@/g,'<blockquote>')
    .replace(/@@BQ_CLOSE@@/g,'</blockquote>');
  // Convertir líneas vacías marcadas antes de las normalizaciones para que coincidan los patrones
  finalHtml = finalHtml.replace(/@@EMPTY_LINE@@/g,'<br class="blank-line" />');
  // Normalizaciones sin colapsar múltiples blank lines
  finalHtml = finalHtml
    .replace(/<blockquote>\s*(?:<br\s*\/?>\s*)+/g,'<blockquote>')
    .replace(/(?:<br\s*\/?>\s*)+<\/blockquote>/g,'</blockquote>');
  finalHtml = finalHtml.replace(/<br>(?=\s*<br class="blank-line" \/>)/g,'');
  finalHtml = finalHtml.replace(/<p>\s*<\/p>/g,'');
  finalHtml = finalHtml.replace(/<\/blockquote>\s*<br>(?=\s*<br)/g,'</blockquote>');
  finalHtml = finalHtml.replace(/<p>(.*?)<br><\/p>/g, (_m, inner) => `<p>${inner}</p>`);
  finalHtml = finalHtml.replace(/<br\s*\/?>(?=\s*<blockquote>)/g,'');
  finalHtml = finalHtml.replace(/<blockquote>\s*<br(?! class="blank-line")\s*\/?>(?=)/g,'<blockquote>');
  finalHtml = finalHtml.replace(/<\/blockquote>\s*(?:<br\s*\/?>(?! class="blank-line"))*<br class="blank-line" \/>/g,'</blockquote><br class="blank-line" />');
  finalHtml = finalHtml.replace(/<blockquote>\s*<br class="blank-line" \/>/g,'<blockquote>');
  finalHtml = finalHtml.replace(/<\/blockquote>\s*<br>(?!\s*<br)/g,'</blockquote>');
  finalHtml = finalHtml.replace(/<br>\s*<br class="blank-line" \/>\s*<br>/g,'<br class="blank-line" />');
  finalHtml = finalHtml.replace(/<br class="blank-line">/g,'<br class="blank-line" />');
  finalHtml = finalHtml.replace(/<br>\s*(<br class="blank-line" \/>)/g,'$1');
  finalHtml = finalHtml.replace(/(<br class="blank-line" \/>)\s*<br>(?! class="blank-line")/g,'$1');
  // Unwrap de párrafos que contienen únicamente un marker
  finalHtml = finalHtml.replace(/<p>\s*(<br class="blank-line" \/>)\s*<\/p>/g,'$1');
  // Dividir párrafos con markers preservando secuencias
  finalHtml = finalHtml.replace(/<p>([\s\S]*?)<\/p>/g, (m, inner) => {
    if(!inner.includes('<br class="blank-line"')) return m;
    const tokens = inner.split(/(<br class="blank-line" \/>+)/);
    let pieces: string[] = [];
    for(const tok of tokens){
      if(!tok) continue;
      if(/^(<br class="blank-line" \/>)+$/.test(tok)){
        pieces.push(tok);
      } else {
        const trimmed = tok.trim();
        if(trimmed.length){ pieces.push(`<p>${trimmed}</p>`); }
      }
    }
    return pieces.join('');
  });
  return finalHtml;
}

// Hook para convertir los emojis unicode dentro de los spans generados a imágenes Twemoji al momento de inyectar en el DOM.
// Exportamos helper para aplicar después del dangerouslySetInnerHTML.
export function enhanceEmojiImages(container: HTMLElement){
  const spans = Array.from(container.querySelectorAll('span.d-emoji')) as HTMLSpanElement[];
  spans.forEach(span=>{
    if(span.getAttribute('data-img-ready')==='true') return; // ya procesado
    const txt = span.textContent||'';
    if(!txt) return;
    const parsed = twemoji.parse(txt, { folder:'svg', ext:'.svg', className:'d-emoji-img', base: 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/' });
    if(parsed && parsed !== txt){ span.innerHTML = parsed; span.setAttribute('data-img-ready','true'); }
  });
}
