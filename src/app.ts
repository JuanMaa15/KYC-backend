import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { API_PREFIX } from '@/config/env'
import { AppError } from '@/share/errors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import verificationRouter from '@/modules/verifications/verification.router'


/**
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

// ── Módulos de negocio ────────────────────────────────────────────────────────

app.route(`${API_PREFIX}/verifications`, verificationRouter)

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
  // Errores de dominio conocidos → responden con su código y mensaje
  if (err instanceof AppError) {
    return c.json(
      { status: 'error', message: err.message, code: err.statusCode },
      err.statusCode as ContentfulStatusCode
    )
  }

  // Errores inesperados → se loguean completos, pero al cliente solo un genérico
  console.error('[GlobalError]', err)
  return c.json(
    { status: 'error', message: 'Internal server error', code: 500 },
    500
  )
})

export default app
