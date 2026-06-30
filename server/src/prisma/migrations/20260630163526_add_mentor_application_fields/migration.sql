-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "isMentor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentorApplicationStatus" TEXT,
ADD COLUMN     "mentorAppliedAt" TIMESTAMP(3),
ADD COLUMN     "mentorBio" TEXT;
