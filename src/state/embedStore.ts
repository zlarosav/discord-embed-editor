import { create } from 'zustand';

export interface EmbedField { id: string; name: string; value: string; inline: boolean; }
export interface EmbedAuthor { name?: string; url?: string; icon_url?: string; }
export interface EmbedFooter { text?: string; icon_url?: string; }
export interface EmbedImage { url?: string; }
export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string; // ISO
  color?: number; // int
  footer?: EmbedFooter;
  author?: EmbedAuthor;
  thumbnail?: EmbedImage;
  image?: EmbedImage;
  fields: EmbedField[];
}

export interface EmbedState {
  embed: EmbedData;
  addField: () => void;
  updateField: (id: string, patch: Partial<EmbedField>) => void;
  removeField: (id: string) => void;
  reorderField: (id: string, direction: 'up'|'down') => void;
  updateEmbed: (patch: Partial<EmbedData>) => void;
  reset: () => void;
  importJSON: (data: any) => void;
  exportJSON: () => { embeds: EmbedData[] };
}

export const DEFAULT_ICON_URL = 'https://play-lh.googleusercontent.com/s-2O9IP9uO25JhGp2GfxKJKEs9G7CFcAzgheFeatXAQFCiyGy5-M8uJOpdBLwYM8t4zL=w240-h480-rw';
export const DEFAULT_IMAGE_URL = 'https://support.discord.com/hc/article_attachments/1500017894801';
// Template base “vacío” mínimo por si se necesita fallback
const emptyEmbed: EmbedData = { fields: [], color: 0x2b2d31, image: { url: DEFAULT_IMAGE_URL }, thumbnail: { url: DEFAULT_ICON_URL }, author: { name: 'Author', icon_url: DEFAULT_ICON_URL }, footer: { text: 'Footer', icon_url: DEFAULT_ICON_URL } };

function exampleFullTemplate(): EmbedData {
  const repoUrl = 'https://github.com/zlarosav/discord-embed-editor.git';
  const descLines: string[] = [
    '**Discord Embed Editor** – ejemplo con TODAS las características.',
    '',
    '**Atajos**: Ctrl+B / Ctrl+I / Ctrl+U / Ctrl+E (inline code) / Ctrl+S (spoiler) / Ctrl+Shift+C (bloque de código)',
    '',
    '**Autoformateado de menciones**: @here, @everyone, <@1007636530946375813>',
    '',
    '**Spoilers**: ||Never gonna give you up 🎶||.',
    '',
    '> Bloque de cita línea 1',
    '> ',
    '> Segunda línea dentro de la misma cita',
    '',
    'Texto normal tras la cita con *itálica*, **negrita**, __subrayado__, `inline code` y combinación.',
    '',
    '```js',
    '// Ejemplo de código resaltado',
    'function saludo(nombre){',
    '  console.log(`Hola ${nombre}!`);',
    '}',
    'saludo("mundo");',
    '```'
  ];
  return {
    title: 'Discord Embed Editor',
    url: repoUrl, // URL del título
    description: descLines.join('\n'),
    color: 0x5865f2,
    timestamp: new Date().toISOString(),
    image: { url: DEFAULT_IMAGE_URL },
    thumbnail: { url: DEFAULT_ICON_URL },
    author: { name: 'zlarosav / Project', icon_url: DEFAULT_ICON_URL, url: repoUrl },
    footer: { text: 'Ejemplo generado automáticamente', icon_url: DEFAULT_ICON_URL },
    fields: [
      { id: generateId(), name: 'Repositorio', value: '[GitHub](' + repoUrl + ')', inline: true },
      { id: generateId(), name: 'Versión', value: '1.0.0', inline: true },
      { id: generateId(), name: 'Comandos', value: '`/help` | `/info` | `/invite`', inline: false },
      { id: generateId(), name: 'Inline A', value: 'Valor A', inline: true },
      { id: generateId(), name: 'Inline B', value: 'Valor B', inline: true }
    ]
  };
}

// Alias para reset
const sampleResetEmbed = exampleFullTemplate;

export const useEmbedStore = create<EmbedState>((set, get) => ({
  embed: loadFromLocal() ?? exampleFullTemplate(),
  addField: () => set((s: EmbedState) => {
    if(s.embed.fields.length >=25) return {} as any;
    return { embed: { ...s.embed, fields: [...s.embed.fields, { id: generateId(), name: 'Field name', value: 'Value', inline: false }] } };
  }),
  updateField: (id: string, patch: Partial<EmbedField>) => set((s: EmbedState) => ({ embed: { ...s.embed, fields: s.embed.fields.map((f: EmbedField) => f.id===id? { ...f, ...patch }: f) } })),
  removeField: (id: string) => set((s: EmbedState) => ({ embed: { ...s.embed, fields: s.embed.fields.filter((f: EmbedField) => f.id!==id) } })),
  reorderField: (id: string, direction: 'up'|'down') => set((s: EmbedState) => {
    const idx = s.embed.fields.findIndex((f: EmbedField)=>f.id===id);
    if(idx===-1) return {} as any;
    const target = direction==='up'? idx-1: idx+1;
    if(target<0 || target>=s.embed.fields.length) return {} as any;
    const newFields = [...s.embed.fields];
    const [item] = newFields.splice(idx,1);
    newFields.splice(target,0,item);
    return { embed: { ...s.embed, fields: newFields } };
  }),
  updateEmbed: (patch: Partial<EmbedData>) => set((s: EmbedState) => ({ embed: { ...s.embed, ...patch } })),
  reset: () => set({ embed: sampleResetEmbed() }),
  importJSON: (data: any) => {
    // Aceptar tanto { embeds:[embed] } como un objeto embed directo
    const raw = data?.embeds?.[0] && typeof data.embeds[0] === 'object'
      ? data.embeds[0]
      : (data && typeof data === 'object' && !Array.isArray(data) ? data : null);
  if(!raw) { return; }
    // Construcción estricta: sólo lo que viene en el JSON (sin fusionar plantilla),
    // generando nuevos ids de fields y aplicando defaults mínimos.
    const next: EmbedData = {
      fields: Array.isArray(raw.fields)? raw.fields.map((f: any) => ({
        id: generateId(),
        name: typeof f.name === 'string'? f.name : '',
        value: typeof f.value === 'string'? f.value : '',
        inline: !!f.inline
      })) : [],
      ...(typeof raw.title === 'string'? { title: raw.title }: {}),
      ...(typeof raw.description === 'string'? { description: raw.description }: {}),
      ...(typeof raw.url === 'string'? { url: raw.url }: {}),
      ...(typeof raw.timestamp === 'string'? { timestamp: raw.timestamp }: {}),
      ...(typeof raw.color === 'number'? { color: raw.color }: {}),
      ...(raw.footer && typeof raw.footer === 'object'? { footer: {
        ...(typeof raw.footer.text === 'string'? { text: raw.footer.text }: {}),
        ...(typeof raw.footer.icon_url === 'string'? { icon_url: raw.footer.icon_url }: {})
      }}: {}),
      ...(raw.author && typeof raw.author === 'object'? { author: {
        ...(typeof raw.author.name === 'string'? { name: raw.author.name }: {}),
        ...(typeof raw.author.url === 'string'? { url: raw.author.url }: {}),
        ...(typeof raw.author.icon_url === 'string'? { icon_url: raw.author.icon_url }: {})
      }}: {}),
      ...(raw.thumbnail && typeof raw.thumbnail === 'object'? { thumbnail: {
        ...(typeof raw.thumbnail.url === 'string'? { url: raw.thumbnail.url }: {})
      }}: {}),
      ...(raw.image && typeof raw.image === 'object'? { image: {
        ...(typeof raw.image.url === 'string'? { url: raw.image.url }: {})
      }}: {}),
    };
  try { localStorage.removeItem('embed_state'); } catch {}
  set({ embed: next });
  },
  exportJSON: () => ({ embeds: [ get().embed ] })
}));

export type EmbedStore = typeof useEmbedStore;
export type EmbedStoreState = EmbedState;

function loadFromLocal(): EmbedData | null {
  try {
    const raw = localStorage.getItem('embed_state');
    if(!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

useEmbedStore.subscribe(state => {
  try { localStorage.setItem('embed_state', JSON.stringify(state.embed)); } catch {}
});

function generateId(): string {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return 'id_' + Math.random().toString(36).slice(2, 10);
}
