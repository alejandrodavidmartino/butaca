import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En desarrollo, las peticiones a /api se redirigen al backend
    proxy: { '/api': 'http://localhost:4000' },
  },
});
