-- Add subject type enum and make subject stream optional for shared subjects.
CREATE TYPE "SubjectType" AS ENUM ('STREAM_SPECIFIC', 'SHARED');

ALTER TABLE "Subject"
  ADD COLUMN "type" "SubjectType" NOT NULL DEFAULT 'STREAM_SPECIFIC',
  ALTER COLUMN "stream" DROP NOT NULL;

-- Convert common subjects to shared by default.
UPDATE "Subject"
SET "type" = 'SHARED',
    "stream" = NULL
WHERE lower("name") IN ('english', 'aptitude');
