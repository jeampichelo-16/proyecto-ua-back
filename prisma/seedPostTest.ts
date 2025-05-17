import { PrismaClient, PlatformStatus, OperatorStatus } from "@prisma/client";
import { addMinutes, addDays } from "date-fns";

const prisma = new PrismaClient();

enum QuotationStatus {
  PENDIENTE_DATOS = "PENDIENTE_DATOS",
  PENDIENTE_PAGO = "PENDIENTE_PAGO",
  PAGADO = "PAGADO",
  RECHAZADO = "RECHAZADO",
}

async function main() {
  const TOTAL = 190;
  const fechaInicio = new Date("2025-05-01");
  const PROCESADAS = Math.floor(TOTAL * 0.8); // 152 procesadas (≈ 80%)

  // Crear 5 clientes
  const clients = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.client.create({
        data: {
          name: `Cliente ${i + 1}`,
          email: `cliente${i + 1}@test.com`,
          ruc: `20${i + 1}23456789`,
        },
      })
    )
  );

  // Crear 5 usuarios + operadores
  const operators = await Promise.all(
    Array.from({ length: 5 }, async (_, i) => {
      const user = await prisma.user.create({
        data: {
          email: `operario${i + 1}@test.com`,
          username: `operario${i + 1}`,
          firstName: `Operario`,
          lastName: `#${i + 1}`,
          dni: `1234567${i}`,
          password: "hashed-password",
          role: "OPERARIO",
        },
      });

      return prisma.operator.create({
        data: {
          userId: user.id,
          emoPDFPath: `emo_${i + 1}.pdf`,
          operativityCertificatePath: `cert_op_${i + 1}.pdf`,
          costService: 200 + i * 10,
          operatorStatus: i % 2 === 0 ? "ACTIVO" : "EN_TRABAJO",
        },
      });
    })
  );

  // Crear plataformas según número de cotizaciones procesadas
  const platforms = await Promise.all(
    Array.from({ length: PROCESADAS }, (_, i) =>
      prisma.platform.create({
        data: {
          serial: `PLAT-${i + 1}`,
          brand: `Marca-${i % 5}`,
          model: `Modelo-${i + 1}`,
          price: 1000 + i * 5,
          operativityCertificatePath: `cert_plat_${i + 1}.pdf`,
          ownershipDocumentPath: `prop_${i + 1}.pdf`,
          status: i % 4 === 0 ? "EN_TRABAJO" : "ACTIVO",
        },
      })
    )
  );

  let procesadas = 0;
  let pendientes = 0;

  for (let i = 0; i < TOTAL; i++) {
    const dia = i % 15;
    const fechaBase = addDays(fechaInicio, dia);

    let status: QuotationStatus;
    let statusToPendingPagoAt: Date | null = null;
    let statusToPagadoAt: Date | null = null;
    let statusToRechazadoAt: Date | null = null;
    let rejectionReason: string | null = null;

    let platformId: number | null = null;

    if (procesadas < PROCESADAS && Math.random() > 0.2) {
      const minutosRespuesta = +(Math.random() * (0.9 - 0.4) + 0.4).toFixed(2);
      statusToPendingPagoAt = addMinutes(fechaBase, minutosRespuesta);

      if (Math.random() < 0.7) {
        status = QuotationStatus.PAGADO;
        statusToPagadoAt = statusToPendingPagoAt;
      } else {
        status = QuotationStatus.RECHAZADO;
        statusToRechazadoAt = statusToPendingPagoAt;
        rejectionReason = Math.random() < 0.5 ? "Presupuesto rechazado" : "Cliente desistió";
      }

      platformId = platforms[procesadas].id;
      procesadas++;
    } else {
      status = QuotationStatus.PENDIENTE_DATOS;
      pendientes++;
      // Para no violar la FK, seleccionamos una plataforma random ya creada
      platformId = platforms[Math.floor(Math.random() * platforms.length)].id;
    }

    const client = clients[i % clients.length];
    const operator = operators[i % operators.length];

    await prisma.quotation.create({
      data: {
        clientId: client.id,
        platformId,
        operatorId: operator.id,
        amount: 1000,
        subtotal: 1000,
        igv: 180,
        total: 1180,
        typeCurrency: "PEN",
        isNeedOperator: true,
        status,
        quotationPath: `cotizacion_${i + 1}.pdf`,
        startDate: fechaBase,
        endDate: addDays(fechaBase, 2),
        createdAt: fechaBase,
        updatedAt: new Date(),
        statusToPendingPagoAt,
        statusToPagadoAt,
        statusToRechazadoAt,
        rejectionReason,
      },
    });
  }

  console.log(`✅ Cotizaciones insertadas: ${procesadas} procesadas, ${pendientes} pendientes.`);
}

main()
  .catch((e) => {
    console.error("❌ Error al insertar cotizaciones:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
