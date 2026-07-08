import app from './app'

/**
 * Entry point del Worker de Cloudflare.
 * Re-exporta la instancia de Hono que maneja todas las peticiones.
 * Wrangler detecta el `export default` y lo conecta al runtime de Workers.
 */
export default app
