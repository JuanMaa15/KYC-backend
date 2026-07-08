import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

/**
 * Instancia principal de la aplicación Hono.
 * Aquí se registran middlewares globales y se montan los módulos de negocio.
 *
 * Flujo de middlewares (orden importante):
 * 1. secureHeaders — cabeceras de seguridad HTTP
 * 2. cors          — política de CORS
 * (los módulos de rutas se montarán aquí a medida que se desarrollen)
 */
const app = new Hono<{ Bindings: CloudflareBindings }>()

// ── Middlewares globales ──────────────────────────────────────────────────────

app.use('*', secureHeaders())

app.use(
  '*',
  cors({
    origin: '*', // TODO: restringir al dominio del frontend en producción
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (c) => {
  return c.json({
    status: 'success',
    message: 'KYC API is running',
    code: 200,
  })
})

// ── 404 handler ───────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json(
    {
      status: 'error',
      message: 'Resource not found',
      code: 404,
    },
    404
  )
})

// ── Error handler global ──────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('[GlobalError]', err)
  return c.json(
    {
      status: 'error',
      message: err.message ?? 'Internal server error',
      code: 500,
    },
    500
  )
})

export default app
