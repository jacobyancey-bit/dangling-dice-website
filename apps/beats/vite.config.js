import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});

