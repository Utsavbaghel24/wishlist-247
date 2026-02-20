/*
  Warnings:

  - You are about to drop the column `shop` on the `WishlistItem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WishlistItem" ("createdAt", "customerId", "id", "productId", "variantId") SELECT "createdAt", "customerId", "id", "productId", "variantId" FROM "WishlistItem";
DROP TABLE "WishlistItem";
ALTER TABLE "new_WishlistItem" RENAME TO "WishlistItem";
CREATE INDEX "WishlistItem_customerId_idx" ON "WishlistItem"("customerId");
CREATE UNIQUE INDEX "WishlistItem_customerId_productId_variantId_key" ON "WishlistItem"("customerId", "productId", "variantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
