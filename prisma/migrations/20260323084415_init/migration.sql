-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('BUS', 'TRAIN', 'FLIGHT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" SERIAL NOT NULL,
    "busName" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "departure" TEXT NOT NULL,
    "arrival" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "seats" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Train" (
    "id" SERIAL NOT NULL,
    "trainNumber" TEXT NOT NULL,
    "trainName" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "departure" TEXT NOT NULL,
    "arrival" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "seats" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Train_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" SERIAL NOT NULL,
    "flightNo" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "departure" TEXT NOT NULL,
    "arrival" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "stops" TEXT NOT NULL,
    "dep" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "seats" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "pnr" TEXT,
    "userId" INTEGER,
    "bookingType" "BookingType" NOT NULL,
    "busId" INTEGER,
    "trainId" INTEGER,
    "flightId" INTEGER,
    "passengerName" TEXT NOT NULL,
    "passengerAge" INTEGER NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "passengerEmail" TEXT NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "priceAtBooking" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "lockExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_pnr_key" ON "Booking"("pnr");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "Train"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
