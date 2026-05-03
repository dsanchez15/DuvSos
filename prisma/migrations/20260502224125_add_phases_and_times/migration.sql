-- AlterTable
ALTER TABLE "DailyProgress" ADD COLUMN     "actualTime" TEXT,
ADD COLUMN     "plannedTime" TEXT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "phaseId" TEXT;

-- CreateIndex
CREATE INDEX "Goal_phaseId_idx" ON "Goal"("phaseId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
