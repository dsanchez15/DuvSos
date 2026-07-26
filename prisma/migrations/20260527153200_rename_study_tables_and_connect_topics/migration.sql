-- Migration: rename_study_tables_and_connect_topics

-- 1. Renombrar tablas
ALTER TABLE "StudyQuestion" RENAME TO "Question";
ALTER TABLE "StudyTopic" RENAME TO "Topic";
ALTER TABLE "StudySession" RENAME TO "Session";
ALTER TABLE "StudySessionAnswer" RENAME TO "SessionAnswer";
ALTER TABLE "StudySettings" RENAME TO "StudySetting";

-- 2. Renombrar constraints de clave foránea en SessionAnswer
ALTER TABLE "SessionAnswer" RENAME CONSTRAINT "StudySessionAnswer_sessionId_fkey" TO "SessionAnswer_sessionId_fkey";

-- 3. Renombrar constraints de clave foránea en Question
ALTER TABLE "Question" RENAME CONSTRAINT "StudyQuestion_categoryId_fkey" TO "Question_categoryId_fkey";
ALTER TABLE "Question" RENAME CONSTRAINT "StudyQuestion_userId_fkey" TO "Question_userId_fkey";

-- 4. Crear Topics para los strings existentes en Question
INSERT INTO "Topic" ("id", "name", "normalizedName", "userId", "createdAt")
SELECT DISTINCT
    gen_random_uuid(),
    q."topic",
    LOWER(q."topic"),
    q."userId",
    NOW()
FROM "Question" q
WHERE q."topic" IS NOT NULL AND q."topic" <> ''
ON CONFLICT ("userId", "normalizedName") DO NOTHING;

-- 5. Agregar columna topicId a Question
ALTER TABLE "Question" ADD COLUMN "topicId" TEXT;

-- 6. Actualizar topicId basado en el nombre del topic
UPDATE "Question" q
SET "topicId" = t."id"
FROM "Topic" t
WHERE LOWER(q."topic") = t."normalizedName" AND q."userId" = t."userId";

-- 7. Para preguntas sin topic (vacío o null), asignar un topic por defecto o dejar null
-- Como topicId ahora es obligatorio, vamos a crear un topic "General" para el usuario si hay preguntas sin topic
INSERT INTO "Topic" ("id", "name", "normalizedName", "userId", "createdAt")
SELECT DISTINCT
    gen_random_uuid(),
    'General',
    'general',
    q."userId",
    NOW()
FROM "Question" q
WHERE q."topicId" IS NULL
ON CONFLICT ("userId", "normalizedName") DO NOTHING;

UPDATE "Question" q
SET "topicId" = t."id"
FROM "Topic" t
WHERE q."topicId" IS NULL AND t."normalizedName" = 'general' AND q."userId" = t."userId";

-- 8. Hacer topicId NOT NULL
ALTER TABLE "Question" ALTER COLUMN "topicId" SET NOT NULL;

-- 9. Eliminar columna topic string
ALTER TABLE "Question" DROP COLUMN "topic";

-- 10. Crear foreign key Question -> Topic
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey"
FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. Actualizar índices
CREATE INDEX "Question_topicId_idx" ON "Question"("topicId");
DROP INDEX IF EXISTS "StudyQuestion_userId_topic_idx";
