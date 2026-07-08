import { PrismaClient, $Enums } from '@/database/generated/prisma/client'
import { NotFoundError, BadRequestError } from '@/share/errors'
import { StorageProvider } from '@/providers/storage.provider'
import { validateFile } from './verification.schema'
import type { CreateVerificationDto } from './verification.schema'

export class VerificationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StorageProvider,
  ) {}

  async create(
    data: CreateVerificationDto,
    files: { documentImage: File; selfieImage: File },
  ) {
    const { id, documentKey, selfieKey } = await this.validateAndUpload(files)

    return this.prisma.verification.create({
      data: {
        id,
        name: data.name,
        email: data.email,
        documentNumber: data.documentNumber,
        urlDocumentImage: documentKey,
        urlSelfieImage: selfieKey,
        status: $Enums.VerificationStatus.pending,
      },
    })
  }

  private async validateAndUpload(files: { documentImage: File; selfieImage: File }) {
    for (const [field, file] of Object.entries(files) as [string, File][]) {
      const error = validateFile(file, field as 'documentImage' | 'selfieImage')
      if (error) throw error
    }

    const id = crypto.randomUUID()
    const documentKey = `verifications/${id}/document.${this.getExtension(files.documentImage)}`
    const selfieKey = `verifications/${id}/selfie.${this.getExtension(files.selfieImage)}`

    await Promise.all([
      this.storage.upload(documentKey, files.documentImage),
      this.storage.upload(selfieKey, files.selfieImage),
    ])

    return { id, documentKey, selfieKey }
  }

  async findById(id: string) {
    const verification = await this.prisma.verification.findUnique({ where: { id } })

    if (!verification) {
      throw new NotFoundError('Verificación no encontrada')
    }

    return verification
  }

  async updateStatus(id: string, newStatus: 'approved' | 'rejected') {
    const allowedStatuses = Object.values($Enums.VerificationStatus).filter(
      (s) => s !== $Enums.VerificationStatus.pending
    )

    if (!allowedStatuses.includes(newStatus)) {
      throw new BadRequestError('El estado debe ser approved o rejected')
    }

    const verification = await this.prisma.verification.findUnique({ where: { id } })

    if (!verification) {
      throw new NotFoundError('Verificación no encontrada')
    }

    if (verification.status !== $Enums.VerificationStatus.pending) {
      throw new BadRequestError('Solo se pueden cambiar verificaciones en estado pending')
    }

    return this.prisma.verification.update({
      where: { id },
      data: { status: newStatus },
    })
  }

  private getExtension(file: File): string {
    return file.name.split('.').pop() || 'jpg'
  }
}
