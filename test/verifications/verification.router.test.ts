import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { AppError } from '@/share/errors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import verificationRouter from '@/modules/verifications/verification.router'

const mockVerification = vi.hoisted(() => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Juan',
  email: 'juan@test.com',
  documentNumber: '12345678',
  urlDocumentImage: null,
  urlSelfieImage: null,
  status: 'pending',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}))

const mockPrisma = vi.hoisted(() => ({
  verification: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}))

vi.mock('@/database/prismaService', () => ({
  createPrismaClient: vi.fn(() => mockPrisma),
}))

const mockEnv = {
  DB: {} as Record<string, unknown>,
  ENVIRONMENT: 'test',
}

describe('Verification Router', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()

    app = new Hono()
    app.route('/api/v1/verifications', verificationRouter)

    app.notFound((c) => {
      return c.json(
        { status: 'error', message: 'Resource not found', code: 404 },
        404
      )
    })

    app.onError((err, c) => {
      if (err instanceof AppError) {
        return c.json(
          { status: 'error', message: err.message, code: err.statusCode },
          err.statusCode as ContentfulStatusCode
        )
      }
      console.error('[GlobalError]', err)
      return c.json(
        { status: 'error', message: 'Internal server error', code: 500 },
        500
      )
    })
  })

  describe('POST /api/v1/verifications', () => {
    it('debería crear una verificación y devolver 201', async () => {
      mockPrisma.verification.create.mockResolvedValue(mockVerification)

      const res = await app.request('/api/v1/verifications', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Juan',
          email: 'juan@test.com',
          documentNumber: '12345678',
        }),
        headers: { 'Content-Type': 'application/json' },
      }, mockEnv)

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body).toEqual({
        status: 'success',
        message: 'Verificación creada',
        data: {
          ...mockVerification,
          createdAt: mockVerification.createdAt.toISOString(),
          updatedAt: mockVerification.updatedAt.toISOString(),
        },
        code: 201,
      })
    })

    it('debería devolver 400 cuando el email es inválido', async () => {
      const res = await app.request('/api/v1/verifications', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Juan',
          email: 'email-invalido',
          documentNumber: '12345678',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(400)
    })

    it('debería devolver 400 cuando faltan campos requeridos', async () => {
      const res = await app.request('/api/v1/verifications', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/verifications/:id', () => {
    it('debería devolver la verificación cuando existe', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue(mockVerification)

      const res = await app.request(
        `/api/v1/verifications/${mockVerification.id}`,
        { method: 'GET' },
        mockEnv
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        status: 'success',
        message: 'Verificación encontrada',
        data: {
          ...mockVerification,
          createdAt: mockVerification.createdAt.toISOString(),
          updatedAt: mockVerification.updatedAt.toISOString(),
        },
        code: 200,
      })
    })

    it('debería devolver 404 cuando no existe', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue(null)

      const res = await app.request(
        `/api/v1/verifications/550e8400-e29b-41d4-a716-446655440000`,
        { method: 'GET' },
        mockEnv
      )

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body).toEqual({
        status: 'error',
        message: 'Verificación no encontrada',
        code: 404,
      })
    })

    it('debería devolver 400 cuando el ID no es un UUID válido', async () => {
      const res = await app.request('/api/v1/verifications/id-invalido', {
        method: 'GET',
      })

      expect(res.status).toBe(400)
    })
  })
})
