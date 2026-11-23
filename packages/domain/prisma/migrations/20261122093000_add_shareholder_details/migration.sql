ALTER TABLE "ShareholderProfile"
RENAME COLUMN "totalShares" TO "numberOfShares";

ALTER TABLE "ShareholderProfile"
ADD COLUMN "contactNo" TEXT,
ADD COLUMN "tinNumber" TEXT,
ADD COLUMN "shareValue" DECIMAL(10, 2) NOT NULL DEFAULT 1000.00,
ADD COLUMN "totalContribution" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN "datePaid" TIMESTAMP(3),
ADD COLUMN "remarks" TEXT;

CREATE TABLE "ShareholderDocument" (
    "id" TEXT NOT NULL,
    "shareholderProfileId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareholderDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ShareholderDocument"
ADD CONSTRAINT "ShareholderDocument_shareholderProfileId_fkey"
FOREIGN KEY ("shareholderProfileId") REFERENCES "ShareholderProfile"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
