-- Partner preferences for education and profession, shown under "Partner expectations" so
-- they are clearly separate from the profile owner's own education & profession. Both optional.
-- Run once against the production database (Render). Safe to re-run (idempotent).

ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "PartnerEducation" text;
ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "PartnerProfession" text;
