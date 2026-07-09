/**
 * Variables de entorno y constantes de la aplicación.
 
 */
export interface Env {
  /** Entorno de ejecución: development | production */
  ENVIRONMENT: string
  /** Binding de la base de datos D1 — se configurará en wrangler.jsonc */
  DB: D1Database
  /** Binding del bucket R2 para almacenamiento de imágenes */
  KYC_BUCKET: R2Bucket
/** URL de la app frontend */
  FRONTEND_URL: string
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
