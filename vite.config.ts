import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Nota: Ajusta 'base' si cambias el nombre del repositorio o usas un dominio personalizado.
export default defineConfig({
  plugins: [react()],
  base: '/discord-embed-editor/',
});
