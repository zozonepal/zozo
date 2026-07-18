import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-rewrite',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url ? req.url.split('?')[0] : '';
            if (url === '/admin' || url === '/admin/') {
              req.url = '/admin.html' + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : '');
            } else if (url === '/product' || url === '/product/') {
              req.url = '/product.html' + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : '');
            } else if (url === '/checkout' || url === '/checkout/') {
              req.url = '/checkout.html' + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : '');
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          product: path.resolve(__dirname, 'product.html'),
          checkout: path.resolve(__dirname, 'checkout.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
