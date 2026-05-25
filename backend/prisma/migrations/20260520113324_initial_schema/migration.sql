-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('PENDING', 'RESOLVED', 'NOT_RESOLVED');

-- CreateTable
CREATE TABLE "support_sessions" (
    "id" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "botResponse" TEXT NOT NULL,
    "resolutionStatus" "ResolutionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_sessions_resolutionStatus_idx" ON "support_sessions"("resolutionStatus");

-- CreateIndex
CREATE INDEX "support_sessions_createdAt_idx" ON "support_sessions"("createdAt");
