/*
  Warnings:

  - You are about to drop the column `jobTitle` on the `CareerGuide` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CareerGuide" DROP COLUMN "jobTitle",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';
