/*
  Warnings:

  - Made the column `pnr` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "checkInCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "checkedIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "lastScannedAt" TIMESTAMP(3),
ALTER COLUMN "pnr" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL;

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "scannedBy" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanLog_bookingId_idx" ON "ScanLog"("bookingId");

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
