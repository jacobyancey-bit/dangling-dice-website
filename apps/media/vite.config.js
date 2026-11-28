import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3001,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api': {
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

