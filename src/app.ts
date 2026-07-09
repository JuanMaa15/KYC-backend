import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { swaggerUI } from '@hono/swagger-ui'
import { openAPIRouteHandler, describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi'
import { z } from 'zod'
import { API_PREFIX, API_VERSION } from '@/config/env'
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
  '*', (c, next) =>
  cors({
    origin:  c.env.FRONTEND_URL, // TODO: restringir al dominio del frontend en producción
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next)
)

// ── Health check ──────────────────────────────────────────────────────────────

const healthResponseSchema = z.object({
  status: z.literal('success'),
  message: z.string(),
  code: z.literal(200),
})

app.get(
  '/health',
  describeRoute({
    tags: ['Health'],
    summary: 'Health check',
    description: 'Verifica que la API esta funcionando correctamente.',
    responses: {
      200: {
        description: 'API operativa',
        content: {
          'application/json': {
            schema: resolver(healthResponseSchema),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json({
      status: 'success',
      message: 'KYC API is running',
      code: 200,
    })
  }
)

// ── Módulos de negocio ────────────────────────────────────────────────────────

app.route(`${API_PREFIX}/verifications`, verificationRouter)

// ── Documentación OpenAPI ─────────────────────────────────────────────────────

app.get(
  '/api/specs',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'KYC API',
        version: API_VERSION,
        description: 'API de validacion de identidad (KYC). Permite crear verificaciones con subida de documentos y selfies, consultar su estado y resolverlas automatica o manualmente.',
      },
      servers: [
        {
          url: 'http://localhost:8787',
          description: 'Desarrollo local',
        },
      ],
      tags: [
        { name: 'Verifications', description: 'Operaciones de verificacion de identidad' },
        { name: 'Health', description: 'Health check de la API' },
      ],
    },
  })
)

app.get('/docs', swaggerUI({ url: '/api/specs' }))

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
