# Documentación de Dependencias — KYC Backend

Registro de todas las dependencias instaladas en el proyecto, organizadas por tipo, con su propósito y el comando de instalación utilizado.

---

## Dependencias de Producción

Instaladas con el scaffold inicial:

```bash
npm create hono@latest ./ -- --template cloudflare-workers --pm npm --install
```

| Paquete | Versión | Propósito |
|---|---|---|
| `hono` | ^4.12.27 | Framework web ultraligero para Cloudflare Workers y Web Standards |
| `wrangler` | ^4.4.0 | CLI oficial de Cloudflare para desarrollo local y deploy de Workers |

---

Instaladas con:

```bash
npm install zod @hono/zod-validator @prisma/client @prisma/adapter-d1
```

| Paquete | Versión | Propósito |
|---|---|---|
| `zod` | ^3.x | Validación de esquemas y entradas externas con TypeScript nativo |
| `@hono/zod-validator` | ^0.4.x | Middleware de Hono para integrar validación con Zod en las rutas |
| `@prisma/client` | ^6.x | Cliente del ORM Prisma para interactuar con la base de datos |
| `@prisma/adapter-d1` | ^6.x | Adapter oficial de Prisma para Cloudflare D1 (sin Node.js nativo) |

---

## Dependencias de Desarrollo

Instaladas con:

```bash
npm install -D prisma vitest @cloudflare/workers-types eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

| Paquete | Versión | Propósito |
|---|---|---|
| `prisma` | ^6.x | CLI de Prisma: genera el cliente, maneja migraciones y el schema |
| `vitest` | ^3.x | Test runner compatible con Vite/ESNext, usado para unit e integration tests |
| `@cloudflare/workers-types` | ^4.x | Tipos TypeScript de las APIs de Cloudflare Workers (D1Database, R2Bucket, etc.) |
| `eslint` | ^9.x | Linter estático para detectar errores y malas prácticas en el código |
| `@typescript-eslint/parser` | ^8.x | Parser que permite a ESLint entender la sintaxis TypeScript |
| `@typescript-eslint/eslint-plugin` | ^8.x | Reglas ESLint específicas para TypeScript (no-any, unused-vars, etc.) |

---

Instaladas con:

```bash
npm install -D @eslint/js typescript-eslint
```

| Paquete | Versión | Propósito |
|---|---|---|
| `@eslint/js` | ^9.x | Configuración base de ESLint recomendada (flat config) |
| `typescript-eslint` | ^8.x | Meta-paquete que unifica `@typescript-eslint/parser` + plugin para flat config |

---

Instaladas con:

```bash
npm install -D husky @vitest/coverage-v8@3.2.7
```

| Paquete | Versión | Propósito |
|---|---|---|
| `husky` | ^9.x | Gestor de hooks de Git para validar commits (formato del mensaje + calidad del código) |
| `@vitest/coverage-v8` | ^3.2.7 | Proveedor de cobertura para Vitest usando el motor nativo V8 de Node. Genera reportes y verifica thresholds |

> **Nota:** `@vitest/coverage-v8` se fijó en `3.2.7` porque versiones 4.x requieren `vitest` 4.x y el proyecto usa vitest 3.x.

---

## Notas

- **`@prisma/adapter-d1`**: Es necesario porque Cloudflare Workers no tiene acceso a Node.js nativo. Este adapter conecta Prisma directamente con el binding `D1Database` del contexto del Worker.
- **`@cloudflare/workers-types`**: Provee los tipos de `D1Database`, `R2Bucket`, `KVNamespace`, etc. Se inyectan vía `tsconfig.json` en la sección `types`.
- **`wrangler`**: Aunque es una dev dependency, también provee el runtime local (`wrangler dev`) que simula el entorno de Cloudflare Workers.
- Las versiones exactas se pueden ver en `package-lock.json`.
