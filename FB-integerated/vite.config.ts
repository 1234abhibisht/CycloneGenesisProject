import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
const proxy = { '/api': { target: 'http://127.0.0.1:8002', changeOrigin: true } };
export default defineConfig({ plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1', port: 3002, strictPort: true, open: false, proxy },
  preview: { host: '127.0.0.1', port: 3002, strictPort: true, proxy },
});
