-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quotation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "platformId" INTEGER NOT NULL,
    "operatorId" INTEGER,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "igv" REAL NOT NULL,
    "total" REAL NOT NULL,
    "typeCurrency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "days" INTEGER NOT NULL,
    "quotationPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quotation" ("amount", "clientId", "createdAt", "days", "description", "id", "igv", "operatorId", "platformId", "quotationPath", "status", "subtotal", "total", "typeCurrency", "updatedAt") SELECT "amount", "clientId", "createdAt", "days", "description", "id", "igv", "operatorId", "platformId", "quotationPath", "status", "subtotal", "total", "typeCurrency", "updatedAt" FROM "Quotation";
DROP TABLE "Quotation";
ALTER TABLE "new_Quotation" RENAME TO "Quotation";
CREATE UNIQUE INDEX "Quotation_platformId_key" ON "Quotation"("platformId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
