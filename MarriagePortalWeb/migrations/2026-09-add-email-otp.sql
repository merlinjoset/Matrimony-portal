-- Non-member registration via email OTP.
-- Run once against the production database (Neon). Safe to re-run (idempotent).

-- 1) One-time codes for email verification.
CREATE TABLE IF NOT EXISTS "TblEmailOtp" (
  "Id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Email"     text NOT NULL,
  "CodeHash"  text NOT NULL,
  "ExpiresAt" timestamptz NOT NULL,
  "Consumed"  boolean NOT NULL DEFAULT false,
  "Attempts"  integer NOT NULL DEFAULT 0,
  "CreatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IX_TblEmailOtp_Email" ON "TblEmailOtp" ("Email");

-- 2) Allow guest (non-member) accounts that have no membership card.
ALTER TABLE "TblMemberAccounts" ALTER COLUMN "MemberId" DROP NOT NULL;
ALTER TABLE "TblMemberAccounts" ALTER COLUMN "MembershipNo" DROP NOT NULL;

-- 3) CHECK whether shortlists / contact requests have a foreign key on MemberId that would
--    reject a guest's synthetic id. If either query returns rows, drop or relax that FK so
--    guests can shortlist and request contact like members ("fully equal").
--    (Guests use a UUID derived from their email as MemberId; it is not in the member roster.)
SELECT conrelid::regclass AS table, conname
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid::regclass::text IN ('"TblShortlists"', '"TblContactRequests"')
  AND pg_get_constraintdef(oid) ILIKE '%MemberId%';
