-- A success testimony recorded (by the parish office) for a committed/married profile:
-- a written note and/or a link to a testimony video (YouTube, Drive, etc.).
-- Run once against the production database (Neon). Safe to re-run (idempotent).

ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "Testimony" text;
ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "TestimonyVideoUrl" text;

-- Marriage date for a committed profile's success story.
ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "MarriageDate" date;
