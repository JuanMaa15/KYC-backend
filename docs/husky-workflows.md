# Husky y GitHub CI/CD

## Husky — Hooks de Git

Husky gestiona los hooks de Git para garantizar calidad antes de cada commit.

### Hooks configurados

| Hook | Archivo | Qué hace |
|------|---------|----------|
| `pre-commit` | `.husky/pre-commit` | Ejecuta `typecheck` → `lint` → `test`. Si alguno falla, el commit se cancela. |
| `commit-msg` | `.husky/commit-msg` | Valida que el mensaje siga el formato `type(category): mensaje`. |

### Formato de commit válido

```
type(category): mensaje
```

**Types permitidos:** `chore`, `feat`, `refactor`, `fix`

**Ejemplos:**

```
feat(core): agregar endpoint de verificación
fix(database): corregir nombre de columna en migration
chore(deps): actualizar vitest a 3.2.7
refactor(api): extraer lógica de validación a servicio
```

### ¿Cómo funciona?

Husky v9 usa el sistema nativo de hooks de Git (`.git/hooks/`). Se activa automáticamente al ejecutar `npm install` gracias al script `prepare` en `package.json`:

```json
"scripts": {
  "prepare": "husky"
}
```

Si alguien clona el repo y ejecuta `npm install`, Husky se configura solo.

---

## GitHub CI/CD — Workflows

### Workflow: `CI`

**Archivo:** `.github/workflows/ci.yml`

**Trigger:**

- Push a `main` o `develop`
- Pull request hacia `main` o `develop`

**Job: `quality`**

Se ejecuta en `ubuntu-latest` con Node.js 24 y realiza estos pasos en orden:

| Paso | Comando | Propósito |
|------|---------|-----------|
| 1 | `actions/checkout@v4` | Clona el repositorio |
| 2 | `actions/setup-node@v4` | Configura Node.js con caché de npm |
| 3 | `npm ci` | Instala dependencias exactas (versión bloqueada) |
| 4 | `npm run db:generate` | Genera el cliente de Prisma |
| 5 | `npm run typecheck` | Verifica tipos de TypeScript |
| 6 | `npm run lint` | Ejecuta ESLint |
| 7 | `npm run test:coverage` | Ejecuta tests y verifica cobertura ≥ 80% |
| 8 | `upload-artifact` | Sube el reporte de cobertura |

**Nota:** El paso `db:generate` es necesario porque `src/generated/` está en `.gitignore`. En CI hay que regenerar el cliente de Prisma.

### Cobertura mínima

Definida en el script `test:coverage` de `package.json` mediante flags de CLI:

```bash
vitest run --coverage \
  --coverage.include="src/**" \
  --coverage.exclude="**/generated/**" \
  --coverage.thresholds.statements=80 \
  --coverage.thresholds.branches=80 \
  --coverage.thresholds.functions=80 \
  --coverage.thresholds.lines=80
```

- **include:** solo mide código dentro de `src/` (el negocio)
- **exclude:** excluye `src/generated/` (código autogenerado por Prisma)
- **thresholds:** cada métrica (statements, branches, functions, lines) debe superar el 80%

Si la cobertura baja del 80% en cualquier métrica, el workflow falla.

### Estado actual

En esta fase inicial (Fase 1 completa, Fase 2 —módulo Verifications— pendiente) no hay tests que cubran el código fuente, por lo que `npm run test:coverage` falla con cobertura 0%. Esto es **esperado**. El pipeline se pondrá verde automáticamente cuando los tests del módulo Verifications (Fase 2) superen el 80% de cobertura.

---

## Resumen visual del flujo

```
Commit (local)
  │
  ├─ Husky pre-commit
  │   ├─ typecheck ── pasa?
  │   ├─ lint ─────── pasa?
  │   └─ test ─────── pasa?
  │         │
  │         └─ ❌ No → se cancela el commit
  │
  └─ Husky commit-msg
      └─ Formato "type(category): msg"?
          ├─ ❌ No → se cancela el commit
          └─ ✅ Sí → commit creado

Push / PR (GitHub)
  │
  └─ CI workflow
      ├─ npm ci
      ├─ db:generate
      ├─ typecheck
      ├─ lint
      └─ test:coverage (thresholds ≥ 80%)
          ├─ ❌ No → workflow falla (rojo)
          └─ ✅ Sí → workflow pasa (verde)
```
