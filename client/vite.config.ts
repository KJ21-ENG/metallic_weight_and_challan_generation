import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read package.json from metallic_electron_app directory to get version
const electronPackageJson = JSON.parse(readFileSync(resolve(__dirname, '../metallic_electron_app/package.json'), 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(electronPackageJson.version)
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/files': 'http://localhost:4000'
    }
  }
})
