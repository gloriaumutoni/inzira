-- AlterTable
ALTER TABLE "ConfidenceLog" ADD COLUMN     "streamCode" TEXT;

-- AlterTable
ALTER TABLE "GroupSession" ADD COLUMN     "streamCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "QuizResult" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "scores" JSONB NOT NULL,
    "topPathways" TEXT[],
    "streamCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
