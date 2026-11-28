import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Never inline fonts as data: URIs; CSP font-src allows 'self' only, and hashed files cache immutably
    assetsInlineLimit: (filePath) => (filePath.endsWith('.woff2') || filePath.endsWith('.woff') ? false : undefined),
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});

