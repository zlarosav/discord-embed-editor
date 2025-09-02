import { describe, it, expect } from 'vitest';
import { renderDiscordMarkdown } from './markdown';

describe('markdown blank line handling', () => {
  it('should render exactly one blank-line br between two paragraphs separated by one blank line', () => {
    const input = 'test1\n\ntest4';
    const html = renderDiscordMarkdown(input);
    const occurrences = (html.match(/<br class="blank-line" \/>/g) || []).length;
    // Debe haber exactamente un marcador blank-line y no <br><br class="blank-line" /> secuencia
    expect(occurrences).toBe(1);
    expect(html).not.toMatch(/<br>\s*<br class="blank-line" \/>/);
  });
  it('should split into two paragraphs when blank line present', () => {
    const input = 'test1\n\ntest4';
    const html = renderDiscordMarkdown(input);
    expect(html).toMatch(/<p>test1<\/p>\s*<br class="blank-line" \/>\s*<p>test4<\/p>/);
  });
});

describe('multiple blank lines preservation', () => {
  it('should preserve all blank lines between hola and mundo', () => {
    const input = 'hola\n\n\n\n\n\nmundo';
    const html = renderDiscordMarkdown(input);
    const count = (html.match(/<br class="blank-line" \/>/g) || []).length;
    expect(count).toBe(5); // se preservan todos
    expect(html).toMatch(/<p>hola<\/p>(<br class="blank-line" \/>){5}<p>mundo<\/p>/);
  });
});

describe('underline vs bold handling', () => {
  it('should render __text__ as <u> and **text** as <strong>', () => {
    const input = '__subrayado__ y **negrita**';
    const html = renderDiscordMarkdown(input);
    expect(html).toContain('<u>subrayado</u>');
    expect(html).toMatch(/<strong>negrita<\/strong>/);
  });
  it('should allow nested formatting inside underline', () => {
    const input = '__sub *it* **bold**__';
    const html = renderDiscordMarkdown(input);
    expect(html).toMatch(/<u>sub <em>it<\/em> <strong>bold<\/strong><\/u>/);
  });
});
