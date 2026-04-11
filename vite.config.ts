import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

function formatReleaseConfigFile(body: {
  releaseUITheme: unknown
  releaseBackgroundSphere: unknown
}) {
  return [
    `export const releaseUITheme = ${JSON.stringify(body.releaseUITheme, null, 2)} as const`,
    '',
    `export const releaseBackgroundSphere = ${JSON.stringify(body.releaseBackgroundSphere, null, 2)} as const`,
    '',
  ].join('\n')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    {
      name: 'dev-save-release-config',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__dev/save-release-config', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
            return
          }

          try {
            const chunks: Buffer[] = []

            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            }

            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
              releaseUITheme: unknown
              releaseBackgroundSphere: unknown
            }

            const targetPath = path.resolve(server.config.root, 'src/lib/landingReleaseConfig.ts')
            const nextContent = formatReleaseConfigFile(payload)
            await writeFile(targetPath, nextContent, 'utf8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to save release config',
              })
            )
          }
        })
      },
    },
  ],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
})
