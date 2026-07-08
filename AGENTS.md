# KYC
Proyecto de validación de identidad (KYC)

## Stack
- Lenguaje: TypeScript estricto
- Framework / runtime: hono.js
- ORM: Prisma 7
- Base de datos: Cloudflare D1
- Tests: Vitest
- Deploy: Cloudfare Workers
- Dockerfile
- Validaciones: zod
- linter: eslint

## Comandos
- `npm run dev` — arranca el servidor en local
- `npm run test` — ejecuta los tests (deben pasar antes de cada
commit)
- `npm run dev` — arranca el servidor en local
- `npm run db:migrate` — aplica migraciones a D1
- `npm run deploy` — despliega a cloudflare workers

## Estructura del proyecto
- `src/modules` — Aca van los modulos del negocio que construyen la aplicacion (controller, service, dto, interfaces, etc)
- `src/share` — Aca van las funciones o herramientas compartidas en toda la aplicacion (funciones reutilizables, manejo de errores)
- `src/database` — Contienen toda la configuracion del ORM y la conexion con la base de datos (prismaService, migraciones, esquema prisma)
- `src/generated` - Codigo generado por prisma
- `src/config` — Configuracion de la variables de entorno y las variables que son constantes
- `test/` - Pruebas de integracion y unitarias
- `husky/` - Validar commit antes de subir. Antes de subir un commit revisar que los test pasan y el mensaje cumple con la estructura type(category): mensaje 
- `github/` - Workflows CD/CI - Tests, % de cobertura cumplida ( > 80% )
- `docs/` - Documentacion del proyecto


## Convenciones
- variables, metodos, atributos con camelCase (nombreMetodo, nombreVariable)
- Clases con pascalcase (MiClase)
- Flujo de dependencias: controller -> service -> acceso a datos 
- Entradas externas se validan con zod
- Respuestas de peticiones: { status: success - error, message:, data (en caso de devolver algo), code: (200,400,404) }
- Rutas API: Rest, recursos en plural (/api/examples)
- Ramas git: main (produccion), develop (desarrollo), feature/ (Nuevas funcionalidades), fix/ (Correcion de bugs)
- Estructura commits: type(category): mensaje  -  Los "type" pueden ser chore (configuracion), feat (nuevo), refactor(refactorizacion), fix(arreglo bug)
-  
## No hagas
- No instalar dependencias sin avisar.
- NO Descargar dependencias deprecadas.
- no usar `any` en TypeScript sin justificarlo.
- No hagas los commits sin yo antes confirmar que mensaje contienen

## Flujo de trabajo
- Antes de una tarea no trivial, propón un plan y espera mi OK.
- Una tarea a la vez; al terminar, dime qué cambiaste para que lo
revise.
- Si no estás seguro al 80%, pregunta. No inventes.

## Documentación
Arquitectura modular en capas
Codigo limpio y buenas practicas: SOLID, DRY, YAGNI, KISS
Endpoints a usar: POST / verifications  -   GET /verifications/:id
Seguridad: Middleware Rate limiting, CORS,  Middleware secure-headers
Validaciones de campos con zod

Flujo de cliente para tener en cuenta: 
1. Datos -> 2. Foto documento -> 3. Selfie -> 4. Enviar y revisar

## Base de datos
Verifications {
  "id": "uuid",
  "name": "Juan",
  "email": "juan@test.com",
  "documentNumber": "123",
  "urlDocumentImage": "https://...."  R2
  "urlSelfieImage": "https://...."    R2
  "status": "pending" | "approved" | "rejected"
  "createdAt": datetime
  "updatedAt": datetime 
}