/*
  Warnings:

  - You are about to drop the column `price_per_day` on the `Listing` table. All the data in the column will be lost.
  - Added the required column `price` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "price_per_day",
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL;
