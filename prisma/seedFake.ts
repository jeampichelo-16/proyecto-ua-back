// seedPostTest.ts
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { addDays } from "date-fns";

export enum QuotationStatus {
  PENDIENTE_DATOS = "PENDIENTE_DATOS",
  PENDIENTE_PAGO = "PENDIENTE_PAGO",
  PAGADO = "PAGADO",
  RECHAZADO = "RECHAZADO",
}

const prisma = new PrismaClient();

async function main() {
  const startDate = new Date("2025-05-01");

  // Asegúrate de tener al menos un cliente, operador y plataforma
  const client = await prisma.client.create({
    data: {
      name: "Cliente PostTest",
      email: faker.internet.email(),
      ruc: faker.string.numeric(11),
    },
  });

  const user = await prisma.user.create({
    data: {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      dni: faker.string.numeric(8),
      password: "hashed-password",
      role: "OPERARIO",
    },
  });

  const operator = await prisma.operator.create({
    data: {
      userId: user.id,
      emoPDFPath: faker.system.filePath(),
      operativityCertificatePath: faker.system.filePath(),
      costService: faker.number.float({ min: 100, max: 300 }),
    },
  });

  const platform = await prisma.platform.create({
    data: {
      serial: faker.string.uuid(),
      brand: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      price: faker.number.float({ min: 500, max: 1500 }),
      operativityCertificatePath: faker.system.filePath(),
      ownershipDocumentPath: faker.system.filePath(),
    },
  });

  // Crear cotizaciones
  for (let i = 0; i < 22; i++) {
    const createdAt = addDays(startDate, i % 15);
    const isProcessed = Math.random() < 0.8;
    const status: QuotationStatus = faker.helpers.arrayElement([
      QuotationStatus.PAGADO,
      QuotationStatus.RECHAZADO,
      QuotationStatus.PENDIENTE_DATOS,
    ]);

    await prisma.quotation.create({
      data: {
        clientId: client.id,
        platformId: platform.id,
        operatorId: operator.id,
        amount: faker.number.float({ min: 300, max: 2000 }),
        subtotal: 1000,
        igv: 180,
        total: 1180,
        typeCurrency: "PEN",
        isNeedOperator: true,
        status,
        quotationPath: faker.system.filePath(),
        startDate: createdAt,
        endDate: addDays(createdAt, 2),
        createdAt,
        statusToPagadoAt:
          status === QuotationStatus.PAGADO ? addDays(createdAt, 1) : null,
        rejectionReason:
          status === QuotationStatus.RECHAZADO
            ? "No se aprobó presupuesto"
            : null,
      },
    });
  }

  console.log("✅ Datos PostTest generados correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
