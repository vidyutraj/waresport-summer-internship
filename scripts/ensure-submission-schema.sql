-- Run once in Neon (SQL editor) if production errors mention missing columns / SubmissionKind
-- Safe to re-run: enum creation is guarded; columns use IF NOT EXISTS.

DO $$
BEGIN
  CREATE TYPE "SubmissionKind" AS ENUM ('NONE', 'TEXT', 'LINK', 'CONFIRMATION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "requiresSubmission" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "submissionKind" "SubmissionKind" NOT NULL DEFAULT 'NONE';

ALTER TABLE "TaskSubmission" ADD COLUMN IF NOT EXISTS "kind" "SubmissionKind" NOT NULL DEFAULT 'TEXT';
