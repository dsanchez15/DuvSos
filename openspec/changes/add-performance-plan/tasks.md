## 1. Database Setup

- [ ] 1.1 Add Goal model to schema.prisma (id, userId, category, title, description, priority, status, deadline, estimatedHours, totalHoursSpent, createdAt, updatedAt, completedAt)
- [ ] 1.2 Add Milestone model (id, goalId, title, targetDate, completed, completedAt, order)
- [ ] 1.3 Add Phase model (id, userId, number, title, description, startDate, endDate)
- [ ] 1.4 Add DailyProgress model (id, userId, date, goalId, gymCompleted, sleepHours, studyHours, workHours, notes)
- [ ] 1.5 Add WeeklyCheckIn model (id, userId, weekStartDate, fatigueLevel, completedHours, deviations, adjustmentNotes)
- [ ] 1.6 Add enums: GoalCategory (PROFESIONAL, PERSONAL), Priority (ALTA, MEDIA, BAJA), GoalStatus (ACTIVE, COMPLETED, PAUSED, CANCELLED)
- [ ] 1.7 Run prisma migrate dev --name add-performance-plan

## 2. API Routes

- [ ] 2.1 Create GET /api/goals - list goals with filters (status, category, priority)
- [ ] 2.2 Create POST /api/goals - create goal with milestones
- [ ] 2.3 Create GET /api/goals/[id] - get single goal with milestones
- [ ] 2.4 Create PATCH /api/goals/[id] - update goal (status, priority, deadline)
- [ ] 2.5 Create DELETE /api/goals/[id] - delete goal (cascades to milestones)
- [ ] 2.6 Create POST /api/progress/daily - log daily progress with validation (gym requires sleep >= 7)
- [ ] 2.7 Create GET /api/progress/daily - get progress by date range with summary stats
- [ ] 2.8 Create POST /api/checkin - create weekly check-in (unique per week)
- [ ] 2.9 Create GET /api/checkin - list all check-ins for user
- [ ] 2.10 Create GET /api/stats - aggregate stats (gymStreak, hoursThisWeek, hoursThisMonth, goalCounts, upcomingMilestones)

## 3. UI Components

- [ ] 3.1 Create GoalCard component (displays title, category, priority badge, progress %, deadline)
- [ ] 3.2 Create MilestoneItem component (checkbox, title, target date, overdue state)
- [ ] 3.3 Create DayTracker component (form for logging gym, sleep, study, work hours)
- [ ] 3.4 Create WeekCalendar component (weekly view with completion indicators)
- [ ] 3.5 Create ProgressRing component (circular progress indicator)
- [ ] 3.6 Create StreakBadge component (gym streak display)
- [ ] 3.7 Create CheckInForm component (fatigue, hours, deviations, notes)
- [ ] 3.8 Create PriorityBadge component (ALTA/MEDIA/BAJA color coding)
- [ ] 3.9 Create StatCard component (dashboard metric display)

## 4. Pages

- [ ] 4.1 Create /goals/page.tsx - list all goals with filters and create button
- [ ] 4.2 Create /goals/new/page.tsx - goal creation form with milestones
- [ ] 4.3 Create /goals/[id]/page.tsx - goal detail with milestones and progress history
- [ ] 4.4 Create /progress/page.tsx - daily progress logging with calendar view
- [ ] 4.5 Create /checkin/page.tsx - check-in form and history

## 5. Dashboard Integration

- [ ] 5.1 Add StatsCards to existing dashboard (gym streak, hours this week, active goals count)
- [ ] 5.2 Add GoalsList component showing active goals with progress
- [ ] 5.3 Add QuickRegister component for fast daily progress logging
- [ ] 5.4 Add upcoming milestones widget (next 7 days)

## 6. Navigation

- [ ] 6.1 Add sidebar links for /goals, /progress, /checkin
- [ ] 6.2 Ensure navigation is consistent with existing pattern
