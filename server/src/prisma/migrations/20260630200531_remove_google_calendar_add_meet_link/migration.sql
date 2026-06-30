/*
  Warnings:

  - You are about to drop the column `googleAccessToken` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `googleCalendarConnected` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `googleRefreshToken` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `googleTokenExpiry` on the `Professional` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MentorSlot" ADD COLUMN     "meetLink" TEXT;

-- AlterTable
ALTER TABLE "Professional" DROP COLUMN "googleAccessToken",
DROP COLUMN "googleCalendarConnected",
DROP COLUMN "googleRefreshToken",
DROP COLUMN "googleTokenExpiry";
