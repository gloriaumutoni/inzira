/*
  Warnings:

  - You are about to drop the column `isPremiumOnly` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `nextBillingDate` on the `Mentorship` table. All the data in the column will be lost.
  - You are about to drop the column `offersPremiumTier` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `offersProTier` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `premiumRate` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `premiumSessionsPerMonth` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `proRate` on the `Professional` table. All the data in the column will be lost.
  - You are about to drop the column `commissionAmount` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `grossAmount` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `netAmount` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `mentorPlan` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "isPremiumOnly";

-- AlterTable
ALTER TABLE "Mentorship" DROP COLUMN "nextBillingDate";

-- AlterTable
ALTER TABLE "Professional" DROP COLUMN "offersPremiumTier",
DROP COLUMN "offersProTier",
DROP COLUMN "premiumRate",
DROP COLUMN "premiumSessionsPerMonth",
DROP COLUMN "proRate";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "commissionAmount",
DROP COLUMN "grossAmount",
DROP COLUMN "netAmount",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "mentorPlan";

-- DropEnum
DROP TYPE "MentorPlan";

-- DropEnum
DROP TYPE "SessionType";
