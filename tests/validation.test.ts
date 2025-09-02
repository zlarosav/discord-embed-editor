import { describe, it, expect } from 'vitest';
import { validateEmbed } from '../src/utils/validation';

describe('validation', () => {
  it('detecta overflow title', () => {
    const embed: any = { title: 'x'.repeat(300), fields: [] };
    const res = validateEmbed(embed);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e=>e.includes('title'))).toBe(true);
  });
  it('acepta embed vacío', () => {
    const res = validateEmbed({ fields: [] });
    expect(res.valid).toBe(true);
  });
});
