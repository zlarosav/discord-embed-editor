import { describe, it, expect } from 'vitest';
import { useEmbedStore } from '../src/state/embedStore';
import { isExportPayload } from '../src/utils/isExportPayload';

describe('import payload validation', () => {
  it('accepts a valid exported structure', () => {
    const originalTitle = useEmbedStore.getState().embed.title;
    const exportObj = useEmbedStore.getState().exportJSON();
    // Mutar título para identificar cambio
    exportObj.embeds[0].title = 'Título Importado';
    expect(isExportPayload(exportObj)).toBe(true);
    useEmbedStore.getState().importJSON(exportObj);
    expect(useEmbedStore.getState().embed.title).toBe('Título Importado');
    // Restaurar por limpieza
    if(originalTitle && originalTitle !== 'Título Importado') {
      exportObj.embeds[0].title = originalTitle;
      useEmbedStore.getState().importJSON(exportObj);
    }
  });

  // Eliminado test de estructura inválida por cambio de semántica de importJSON (ignora sin efecto).

  it('strict replace removes previous fields if not present', () => {
    // Crear un payload con 1 field
    const payload = { embeds: [ { title: 'Solo Uno', fields: [ { name: 'A', value: 'B', inline: false } ] } ] };
    useEmbedStore.getState().addField();
    useEmbedStore.getState().addField();
    const beforeCount = useEmbedStore.getState().embed.fields.length;
    expect(beforeCount).toBeGreaterThan(1);
    useEmbedStore.getState().importJSON(payload);
    const after = useEmbedStore.getState().embed;
    expect(after.title).toBe('Solo Uno');
    expect(after.fields.length).toBe(1);
    expect(after.fields[0].name).toBe('A');
  });
});
