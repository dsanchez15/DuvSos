## ADDED Requirements

### Requirement: Category table consolidates module-specific tables
The system SHALL migrate all records from `ChecklistCategory` and `TodoCategory` into the existing `Category` table. The `Category` model SHALL gain a `scopes` field (array of strings) that defines in which functionalities the category is visible. By default, a category is visible in all functionalities.

#### Scenario: Migrating checklist categories
- **WHEN** the migration runs
- **THEN** all `ChecklistCategory` records are inserted into `Category` with default scopes including all modules

#### Scenario: Migrating todo categories
- **WHEN** the migration runs
- **THEN** all `TodoCategory` records are inserted into `Category` with default scopes including all modules

### Requirement: Scopes control category visibility per functionality
The system SHALL use the `scopes` field to filter categories per functionality. A category is visible in a functionality if its `scopes` array is empty or contains that functionality's identifier.

#### Scenario: Category visible everywhere by default
- **WHEN** a category is created without specifying scopes
- **THEN** it appears in Todos, Checklists, Habits, and Study selectors

#### Scenario: Category excluded from a functionality
- **WHEN** user edits a category and removes "study" from its scopes
- **THEN** that category no longer appears in the Study question category selector

### Requirement: Module-specific category tables are removed
The system SHALL drop `ChecklistCategory` and `TodoCategory` tables after successful data migration into `Category`.

#### Scenario: Post-migration schema
- **WHEN** migration completes successfully
- **THEN** only `Category` exists for categories across all modules
