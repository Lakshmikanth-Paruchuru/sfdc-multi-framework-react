import { defineConfig, type AliasOptions } from 'vite';
import react from '@vitejs/plugin-react';
import salesforce from '@salesforce/vite-plugin-ui-bundle';
import path from 'path';

export default defineConfig(({ mode }) => {
  const alias: AliasOptions =
    mode === 'development'
      ? { '@salesforce/sdk-data': path.resolve(__dirname, 'src/sdk-mock.ts') }
      : {};

  return {
    plugins: [
      react(),
      salesforce(), // handles base path, proxy, and org config for Salesforce
    ],
    resolve: { alias },
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,
    },
  };
});
