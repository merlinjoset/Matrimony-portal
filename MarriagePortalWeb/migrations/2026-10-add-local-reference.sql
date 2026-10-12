-- Local (UAE) reference for a profile: a parish member or friend the office can contact to vouch
-- for the family. Optional, available to every congregation, and admin-only (never shown to members).
-- Run once against the production database (Render). Safe to re-run (idempotent).

ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "LocalReferenceName" text;
ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "LocalReferenceContact" text;
