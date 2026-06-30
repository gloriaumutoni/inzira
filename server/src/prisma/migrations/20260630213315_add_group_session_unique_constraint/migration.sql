/*
  Warnings:

  - A unique constraint covering the columns `[professionalId,scheduledAt]` on the table `GroupSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GroupSession_professionalId_scheduledAt_key" ON "GroupSession"("professionalId", "scheduledAt");
