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
  const fechaInicio = new Date("2025-05-01");
  const fechaHasta = new Date("2025-05-23");
  const diffInDays = Math.ceil(
    (fechaHasta.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
  );
  const COTIZACIONES_POR_DIA = 8;
  const TOTAL = diffInDays * COTIZACIONES_POR_DIA;
  const PROCESADAS = Math.floor(TOTAL * 0.8);

  const fakeEmails = [
    "ventas@acme.com",
    "info@logisticaperu.pe",
    "contacto@megacorp.net",
    "admin@transportruta.com",
    "recepcion@equipostrack.com",
  ];

  const clients = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      prisma.client.create({
        data: {
          name: `Cliente ${i + 1}`,
          companyName: `Empresa ${i + 1} SAC`,
          phone: `+51 98765${100 + i}`,
          address: `Av. Principal ${i + 1}xx - Lima`,
          email: fakeEmails[i],
          ruc: `20${i + 1}23456789`,
        },
      })
    )
  );

  const operatorData = [
    {
      firstName: "Luis",
      lastName: "González",
      dni: "44561234",
      email: "lgonzalez@empresa.com",
      phone: "+51 987654321",
    },
    {
      firstName: "María",
      lastName: "Fernández",
      dni: "55672345",
      email: "mfernandez@empresa.com",
      phone: "+51 987654322",
    },
    {
      firstName: "Carlos",
      lastName: "Ramírez",
      dni: "66783456",
      email: "cramirez@empresa.com",
      phone: "+51 987654323",
    },
    {
      firstName: "Ana",
      lastName: "Torres",
      dni: "77894567",
      email: "atorres@empresa.com",
      phone: "+51 987654324",
    },
    {
      firstName: "Jorge",
      lastName: "Vega",
      dni: "88905678",
      email: "jvega@empresa.com",
      phone: "+51 987654325",
    },
  ];

  const FIXED_DOCUMENT_URL =
    "https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/assets%2Flogo.jpg?alt=media&token=a7818d82-c3cc-4fd4-9ab2-3317c88e979f";

  const operators = await Promise.all(
    operatorData.map(async (data, i) => {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}`,
          firstName: data.firstName,
          lastName: data.lastName,
          dni: data.dni,
          phone: data.phone,
          password: "hashed-password",
          role: "OPERARIO",
        },
      });

      return prisma.operator.create({
        data: {
          userId: user.id,
          emoPDFPath: FIXED_DOCUMENT_URL,
          operativityCertificatePath: FIXED_DOCUMENT_URL,
          costService: 200 + i * 10,
          operatorStatus: i % 2 === 0 ? "ACTIVO" : "EN_COTIZACION",
        },
      });
    })
  );

  const platforms = await Promise.all(
    Array.from({ length: PROCESADAS }, (_, i) =>
      prisma.platform.create({
        data: {
          serial: `PLAT-${i + 1}`,
          brand: `Marca-${i % 5}`,
          model: `Modelo-${i + 1}`,
          price: 1000 + i * 5,
          operativityCertificatePath: FIXED_DOCUMENT_URL,
          ownershipDocumentPath: FIXED_DOCUMENT_URL,
          status: i % 4 === 0 ? "EN_COTIZACION" : "ACTIVO",
        },
      })
    )
  );

  let procesadas = 0;
  let pendientes = 0;

  for (let i = 0; i < TOTAL; i++) {
    const dia = Math.floor(i / COTIZACIONES_POR_DIA);
    const fechaBase = addDays(fechaInicio, dia);

    const isNeedOperator = Math.random() < 0.5;
    let status: QuotationStatus;
    let statusToPendingPagoAt: Date | null = null;
    let statusToPagadoAt: Date | null = null;
    let statusToRechazadoAt: Date | null = null;
    let rejectionReason: string | null = null;

    if (procesadas < PROCESADAS && Math.random() > 0.2) {
      // Variable: tiempo de cambio a PENDIENTE_PAGO
      // Distribución centrada en 4–5 minutos con pequeños desvíos
      const probabilidades = Math.random();
      let minutosParaCambioDeEstado: number;

      if (probabilidades < 0.6) {
        // 60% entre 4 y 5 min
        minutosParaCambioDeEstado = Math.floor(Math.random() * 2) + 4; // 4 o 5
      } else if (probabilidades < 0.9) {
        // 30% entre 3 y 6 min
        minutosParaCambioDeEstado = Math.floor(Math.random() * 4) + 3; // 3–6
      } else {
        // 10% extremos suaves: 1–2 o 7–8 min
        minutosParaCambioDeEstado =
          Math.random() < 0.5
            ? Math.floor(Math.random() * 2) + 1 // 1–2
            : Math.floor(Math.random() * 2) + 7; // 7–8
      }

      statusToPendingPagoAt = addMinutes(fechaBase, minutosParaCambioDeEstado);

      if (Math.random() < 1) {
        status = QuotationStatus.PAGADO;
        statusToPagadoAt = addMinutes(
          statusToPendingPagoAt,
          Math.floor(Math.random() * 60)
        ); // 0–60 min después
      } else {
        status = QuotationStatus.PENDIENTE_PAGO;
      }

      procesadas++;
    } else {
      status = QuotationStatus.PENDIENTE_DATOS;
      pendientes++;
    }

    const filteredPlatforms =
      status === QuotationStatus.PAGADO
        ? platforms
        : platforms.filter((p) => p.status === "EN_COTIZACION");

    if (filteredPlatforms.length === 0)
      throw new Error("No hay plataformas EN_COTIZACION disponibles");

    const platform =
      filteredPlatforms[Math.floor(Math.random() * filteredPlatforms.length)];

    let selectedOperatorId: number | null = null;

    if (isNeedOperator && status === QuotationStatus.PENDIENTE_PAGO) {
      const availableOperators = operators.filter(
        (o) => o.operatorStatus === "EN_COTIZACION"
      );
      if (availableOperators.length === 0)
        throw new Error("No hay operadores EN_COTIZACION disponibles");
      selectedOperatorId =
        availableOperators[
          Math.floor(Math.random() * availableOperators.length)
        ].id;
    } else if (status === QuotationStatus.PAGADO) {
      selectedOperatorId =
        operators[Math.floor(Math.random() * operators.length)].id;
    }

    const client = clients[i % clients.length];
    const clientNameSanitized = client.name.replace(/\s+/g, "_").toUpperCase();
    const platformSerialSanitized = platform.serial
      .replace(/\s+/g, "_")
      .toUpperCase();
    const timestamp = Date.now();
    const codeQuotation = `${clientNameSanitized}_${platformSerialSanitized}_${timestamp}`;

    await prisma.quotation.create({
      data: {
        clientId: client.id,
        platformId: platform.id,
        operatorId: selectedOperatorId,
        amount: 1000,
        subtotal: 1000,
        igv: 180,
        total: 1180,
        typeCurrency: "PEN",
        isNeedOperator,
        status,
        quotationPath:
          status === QuotationStatus.PENDIENTE_DATOS ? "" : FIXED_DOCUMENT_URL,
        paymentReceiptPath:
          status === QuotationStatus.PAGADO ? FIXED_DOCUMENT_URL : null,
        startDate: fechaBase,
        endDate: addDays(fechaBase, 2),
        createdAt: fechaBase,
        updatedAt: new Date(),
        statusToPendingPagoAt,
        statusToPagadoAt,
        statusToRechazadoAt,
        rejectionReason,
        codeQuotation,
      },
    });
  }

  console.log(
    `✅ Cotizaciones insertadas: ${procesadas} procesadas, ${pendientes} pendientes.`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error al insertar cotizaciones:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
