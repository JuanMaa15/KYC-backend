import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VerificationService } from '@/modules/verifications/verification.service'
import { NotFoundError } from '@/share/errors'

const mockVerification = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Juan',
  email: 'juan@test.com',
  documentNumber: '12345678',
  urlDocumentImage: null,
  urlSelfieImage: null,
  status: 'pending',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

const mockPrisma = {
  verification: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}

describe('VerificationService', () => {
  let service: VerificationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new VerificationService(mockPrisma as any)
  })

  describe('create', () => {
    it('debería crear una verificación con estado pending', async () => {
      mockPrisma.verification.create.mockResolvedValue(mockVerification)

      const result = await service.create({
        name: 'Juan',
        email: 'juan@test.com',
        documentNumber: '12345678',
      })

      expect(mockPrisma.verification.create).toHaveBeenCalledWith({
        data: {
          name: 'Juan',
          email: 'juan@test.com',
          documentNumber: '12345678',
          status: 'pending',
        },
      })
      expect(result).toEqual(mockVerification)
    })
  })

  describe('findById', () => {
    it('should return verification when found', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue(mockVerification)

      const result = await service.findById('550e8400-e29b-41d4-a716-446655440000')

      expect(mockPrisma.verification.findUnique).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
      })
      expect(result).toEqual(mockVerification)
    })

    it('should throw NotFoundError when not found', async () => {
      mockPrisma.verification.findUnique.mockResolvedValue(null)

      await expect(
        service.findById('550e8400-e29b-41d4-a716-446655440000')
      ).rejects.toThrow(NotFoundError)
    })
  })
})
