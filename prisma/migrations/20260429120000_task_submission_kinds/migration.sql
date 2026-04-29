-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('NONE', 'TEXT', 'LINK', 'CONFIRMATION');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "requiresSubmission" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "submissionKind" "SubmissionKind" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "TaskSubmission" ADD COLUMN "kind" "SubmissionKind" NOT NULL DEFAULT 'TEXT';
