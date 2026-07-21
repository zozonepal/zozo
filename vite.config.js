import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    {
      name: 'html-ext-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const urlObj = new URL(req.url, 'http://localhost');
            const pathname = urlObj.pathname;
            
            // If the pathname doesn't have an extension, is not root, and doesn't end with a slash
            if (pathname !== '/' && !pathname.includes('.') && !pathname.endsWith('/')) {
              // Map /admin to /admin.html
              req.url = pathname + '.html' + urlObj.search + urlObj.hash;
            } else if (pathname.endsWith('/') && pathname !== '/') {
              // Map /admin/ to /admin.html
              req.url = pathname.slice(0, -1) + '.html' + urlObj.search + urlObj.hash;
            }
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        product: path.resolve(__dirname, 'product.html'),
        checkout: path.resolve(__dirname, 'checkout.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        login: path.resolve(__dirname, 'login.html'),
      },
    },
  },
});

