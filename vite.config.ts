import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const baseUrl: string = '/anki-advanced/';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: baseUrl,
  define: {
    'process.env': {
      BASE_URL: baseUrl,
    },
  },
  build: { // Add build options to generate editor-poc.html along with index.html, until POC is merged into main app
    rollupOptions: {
      input: {
        main: 'index.html',
        editor: 'editor-poc.html',
      }
    },
  }
});
