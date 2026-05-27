## ADDED Requirements

### Requirement: Study questions are stored in PostgreSQL
The system SHALL persist study questions in the database with the same fields as the current localStorage model: id, question text, categoryId, topic, type, directAnswer, options, correctOptionIndex, supportsBothModes, createdAt, updatedAt.

#### Scenario: Creating a study question
- **WHEN** user creates a study question via POST /api/study/questions
- **THEN** the question is saved in the StudyQuestion table

#### Scenario: Retrieving study questions
- **WHEN** user loads the study questions page
- **THEN** the system fetches all questions from PostgreSQL via GET /api/study/questions

### Requirement: Study questions support filtering
The system SHALL support filtering study questions by categoryId, topic, type, supportsBothModes, and search text.

#### Scenario: Filtering by topic
- **WHEN** user selects a topic filter
- **THEN** only questions matching that topic are returned

#### Scenario: Filtering by question type
- **WHEN** user selects "multiple-choice" or "direct" filter
- **THEN** only questions of that type are returned

### Requirement: Study questions can be imported from JSON
The system SHALL accept a JSON array of question objects via POST /api/study/questions/import and persist valid entries, returning an ImportSummary.

#### Scenario: Importing valid questions
- **WHEN** user uploads a JSON file with valid questions
- **THEN** all valid questions are saved and a summary of imported/ignored items is returned

#### Scenario: Importing invalid questions
- **WHEN** user uploads a JSON file with missing required fields or invalid categoryIds
- **THEN** invalid entries are ignored with error details in the summary

### Requirement: Study questions can be exported to JSON
The system SHALL provide an endpoint GET /api/study/questions/export that returns all questions as a JSON array.

#### Scenario: Exporting questions
- **WHEN** user clicks "Export"
- **THEN** a JSON file containing all questions is downloaded
