## ADDED Requirements

### Requirement: Study sessions are stored in PostgreSQL
The system SHALL persist study sessions, session answers, and session results in the database.

#### Scenario: Starting a study session
- **WHEN** user starts a review session
- **THEN** a StudySession record is created with config, status, and questionIds

#### Scenario: Answering a question in a session
- **WHEN** user submits an answer
- **THEN** a StudySessionAnswer record is created with questionId, userAnswer, correctAnswer, isCorrect, modeUsed, and timeSpent

#### Scenario: Completing a session
- **WHEN** user finishes all questions or abandons the session
- **THEN** the session status is updated and a SessionResult is calculated and stored

### Requirement: Active session is tracked per user
The system SHALL support exactly one active session per user at a time, stored in the StudySession table with status "active".

#### Scenario: Resuming an active session
- **WHEN** user navigates to the review page and has an active session
- **THEN** the active session is loaded from the database

#### Scenario: Starting a new session with an active one
- **WHEN** user starts a new session while another is active
- **THEN** the previous session is marked "abandoned" before creating the new one

### Requirement: Session results are queryable
The system SHALL allow retrieving session results with statistics (totalQuestions, correctCount, accuracyPercentage, totalTimeSpent).

#### Scenario: Viewing session history
- **WHEN** user opens the review history
- **THEN** all completed session results are returned ordered by completedAt desc
