import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Pages from 'vite-plugin-pages'
import path from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    Pages({
      dirs: 'src/pages',
      extensions: ['tsx'],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/',
})