import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifestJson from './manifest.json';

const manifest = manifestJson as any;

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',
        dashboard: 'src/dashboard/dashboard.html'
      }
    }
  }
});
