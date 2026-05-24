import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import salesforce from '@salesforce/vite-plugin-ui-bundle';
import path from 'path';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var alias = mode === 'development'
        ? { '@salesforce/sdk-data': path.resolve(__dirname, 'src/sdk-mock.ts') }
        : {};
    return {
        plugins: [
            react(),
            salesforce(), // handles base path, proxy, and org config for Salesforce
        ],
        resolve: { alias: alias },
        test: {
            environment: 'jsdom',
            setupFiles: ['./vitest.setup.ts'],
            globals: true,
        },
    };
});
