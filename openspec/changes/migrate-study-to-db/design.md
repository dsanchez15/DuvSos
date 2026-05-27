## Context

The spaced repetition module (`src/lib/study/*`, `src/app/study/*`) currently persists all data in browser localStorage. There is no backend storage for questions, topics, sessions, or settings. The Prisma schema already contains robust models for todos, habits, checklists, reminders, and performance plans, but nothing for study data.

Additionally, the schema has three nearly identical category tables:
- `Category` (habits)
- `ChecklistCategory` (checklists)
- `TodoCategory` (todos)

Each has `id`, `name`, `color`, `icon`, `createdAt`, `userId`. This duplication complicates maintenance and prevents cross-module categorization.

## Goals / Non-Goals

**Goals:**
- Persist study questions, topics, sessions, and settings in PostgreSQL via Prisma.
- Consolidate `ChecklistCategory` and `TodoCategory` into the existing `Category` table with a `scopes` field for exclusion-based filtering.
- Centralize category creation in Settings only; remove inline category creation from all other modules.
- Provide REST API endpoints for study CRUD operations.
- Migrate existing localStorage study data to the database on first load after deployment.
- Backup the database before any schema migration.

**Non-Goals:**
- Real-time sync or offline support (out of scope; localStorage can act as a temporary cache if needed later).
- Changing the study UI/UX (functionality stays the same; only the data layer changes).
- Rewriting non-study frontend components (habits, checklists, todos) beyond category reference updates.

## Decisions

### 1. Reuse Existing Category Table with Scopes Field
- **Decision**: Migrate `ChecklistCategory` and `TodoCategory` data into the existing `Category` table. Add a `scopes` field (array of strings, e.g., `["habit","checklist","todo","study"]`) that controls in which functionalities a category is visible. By default, a category is visible in all functionalities.
- **Rationale**: Avoids creating a new table and leverages the existing `Category` model that already has the right structure. The `scopes` field acts as an exclusion list: if a module is not in `scopes`, the category is hidden from that module. This is more flexible than a single scope discriminator.
- **Alternative considered**: Create a new `UnifiedCategory` table with a `scope` enum. Rejected because the existing `Category` table already works and renaming would be unnecessary churn.

### 2. Category Creation Only in Settings
- **Decision**: Remove inline category creation from Todos, Checklists, Habits, Study, and all other modules. The only place to create, edit, or delete categories is the Settings page.
- **Rationale**: Centralizes category management, prevents duplicate category names across modules, and simplifies the UI in individual features. Users can still assign existing categories anywhere.
- **Alternative considered**: Keep inline creation but redirect to Settings. Rejected because it adds friction without benefit; a simple category selector dropdown is sufficient in feature pages.

### 3. Study Models Aligned with Existing localStorage Types
- **Decision**: Mirror the existing `Question`, `StudyTopic`, `StudySession`, `SessionResult`, and `StudySettings` TypeScript interfaces in Prisma models.
- **Rationale**: Minimizes frontend refactoring. The API responses can directly replace localStorage objects.
- **Alternative considered**: Redesign the study domain model. Rejected to keep scope manageable and avoid UI rewrites.

### 4. Server-Side API Routes Instead of Direct Prisma Calls from Frontend
- **Decision**: Create Next.js API routes (`/api/study/questions`, `/api/study/sessions`, etc.) that wrap Prisma Client.
- **Rationale**: Maintains the existing architecture pattern used by todos, habits, and checklists. Enables auth middleware and validation in one place.

### 5. One-Time Data Migration on Frontend Boot
- **Decision**: After deployment, the frontend checks localStorage for study data. If found, it POSTs the data to the new API endpoints and then clears localStorage.
- **Rationale**: Zero-downtime migration for users. No complex database migration scripts needed for localStorage → DB transfer.
- **Alternative considered**: CLI script to import from browser exports. Rejected because it requires user action; auto-migration is seamless.

### 6. Database Backup Before Migration
- **Decision**: Use `pg_dump` to create a full backup before running `prisma migrate dev`.
- **Rationale**: Schema changes (dropping `ChecklistCategory`, `TodoCategory`) are destructive. A backup allows rollback.

## Risks / Trade-offs

- **[Risk] Data loss during category consolidation** → Mitigation: Backup before migration. Write a Prisma transaction that reads `ChecklistCategory` and `TodoCategory`, inserts into `Category`, updates foreign keys, and only then drops old tables.
- **[Risk] localStorage migration fails for large datasets** → Mitigation: Batch the POST requests (e.g., 50 questions at a time) with retry logic.
- **[Risk] Breaking changes in API routes for todos/checklists/habits** → Mitigation: Update all route handlers in the same PR to use `Category`. Run full test suite before merge.
- **[Risk] Frontend services tightly coupled to localStorage shape** → Mitigation: Keep the service function signatures identical; only swap the internal storage mechanism for API calls.

## Migration Plan

1. **Pre-migration**: Run `pg_dump` to backup the database.
2. **Schema**: Add `scopes` field to `Category`; add study models to Prisma schema; remove `ChecklistCategory` and `TodoCategory`.
3. **Data migration script**: Create a Prisma script that copies `ChecklistCategory` and `TodoCategory` into `Category` with default `scopes` including all modules.
4. **API routes**: Update existing `/api/*` routes to use `Category`. Create new `/api/study/*` routes.
5. **Frontend services**: Replace localStorage calls with `fetch()` to new API routes.
6. **localStorage migration**: Add a one-time boot check in the study layout/page that uploads localStorage data to the API.
7. **Cleanup**: After confirming data integrity, drop old category tables and remove localStorage migration code in a follow-up release.

## Open Questions

- Should `Category` support nesting (parent/child) globally, or should tree behavior be module-specific? Current `TodoCategory` supports nesting; `Category` and `ChecklistCategory` do not.
- Should study settings be per-user or global? Currently stored per-browser (localStorage), implying per-user is correct.
- How should the `ImportSummary` from JSON imports be handled server-side? Should it return the same structure via API?
