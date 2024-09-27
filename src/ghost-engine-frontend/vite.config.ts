import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import macrosPlugin from 'vite-plugin-babel-macros';
import dotenv from 'dotenv';

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'local';

dotenv.config({ path: `../../.env.${mode}` });

process.env.II_URL =
  process.env.DFX_NETWORK === 'local'
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`
    : `https://identity.ic0.app`;

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4943',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'assets',
  plugins: [
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
    environment(['II_URL']),
    macrosPlugin(),
  ],
});
