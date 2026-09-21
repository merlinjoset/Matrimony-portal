-- "Details of the Person Submitting the Form" consent.
-- Stored with the listing as a JSON text blob, populated only when a profile is created on
-- behalf of someone else (CreatedFor != 'Self'). Admin-only; stripped from member-facing payloads.
-- Run once against the production database (Neon). Safe to re-run (idempotent).

ALTER TABLE "TblProfiles" ADD COLUMN IF NOT EXISTS "SubmitterDetails" text;
