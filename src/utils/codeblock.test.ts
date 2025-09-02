import { describe, it, expect } from 'vitest';
import { renderDiscordMarkdown } from './markdown';

describe('code block rendering', () => {
  it('renders code block with highlight class and language mapping', () => {
    const input = '```js\nconsole.log("hola mundo");\n```';
    const html = renderDiscordMarkdown(input);
    expect(html).toMatch(/<pre class="code-block">/);
    expect(html).toMatch(/code-inner hljs/);
    expect(html).toMatch(/lang-javascript/); // mapping js -> javascript
    // Debe contener algún span de highlight (variable/function/string)
    expect(html).toMatch(/hljs-(variable|title|string|keyword)/);
  });
});
