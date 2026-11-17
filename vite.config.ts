import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type Connect } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { VitePWA } from 'vite-plugin-pwa'

const MAX_PROXY_BYTES = 5 * 1024 * 1024
const PROXY_TIMEOUT_MS = 20_000

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '0.0.0.0' || host === '[::1]' || host === '::1') return true
  if (/^127\./.test(host)) return true
  if (/^10\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true
  if (/^169\.254\./.test(host)) return true
  return false
}

const linkProxyHandler: Connect.NextHandleFunction = async (
  req: IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction
) => {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost')
  if (requestUrl.pathname !== '/api/fetch') {
    next()
    return
  }

  const target = requestUrl.searchParams.get('url')
  if (!target) {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Parâmetro "url" é obrigatório' }))
    return
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'URL inválida' }))
    return
  }

  if (!/^https?:$/.test(parsed.protocol) || isPrivateHostname(parsed.hostname)) {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Destino não permitido' }))
    return
  }

  // Permite requisições de qualquer origem (dev em LAN, PWA, etc.)
  res.setHeader('x-safezone-proxy', '1')
  res.setHeader('access-control-allow-origin', '*')
  res.setHeader('cache-control', 'no-store')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)

  try {
    const upstream = await fetch(parsed.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })

    const buffer = Buffer.from(await upstream.arrayBuffer())

    if (buffer.byteLength > MAX_PROXY_BYTES) {
      res.statusCode = 413
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Conteúdo maior que 5MB' }))
      return
    }

    res.statusCode = upstream.status
    res.setHeader(
      'content-type',
      upstream.headers.get('content-type') ?? 'text/html; charset=utf-8'
    )
    res.end(buffer)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'erro desconhecido'
    res.statusCode = 502
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: `Falha ao buscar a URL: ${reason}` }))
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Proxy same-origin para extração de links.
 * Funciona em `vite dev` e `vite preview` (sem problemas de CORS).
 * Em hospedagem estática o endpoint não existe e o app cai nos proxies públicos.
 */
function linkProxyPlugin(): Plugin {
  return {
    name: 'safezone-link-proxy',
    configureServer(server) {
      server.middlewares.use(linkProxyHandler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(linkProxyHandler)
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    linkProxyPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32x32.png', 'apple-touch-icon.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // inclui o worker do PDF.js (.mjs) no cache offline
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        id: '/',
        name: 'SafeZone Studies',
        short_name: 'SafeZone',
        description: 'Portal de Estudos para Certificações Microsoft Azure (AI-200 e AI-103)',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, ''),
      },
    },
  },
})
