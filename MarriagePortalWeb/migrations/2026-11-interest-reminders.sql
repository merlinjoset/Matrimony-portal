-- Track reminder emails the parish office sends about a pending (Awaiting) interest, so the admin
-- Interests list can show when the listing's family was last reminded and how many times.
-- Run once against the production database (Render). Safe to re-run (idempotent).

ALTER TABLE "TblInterests" ADD COLUMN IF NOT EXISTS "LastReminderAt" timestamptz;
ALTER TABLE "TblInterests" ADD COLUMN IF NOT EXISTS "ReminderCount" integer NOT NULL DEFAULT 0;
