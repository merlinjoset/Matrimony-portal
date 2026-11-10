-- One row per reminder email sent from Admin > Interests, so the office can see the full history:
-- when each reminder went out, which admin sent it and to which address. ("LastReminderAt" and
-- "ReminderCount" on TblInterests stay as the quick summary shown in the list.)
-- Run once against the production database (Render). Safe to re-run (idempotent).

CREATE TABLE IF NOT EXISTS "TblInterestReminders" (
  "Id"         uuid PRIMARY KEY,
  "InterestId" uuid NOT NULL,
  "SentAt"     timestamptz NOT NULL DEFAULT now(),
  "SentById"   text,
  "SentByName" text,
  "ToEmail"    text
);

CREATE INDEX IF NOT EXISTS "IX_TblInterestReminders_InterestId" ON "TblInterestReminders" ("InterestId", "SentAt" DESC);
