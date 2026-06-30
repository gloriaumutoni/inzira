/*
  Warnings:

  - The values [COMPANY] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Workshop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkshopAgendaItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkshopRegistration` table. If the table is not empty, all the data it contains will be lost.

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
