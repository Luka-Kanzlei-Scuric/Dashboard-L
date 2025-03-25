import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    cors: {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    },
    historyApiFallback: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // Wichtig: Diese Konfiguration sorgt dafür, dass alle Routen zu index.html zurückgeführt werden
  // Dies ermöglicht client-seitiges Routing mit React Router auch bei direkten URL-Zugriffen
  preview: {
    port: 3000
  }
});