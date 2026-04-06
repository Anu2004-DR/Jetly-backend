/*
  Warnings:

  - You are about to alter the column `passengerPhone` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.
  - You are about to alter the column `passengerEmail` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "flightData" JSONB,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "passengerPhone" SET DATA TYPE VARCHAR(15),
ALTER COLUMN "passengerEmail" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE INDEX "Booking_pnr_idx" ON "Booking"("pnr");

-- CreateIndex
CREATE INDEX "Booking_busId_idx" ON "Booking"("busId");

-- CreateIndex
CREATE INDEX "Booking_trainId_idx" ON "Booking"("trainId");

-- CreateIndex
CREATE INDEX "Booking_flightId_idx" ON "Booking"("flightId");

-- CreateIndex
CREATE INDEX "Bus_fromCity_toCity_idx" ON "Bus"("fromCity", "toCity");

-- CreateIndex
CREATE INDEX "Bus_departure_idx" ON "Bus"("departure");

-- CreateIndex
CREATE INDEX "Flight_fromCity_toCity_idx" ON "Flight"("fromCity", "toCity");

-- CreateIndex
CREATE INDEX "Flight_departure_idx" ON "Flight"("departure");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Train_fromCity_toCity_idx" ON "Train"("fromCity", "toCity");

-- CreateIndex
CREATE INDEX "Train_departure_idx" ON "Train"("departure");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
