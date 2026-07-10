import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { validator, describeRoute } from 'hono-openapi'
import { resolver } from 'hono-openapi'
import { createPrismaClient } from '@/database/prismaService'
import { StorageProvider } from '@/providers/storage.provider'
import { VerificationService } from './verification.service'
import {
  createVerificationSchema,
  verificationParamsSchema,
  updateStatusSchema,
  verificationResponseSchema,
  errorResponseSchema,
} from './verification.schema'
import { BadRequestError } from '@/share/errors'
import type { Env } from '@/config/env'
import { z } from 'zod'

const app = new Hono<{ Bindings: Env }>()

app.post(
  '/',
  describeRoute({
    tags: ['Verifications'],
    summary: 'Crear verificación con documentos',
    description: 'Crea una nueva verificación de identidad subiendo los datos personales, la foto del documento y una selfie. Los archivos se almacenan en R2 y la verificación queda en estado pending.',
    requestBody: {
    required: true,
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['name', 'email', 'documentNumber', 'documentImage', 'selfieImage'],
          properties: {
            name:           { type: 'string', maxLength: 100, example: 'Juan Manuel' },
            email:          { type: 'string', format: 'email', example: 'juan@test.com' },
            documentNumber: { type: 'string', maxLength: 50, example: '123456789' },
            documentImage:  { type: 'string', format: 'binary', description: 'JPEG/PNG, máx 10 MB' },
            selfieImage:    { type: 'string', format: 'binary', description: 'JPEG/PNG, máx 10 MB' },
          },
        },
      },
    },
  },
    responses: {
      201: {
        description: 'Verificación creada exitosamente',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                status: z.literal('success'),
                message: z.string(),
                data: verificationResponseSchema,
                code: z.literal(201),
              })
            ),
          },
        },
      },
      400: {
        description: 'Datos inválidos o archivos no cumplen requisitos (tipo/tamaño)',
        content: {
          'application/json': {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const form = await c.req.parseBody()

    const parsed = createVerificationSchema.safeParse({
      name: form['name'],
      email: form['email'],
      documentNumber: form['documentNumber'],
    })
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0].message)
    }

    const documentImage = form['documentImage'] as File
    const selfieImage = form['selfieImage'] as File

    const prisma = createPrismaClient(c.env.DB)
    const storage = new StorageProvider(c.env.KYC_BUCKET)
    const service = new VerificationService(prisma, storage)
    const verification = await service.create(parsed.data, { documentImage, selfieImage })

    return c.json(
      { status: 'success', message: 'Verificación creada', data: verification, code: 201 },
      201
    )
  }
)

app.get(
  '/:id',
  validator('param', verificationParamsSchema),
  describeRoute({
    tags: ['Verifications'],
    summary: 'Obtener verificación por ID',
    description: 'Devuelve los datos de una verificación. Si la verificación está en pending y pasaron más de 10 segundos desde su creación, se resuelve automáticamente (approved/rejected) antes de devolverla.',
    responses: {
      200: {
        description: 'Verificación encontrada',
        content: {
          'application/json': {
            schema: resolver(
              z.object({
                status: z.literal('success'),
                message: z.string(),
                data: verificationResponseSchema,
                code: z.literal(200),
              })
            ),
          },
        },
      },
      400: {
        description: 'ID no es un UUID válido',
        content: {
          'application/json': {
            schema: resolver(errorResponseSchema),
          },
        },
      },
      404: {
        description: 'Verificación no encontrada',
        content: {
          'application/json': {
            schema: resolver(errorResponseSchema),
          },
        },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const prisma = createPrismaClient(c.env.DB)
    const storage = new StorageProvider(c.env.KYC_BUCKET)
    const service = new VerificationService(prisma, storage)
    const verification = await service.findById(id)
    return c.json(
      { status: 'success', message: 'Verificación encontrada', data: verification, code: 200 },
      200
    )
  }
)

app.patch(
  '/:id/status',
  zValidator('param', verificationParamsSchema),
  zValidator('json', updateStatusSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { status } = c.req.valid('json')
    const prisma = createPrismaClient(c.env.DB)
    const storage = new StorageProvider(c.env.KYC_BUCKET)
    const service = new VerificationService(prisma, storage)
    const verification = await service.updateStatus(id, status)
    return c.json(
      { status: 'success', message: 'Estado actualizado', data: verification, code: 200 },
      200
    )
  }
)

export default app
