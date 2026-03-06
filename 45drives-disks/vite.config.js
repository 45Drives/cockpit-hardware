import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

// Strip crossorigin attributes from HTML - Cockpit doesn't support them
const cockpitCompat = () => ({
  name: 'cockpit-compat',
  transformIndexHtml(html) {
    return html.replace(/ crossorigin/g, '');
  },
});

// Redirect p5 imports to window.p5 global - p5 is loaded via <script> tag
// to avoid CSP unsafe-eval violations when bundled
const p5Global = () => ({
  name: 'p5-global',
  resolveId(source) {
    if (source === 'p5') return '\0p5-global';
    return null;
  },
  load(id) {
    if (id === '\0p5-global') return 'export default window.p5;';
    return null;
  },
});

// Copy p5.min.js to dist at build time
const copyP5 = () => ({
  name: 'copy-p5',
  closeBundle() {
    const p5Pkg = resolve(rootDir, 'node_modules/p5/lib/p5.min.js');
    const dest = resolve(__dirname, 'dist/p5.min.js');
    copyFileSync(p5Pkg, dest);
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), cockpitCompat(), p5Global(), copyP5()],
  base: "./",
  resolve: {
    dedupe: ['vue'],
  },
  build:{
    minify: false,
  }
})

