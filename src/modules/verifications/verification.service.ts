import { PrismaClient, $Enums } from '@/database/generated/prisma/client'
import { NotFoundError } from '@/share/errors'
import type { CreateVerificationDto } from './verification.schema'

export class VerificationService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateVerificationDto) {
    return this.prisma.verification.create({
      data: {
        name: data.name,
        email: data.email,
        documentNumber: data.documentNumber,
        status: $Enums.VerificationStatus.pending,
      },
    })
  }

  async findById(id: string) {
    const verification = await this.prisma.verification.findUnique({ where: { id } })

    if (!verification) {
      throw new NotFoundError('Verificación no encontrada')
    }

    return verification
  }   
}
