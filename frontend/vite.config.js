import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject build timestamp — changes every build, forces SW update
    __BUILD_TIME: JSON.stringify(Date.now()),
  },
  server: {
    port: 3001,
    strictPort: false,
  }
})
