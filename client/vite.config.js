import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      // thêm domain thật khi deploy, ví dụ:
      // 'tgr.example.com',
    ],
  },
});