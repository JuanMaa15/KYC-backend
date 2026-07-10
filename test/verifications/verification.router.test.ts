import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { AppError } from '@/share/errors'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import verificationRouter from '@/modules/verifications/verification.router'

const mockVerification = vi.hoisted(() => {
  const id = '550e8400-e29b-41d4-a716-446655440000'
  const now = new Date()
  return {
    id,
    name: 'Juan',
    email: 'juan@test.com',
    documentNumber: '12345678',
    urlDocumentImage: `verifications/${id}/document.jpg`,
    urlSelfieImage: `verifications/${id}/selfie.jpg`,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
})

const oldMockVerification = vi.hoisted(() => {
  const id = '550e8400-e29b-41d4-a716-446655440000'
  const oldDate = new Date('2026-01-01')
  return {
    ...mockVerification,
    createdAt: oldDate,
    updatedAt: oldDate,
  }
})

const mockPrisma = vi.hoisted(() => ({
  verification: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

const mockStorage = vi.hoisted(() => ({
  upload: vi.fn(),
}))

vi.mock('@/database/prismaService', () => ({
  createPrismaClient: vi.fn(() => mockPrisma),
}))

vi.mock('@/providers/storage.provider', () => ({
  StorageProvider: vi.fn(() => mockStorage),
}))

const mockEnv = {
  DB: {} as Record<string, unknown>,
  KYC_BUCKET: {} as Record<string, unknown>,
  ENVIRONMENT: 'test',
}

describe('Verification Router', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('550e8400-e29b-41d4-a716-446655440000')

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
    function buildForm(overrides?: Partial<Record<string, string | File>>) {
      const form = new FormData()
      form.append('name', overrides?.name ?? 'Juan')
      form.append('email', overrides?.email ?? 'juan@test.com')
      form.append('documentNumber', overrides?.documentNumber ?? '12345678')
      form.append('documentImage', overrides?.documentImage ?? new File(['fake'], 'doc.jpg', { type: 'image/jpeg' }))
      form.append('selfieImage', overrides?.selfieImage ?? new File(['fake'], 'selfie.jpg', { type: 'image/jpeg' }))
      return form
    }

    it('debería crear una verificación y devolver 201', async () => {
      mockPrisma.verification.create.mockResolvedValue(mockVerification)
      mockStorage.upload.mockResolvedValue('key')

      const res = await app.request('/api/v1/verifications', {
        method: 'POST',
        body: buildForm(),
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
        body: buildForm({ email: 'email-invalido' }),
      }, mockEnv)

      expect(res.status).toBe(400)
    })

    it('debería devolver 400 cuando faltan campos requeridos', async () => {
      const res = await app.request('/api/v1/verifications', {
        method: 'POST',
        body: new FormData(),
      }, mockEnv)

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/verifications/:id', () => {
    it('debería devolver la verificación sin cambios cuando está en pending y no pasaron 10s', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue(mockVerification)

      const res = await app.request(
        `/api/v1/verifications/${mockVerification.id}`,
        { method: 'GET' },
        mockEnv
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { data: { status: string } }
      expect(body.data.status).toBe('pending')
      expect(mockPrisma.verification.update).not.toHaveBeenCalled()
    })

    it('debería resolver automáticamente cuando pasaron más de 10s', async () => {
      const firstTwo = parseInt(mockVerification.id.replace(/-/g, '').substring(0, 2), 16)
      const expectedStatus = firstTwo % 5 === 0 ? 'rejected' : 'approved'
      const resolved = { ...oldMockVerification, status: expectedStatus }

      mockPrisma.verification.findUnique.mockResolvedValue(oldMockVerification)
      mockPrisma.verification.update.mockResolvedValue(resolved)

      const res = await app.request(
        `/api/v1/verifications/${mockVerification.id}`,
        { method: 'GET' },
        mockEnv
      )

      expect(res.status).toBe(200)
      const body = await res.json() as { data: { status: string } }
      expect(body.data.status).toBe(expectedStatus)
      expect(mockPrisma.verification.update).toHaveBeenCalledWith({
        where: { id: mockVerification.id },
        data: { status: expectedStatus },
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

  describe('PATCH /api/v1/verifications/:id/status', () => {
    it('debería cambiar el estado (sin auto-resolver) y devolver 200', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue(mockVerification)
      const updated = { ...mockVerification, status: 'approved' }
      mockPrisma.verification.update.mockResolvedValue(updated)

      const res = await app.request(
        `/api/v1/verifications/${mockVerification.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual({
        status: 'success',
        message: 'Estado actualizado',
        data: {
          ...updated,
          createdAt: mockVerification.createdAt.toISOString(),
          updatedAt: mockVerification.updatedAt.toISOString(),
        },
        code: 200,
      })
    })

    it('debería devolver 400 cuando la verificación ya fue resuelta (con token)', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue({ ...mockVerification, status: 'approved' })

      const res = await app.request(
        `/api/v1/verifications/${mockVerification.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          headers: { 'Content-Type': 'application/json' },
        },
        mockEnv
      )

      expect(res.status).toBe(400)
    })

    it('debería devolver 404 cuando la verificación no existe', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue(null)

      const res = await app.request(
        `/api/v1/verifications/${mockVerification.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
          headers: { 'Content-Type': 'application/json' },
        },
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
      const res = await app.request('/api/v1/verifications/id-invalido/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(res.status).toBe(400)
    })

    it('debería devolver 400 cuando el status no es válido', async () => {
      const res = await app.request(
        `/api/v1/verifications/${mockVerification.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'invalid-status' }),
          headers: { 'Content-Type': 'application/json' },
        }
      )

      expect(res.status).toBe(400)
    })
  })
})
