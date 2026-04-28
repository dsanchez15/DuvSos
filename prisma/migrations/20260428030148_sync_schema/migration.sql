-- AlterTable
ALTER TABLE "Checklist" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lifecycleState" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "recurrencePattern" TEXT,
ADD COLUMN     "templateId" INTEGER,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "blockedByItemId" INTEGER,
ADD COLUMN     "effortEstimate" INTEGER,
ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "HabitCompletion" ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lifecycleEndDate" TIMESTAMP(3),
ADD COLUMN     "lifecycleStartDate" TIMESTAMP(3),
ADD COLUMN     "sourceId" INTEGER,
ADD COLUMN     "sourceModule" TEXT;

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "dueTime" TEXT,
ADD COLUMN     "effortMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal';

-- CreateTable
CREATE TABLE "TodoCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icon" TEXT NOT NULL DEFAULT 'folder',
    "description" TEXT,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "TodoCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderRecurrenceRule" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'once',
    "interval" INTEGER NOT NULL DEFAULT 1,
    "daysOfWeek" INTEGER[],
    "dayOfMonth" INTEGER,
    "monthOfYear" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderRecurrenceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderException" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "exceptionDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderBlocker" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "blockerModule" TEXT NOT NULL,
    "blockerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderBlocker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderMetrics" (
    "id" SERIAL NOT NULL,
    "reminderId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionTaken" TEXT,

    CONSTRAINT "ReminderMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#f59e0b',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneItem" (
    "id" SERIAL NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "itemModule" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityEscalationRule" (
    "id" SERIAL NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "thresholdHours" INTEGER NOT NULL DEFAULT 48,
    "escalationLevel" TEXT NOT NULL DEFAULT 'high',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriorityEscalationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TodoCategory_userId_idx" ON "TodoCategory"("userId");

-- CreateIndex
CREATE INDEX "TodoCategory_parentId_idx" ON "TodoCategory"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderRecurrenceRule_reminderId_key" ON "ReminderRecurrenceRule"("reminderId");

-- CreateIndex
CREATE INDEX "ReminderException_reminderId_idx" ON "ReminderException"("reminderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderException_reminderId_exceptionDate_key" ON "ReminderException"("reminderId", "exceptionDate");

-- CreateIndex
CREATE INDEX "ReminderBlocker_reminderId_idx" ON "ReminderBlocker"("reminderId");

-- CreateIndex
CREATE INDEX "ReminderBlocker_blockerModule_blockerId_idx" ON "ReminderBlocker"("blockerModule", "blockerId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderBlocker_reminderId_blockerModule_blockerId_key" ON "ReminderBlocker"("reminderId", "blockerModule", "blockerId");

-- CreateIndex
CREATE INDEX "ReminderMetrics_reminderId_idx" ON "ReminderMetrics"("reminderId");

-- CreateIndex
CREATE INDEX "ReminderMetrics_reminderId_viewedAt_idx" ON "ReminderMetrics"("reminderId", "viewedAt");

-- CreateIndex
CREATE INDEX "Milestone_userId_idx" ON "Milestone"("userId");

-- CreateIndex
CREATE INDEX "Milestone_userId_date_idx" ON "Milestone"("userId", "date");

-- CreateIndex
CREATE INDEX "MilestoneItem_milestoneId_idx" ON "MilestoneItem"("milestoneId");

-- CreateIndex
CREATE INDEX "MilestoneItem_itemModule_itemId_idx" ON "MilestoneItem"("itemModule", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneItem_milestoneId_itemModule_itemId_key" ON "MilestoneItem"("milestoneId", "itemModule", "itemId");

-- CreateIndex
CREATE INDEX "PriorityEscalationRule_sourceModule_sourceId_idx" ON "PriorityEscalationRule"("sourceModule", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityEscalationRule_sourceModule_sourceId_key" ON "PriorityEscalationRule"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "Checklist_lifecycleState_idx" ON "Checklist"("lifecycleState");

-- CreateIndex
CREATE INDEX "ChecklistItem_parentId_idx" ON "ChecklistItem"("parentId");

-- CreateIndex
CREATE INDEX "ChecklistItem_blockedByItemId_idx" ON "ChecklistItem"("blockedByItemId");

-- CreateIndex
CREATE INDEX "Reminder_sourceModule_sourceId_idx" ON "Reminder"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "Reminder_lifecycleStartDate_idx" ON "Reminder"("lifecycleStartDate");

-- CreateIndex
CREATE INDEX "Reminder_lifecycleEndDate_idx" ON "Reminder"("lifecycleEndDate");

-- CreateIndex
CREATE INDEX "Todo_parentId_idx" ON "Todo"("parentId");

-- CreateIndex
CREATE INDEX "Todo_categoryId_idx" ON "Todo"("categoryId");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TodoCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoCategory" ADD CONSTRAINT "TodoCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TodoCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TodoCategory" ADD CONSTRAINT "TodoCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRecurrenceRule" ADD CONSTRAINT "ReminderRecurrenceRule_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderException" ADD CONSTRAINT "ReminderException_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderBlocker" ADD CONSTRAINT "ReminderBlocker_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderMetrics" ADD CONSTRAINT "ReminderMetrics_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneItem" ADD CONSTRAINT "MilestoneItem_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;
