import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { Role } from "../src/common/enum/role.enum";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;
  const adminUsername = process.env.ADMIN_USERNAME!;
  const adminFirstName = process.env.ADMIN_FIRST_NAME!;
  const adminLastName = process.env.ADMIN_LAST_NAME!;

  // Empleado
  const employeeEmail = process.env.EMPLOYEE_EMAIL!;
  const employeePassword = process.env.EMPLOYEE_PASSWORD!;
  const employeeUsername = process.env.EMPLOYEE_USERNAME!;
  const employeeFirstName = process.env.EMPLOYEE_FIRST_NAME!;
  const employeeLastName = process.env.EMPLOYEE_LAST_NAME!;

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const existingEmployee = await prisma.user.findUnique({ where: { email: employeeEmail } });

  if (!existingAdmin) {
    const hashedAdmin = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        firstName: adminFirstName,
        lastName: adminLastName,
        password: hashedAdmin,
        role: Role.ADMIN,
        isEmailVerified: true,
      },
    });
    console.log(`✅ Admin seed creado: ${adminEmail}`);
  } else {
    console.log("✅ Admin ya existe.");
  }

  if (!existingEmployee) {
    const hashedEmployee = await bcrypt.hash(employeePassword, 10);
    await prisma.user.create({
      data: {
        email: employeeEmail,
        username: employeeUsername,
        firstName: employeeFirstName,
        lastName: employeeLastName,
        password: hashedEmployee,
        role: Role.EMPLEADO,
        isEmailVerified: true,
      },
    });
    console.log(`✅ Empleado seed creado: ${employeeEmail}`);
  } else {
    console.log("✅ Empleado ya existe.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error al ejecutar el seed:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
