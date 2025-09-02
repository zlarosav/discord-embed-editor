import { renderDiscordMarkdown } from '../src/utils/markdown';
import { describe,it,expect } from 'vitest';

describe('Mentions rendering', () => {
  it('wraps user, role, channel and everyone mentions with token span', () => {
    const input = 'Hola <@123> rol <@&456> canal <#789> @everyone @here';
    const html = renderDiscordMarkdown(input);
  const occurrences = (html.match(/<span class=\"mention-token\"/g) || []).length;
  expect(occurrences).toBe(5);
  });
});
