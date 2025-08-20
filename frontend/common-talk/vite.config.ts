import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
    server: {
    proxy: {
      "/hansard": {
        target: "https://hansard-api.parliament.uk",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hansard/, ""),
      },
      "/members": {
        target: "https://members-api.parliament.uk",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/members/, ""),
      },
    },
  }
})
