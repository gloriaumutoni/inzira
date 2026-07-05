-- CreateEnum
CREATE TYPE "CareerStoryStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED');

-- CreateTable
CREATE TABLE "CareerStory" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "combinations" TEXT[],
    "myPath" TEXT NOT NULL,
    "whatIDo" TEXT NOT NULL,
    "adviceForStudents" TEXT NOT NULL,
    "status" "CareerStoryStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejectionReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerStory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CareerStory" ADD CONSTRAINT "CareerStory_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
