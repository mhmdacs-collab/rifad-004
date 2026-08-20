import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  },
  build: {
    target: ['chrome109', 'edge109'],
    outDir: '../dist',
    emptyOutDir: true
  }
});
