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

    // Si sigue pending y pasaron más de 10s desde su creación, se resuelve automáticamente
    if (verification.status === $Enums.VerificationStatus.pending) {
      const elapsed = Date.now() - verification.createdAt.getTime()
      if (elapsed > 10_000) {
        const verdict = this.determineVerdict(id)
        return this.prisma.verification.update({
          where: { id },
          data: { status: verdict },
        })
      }
    }

    return verification
  }

  // Veredicto determinístico basado en los primeros 2 caracteres hex del UUID:
  // si % 5 === 0 → rejected, sino → approved
  private determineVerdict(id: string) {
    const hex = id.replace(/-/g, '')
    const firstTwo = parseInt(hex.substring(0, 2), 16)
    return firstTwo % 5 === 0
      ? $Enums.VerificationStatus.rejected
      : $Enums.VerificationStatus.approved
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
