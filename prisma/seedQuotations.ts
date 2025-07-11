import { PrismaClient, QuotationStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { randomBytes } from "crypto";

faker.seed(42);

const prisma = new PrismaClient();

let CLIENT_IDS: number[] = [];
let PLATFORM_IDS: number[] = [];
let OPERATOR_IDS: number[] = [];

const START_DATE = new Date("2025-05-01T00:00:00Z");
const END_DATE = new Date("2025-05-22T23:59:59Z");

const daysBetween = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
};

const limaOffsetInMs = 5 * 60 * 60 * 1000;
const generateLimaDate = (baseDate: Date, hourOffset = 0): Date => {
  const limaDate = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
      8 + hourOffset,
      faker.number.int({ min: 0, max: 59 }),
      0
    )
  );
  return new Date(limaDate.getTime() + limaOffsetInMs);
};

async function generateCodeQuotation(
  clientId: number,
  platformId: number,
  createdAt: Date
): Promise<string> {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!client || !platform)
    throw new Error("Cliente o plataforma no encontrados");

  const clientName = client.name.replace(/\s+/g, "_").toUpperCase();
  const platformSerial = platform.serial.replace(/\s+/g, "_").toUpperCase();
  const timestamp = createdAt.getTime();
  const randomPart = randomBytes(3).toString("hex").toUpperCase();

  return `${clientName}_${platformSerial}_${timestamp}_${randomPart}`;
}

async function main() {
  // Limpiar antes de insertar
  await prisma.quotation.deleteMany({});

  CLIENT_IDS = (await prisma.client.findMany({ select: { id: true } })).map(
    (c) => c.id
  );
  PLATFORM_IDS = (await prisma.platform.findMany({ select: { id: true } })).map(
    (p) => p.id
  );
  OPERATOR_IDS = (await prisma.operator.findMany({ select: { id: true } })).map(
    (o) => o.id
  );

  const days = daysBetween(START_DATE, END_DATE);

  let totalCount = 0;

  for (const day of days) {
    if (totalCount >= 239) break;

    const remaining = 239 - totalCount;
    const numQuotations = Math.min(
      faker.number.int({ min: 12, max: 15 }),
      remaining
    );
const paidSameDayTarget = Math.round(
  numQuotations * faker.number.float({ min: 0.775, max: 0.836 })
);

    for (let i = 0; i < numQuotations; i++) {
      const clientId = faker.helpers.arrayElement(CLIENT_IDS);
      const platformId = faker.helpers.arrayElement(PLATFORM_IDS);
      const isNeedOperator = faker.datatype.boolean();
      const operatorId = isNeedOperator
        ? faker.helpers.arrayElement(OPERATOR_IDS)
        : null;

      const amount = faker.number.float({
        min: 1000,
        max: 3000,
        fractionDigits: 2,
      });
      const deliveryAmount = isNeedOperator ? 200 : null;
      const subtotal = amount + (deliveryAmount || 0);
      const igv = parseFloat((subtotal * 0.18).toFixed(2));
      const total = parseFloat((subtotal + igv).toFixed(2));

      const createdAt = generateLimaDate(
        day,
        faker.number.int({ min: 0, max: 2 })
      );
      const startDate = generateLimaDate(
        day,
        faker.number.int({ min: 3, max: 5 })
      );
      const endDate = generateLimaDate(
        day,
        faker.number.int({ min: 6, max: 8 })
      );

      const isRejected = i >= paidSameDayTarget;

      let status: QuotationStatus;
      let statusToPendingPagoAt: Date | null = null;
      let statusToPagadoAt: Date | null = null;
      let statusToRechazadoAt: Date | null = null;
      let rejectionReason: string | null = null;

      if (isRejected) {
        status = QuotationStatus.RECHAZADO;
        statusToRechazadoAt = new Date(
          createdAt.getTime() +
            faker.number.int({ min: 10, max: 20 }) * 60 * 1000
        );
        rejectionReason = faker.helpers.arrayElement([
          "Datos incompletos",
          "Cliente canceló",
          "No disponibilidad de plataforma",
        ]);
      } else {
        status = QuotationStatus.PAGADO;
        statusToPendingPagoAt = new Date(
          createdAt.getTime() + faker.number.float({ min: 3, max: 4.43 }) * 60 * 1000
        );
        statusToPagadoAt = new Date(
          createdAt.getTime() +
            faker.number.int({ min: 10, max: 25 }) * 60 * 1000
        );
      }

      await prisma.quotation.create({
        data: {
          codeQuotation: await generateCodeQuotation(
            clientId,
            platformId,
            createdAt
          ),
          clientId,
          platformId,
          operatorId,
          isNeedOperator,
          amount,
          deliveryAmount,
          subtotal,
          igv,
          total,
          typeCurrency: "PEN",
          status,
          description: faker.lorem.sentence(),
          quotationPath: `https://storage.googleapis.com/sandbox-566f/quotations%2Fdemo.pdf`,
          paymentReceiptPath:
            status === QuotationStatus.PAGADO
              ? `https://storage.googleapis.com/sandbox-566f/receipts%2Fdemo.pdf`
              : null,
          startDate,
          endDate,
          createdAt,
          statusToPendingPagoAt,
          statusToPagadoAt,
          statusToRechazadoAt,
          updatedAt: new Date(),
          rejectionReason,
        },
      });

      totalCount++;
      if (totalCount >= 239) break;
    }
  }

  console.log(
    "✅ Se generaron exactamente 239 cotizaciones con fechas en horario Lima y entre 16% y 23% rechazadas."
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
