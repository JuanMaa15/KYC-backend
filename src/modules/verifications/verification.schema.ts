import { z } from 'zod'

export const createVerificationSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string({ required_error: 'El email es requerido' })
    .email('El email no es válido'),
  documentNumber: z
    .string({ required_error: 'El número de documento es requerido' })
    .min(1, 'El número de documento no puede estar vacío')
    .max(50, 'El número de documento no puede exceder 50 caracteres'),
})

export const verificationParamsSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
})

export type CreateVerificationDto = z.infer<typeof createVerificationSchema>
