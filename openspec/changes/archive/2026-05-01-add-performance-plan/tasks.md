## 1. Database Setup

- [x] 1.1 Add Goal model to schema.prisma (id, userId, category, title, description, priority, status, deadline, estimatedHours, totalHoursSpent, createdAt, updatedAt, completedAt)
- [x] 1.2 Add Milestone model (id, goalId, title, targetDate, completed, completedAt, order)
- [x] 1.3 Add Phase model (id, userId, number, title, description, startDate, endDate)
- [x] 1.4 Add DailyProgress model (id, userId, date, goalId, gymCompleted, sleepHours, studyHours, workHours, notes)
- [x] 1.5 Add WeeklyCheckIn model (id, userId, weekStartDate, fatigueLevel, completedHours, deviations, adjustmentNotes)
- [x] 1.6 Add enums: GoalCategory (PROFESIONAL, PERSONAL), Priority (ALTA, MEDIA, BAJA), GoalStatus (ACTIVE, COMPLETED, PAUSED, CANCELLED)
- [x] 1.7 Run prisma migrate dev --name add-performance-plan

## 2. API Routes

- [x] 2.1 Create GET /api/goals - list goals with filters (status, category, priority)
- [x] 2.2 Create POST /api/goals - create goal with milestones
- [x] 2.3 Create GET /api/goals/[id] - get single goal with milestones
- [x] 2.4 Create PATCH /api/goals/[id] - update goal (status, priority, deadline)
- [x] 2.5 Create DELETE /api/goals/[id] - delete goal (cascades to milestones)
- [x] 2.6 Create POST /api/progress/daily - log daily progress with validation (gym requires sleep >= 7)
- [x] 2.7 Create GET /api/progress/daily - get progress by date range with summary stats
- [x] 2.8 Create POST /api/checkin - create weekly check-in (unique per week)
- [x] 2.9 Create GET /api/checkin - list all check-ins for user
- [x] 2.10 Create GET /api/stats - aggregate stats (gymStreak, hoursThisWeek, hoursThisMonth, goalCounts, upcomingMilestones)

## 3. UI Components

- [x] 3.1 Create GoalCard component (displays title, category, priority badge, progress %, deadline)
- [x] 3.2 Create MilestoneItem component (checkbox, title, target date, overdue state)
- [x] 3.3 Create DayTracker component (form for logging gym, sleep, study, work hours)
- [x] 3.4 Create WeekCalendar component (weekly view with completion indicators)
- [x] 3.5 Create ProgressRing component (circular progress indicator)
- [x] 3.6 Create StreakBadge component (gym streak display)
- [x] 3.7 Create CheckInForm component (fatigue, hours, deviations, notes)
- [x] 3.8 Create PriorityBadge component (ALTA/MEDIA/BAJA color coding)
- [x] 3.9 Create StatCard component (dashboard metric display)

## 4. Pages

- [x] 4.1 Create /goals/page.tsx - list all goals with filters and create button
- [x] 4.2 Create /goals/new/page.tsx - goal creation form with milestones
- [x] 4.3 Create /goals/[id]/page.tsx - goal detail with milestones and progress history
- [x] 4.4 Create /progress/page.tsx - daily progress logging with calendar view
- [x] 4.5 Create /checkin/page.tsx - check-in form and history

## 5. Dashboard Integration

- [x] 5.1 Add StatsCards to existing dashboard (gym streak, hours this week, active goals count)
- [x] 5.2 Add GoalsList component showing active goals with progress
- [x] 5.3 Add QuickRegister component for fast daily progress logging
- [x] 5.4 Add upcoming milestones widget (next 7 days)

## 6. Navigation

- [x] 6.1 Add sidebar links for /goals, /progress, /checkin
- [x] 6.2 Ensure navigation is consistent with existing pattern
