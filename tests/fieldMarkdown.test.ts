import { describe, it, expect } from 'vitest';
import { renderDiscordMarkdown } from '../src/utils/markdown';

describe('Field markdown rendering (indirect)', () => {
  it('renders inline code and underline', () => {
    const input = 'Nombre con __sub__ y `code`';
    const html = renderDiscordMarkdown(input);
    expect(html).toContain('<u>sub</u>');
    expect(html).toMatch(/<code>code<\/code>/);
  });
});