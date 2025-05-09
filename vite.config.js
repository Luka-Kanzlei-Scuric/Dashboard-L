import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    cors: {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    },
    open: true, // automatically open browser on start
    proxy: {
      // if needed, you can add proxy settings for API calls here
      // '/api': 'http://localhost:5000',
    },
    // Added hmr settings for better dev experience
    hmr: {
      overlay: true,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    // Ensure sourcemaps for easier debugging
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  // Ensure client-side routing works with React Router for direct URL access
  preview: {
    port: 3000
  }
});