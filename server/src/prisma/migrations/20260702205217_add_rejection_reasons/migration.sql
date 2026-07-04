-- AlterTable
ALTER TABLE "CareerGuide" ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "mentorRejectionReason" TEXT,
ADD COLUMN     "rejectionReason" TEXT;
