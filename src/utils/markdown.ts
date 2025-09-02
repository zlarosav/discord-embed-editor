import { marked } from 'marked';
import hljs from 'highlight.js';

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

export function renderDiscordMarkdown(raw: string): string {
  // Recortar sólo líneas completamente vacías al inicio y final para evitar padding extra
  const trimmedRaw = raw.replace(/^[\n\r]+|[\n\r]+$/g,'');
  const lines = trimmedRaw.split(/\n/);
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
