/*
  Warnings:

  - The values [COMPANY] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `jobTitle` on the `CareerGuide` table. All the data in the column will be lost.
  - You are about to drop the column `googleAccessToken` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `googleRefreshToken` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `googleTokenExpiry` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workshop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkshopAgendaItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkshopRegistration` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[professionalId,scheduledAt]` on the table `GroupSession` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'PROFESSIONAL', 'CAREER_GUIDE', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_mentorshipId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Workshop" DROP CONSTRAINT "Workshop_companyId_fkey";

-- DropForeignKey
ALTER TABLE "WorkshopAgendaItem" DROP CONSTRAINT "WorkshopAgendaItem_workshopId_fkey";

-- DropForeignKey
ALTER TABLE "WorkshopRegistration" DROP CONSTRAINT "WorkshopRegistration_studentId_fkey";

-- DropForeignKey
ALTER TABLE "WorkshopRegistration" DROP CONSTRAINT "WorkshopRegistration_workshopId_fkey";

-- AlterTable
ALTER TABLE "CareerGuide" DROP COLUMN "jobTitle",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Professional" DROP COLUMN "googleAccessToken",
DROP COLUMN "googleRefreshToken",
DROP COLUMN "googleTokenExpiry",
ADD COLUMN     "isMentor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentorApplicationStatus" TEXT,
ADD COLUMN     "mentorAppliedAt" TIMESTAMP(3),
ADD COLUMN     "mentorBio" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "Workshop";

-- DropTable
DROP TABLE "WorkshopAgendaItem";

-- DropTable
DROP TABLE "WorkshopRegistration";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "WorkshopFormat";

-- DropEnum
DROP TYPE "WorkshopStatus";

-- CreateTable
CREATE TABLE "AdminInterviewSlot" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "meetLink" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminInterviewSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorApplicationInterviewBooking" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "adminSlotId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "meetLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorApplicationInterviewBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAvailabilityTemplate" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorAvailabilityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSlot" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookedByStudentId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meetLink" TEXT,

    CONSTRAINT "MentorSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalCareer" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfessionalCareer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionFeedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "confidenceBefore" INTEGER NOT NULL,
    "confidenceAfter" INTEGER NOT NULL,
    "wasHelpful" BOOLEAN NOT NULL,
    "professionalFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminInterviewSlot_dayOfWeek_startHour_startMinute_key" ON "AdminInterviewSlot"("dayOfWeek", "startHour", "startMinute");

-- CreateIndex
CREATE UNIQUE INDEX "MentorApplicationInterviewBooking_professionalId_key" ON "MentorApplicationInterviewBooking"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorAvailabilityTemplate_professionalId_dayOfWeek_startHo_key" ON "MentorAvailabilityTemplate"("professionalId", "dayOfWeek", "startHour", "startMinute");

-- CreateIndex
CREATE UNIQUE INDEX "MentorSlot_professionalId_scheduledAt_key" ON "MentorSlot"("professionalId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalCareer_professionalId_careerId_key" ON "ProfessionalCareer"("professionalId", "careerId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionFeedback_sessionId_key" ON "SessionFeedback"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSession_professionalId_scheduledAt_key" ON "GroupSession"("professionalId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "MentorApplicationInterviewBooking" ADD CONSTRAINT "MentorApplicationInterviewBooking_adminSlotId_fkey" FOREIGN KEY ("adminSlotId") REFERENCES "AdminInterviewSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorApplicationInterviewBooking" ADD CONSTRAINT "MentorApplicationInterviewBooking_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAvailabilityTemplate" ADD CONSTRAINT "MentorAvailabilityTemplate_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSlot" ADD CONSTRAINT "MentorSlot_bookedByStudentId_fkey" FOREIGN KEY ("bookedByStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSlot" ADD CONSTRAINT "MentorSlot_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalCareer" ADD CONSTRAINT "ProfessionalCareer_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalCareer" ADD CONSTRAINT "ProfessionalCareer_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionFeedback" ADD CONSTRAINT "SessionFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionFeedback" ADD CONSTRAINT "SessionFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
