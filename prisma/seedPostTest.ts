// prisma/seedPostTest.ts
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { addMinutes, addDays } from "date-fns";

const prisma = new PrismaClient();

enum QuotationStatus {
  PENDIENTE_DATOS = "PENDIENTE_DATOS",
  PENDIENTE_PAGO = "PENDIENTE_PAGO",
  PAGADO = "PAGADO",
  RECHAZADO = "RECHAZADO",
}

async function main() {
  const MAY_2025 = new Date("2025-05-01");

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

  const cotizacionesTotales = 22;
  const procesadas = Math.floor(cotizacionesTotales * 0.8);

  for (let i = 0; i < cotizacionesTotales; i++) {
    const fechaBase = addDays(MAY_2025, i % 15);
    const minutosRespuesta = Math.floor(faker.number.float({ min: 20, max: 50 }));
    const status: QuotationStatus =
      i < procesadas
        ? faker.helpers.arrayElement([QuotationStatus.PAGADO, QuotationStatus.RECHAZADO])
        : QuotationStatus.PENDIENTE_DATOS;

    const data = {
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
      startDate: fechaBase,
      endDate: addDays(fechaBase, 2),
      createdAt: fechaBase,
      updatedAt: addMinutes(fechaBase, minutosRespuesta),
      statusToPendingPagoAt:
        status !== QuotationStatus.PENDIENTE_DATOS
          ? addMinutes(fechaBase, minutosRespuesta)
          : null,
      statusToPagadoAt:
        status === QuotationStatus.PAGADO
          ? addMinutes(fechaBase, minutosRespuesta + 20)
          : null,
      statusToRechazadoAt:
        status === QuotationStatus.RECHAZADO
          ? addMinutes(fechaBase, minutosRespuesta + 15)
          : null,
      rejectionReason:
        status === QuotationStatus.RECHAZADO ? "No se aprobó presupuesto" : null,
    };

    await prisma.quotation.create({ data });
  }

  console.log("✅ Datos del PostTest insertados correctamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error al insertar PostTest:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
