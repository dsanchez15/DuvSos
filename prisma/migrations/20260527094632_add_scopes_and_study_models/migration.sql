-- Migration: add_scopes_and_study_models
-- Description: Add scopes to Category, migrate ChecklistCategory/TodoCategory data, add study models

BEGIN;

-- 1. Add new columns to Category
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "scopes" TEXT[] DEFAULT ARRAY['habit', 'checklist', 'todo', 'study'];

-- 2. Migrate ChecklistCategory data into Category
INSERT INTO "Category" ("name", "color", "icon", "description", "scopes", "createdAt", "userId")
SELECT 
    name,
    color,
    icon,
    NULL as description,
    ARRAY['checklist', 'todo', 'habit', 'study'] as scopes,
    "createdAt",
    "userId"
FROM "ChecklistCategory"
ON CONFLICT DO NOTHING;

-- 3. Migrate TodoCategory data into Category
INSERT INTO "Category" ("name", "color", "icon", "description", "scopes", "createdAt", "userId")
SELECT 
    name,
    color,
    icon,
    description,
    ARRAY['todo', 'checklist', 'habit', 'study'] as scopes,
    "createdAt",
    "userId"
FROM "TodoCategory"
ON CONFLICT DO NOTHING;

-- 4. Update Checklist foreign keys to point to Category
-- First, create a mapping from ChecklistCategory.id to Category.id
-- Then update Checklist.categoryId
WITH mapping AS (
    SELECT 
        cc.id as old_id,
        c.id as new_id
    FROM "ChecklistCategory" cc
    JOIN "Category" c ON cc.name = c.name AND cc."userId" IS NOT DISTINCT FROM c."userId"
)
UPDATE "Checklist" ch
SET "categoryId" = m.new_id
FROM mapping m
WHERE ch."categoryId" = m.old_id;

-- 5. Update Todo foreign keys to point to Category
WITH mapping AS (
    SELECT 
        tc.id as old_id,
        c.id as new_id
    FROM "TodoCategory" tc
    JOIN "Category" c ON tc.name = c.name AND tc."userId" IS NOT DISTINCT FROM c."userId"
)
UPDATE "Todo" t
SET "categoryId" = m.new_id
FROM mapping m
WHERE t."categoryId" = m.old_id;

-- 6. Create StudyQuestion table
CREATE TABLE "StudyQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "categoryId" INTEGER,
    "topic" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "directAnswer" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctOptionIndex" INTEGER,
    "supportsBothModes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "StudyQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StudyQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StudyQuestion_userId_idx" ON "StudyQuestion"("userId");
CREATE INDEX "StudyQuestion_userId_topic_idx" ON "StudyQuestion"("userId", "topic");
CREATE INDEX "StudyQuestion_categoryId_idx" ON "StudyQuestion"("categoryId");
CREATE INDEX "StudyQuestion_type_idx" ON "StudyQuestion"("type");

-- 7. Create StudyTopic table
CREATE TABLE "StudyTopic" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StudyTopic_userId_idx" ON "StudyTopic"("userId");
CREATE UNIQUE INDEX "StudyTopic_userId_normalizedName_key" ON "StudyTopic"("userId", "normalizedName");

-- 8. Create StudySession table
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "questionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StudySession_userId_idx" ON "StudySession"("userId");
CREATE INDEX "StudySession_userId_status_idx" ON "StudySession"("userId", "status");

-- 9. Create StudySessionAnswer table
CREATE TABLE "StudySessionAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "modeUsed" TEXT NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    CONSTRAINT "StudySessionAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StudySessionAnswer_sessionId_idx" ON "StudySessionAnswer"("sessionId");

-- 10. Create StudySettings table
CREATE TABLE "StudySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "showStudySection" BOOLEAN NOT NULL DEFAULT true,
    "maxQuestionsPerReview" INTEGER NOT NULL DEFAULT 20,
    CONSTRAINT "StudySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "StudySettings_userId_idx" ON "StudySettings"("userId");
CREATE UNIQUE INDEX "StudySettings_userId_key" ON "StudySettings"("userId");

-- 11. Drop old category tables (after data migration)
DROP TABLE IF EXISTS "ChecklistCategory" CASCADE;
DROP TABLE IF EXISTS "TodoCategory" CASCADE;

COMMIT;
