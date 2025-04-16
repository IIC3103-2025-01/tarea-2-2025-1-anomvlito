import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 👇 Esta es la línea importante para GitHub Pages
  base: '/tarea-2-2025-1-anomvlito/',
});