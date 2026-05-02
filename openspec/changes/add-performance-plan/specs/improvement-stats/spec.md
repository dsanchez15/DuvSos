## ADDED Requirements

### Requirement: Gym streak calculation
The system SHALL calculate the current gym streak as the number of consecutive days with gymCompleted=true, counting backwards from today.

#### Scenario: Calculate 5-day gym streak
- **WHEN** user has gymCompleted true for Jan 10, 11, 12, 13, 14
- **THEN** system returns gymStreak of 5

#### Scenario: Broken streak
- **WHEN** user has gymCompleted true for Jan 10, 11, 12, but Jan 13 is false
- **THEN** system returns gymStreak of 3

### Requirement: Hours this week calculation
The system SHALL sum studyHours and workHours from DailyProgress for the current week (Monday to Sunday).

#### Scenario: Calculate this week's hours
- **WHEN** current date is Thursday Jan 16
- **THEN** system sums DailyProgress entries from Monday Jan 13 through Thursday Jan 16

### Requirement: Hours this month calculation
The system SHALL sum studyHours and workHours from DailyProgress for the current calendar month.

#### Scenario: Calculate this month's hours
- **WHEN** current date is Jan 16
- **THEN** system sums all DailyProgress entries from Jan 1 through Jan 16

### Requirement: Goal completion metrics
The system SHALL return total number of goals and number of completed goals for the user.

#### Scenario: Get goal metrics
- **WHEN** user has 8 total goals, 3 completed
- **THEN** response includes { totalGoals: 8, completedGoals: 3 }

### Requirement: Upcoming milestones
The system SHALL return milestones with targetDate in the next 7 days that are not completed.

#### Scenario: Get upcoming milestones
- **WHEN** there are 3 milestones in the next 7 days with completed=false
- **THEN** system returns those 3 milestones ordered by targetDate
