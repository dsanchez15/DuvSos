## ADDED Requirements

### Requirement: Daily progress logging
The system SHALL allow users to log daily progress with gym completion, sleep hours, study hours, work hours, and optional notes. Each entry is associated with a date.

#### Scenario: Log complete daily progress
- **WHEN** user submits { date: "2026-01-15", gymCompleted: true, sleepHours: 7.5, studyHours: 3, workHours: 1, notes: "Good session" }
- **THEN** system creates DailyProgress record for that date and user

#### Scenario: Log minimal progress
- **WHEN** user submits { date: "2026-01-15", gymCompleted: false, sleepHours: 6 }
- **THEN** system creates DailyProgress record with studyHours and workHours as null

### Requirement: Gym validation based on sleep
The system SHALL reject gym completion if the logged sleep hours are less than 7.

#### Scenario: Reject gym with insufficient sleep
- **WHEN** user submits { date: "2026-01-15", gymCompleted: true, sleepHours: 5.5 }
- **THEN** system returns 400 error with message "Gym requires at least 7 hours of sleep"

### Requirement: Daily progress retrieval by date range
The system SHALL return daily progress entries for a user within a specified date range.

#### Scenario: Get progress for date range
- **WHEN** user requests GET /api/progress/daily?startDate=2026-01-01&endDate=2026-01-31
- **THEN** system returns all DailyProgress entries for that user in January 2026

### Requirement: Daily progress summary
The system SHALL calculate summary statistics for a date range including total gym days, average sleep, and total study hours.

#### Scenario: Calculate monthly summary
- **WHEN** user requests summary for January 2026
- **THEN** response includes gymDays (count where gymCompleted true), avgSleep (average sleepHours), totalStudyHours

### Requirement: Progress linked to specific goal
The system SHALL optionally associate a daily progress entry with a goal.

#### Scenario: Link progress to goal
- **WHEN** user submits daily progress with goalId
- **THEN** system links the entry to the specified goal and increments goal's totalHoursSpent
