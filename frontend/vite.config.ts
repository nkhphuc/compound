import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      server: {
        host: '0.0.0.0',
        port: 5173,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('exceljs')) return 'vendor-exceljs';
                if (id.includes('docx')) return 'vendor-docx';
                if (id.includes('jszip')) return 'vendor-jszip';
                if (id.includes('react-dom')) return 'vendor-react-dom';
                if (id.includes('react-router-dom')) return 'vendor-react-router-dom';
                if (id.includes('react')) return 'vendor-react';
                return 'vendor';
              }
            },
          },
        },
      },
    };
});
