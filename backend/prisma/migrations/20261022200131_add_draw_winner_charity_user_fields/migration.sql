-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('DRAFT', 'OPEN', 'SIMULATED', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DrawType" AS ENUM ('RANDOM', 'ALGORITHMIC');

-- CreateEnum
CREATE TYPE "WinnerPayoutStatus" AS ENUM ('PENDING', 'VERIFIED', 'PAID', 'REJECTED');

-- AlterTable
ALTER TABLE "Charity" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "charityContribution" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "selectedCharityId" TEXT;

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "drawMonth" INTEGER NOT NULL,
    "drawYear" INTEGER NOT NULL,
    "drawType" "DrawType" NOT NULL DEFAULT 'RANDOM',
    "status" "DrawStatus" NOT NULL DEFAULT 'DRAFT',
    "totalPrizePool" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "jackpotPool" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fourMatchPool" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "threeMatchPool" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "drawnNumbers" INTEGER[],
    "simulationData" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawEntry" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numbers" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawWin" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "prizeAmount" DECIMAL(12,2) NOT NULL,
    "payoutStatus" "WinnerPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "proofImageUrl" TEXT,
    "adminNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrawWin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Draw_status_idx" ON "Draw"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Draw_drawMonth_drawYear_key" ON "Draw"("drawMonth", "drawYear");

-- CreateIndex
CREATE INDEX "DrawEntry_drawId_idx" ON "DrawEntry"("drawId");

-- CreateIndex
CREATE INDEX "DrawEntry_userId_idx" ON "DrawEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawEntry_drawId_userId_key" ON "DrawEntry"("drawId", "userId");

-- CreateIndex
CREATE INDEX "DrawWin_drawId_idx" ON "DrawWin"("drawId");

-- CreateIndex
CREATE INDEX "DrawWin_userId_idx" ON "DrawWin"("userId");

-- CreateIndex
CREATE INDEX "DrawWin_payoutStatus_idx" ON "DrawWin"("payoutStatus");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedCharityId_fkey" FOREIGN KEY ("selectedCharityId") REFERENCES "Charity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawEntry" ADD CONSTRAINT "DrawEntry_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawEntry" ADD CONSTRAINT "DrawEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawWin" ADD CONSTRAINT "DrawWin_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawWin" ADD CONSTRAINT "DrawWin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
