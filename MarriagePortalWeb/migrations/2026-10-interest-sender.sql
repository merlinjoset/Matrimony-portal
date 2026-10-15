-- Record WHO expressed an interest, not just the name/mobile they typed: the sender's member
-- account and their own listing (id + reference). Older rows stay NULL; the admin page matches
-- those senders by mobile number and labels them as such. All optional.
-- Run once against the production database (Render). Safe to re-run (idempotent).

ALTER TABLE "TblInterests" ADD COLUMN IF NOT EXISTS "FromMemberId" text;
ALTER TABLE "TblInterests" ADD COLUMN IF NOT EXISTS "FromProfileId" text;
ALTER TABLE "TblInterests" ADD COLUMN IF NOT EXISTS "FromReferenceId" text;
