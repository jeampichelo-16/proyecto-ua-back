// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

// ✅ Importa con ruta relativa (no "src/...")
import { Role } from "../src/common/enum/role.enum";

dotenv.config(); // Cargar variables de entorno

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "❌ ADMIN_EMAIL o ADMIN_PASSWORD no están definidos en .env"
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log("✅ Admin ya existe. No se necesita seeding.");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      isEmailVerified: true,
      role: Role.ADMIN, // Usa el enum local correctamente
    },
  });

  console.log(`🚀 Admin seed creado: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error("❌ Error al ejecutar el seed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
