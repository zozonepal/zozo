import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  plugins: [
    {
      name: 'html-ext-fallback-and-cache',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const urlObj = new URL(req.url, 'http://localhost');
            const pathname = urlObj.pathname;

            // Set immutable long-term Cache-Control headers for static media and bundled assets
            if (/\.(png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|ttf|otf|css|js)$/i.test(pathname)) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else if (pathname.endsWith('.html') || pathname === '/' || !pathname.includes('.')) {
              res.setHeader('Cache-Control', 'no-cache, must-revalidate');
            }
            
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
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    assetsInlineLimit: 4096, // Inline small assets (<4kb) as data URIs to reduce HTTP requests
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        product: path.resolve(__dirname, 'product.html'),
        checkout: path.resolve(__dirname, 'checkout.html'),
        admin: path.resolve(__dirname, 'admin.html'),
        login: path.resolve(__dirname, 'login.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules')) {
            return 'vendor-core';
          }
        },
      },
    },
  },
});


