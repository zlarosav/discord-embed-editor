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
});