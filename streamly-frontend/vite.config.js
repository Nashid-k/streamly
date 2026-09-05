import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject build timestamp — changes every build, forces SW update
    __BUILD_TIME: JSON.stringify(Date.now()),
    // Inject app version from package.json
    __VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 3001,
    strictPort: false,
  }
})
