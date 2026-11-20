import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Na demo (GitHub Pages) os arquivos são servidos de uma subpasta, por isso a base relativa.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_DEMO === 'true' ? './' : '/',
})
