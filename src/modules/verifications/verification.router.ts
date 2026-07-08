import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createPrismaClient } from '@/database/prismaService'
import { StorageProvider } from '@/providers/storage.provider'
import { VerificationService } from './verification.service'
import { createVerificationSchema, verificationParamsSchema } from './verification.schema'
import { BadRequestError } from '@/share/errors'
import type { Env } from '@/config/env'

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
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
})

app.get('/:id', zValidator('param', verificationParamsSchema), async (c) => {
  const { id } = c.req.valid('param')
  const prisma = createPrismaClient(c.env.DB)
  const storage = new StorageProvider(c.env.KYC_BUCKET)
  const service = new VerificationService(prisma, storage)
  const verification = await service.findById(id)
  return c.json(
    { status: 'success', message: 'Verificación encontrada', data: verification, code: 200 },
    200
  )
})

export default app
