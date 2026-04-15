import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repo = 'OneDarkNight';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? `/${repo}/` : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'One Dark Night',
        short_name: 'OneDarkNight',
        description: 'A horror text-adventure game. Survive 5 nights without breaking the rules.',
        start_url: `/${repo}/`,
        scope: `/${repo}/`,
        display: 'standalone',
        theme_color: '#1a1a2e',
        background_color: '#0d0d1a',
        lang: 'ru',
        icons: [
          {
            src: 'icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
}));
