/*
  Warnings:

  - You are about to drop the column `action` on the `UserBehavior` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `UserBehavior` table. All the data in the column will be lost.
  - Added the required column `destination` to the `UserBehavior` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `UserBehavior` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `UserBehavior` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `UserBehavior` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserBehavior_userId_idx";

-- AlterTable
ALTER TABLE "UserBehavior" DROP COLUMN "action",
DROP COLUMN "metadata",
ADD COLUMN     "destination" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
