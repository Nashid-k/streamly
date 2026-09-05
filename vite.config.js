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
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing deps into stable chunks so the SPA shell
        // loads fast and everything else gets cached long-term by vercel.json.
        // (rolldown/Vite 8 requires the function form of manualChunks.)
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-dom')) return 'react-vendor';
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'motion-vendor';
          if (id.includes('@tanstack') || id.includes('react-query')) return 'query-vendor';
          if (id.includes('firebase')) return 'firebase-vendor';
          return 'vendor';
        },
      },
    },
  },
})
