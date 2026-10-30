import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// Resolve hoisted react/react-dom from parent workspace if present, otherwise default to local
const parentReact = path.resolve(__dirname, '../node_modules/react');
const parentReactDom = path.resolve(__dirname, '../node_modules/react-dom');

const aliases = {};
if (fs.existsSync(parentReact)) {
  aliases['react'] = parentReact;
}
if (fs.existsSync(parentReactDom)) {
  aliases['react-dom'] = parentReactDom;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: aliases,
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        searchForWorkspaceRoot(process.cwd()),
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
