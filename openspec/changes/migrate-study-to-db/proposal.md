## Why

The spaced repetition (study) module currently stores all questions, topics, sessions, and results in browser localStorage. This means user data is trapped in a single device, cannot sync across sessions, and is vulnerable to accidental loss. Additionally, the database schema has three separate category tables (`Category`, `ChecklistCategory`, `TodoCategory`) with identical structures, causing duplication and inconsistency. This change migrates study data to PostgreSQL, consolidates all category data into the existing `Category` table, and centralizes category management in Settings.

## What Changes

- **BREAKING**: Migrate all category data from `ChecklistCategory` and `TodoCategory` into the existing `Category` table.
- **BREAKING**: Drop `ChecklistCategory` and `TodoCategory` models from Prisma schema.
- **BREAKING**: Add a `scopes` field to `Category` (array of module names) to optionally exclude categories from specific functionalities. By default, a category is visible everywhere.
- **BREAKING**: Update all foreign keys and API routes referencing `ChecklistCategory` and `TodoCategory` to use `Category`.
- **BREAKING**: Remove inline category creation from Todos, Checklists, Habits, Study, and any other module. Category creation is only available in Settings.
- Add new Prisma models for the study module: `StudyQuestion`, `StudyTopic`, `StudySession`, `StudySessionAnswer`, and `StudySettings`.
- Create REST API routes under `/api/study/*` for CRUD operations on questions, topics, sessions, and settings.
- Replace `localStorage`-based services (`question-service.ts`, `topic-service.ts`, `session-service.ts`, `settings-store.ts`) with server-side API clients.
- Add a database backup and data-migration script before any schema change is applied.
- Remove unused or redundant tables identified during schema audit.

## Capabilities

### New Capabilities
- `study-question-management`: CRUD, import/export, and filtering of study questions stored in PostgreSQL.
- `study-session-management`: Spaced repetition session lifecycle, answer tracking, and result persistence in PostgreSQL.
- `unified-category-system`: Consolidate `ChecklistCategory` and `TodoCategory` into the existing `Category` table with a `scopes` field for exclusion-based filtering.

### Modified Capabilities
- `category-management`: Requirements change to centralize category creation in Settings only. Categories are visible across all modules by default, and `scopes` controls exclusion per functionality.

## Impact

- **Prisma schema**: `Category` model gains `scopes` field; `ChecklistCategory` and `TodoCategory` removed; study models added.
- **Database**: Requires migration with data transfer from `ChecklistCategory` and `TodoCategory` into `Category`; backup mandatory before execution.
- **API routes**: All `/api/todos`, `/api/checklists`, `/api/habits`, and new `/api/study` routes updated to use `Category`.
- **Frontend**: Category creation removed from Todos, Checklists, Habits, Study. Settings page becomes the single place to manage categories.
- **Frontend services**: `question-service.ts`, `topic-service.ts`, `session-service.ts`, `settings-store.ts` replaced by fetch-based API layer.
- **localStorage**: Study data keys (`aure-study-questions`, `aure-study-topics`, `aure-study-sessions`, `aure-study-results`, `aure-study-active-session`, `aure-study-settings`) become obsolete after migration.
