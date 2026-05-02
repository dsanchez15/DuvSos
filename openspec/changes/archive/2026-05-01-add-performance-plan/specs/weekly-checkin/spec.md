## ADDED Requirements

### Requirement: Weekly check-in submission
The system SHALL allow users to submit a weekly check-in with week start date, fatigue level (1-5), completed hours, deviations text, and adjustment notes.

#### Scenario: Submit check-in for week
- **WHEN** user submits { weekStartDate: "2026-01-13", fatigueLevel: 3, completedHours: 25, deviations: "Flew too much", adjustmentNotes: "Need more sleep" }
- **THEN** system creates WeeklyCheckIn record for that user and week

### Requirement: One check-in per week per user
The system SHALL enforce exactly one check-in per user per week (identified by weekStartDate).

#### Scenario: Reject duplicate check-in
- **WHEN** user attempts to submit a check-in for week 2026-01-13 when one already exists
- **THEN** system returns 400 error with message "Check-in already exists for this week"

### Requirement: Check-in retrieval
The system SHALL return all check-ins for a user, ordered by weekStartDate descending.

#### Scenario: Get all check-ins
- **WHEN** user requests GET /api/checkin
- **THEN** system returns all WeeklyCheckIn entries for that user, newest first

### Requirement: Fatigue level range validation
The system SHALL only accept fatigue level values between 1 and 5.

#### Scenario: Reject invalid fatigue level
- **WHEN** user submits fatigueLevel 7
- **THEN** system returns 400 error with validation message
