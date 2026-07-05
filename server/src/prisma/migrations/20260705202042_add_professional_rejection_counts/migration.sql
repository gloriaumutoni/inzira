-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "mentorRejectionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectionCount" INTEGER NOT NULL DEFAULT 0;
