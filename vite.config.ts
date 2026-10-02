import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-puzzle-files',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__puzzles', async (request, response) => {
          const pathname = (request.url ?? '').split('?')[0];
          // Only generated game files are exposed, never arbitrary filesystem paths.
          if (!/^\/(index\.json|boards\/[1-9]\d*\.json)$/.test(pathname)) {
            response.statusCode = 404;
            response.end();
            return;
          }
          try {
            const path = fileURLToPath(new URL(`./puzzles/generated${pathname}`, import.meta.url));
            const body = await readFile(path);
            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Cache-Control', 'no-store');
            response.end(body);
          } catch (error) {
            server.config.logger.error(`Unable to read generated puzzle file: ${error}`);
            response.statusCode = 404;
            response.end();
          }
        });
      },
    },
  ],
  base: './',
});
