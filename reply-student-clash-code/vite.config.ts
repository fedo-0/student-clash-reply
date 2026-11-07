import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  // Pre-bundle tutto all'avvio: evita il re-bundling a runtime (che può caricare due copie di React)
  optimizeDeps: { entries: ['index.html', 'src/**/*.tsx'] },
});
