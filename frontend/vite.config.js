import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

// LOCAL-ONLY WORKAROUND (do not commit): Windows Smart App Control on this PC blocks
// Tailwind's native compiler, so instead of @tailwindcss/vite we hand src/index.css to
// Tailwind's official in-browser runtime. index.css and main.jsx stay unchanged.
const indexCss = fileURLToPath(new URL('./src/index.css', import.meta.url))

function tailwindBrowserRuntime() {
  return {
    name: 'local-tailwind-browser-runtime',
    enforce: 'pre',
    // Serve index.css as empty to Vite; the browser runtime compiles it instead.
    load(id) {
      if (id.split('?')[0].replace(/\\/g, '/') === indexCss.replace(/\\/g, '/')) return ''
    },
    transformIndexHtml() {
      const css = readFileSync(indexCss, 'utf8')
      return [
        {
          tag: 'script',
          attrs: { src: 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.5' },
          injectTo: 'head',
        },
        { tag: 'style', attrs: { type: 'text/tailwindcss' }, children: css, injectTo: 'head' },
      ]
    },
    handleHotUpdate({ file, server }) {
      if (file.replace(/\\/g, '/') === indexCss.replace(/\\/g, '/')) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindBrowserRuntime()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
})
