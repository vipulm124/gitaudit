import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      'vscode': path.resolve(__dirname, 'src/__mocks__/vscode.ts'),
    },
    css: false,
    server: {
      deps: {
        inline: [/d3/, /@csstools/, /@asamuzakjp/],
      }
    },
  },
});
