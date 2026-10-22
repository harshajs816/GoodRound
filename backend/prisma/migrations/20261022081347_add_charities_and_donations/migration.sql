-- CreateTable
CREATE TABLE "Charity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "websiteUrl" TEXT,
    "contactEmail" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharityDonation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "charityId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharityDonation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Charity_slug_key" ON "Charity"("slug");

-- CreateIndex
CREATE INDEX "CharityDonation_userId_createdAt_idx" ON "CharityDonation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CharityDonation_charityId_status_idx" ON "CharityDonation"("charityId", "status");

-- AddForeignKey
ALTER TABLE "CharityDonation" ADD CONSTRAINT "CharityDonation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharityDonation" ADD CONSTRAINT "CharityDonation_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
