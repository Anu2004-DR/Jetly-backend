/*
  Warnings:

  - You are about to drop the column `dep` on the `Flight` table. All the data in the column will be lost.
  - Added the required column `searchKey` to the `Flight` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `departure` on the `Flight` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `arrival` on the `Flight` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `stops` on the `Flight` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "Flight_departure_idx";

-- AlterTable
ALTER TABLE "Flight" DROP COLUMN "dep",
ADD COLUMN     "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "searchKey" TEXT NOT NULL,
ALTER COLUMN "flightNo" DROP NOT NULL,
DROP COLUMN "departure",
ADD COLUMN     "departure" TIMESTAMP(3) NOT NULL,
DROP COLUMN "arrival",
ADD COLUMN     "arrival" TIMESTAMP(3) NOT NULL,
DROP COLUMN "stops",
ADD COLUMN     "stops" INTEGER NOT NULL,
ALTER COLUMN "seats" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Flight_searchKey_idx" ON "Flight"("searchKey");
