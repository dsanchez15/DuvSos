## MODIFIED Requirements

### Requirement: User can create categories with metadata
The system SHALL allow users to create categories with a name, color (hex), icon, and description. Categories are visible across all functionalities by default unless explicitly excluded via the `scopes` field.

#### Scenario: Creating a category in Settings
- **WHEN** user creates a category in the Settings page
- **THEN** the category is saved in the `Category` table and is visible in all functionalities by default

### Requirement: Categories can be nested
The system SHALL support hierarchical categories where a category can have a parent category.

#### Scenario: Creating nested category
- **WHEN** user creates a category with parent_id pointing to another category
- **THEN** the category is displayed in a tree structure in the Settings page

### Requirement: Tasks can be assigned to categories
The system SHALL allow assigning a category to a task, checklist, habit, or study question. Any category from the `Category` table can be assigned unless its `scopes` explicitly excludes that functionality.

#### Scenario: Assigning category to task
- **WHEN** user assigns a category to a todo
- **THEN** the todo is associated with that category, provided the category's scopes include "todo"

### Requirement: Default category for unassigned tasks
The system SHALL provide a default "General" category for items without category assignment. The default category has empty scopes, making it visible everywhere.

#### Scenario: Default category assignment
- **WHEN** a todo is created without a category
- **THEN** the todo is assigned to the default "General" category

### Requirement: Category creation is centralized in Settings
The system SHALL only allow creating, editing, and deleting categories from the Settings page. All other modules (Todos, Checklists, Habits, Study) SHALL only display a category selector dropdown without creation capability.

#### Scenario: Creating category from Todo page
- **WHEN** user is on the Todo page and needs a new category
- **THEN** there is no "Create category" option; user must go to Settings to create it

#### Scenario: Selecting category in Study
- **WHEN** user is creating a study question
- **THEN** a dropdown shows existing categories filtered by scopes, with no option to create a new one inline

## REMOVED Requirements

### Requirement: Module-specific category tables
**Reason**: Replaced by consolidating into the existing `Category` table with scopes-based filtering.
**Migration**: All existing category data from `ChecklistCategory` and `TodoCategory` is automatically migrated to `Category` during deployment.

### Requirement: Inline category creation in feature pages
**Reason**: Centralized in Settings to prevent duplication and inconsistent naming.
**Migration**: Remove "Add new category" buttons and modals from Todos, Checklists, Habits, and Study pages. Users navigate to Settings to manage categories.
