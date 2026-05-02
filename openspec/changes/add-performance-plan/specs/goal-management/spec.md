## ADDED Requirements

### Requirement: Goal creation with categories and priorities
The system SHALL allow users to create goals with title, description, category (PROFESIONAL or PERSONAL), priority (ALTA, MEDIA, BAJA), optional deadline, and optional estimated hours.

#### Scenario: Create professional goal with deadline
- **WHEN** user submits goal with title "Learn TypeScript", category PROFESIONAL, priority ALTA, deadline in 30 days, and estimatedHours 40
- **THEN** system creates goal with status ACTIVE, stores all fields, and returns the created goal

#### Scenario: Create personal goal without deadline
- **WHEN** user submits goal with title "Read 12 books", category PERSONAL, priority MEDIA, no deadline
- **THEN** system creates goal with status ACTIVE, estimatedHours is null, deadline is null

### Requirement: Milestone management within goals
The system SHALL allow users to add milestones to a goal with title, optional target date, and order.

#### Scenario: Add milestones to goal
- **WHEN** user creates goal with milestones [{"title": "Finish chapter 1", "targetDate": "2026-01-15"}, {"title": "Complete project", "targetDate": "2026-02-15"}]
- **THEN** system creates goal and two milestones linked to that goal, ordered as specified

### Requirement: Goal status lifecycle
The system SHALL allow users to change goal status to COMPLETED, PAUSED, or CANCELLED.

#### Scenario: Mark goal as completed
- **WHEN** user updates goal status to COMPLETED
- **THEN** system sets completedAt to current timestamp and status to COMPLETED

#### Scenario: Pause goal
- **WHEN** user updates goal status to PAUSED
- **THEN** system sets status to PAUSED without modifying completedAt

### Requirement: Time tracking on goals
The system SHALL track total hours spent on a goal and update it when daily progress is logged against that goal.

#### Scenario: Increment hours spent
- **WHEN** user logs 2 study hours against goal G
- **THEN** goal G totalHoursSpent increases by 2

### Requirement: Goal progress percentage
The system SHALL calculate goal progress as (totalHoursSpent / estimatedHours) * 100 when estimatedHours is set.

#### Scenario: Calculate 50% progress
- **WHEN** goal has estimatedHours 40 and totalHoursSpent 20
- **THEN** progress percentage is 50

### Requirement: Filter goals by category, priority, status
The system SHALL allow filtering goals list by category, priority, and status parameters.

#### Scenario: Filter active professional goals
- **WHEN** user requests GET /api/goals?status=ACTIVE&category=PROFESIONAL
- **THEN** system returns only goals matching both filters
