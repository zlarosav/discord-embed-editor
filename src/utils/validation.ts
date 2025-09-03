import { EmbedData } from '../state/embedStore';
import { EMBED_LIMITS as LIMITS } from '../constants/embedLimits';

export interface ValidationResult { valid: boolean; errors: string[]; counts: Record<string, { used: number; limit: number }>; total: { used: number; limit: number }; }

// (Límites centralizados en constants/embedLimits.ts)

export function validateEmbed(e: EmbedData): ValidationResult {
  const errors: string[] = [];
  let total = 0;
  const counts: ValidationResult['counts'] = {};

  function track(key: string, used: number, limit: number) {
    counts[key] = { used, limit };
    total += used;
    if (used > limit) errors.push(`${key} excede límite (${used}/${limit})`);
  }

  if (e.title) track('title', e.title.length, LIMITS.title); else counts['title'] = { used: 0, limit: LIMITS.title };
  /*if (e.description) track('description', e.description.length, LIMITS.description); else counts['description'] = { used: 0, limit: LIMITS.description };*/
  if (e.footer?.text) track('footer_text', e.footer.text.length, LIMITS.footer_text); else counts['footer_text'] = { used: 0, limit: LIMITS.footer_text };
  if (e.author?.name) track('author_name', e.author.name.length, LIMITS.author_name); else counts['author_name'] = { used: 0, limit: LIMITS.author_name };

  if (e.fields.length > LIMITS.fields) errors.push(`fields excede límite (${e.fields.length}/${LIMITS.fields})`);
  e.fields.forEach((f, idx) => {
    track(`field_name_${idx}`, f.name.length, LIMITS.field_name);
    track(`field_value_${idx}`, f.value.length, LIMITS.field_value);
  });

  const totalLimit = LIMITS.total;
  if (total > totalLimit) errors.push(`total excede límite (${total}/${totalLimit})`);

  return { valid: errors.length === 0, errors, counts, total: { used: total, limit: totalLimit } };
}
