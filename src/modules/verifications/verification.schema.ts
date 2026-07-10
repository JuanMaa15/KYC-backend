import { z } from 'zod'
import { BadRequestError } from '@/share/errors'

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const
export const ALLOWED_EXTENSIONS = ['.jpeg', '.jpg', '.png'] as const
export const MAX_FILE_SIZE = 10 * 1024 * 1024

export const createVerificationSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .trim()
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string({ required_error: 'El email es requerido' })
    .trim()
    .email('El email no es válido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .transform((v) => v.toLowerCase()),
  documentNumber: z
    .string({ required_error: 'El número de documento es requerido' })
    .trim()
    .min(1, 'El número de documento no puede estar vacío')
    .max(20, 'El número de documento no puede exceder 20 dígitos'),
})

export const verificationParamsSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
})

export const updateStatusSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    required_error: 'El estado es requerido',
    invalid_type_error: 'El estado debe ser approved o rejected',
  }),
})

// ── Schemas de respuesta para OpenAPI ─────────────────────────────────────────

export const verificationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  documentNumber: z.string(),
  urlDocumentImage: z.string().nullable(),
  urlSelfieImage: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.literal('success'),
    message: z.string(),
    data: dataSchema,
    code: z.number(),
  })

export const errorResponseSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  code: z.number(),
})

// ── Tipos derivados ───────────────────────────────────────────────────────────

export type CreateVerificationDto = z.infer<typeof createVerificationSchema>
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>

export type FileField = 'documentImage' | 'selfieImage'

export function validateFile(file: File, field: FileField): BadRequestError | null {
  if (!(file instanceof File) || file.size === 0) {
    return new BadRequestError(`El archivo ${field} es requerido`)
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return new BadRequestError(`El archivo ${field} debe ser JPEG o PNG`)
  }
  if (file.size > MAX_FILE_SIZE) {
    return new BadRequestError(`El archivo ${field} no puede superar los 10 MB`)
  }
  return null
}
