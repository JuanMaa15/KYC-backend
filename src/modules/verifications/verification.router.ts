import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createPrismaClient } from '@/database/prismaService'
import { VerificationService } from './verification.service'
import { createVerificationSchema, verificationParamsSchema } from './verification.schema'
import type { Env } from '@/config/env'

const app = new Hono<{ Bindings: Env }>()

app.post('/', zValidator('json', createVerificationSchema), async (c) => {
  const data = c.req.valid('json')
  const prisma = createPrismaClient(c.env.DB)
  const service = new VerificationService(prisma)
  const verification = await service.create(data)
  return c.json(
    { status: 'success', message: 'Verificación creada', data: verification, code: 201 },
    201
  )
})

app.get('/:id', zValidator('param', verificationParamsSchema), async (c) => {
  const { id } = c.req.valid('param')
  const prisma = createPrismaClient(c.env.DB)
  const service = new VerificationService(prisma)
  const verification = await service.findById(id)
  return c.json(
    { status: 'success', message: 'Verificación encontrada', data: verification, code: 200 },
    200
  )
})

export default app
