-- CreateTable
CREATE TABLE "GolfScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GolfScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GolfScore_userId_scoreDate_idx" ON "GolfScore"("userId", "scoreDate");

-- CreateIndex
CREATE UNIQUE INDEX "GolfScore_userId_scoreDate_key" ON "GolfScore"("userId", "scoreDate");

-- AddForeignKey
ALTER TABLE "GolfScore" ADD CONSTRAINT "GolfScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
