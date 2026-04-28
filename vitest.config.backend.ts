import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    alias: {
      'vscode': path.resolve(__dirname, 'src/__mocks__/vscode.ts'),
    },
    globals: true,
    environment: 'node',
    include: [
      'src/__tests__/analyzer/**/*.test.ts',
      'src/__tests__/cache/**/*.test.ts',
      'src/__tests__/*.test.ts',
      'src/__tests__/utils/**/*.test.ts'
    ],
  },
});
