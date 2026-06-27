/*
  Warnings:

  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CareerGuide" DROP CONSTRAINT "CareerGuide_schoolId_fkey";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "CareerGuide" ALTER COLUMN "schoolId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username";

-- AddForeignKey
ALTER TABLE "CareerGuide" ADD CONSTRAINT "CareerGuide_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
