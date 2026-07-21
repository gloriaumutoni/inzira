-- Structured roadmap fields on CareerStory + Professional.relevantStreams (primary stream tagging).

-- AlterTable
ALTER TABLE "CareerStory" ADD COLUMN     "streamCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "universityStudied" TEXT,
ADD COLUMN     "program" TEXT,
ADD COLUMN     "entryRequirements" TEXT,
ADD COLUMN     "firstJobStep" TEXT,
ADD COLUMN     "yearsToGetThere" INTEGER,
ADD COLUMN     "keySkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "linkedCareerId" TEXT;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "relevantStreams" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "referredById" TEXT;

-- AddForeignKey
ALTER TABLE "CareerStory" ADD CONSTRAINT "CareerStory_linkedCareerId_fkey" FOREIGN KEY ("linkedCareerId") REFERENCES "Career"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill CareerStory.streamCodes from legacy combinations
UPDATE "CareerStory" SET "streamCodes" = (
  SELECT ARRAY(
    SELECT DISTINCT s FROM (
      SELECT CASE
        WHEN c IN ('PCB','MCB','BCG','PCG','AEG','MPC','PCM','MPG','MEG','MCE','PCE','MPE','MEd') THEN 'MATH_SCIENCES'
        WHEN c IN ('HEG','HEL','HGL','HLP','AGL','HGK','HLE','MHE') THEN 'ARTS_HUMANITIES'
        WHEN c IN ('KEL','KGL','LFK','LKF','HEK','KEG') THEN 'LANGUAGES'
      END AS s
      FROM unnest("combinations") AS c
    ) t WHERE s IS NOT NULL
  )
)
WHERE (array_length("streamCodes", 1) IS NULL) AND (array_length("combinations", 1) IS NOT NULL);

-- Backfill Professional.relevantStreams from legacy relevantCombinations
UPDATE "Professional" SET "relevantStreams" = (
  SELECT ARRAY(
    SELECT DISTINCT s FROM (
      SELECT CASE
        WHEN c IN ('PCB','MCB','BCG','PCG','AEG','MPC','PCM','MPG','MEG','MCE','PCE','MPE','MEd') THEN 'MATH_SCIENCES'
        WHEN c IN ('HEG','HEL','HGL','HLP','AGL','HGK','HLE','MHE') THEN 'ARTS_HUMANITIES'
        WHEN c IN ('KEL','KGL','LFK','LKF','HEK','KEG') THEN 'LANGUAGES'
      END AS s
      FROM unnest("relevantCombinations") AS c
    ) t WHERE s IS NOT NULL
  )
)
WHERE (array_length("relevantStreams", 1) IS NULL) AND (array_length("relevantCombinations", 1) IS NOT NULL);
