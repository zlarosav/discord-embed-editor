# Discord Embed Visualizer (MVP)

Proyecto SPA (frontend only) para crear y visualizar un embed de Discord y exportar/ importar JSON compatible.

## Deploy en GitHub Pages

El proyecto está configurado para desplegarse automáticamente a GitHub Pages cuando haces push a `main`.

Pasos:
1. Asegúrate de que el repositorio en GitHub se llama `discord-embed-editor` (o ajusta `base` en `vite.config.ts`).
2. Habilita GitHub Pages en Settings > Pages seleccionando "GitHub Actions" como fuente (la primera vez puede tardar unos minutos tras el primer build).
3. Haz push inicial (`git add .`, `git commit -m "init"`, `git push origin main`).
4. El workflow `.github/workflows/deploy.yml` buildará y publicará la carpeta `dist`.

URL esperada: `https://<tu-usuario>.github.io/discord-embed-editor/`.

Si cambias el nombre del repo, actualiza la opción `base` en `vite.config.ts` para que los assets se resuelvan correctamente en Pages.

## Scripts

- `npm run dev` inicia entorno de desarrollo.
- `npm run build` build producción.
- `npm run preview` sirve build.
- `npm run test` ejecuta tests (vitest).

## Estructura

```
src/
  components/
  state/
  utils/
  styles/
examples/
```

## Estado central

Utiliza `zustand` para exponer métodos: addField, updateField, removeField, reorderField, updateEmbed, importJSON, exportJSON.

## Especificación JSON

Función `toDiscordPayload(embed)` devuelve:

```json
{
  "embeds": [
    {
      "title": "...",
      "description": "...",
      "url": "https://...",
      "timestamp": "2025-09-01T12:00:00.000Z",
      "color": 16711680,
      "footer": { "text": "texto", "icon_url": "https://..." },
      "image": { "url": "https://..." },
      "thumbnail": { "url": "https://..." },
      "author": { "name": "Autor", "url": "https://...", "icon_url": "https://..." },
      "fields": [ { "name": "Campo 1", "value": "Valor", "inline": true } ]
    }
  ]
}
```

`description` permanece como markdown crudo.

## Fixtures

- `examples/simple.json`
- `examples/full-25-fields.json`
- `examples/media.json`
- `examples/markdown.json`

## Funcionalidades actuales (MVP en progreso)

- Edición inline con doble clic, markdown básico, spoilers clicables.
- Atajos: Ctrl/Cmd+B/I/U.
- Drag & Drop para reordenar fields y añadir bloques desde la paleta.
- Color picker en la barra lateral del embed.
- Validaciones y contadores globales + por bloque/field (resaltado en rojo si excede).
- Export / Import JSON, autosave localStorage, reset.

## Próximos pasos sugeridos

- Más atajos (code, spoiler toggle, underline dedicados, code block). 
- Chips visuales para @everyone y @here editables.
- Mejora ARIA y accesibilidad.
- Tests adicionales (markdown avanzado, drag & drop, export/import roundtrip).
