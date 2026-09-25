/*
  Warnings:

  - You are about to drop the column `side` on the `Fill` table. All the data in the column will be lost.
  - Added the required column `takerSide` to the `Fill` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Asset" AS ENUM ('USD', 'BTC', 'ETH', 'SOL');

-- AlterTable
ALTER TABLE "Fill" DROP COLUMN "side",
ADD COLUMN     "takerSide" "OrderSide" NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "createdAt" DROP DEFAULT;
