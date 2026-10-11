import process from 'node:process';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Full address of the store for link previews in index.html. Vercel provides
  // its production domain at build time; on other hosts set SITE_URL.
  const siteUrl = (
    env.SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  ).replace(/\/$/, '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'site-url',
        transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
      },
    ],
    server: {
      // In development the client calls /api/... on its own origin and Vite
      // forwards it to the backend, so CORS and port mismatches can't happen.
      // The API also serves the sitemap and robots.txt at the site root.
      proxy: Object.fromEntries(
        ['/api', '/sitemap.xml', '/robots.txt'].map((path) => [
          path,
          { target: env.API_PROXY_TARGET || 'http://localhost:5000', changeOrigin: true },
        ])
      ),
    },
  };
});
