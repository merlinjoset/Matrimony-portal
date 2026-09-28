-- Partner preferences shown under "expectations": the caste the owner is looking for (a value or
-- "Caste No Bar") and the denomination they will accept (a value or "Any"). Both optional.
-- Run once against the production database (Neon). Safe to re-run (idempotent).

ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "PartnerCaste" text;
ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "PartnerDenomination" text;
