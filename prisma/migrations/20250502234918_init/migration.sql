-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "dni" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "refreshToken" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLEADO',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "operatorStatus" TEXT NOT NULL DEFAULT 'ACTIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emoPDFPath" TEXT NOT NULL,
    "operativityCertificatePath" TEXT NOT NULL,
    CONSTRAINT "Operator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "ruc" TEXT,
    "companyName" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "platformId" INTEGER NOT NULL,
    "operatorId" INTEGER,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "deliveryAmount" REAL,
    "subtotal" REAL NOT NULL,
    "igv" REAL NOT NULL,
    "total" REAL NOT NULL,
    "typeCurrency" TEXT NOT NULL,
    "isNeedOperator" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "days" INTEGER NOT NULL,
    "quotationPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Platform" (
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "User"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_ruc_key" ON "Client"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Platform_serial_key" ON "Platform"("serial");
