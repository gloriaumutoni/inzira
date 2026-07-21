-- AlterTable
ALTER TABLE "Career" ADD COLUMN     "keySkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pathwayCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "universityPrograms" JSONB;

-- CreateTable
CREATE TABLE "CareerRoadmapStep" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "timeframe" TEXT,

    CONSTRAINT "CareerRoadmapStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerRoadmapStep_careerId_order_key" ON "CareerRoadmapStep"("careerId", "order");

-- AddForeignKey
ALTER TABLE "CareerRoadmapStep" ADD CONSTRAINT "CareerRoadmapStep_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;
