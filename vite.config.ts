import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-puzzle-bank',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__puzzles.json', async (_request, response) => {
          try {
            const path = fileURLToPath(new URL('./puzzles/generated/puzzles.json', import.meta.url));
            const body = await readFile(path);
            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Cache-Control', 'no-store');
            response.end(body);
          } catch (error) {
            server.config.logger.error(`Unable to read generated puzzles: ${error}`);
            response.statusCode = 404;
            response.end();
          }
        });
      },
    },
  ],
  base: './',
});
