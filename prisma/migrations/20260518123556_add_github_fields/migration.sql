-- AlterTable
ALTER TABLE "GitRepo" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isFork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT;

-- AlterTable
ALTER TABLE "SandboxRun" ADD COLUMN     "gitBranch" TEXT,
ADD COLUMN     "repoPath" TEXT;
