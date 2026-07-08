/**
 * Servicio de conexión a Prisma con Cloudflare D1.
 *
 * Cloudflare Workers no soporta el cliente estándar de Prisma porque
 * no tiene acceso a Node.js nativo. En su lugar usamos:
 *   - `@prisma/adapter-d1`: adapter oficial de Prisma para D1
 *   - `PrismaClient` con `.$extends({})` para Workers
 *
 * Uso en handlers:
 *   const prisma = createPrismaClient(c.env.DB)
 *
 * IMPORTANTE: En Workers no existe un singleton global de conexión.
 * Cada petición crea su instancia usando el binding D1 del contexto.
 */

import { PrismaClient } from './generated/prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

/**
 * Crea y retorna una instancia de PrismaClient conectada al binding D1.
 *
 * @param d1 - Binding D1Database del contexto de Cloudflare Workers (c.env.DB)
 * @returns Instancia configurada de PrismaClient
 */
export function createPrismaClient(d1: D1Database): PrismaClient {
  const adapter = new PrismaD1(d1)
  return new PrismaClient({ adapter })
}
