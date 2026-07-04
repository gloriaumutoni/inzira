-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "careerInterests" TEXT[],
ADD COLUMN     "combinationsConsidering" TEXT[],
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
