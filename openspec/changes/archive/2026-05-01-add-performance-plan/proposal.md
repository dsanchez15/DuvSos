## Why

The app lacks a structured way to track personal and professional improvement plans with time-based goals, milestones, and daily progress. While habits exist, they don't capture the holistic view of "what am I working toward" with estimated hours, deadline-driven milestones, and weekly reflection cycles.

## What Changes

- New **Goals** system with categories (Professional/Personal), priority levels, estimated hours, and milestone tracking
- **Daily Progress** logging with gym/sleep/study/work hours and validation rules (e.g., gym only if sleep >= 7h)
- **Weekly Check-in** form for biweekly reflection on fatigue, completed hours, and plan adjustments
- **Stats Dashboard** with gym streak, hours tracked, goal completion metrics, and upcoming milestones
- New API routes: `/api/goals`, `/api/progress/daily`, `/api/checkin`, `/api/stats`
- New pages: `/dashboard` (enhanced), `/goals`, `/progress`, `/checkin`

## Capabilities

### New Capabilities
- `goal-management`: Create, track, and complete goals with milestones and time estimation
- `daily-progress-tracking`: Log daily activities (gym, sleep, study, work) with validation
- `weekly-checkin`: Biweekly self-reflection with fatigue tracking and adjustment notes
- `improvement-stats`: Aggregated metrics for improvement plan (streaks, hours, completion rates)

### Modified Capabilities
- (none - new capability set)

## Impact

- New Prisma models: `Goal`, `Milestone`, `Phase`, `DailyProgress`, `WeeklyCheckIn`
- API layer additions in `src/app/api/`
- New page components in `src/app/`
- Reuses existing: `prisma client`, `auth patterns`, `layout components`, `Tailwind styling`
- No breaking changes to existing features
