-- Stream taxonomy: streams become the primary matched unit; combinations kept as legacy.

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "streamCode" TEXT;

-- AlterTable
ALTER TABLE "Career" ADD COLUMN     "streamCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill Student.streamCode from legacy combination
UPDATE "Student" SET "streamCode" = CASE
  WHEN "combination" IN ('PCB','MCB','BCG','PCG','AEG','MPC','PCM','MPG','MEG','MCE') THEN 'MATH_SCIENCES'
  WHEN "combination" IN ('HEG','HEL','HGL','HLP') THEN 'ARTS_HUMANITIES'
  WHEN "combination" IN ('KEL','KGL','LFK') THEN 'LANGUAGES'
END
WHERE "combination" IS NOT NULL AND "streamCode" IS NULL;

-- Backfill Career.streamCodes from legacy combinations
UPDATE "Career" SET "streamCodes" = (
  SELECT ARRAY(
    SELECT DISTINCT s FROM (
      SELECT CASE
        WHEN c IN ('PCB','MCB','BCG','PCG','AEG','MPC','PCM','MPG','MEG','MCE') THEN 'MATH_SCIENCES'
        WHEN c IN ('HEG','HEL','HGL','HLP') THEN 'ARTS_HUMANITIES'
        WHEN c IN ('KEL','KGL','LFK') THEN 'LANGUAGES'
      END AS s
      FROM unnest("combinations") AS c
    ) t WHERE s IS NOT NULL
  )
)
WHERE (array_length("streamCodes", 1) IS NULL) AND (array_length("combinations", 1) IS NOT NULL);
