// Centralización de límites y claves usados en validación / UI
export const EMBED_LIMITS = {
  title: 256,
  description: 4096,
  field_name: 256,
  field_value: 1024,
  fields: 25,
  footer_text: 2048,
  author_name: 256,
  total: 6000
} as const;

export type EmbedLimitKey = keyof typeof EMBED_LIMITS;
