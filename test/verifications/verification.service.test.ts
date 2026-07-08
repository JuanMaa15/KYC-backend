import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VerificationService } from '@/modules/verifications/verification.service'
import { NotFoundError, BadRequestError } from '@/share/errors'

const mockUUID = '550e8400-e29b-41d4-a716-446655440000'

const mockVerification = {
  id: mockUUID,
  name: 'Juan',
  email: 'juan@test.com',
  documentNumber: '12345678',
  urlDocumentImage: `verifications/${mockUUID}/document.jpg`,
  urlSelfieImage: `verifications/${mockUUID}/selfie.jpg`,
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

const mockStorage = {
  upload: vi.fn(),
}

describe('VerificationService', () => {
  let service: VerificationService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID)
    service = new VerificationService(mockPrisma as any, mockStorage as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('create', () => {
    it('debería crear una verificación con los archivos subidos a R2', async () => {
      mockPrisma.verification.create.mockResolvedValue(mockVerification)
      mockStorage.upload.mockResolvedValue('key')

      const documentImage = new File(['fake-image'], 'document.jpg', { type: 'image/jpeg' })
      const selfieImage = new File(['fake-image'], 'selfie.jpg', { type: 'image/jpeg' })

      const result = await service.create(
        { name: 'Juan', email: 'juan@test.com', documentNumber: '12345678' },
        { documentImage, selfieImage },
      )

      expect(mockStorage.upload).toHaveBeenCalledTimes(2)
      expect(mockPrisma.verification.create).toHaveBeenCalledWith({
        data: {
          id: mockUUID,
          name: 'Juan',
          email: 'juan@test.com',
          documentNumber: '12345678',
          urlDocumentImage: `verifications/${mockUUID}/document.jpg`,
          urlSelfieImage: `verifications/${mockUUID}/selfie.jpg`,
          status: 'pending',
        },
      })
      expect(result).toEqual(mockVerification)
    })

    it('debería lanzar error si el archivo no es JPEG o PNG', async () => {
      const documentImage = new File(['fake'], 'document.gif', { type: 'image/gif' })
      const selfieImage = new File(['fake'], 'selfie.jpg', { type: 'image/jpeg' })

      await expect(
        service.create(
          { name: 'Juan', email: 'juan@test.com', documentNumber: '12345678' },
          { documentImage, selfieImage },
        )
      ).rejects.toThrow(BadRequestError)
    })

    it('debería lanzar error si el archivo supera los 10 MB', async () => {
      const bigBuffer = new ArrayBuffer(11 * 1024 * 1024)
      const documentImage = new File([bigBuffer], 'document.jpg', { type: 'image/jpeg' })
      const selfieImage = new File(['fake'], 'selfie.jpg', { type: 'image/jpeg' })

      await expect(
        service.create(
          { name: 'Juan', email: 'juan@test.com', documentNumber: '12345678' },
          { documentImage, selfieImage },
        )
      ).rejects.toThrow(BadRequestError)
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
