## 1. Preparación y Backup

- [x] 1.1 Crear backup completo de la base de datos con `pg_dump` antes de cualquier cambio
- [x] 1.2 Verificar que el backup se puede restaurar correctamente
- [x] 1.3 Documentar el comando de backup y restauración en el change

## 2. Schema Prisma — Category Reuse

- [x] 2.1 Agregar campo `scopes` (array de strings, default: `["habit","checklist","todo","study"]`) al modelo `Category` existente
- [x] 2.2 Verificar que `Category` ya tiene los campos necesarios: id, name, color, icon, description, userId, createdAt
- [x] 2.3 Actualizar modelo `Checklist` para usar `Category` en lugar de `ChecklistCategory`
- [x] 2.4 Actualizar modelo `Todo` para usar `Category` en lugar de `TodoCategory`
- [x] 2.5 Mantener modelo `Habit` usando `Category` (sin cambios en la relación)
- [x] 2.6 Generar migración Prisma para agregar `scopes` a `Category`

## 3. Schema Prisma — Study Models

- [x] 3.1 Crear el enum `QuestionType` con valores: `multiple_choice`, `direct`
- [x] 3.2 Crear el modelo `StudyQuestion` con todos los campos del tipo Question
- [x] 3.3 Crear el modelo `StudyTopic` con campos: id, name, normalizedName, userId, createdAt
- [x] 3.4 Crear el enum `SessionStatus` con valores: `active`, `completed`, `abandoned`, `expired`
- [x] 3.5 Crear el modelo `StudySession` con campos: id, userId, config (JSON), status, startedAt, lastActivityAt, questionIds (JSON), currentIndex, answers (relación), totalTimeSpent
- [x] 3.6 Crear el modelo `StudySessionAnswer` con campos: id, sessionId, questionId, questionText, userAnswer, correctAnswer, isCorrect, modeUsed, timeSpent
- [x] 3.7 Crear el modelo `StudySettings` con campos: id, userId, showStudySection, maxQuestionsPerReview
- [x] 3.8 Generar migración Prisma para agregar todos los modelos de study

## 4. Migración de Datos de Categorías

- [x] 4.1 Crear script de migración que lea `ChecklistCategory` e inserte en `Category` con scopes por defecto (todas las funcionalidades)
- [x] 4.2 Crear script de migración que lea `TodoCategory` e inserte en `Category` con scopes por defecto
- [x] 4.3 Manejar conflictos de nombres duplicados entre tablas (ej: "General" existe en ambas) — agregar sufijo o merge
- [x] 4.4 Actualizar foreign keys en `Checklist` para apuntar a `Category`
- [x] 4.5 Actualizar foreign keys en `Todo` para apuntar a `Category`
- [x] 4.6 Ejecutar scripts de migración y verificar integridad de datos
- [x] 4.7 Crear migración Prisma para eliminar modelos `ChecklistCategory` y `TodoCategory`

## 5. API Routes — Study

- [x] 5.1 Crear `GET /api/study/questions` — listar preguntas con filtros (categoryId, topic, type, search)
- [x] 5.2 Crear `POST /api/study/questions` — crear nueva pregunta
- [x] 5.3 Crear `PUT /api/study/questions/:id` — actualizar pregunta
- [x] 5.4 Crear `DELETE /api/study/questions/:id` — eliminar pregunta
- [x] 5.5 Crear `POST /api/study/questions/import` — importar preguntas desde JSON
- [x] 5.6 Crear `GET /api/study/questions/export` — exportar todas las preguntas a JSON
- [x] 5.7 Crear `GET /api/study/topics` — listar temas únicos
- [x] 5.8 Crear `POST /api/study/sessions` — iniciar nueva sesión
- [x] 5.9 Crear `GET /api/study/sessions/active` — obtener sesión activa del usuario
- [x] 5.10 Crear `POST /api/study/sessions/:id/answers` — guardar respuesta de sesión
- [x] 5.11 Crear `PUT /api/study/sessions/:id/complete` — completar o abandonar sesión
- [x] 5.12 Crear `GET /api/study/sessions/results` — listar resultados históricos
- [x] 5.13 Crear `GET /api/study/settings` y `PUT /api/study/settings` — CRUD de configuración

## 6. API Routes — Categorías

- [x] 6.1 Actualizar `GET /api/todo-categories` para listar `Category` filtradas por scopes (excluir si "todo" no está en scopes)
- [x] 6.2 Eliminar `POST /api/todo-categories` — creación de categorías solo en Settings
- [x] 6.3 Actualizar `GET /api/habits/categories` para listar `Category` filtradas por scopes
- [x] 6.4 Actualizar `GET /api/checklist-categories` para listar `Category` filtradas por scopes
- [x] 6.5 Crear `GET /api/categories` — listar todas las categorías con soporte de filtro por scope
- [x] 6.6 Crear `POST /api/categories` — crear categoría (usado solo desde Settings)
- [x] 6.7 Crear `PUT /api/categories/:id` — actualizar categoría incluyendo scopes
- [x] 6.8 Actualizar todos los endpoints que reciben/retornan categorías para usar el modelo `Category`

## 7. Frontend Services — Study

- [x] 7.1 Reescribir `src/lib/study/question-service.ts` para usar API REST en lugar de localStorage
- [x] 7.2 Reescribir `src/lib/study/topic-service.ts` para usar API REST
- [x] 7.3 Reescribir `src/lib/study/session-service.ts` para usar API REST
- [x] 7.4 Reescribir `src/lib/study/settings-store.ts` para usar API REST
- [x] 7.5 Mantener firmas de funciones públicas iguales para minimizar cambios en componentes
- [x] 7.6 Actualizar `src/app/study/questions/page.tsx` para usar nuevo service
- [x] 7.7 Actualizar `src/app/study/review/page.tsx` para usar nuevo service
- [x] 7.8 Actualizar `src/app/settings/page.tsx` para usar nuevo service de settings

## 8. Frontend — Categorías y Settings

- [x] 8.1 Actualizar componentes de Todo para usar categorías desde `Category` (filtrar por scopes)
- [x] 8.2 Actualizar componentes de Checklist para usar categorías desde `Category`
- [x] 8.3 Actualizar componentes de Habit para usar categorías desde `Category`
- [x] 8.4 Actualizar componentes de Study para usar categorías desde `Category`
- [x] 8.5 Actualizar tipos TypeScript donde se referencian `TodoCategory`, `ChecklistCategory` a `Category`
- [x] 8.6 Eliminar botones/modales de "Crear categoría" de Todo, Checklist, Habit, Study
- [x] 8.7 Actualizar Settings para soportar CRUD de categorías con edición de scopes
- [x] 8.8 Agregar en Settings una vista de árbol o lista de categorías con checkboxes para scopes

## 9. Migración de localStorage a Base de Datos

- [x] 9.1 Crear hook `useStudyMigration` que detecte datos en localStorage
- [x] 9.2 Implementar lógica de subida batch (50 preguntas por request) con retry
- [x] 9.3 Subir temas, sesiones, resultados y settings desde localStorage
- [x] 9.4 Limpiar localStorage después de migración exitosa
- [x] 9.5 Mostrar indicador de progreso al usuario durante la migración
- [x] 9.6 Manejar errores de migración sin bloquear la app

## 10. Limpieza de Categorías Inline

- [x] 10.1 Identificar y eliminar modales/forms de creación de categorías en `src/app/todos`
- [x] 10.2 Identificar y eliminar modales/forms de creación de categorías en `src/app/checklists`
- [x] 10.3 Identificar y eliminar modales/forms de creación de categorías en `src/app/habits`
- [x] 10.4 Identificar y eliminar modales/forms de creación de categorías en `src/app/study`
- [x] 10.5 Reemplazar selectores de categoría por dropdown simple (sin opción de crear) en todos los módulos

## 11. Testing y Limpieza Final

- [x] 11.1 Actualizar tests unitarios de `question-service.test.ts` para mock de API
- [x] 11.2 Actualizar tests de `session-service.test.ts` para mock de API
- [x] 11.3 Crear tests de integración para nuevas API routes de study
- [x] 11.4 Ejecutar suite completa de tests (207 tests pasan)
- [x] 11.5 Verificar TypeScript sin errores en archivos modificados
- [x] 11.6 Verificar ESLint limpio en archivos modificados
- [x] 11.7 Eliminar claves obsoletas de localStorage después de confirmar migración exitosa
- [x] 11.8 Documentar cambios de schema en CHANGELOG o README de migrations
