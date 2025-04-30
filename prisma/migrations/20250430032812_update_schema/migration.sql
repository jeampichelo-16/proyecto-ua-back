/*
  Warnings:

  - Added the required column `serial` to the `Platform` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Platform" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serial" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "typePlatform" TEXT NOT NULL DEFAULT 'ELECTRICO',
    "price" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVO',
    "horometerMaintenance" INTEGER NOT NULL DEFAULT 200,
    "description" TEXT,
    "operativityCertificatePath" TEXT NOT NULL,
    "ownershipDocumentPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Platform" ("brand", "createdAt", "description", "horometerMaintenance", "id", "model", "operativityCertificatePath", "ownershipDocumentPath", "price", "status", "typePlatform", "updatedAt") SELECT "brand", "createdAt", "description", "horometerMaintenance", "id", "model", "operativityCertificatePath", "ownershipDocumentPath", "price", "status", "typePlatform", "updatedAt" FROM "Platform";
DROP TABLE "Platform";
ALTER TABLE "new_Platform" RENAME TO "Platform";
CREATE UNIQUE INDEX "Platform_serial_key" ON "Platform"("serial");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
