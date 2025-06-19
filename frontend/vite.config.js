import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000' // ✅ backend runs here
    }
  },
  optimizeDeps: {
    exclude: ['jwt-decode'],
  },
  resolve: {
    alias: {
      'jwt-decode': '/node_modules/jwt-decode',
    },
  }
});