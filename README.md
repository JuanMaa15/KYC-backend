# KYC Backend

API de validación de identidad (Know Your Customer) construida con Hono.js y Cloudflare Workers.

## Stack

| Tecnología | Versión |
|------------|---------|
| Runtime | Cloudflare Workers (workerd) |
| Framework | Hono.js v4 |
| Lenguaje | TypeScript (strict) |
| ORM | Prisma 7 (adaptado a D1) |
| Base de datos | Cloudflare D1 (SQLite en local) |
| Almacenamiento | Cloudflare R2 |
| Validaciones | Zod |
| Documentación API | OpenAPI 3.1.0 + Swagger UI |
| Tests | Vitest + @vitest/coverage-v8 |
| Linter | ESLint |
| CI/CD | GitHub Actions |
| Git hooks | Husky v9 |

## Requisitos

- Node.js 24+
- npm
- Cuenta de Cloudflare (para D1, R2 y deploy)

## Instalación

```bash
git clone <repo>
cd backend
npm install
npm run db:generate
npm run dev
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor local |
| `npm run test` | Ejecuta tests |
| `npm run test:coverage` | Tests con reporte de cobertura (mín. 80%) |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm run db:generate` | Genera cliente Prisma |
| `npm run db:migrate` | Aplica migraciones a D1 |
| `npm run deploy` | Despliega a Cloudflare Workers |

## Arquitectura

Arquitectura modular en capas con inyección manual de dependencias:

```
Request → Router → Service → Prisma/D1
                    ↓
              StorageProvider (R2)
```

- **Router**: define rutas HTTP, valida entrada con Zod, delega al service
- **Service**: lógica de negocio, orquesta operaciones, lanza errores de dominio
- **StorageProvider**: abstracción sobre R2 para subida de archivos
- **Errores**: jerarquía de dominio (`AppError`, `BadRequestError`, `NotFoundError`, etc.) capturada por handler global

## Estructura de carpetas

```
src/
├── app.ts                        # Entry point Hono, middlewares globales, error handler
├── index.ts                      # Export para Cloudflare Workers
├── config/
│   └── env.ts                    # Variables de entorno e interfaces
├── database/
│   ├── prisma/
│   │   └── schema.prisma         # Schema Prisma
│   ├── generated/                # Cliente Prisma (generado, en .gitignore)
│   └── prismaService.ts          # Factory createPrismaClient(d1)
├── modules/
│   └── verifications/            # Módulo de verificación de identidad
│       ├── verification.schema.ts   # Schemas Zod y constantes
│       ├── verification.service.ts  # Lógica de negocio
│       └── verification.router.ts   # Rutas HTTP
├── providers/
│   └── storage.provider.ts       # Abstracción para R2
└── share/
    └── errors.ts                 # Jerarquía de errores de dominio

test/
└── verifications/                # Tests del módulo
    ├── verification.service.test.ts
    └── verification.router.test.ts

docs/                             # Documentación del proyecto
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/verifications` | Crear verificación con documentos (multipart) |
| GET | `/api/v1/verifications/:id` | Obtener verificación por ID |
| GET | `/health` | Health check |

## Documentación API

Una vez corriendo el servidor, acceder a:

- Swagger UI: `http://localhost:8787/docs`
- OpenAPI spec: `http://localhost:8787/api/specs`
