/**
 * Servicio de conexión a Prisma con Cloudflare D1.
 *
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
