-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "mentorApplicationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0;
