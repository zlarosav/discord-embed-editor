import { describe,it,expect } from 'vitest';
import { renderDiscordMarkdown } from '../src/utils/markdown';

describe('Emoji shortcode rendering', () => {
  it('replaces :green_circle: with unicode inside span', () => {
    const html = renderDiscordMarkdown('Status :green_circle: listo');
    expect(html).toMatch(/<span class="d-emoji" data-name="green_circle">.*?<\/span>/);
    expect(html).toContain('Status ');
  });
  it('leaves unknown shortcode intact', () => {
    const input = 'Texto :emoji_inventado: test';
    const html = renderDiscordMarkdown(input);
    expect(html).toContain(':emoji_inventado:');
  });
  it('fallback retrocede y detecta emoji válido tras secuencia inválida', () => {
    const input = ':innocent::innocent:1:green_circle:';
    const html = renderDiscordMarkdown(input);
    // Debe contener al menos un emoji válido green_circle al final
    expect(html).toMatch(/data-name="green_circle"/);
  });
  it('preserva token inválido completo y reemplaza el siguiente válido', () => {
    const input = ':invalid_emoji:heart:';
    const html = renderDiscordMarkdown(input);
    expect(html).toContain(':invalid_emoji:');
    expect(html).toMatch(/data-name="heart"/);
  });
  it('no reemplaza parcialmente alias incorrectos y captura el último válido', () => {
    const input = ':bad:unrelated::smile:';
    const html = renderDiscordMarkdown(input);
    expect(html).toMatch(/data-name="smile"/);
  });
  it('no deja colon sobrante tras emoji válido final después de inválido intermedio', () => {
    const input = ':heart::nvalid_emoji::heart:';
    const html = renderDiscordMarkdown(input);
    expect(html).toMatch(/data-name="heart"/); // al menos un heart
    // No debe terminar con ':' extra antes del cierre del párrafo
    expect(html.trim().endsWith(':</p>')).toBe(false);
  });
});