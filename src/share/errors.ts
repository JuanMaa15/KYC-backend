/**
 * Jerarquía de errores de dominio compartidos en toda la aplicación.
 *
 * Convención del proyecto:
 * - Los servicios lanzan errores de dominio (subclases de AppError)
 * - Los handlers/controllers los capturan y los mapean a respuestas HTTP
 *
 * Estructura de respuesta de error:
 * { status: 'error', message: string, code: number }
 */

/**
 * Error base de la aplicación.
 * Todos los errores de dominio extienden de esta clase.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * 400 — La solicitud tiene datos inválidos o faltantes.
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST')
    this.name = 'BadRequestError'
  }
}

/**
 * 404 — El recurso solicitado no existe.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

/**
 * 409 — Conflicto: el recurso ya existe o hay un estado inconsistente.
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

/**
 * 422 — Los datos son sintácticamente correctos pero semánticamente inválidos.
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation error') {
    super(message, 422, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * 500 — Error interno del servidor.
 */
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
    this.name = 'InternalServerError'
  }
}
