import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
 
// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'pdf-overlay',
      fileName: (format) => `pdf-overlay.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es', 'cjs'], // ESM and CommonJS for Node.js
    },
    rollupOptions: {
      // Externalize Node.js built-in modules
      external: ['fs/promises', 'fs', 'path', 'os'],
    },
  },
  plugins: [dts()],
});
