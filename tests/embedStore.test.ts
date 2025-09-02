import { describe, it, expect } from 'vitest';
import { useEmbedStore } from '../src/state/embedStore';

describe('embed store', () => {
  it('adds field', () => {
    const before = useEmbedStore.getState().embed.fields.length;
    useEmbedStore.getState().addField();
    expect(useEmbedStore.getState().embed.fields.length).toBe(before + 1);
  });
});
