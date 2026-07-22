import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Project is hosted at https://le-moment-it.github.io/space/ (GitHub Pages project site),
// so all asset URLs need this base path prefix.
export default defineConfig({
  base: '/space/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
