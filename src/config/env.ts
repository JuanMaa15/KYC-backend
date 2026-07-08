/**
 * Variables de entorno y constantes de la aplicación.
 *
 * En Cloudflare Workers las variables de entorno se acceden a través del
 * objeto `env` del contexto (c.env), no a través de process.env.
 * Este archivo centraliza las claves esperadas y sus tipos.
 *
 * Para desarrollo local, definirlas en `.dev.vars` (ignorado por git).
 */

/**
 * Bindings disponibles en el contexto del Worker.
 * Se extiende con la interfaz `CloudflareBindings` generada por wrangler.
 */
export interface Env {
  /** Entorno de ejecución: development | production */
  ENVIRONMENT: string
  /** Binding de la base de datos D1 — se configurará en wrangler.jsonc */
  DB: D1Database
}

/**
 * Nombre del Worker / aplicación.
 */
export const APP_NAME = 'kyc-backend' as const

/**
 * Versión actual de la API.
 */
export const API_VERSION = 'v1' as const

/**
 * Prefijo base de todas las rutas.
 * Ejemplo: /api/v1/verifications
 */
export const API_PREFIX = `/api/${API_VERSION}` as const
