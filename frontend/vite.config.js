import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
  ],
  optimizeDeps: {
    exclude: ['jwt-decode'], // Prevent Vite from pre-bundling jwt-decode
  },
  resolve: {
    alias: {
      'jwt-decode': '/node_modules/jwt-decode', // Ensure direct module resolution
    },
  }
});
