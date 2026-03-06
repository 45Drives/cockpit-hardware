import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Strip crossorigin attributes from HTML - Cockpit doesn't support them
const cockpitCompat = () => ({
  name: 'cockpit-compat',
  transformIndexHtml(html) {
    return html.replace(/ crossorigin/g, '');
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), cockpitCompat()],
  base: "./",
  resolve: {
    dedupe: ['vue'],
  },
})
