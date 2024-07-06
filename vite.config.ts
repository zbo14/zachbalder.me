import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import Sitemap from 'vite-plugin-sitemap';

export default defineConfig({
  plugins: [Sitemap({ hostname: 'https://zachbalder.me' }), createHtmlPlugin()],
});
