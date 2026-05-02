## Context

The app currently tracks habits, todos, and checklists with gamification (XP, streaks). The **Performance Plan** feature adds structured goal pursuit with milestones, time tracking, and weekly reflection—treating goals as first-class entities with deadline-driven milestones and progress logging.

**Current state:**
- Habits support streaks and completion tracking, but lack deadline-driven milestones and time estimation
- Todos have priorities but no categories (Professional/Personal) or estimated hours
- No unified view of "what am I working toward" with time investment tracking

**Constraints:**
- Must reuse existing Prisma client, auth middleware (`x-user-id` header), and layout components
- Database: PostgreSQL via Prisma 7
- Frontend: Next.js 14+ App Router, Tailwind CSS 4
- API pattern: Route handlers with `getUserId()` from headers

**Stakeholders:** Individual users tracking personal/professional improvement

## Goals / Non-Goals

**Goals:**
- Enable goal-setting with categories, priorities, estimated hours, and milestones
- Track daily progress (gym, sleep, study, work hours) with validation rules
- Provide biweekly check-in reflection for plan adjustment
- Surface aggregated stats (streaks, hours, completion rates) on dashboard

**Non-Goals:**
- Social/collaborative features
- Notifications (future consideration only)
- Dark mode (separate change)
- Data export (separate change)
- Gamification integration (separate from habit XP system)

## Decisions

### 1. Reuse existing Prisma client singleton pattern

**Decision:** Use `@/lib/db` (existing Prisma client) instead of creating a new connection pattern.

**Rationale:** The app already has a singleton Prisma client at `src/lib/db.ts` with Neon adapter for production. Reusing it maintains consistency and leverages existing connection pooling.

**Alternatives considered:**
- Create separate `lib/db-performance.ts`: Rejected—no need for separate connections
- Use `prisma` directly without singleton: Rejected—breaks existing pattern

### 2. Goals are separate from Habits

**Decision:** Goals are a new top-level entity, not an extension of habits.

**Rationale:** Habits track recurring daily actions; Goals track deadline-driven achievements with milestones and time investment. Different mental models, different UX flows.

**Alternatives considered:**
- Extend Habit model: Rejected—habits have no milestones or estimated hours
- Extend Todo model: Rejected—todos lack category, time estimation, and milestone structure

### 3. Daily Progress is separate from Habit Completions

**Decision:** `DailyProgress` records are independent of habit completions.

**Rationale:** Users may log gym even if it's not a "habit"—the progress log is a journal, not a habit tracker. This keeps the systems decoupled.

**Alternatives considered:**
- Use habit completions as daily progress: Rejected—different validation rules (sleep >= 7h for gym)
- Store daily progress on Goal: Rejected—one goal may have multiple activities per day

### 4. API routes follow existing pattern

**Decision:** Route handlers use same auth pattern: `getUserId()` from `x-user-id` header.

**Rationale:** Already established and consistent across all API routes.

```typescript
// Reused pattern
const userId = await getUserId()
if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### 5. UI: Reuse existing component patterns

**Decision:** Build `GoalCard`, `MilestoneItem`, `DayTracker`, etc. as new components rather than extending habit components.

**Rationale:** Goals have different data shapes and UX flows. Extending habit components would add conditional logic and coupling.

**Alternatives considered:**
- Make habit components generic: Rejected—overcomplicates both systems
- Use shadcn/ui base components: Valid option—evaluate based on existing shadcn usage

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Users confused when Goals overlap with Habits | Clearly differentiate UX—Goals are for milestones, Habits are for daily routines |
| Daily Progress validation complexity | Keep rules simple: only gym requires sleep >= 7h; others have no prerequisites |
| Stats calculations slow on large datasets | Index `userId + date` on DailyProgress; limit date ranges in queries |
| Two similar streak systems (habits + gym) | Each has its own streak; gym streak shows on dashboard independently |

## Migration Plan

1. Create new Prisma models (non-breaking)
2. Create API routes behind `/api/goals`, `/api/progress`, `/api/checkin`, `/api/stats`
3. Create pages: `/goals`, `/progress`, `/checkin` (no existing routes)
4. Integrate into dashboard (may enhance existing dashboard)
5. No rollback needed for v1—new models/routes are additive

## Open Questions

1. **Should Goals link to existing Habits?** The implementation guide shows `goalId` on `DailyProgress`, suggesting activities can be logged "toward" a goal. Decide if this linking is required or optional.
2. **Phase model scope:** The guide shows `Phase` (1, 2, 3) but it's unclear how phases work.暂时 defer Phase implementation—start with goals and milestones only.
3. **Check-in frequency:** The guide says "quincenal" (twice monthly) but doesn't specify exact timing. User should set their check-in day; default to 1st and 15th of month?
