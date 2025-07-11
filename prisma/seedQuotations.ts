import { PrismaClient, QuotationStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const CLIENT_IDS = [6, 7, 8, 9, 10];
const PLATFORM_IDS = Array.from({ length: 25 }, (_, i) => 27 + i); // 27 to 51
const OPERATOR_IDS = [1, 2, 3, 4];

const START_DATE = new Date("2025-05-01T00:00:00Z");
const END_DATE = new Date("2025-05-22T23:59:59Z");

// Genera array con fechas por día (UTC)
const daysBetween = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

// Genera hora específica en UTC dentro de un día
const generateUtcDateInDay = (baseDate: Date, hourOffset = 0): Date => {
  return new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate(),
      8 + hourOffset,
      faker.number.int({ min: 0, max: 59 }),
      0,
      0
    )
  );
};

async function generateCodeQuotation(
  clientId: number,
  platformId: number
): Promise<string> {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!client || !platform) {
    throw new Error("Cliente o plataforma no encontrados");
  }

  const clientName = client.name.replace(/\s+/g, "_").toUpperCase();
  const platformSerial = platform.serial.replace(/\s+/g, "_").toUpperCase();
  const timestamp = Date.now();
  return `${clientName}_${platformSerial}_${timestamp}`;
}

async function main() {
  const days = daysBetween(START_DATE, END_DATE);
  let quotationCounter = 1;

  for (const day of days) {
    const numQuotations = faker.number.int({ min: 7, max: 12 });

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

      const createdAt = generateUtcDateInDay(
        day,
        faker.number.int({ min: 0, max: 3 })
      );
      const startDate = generateUtcDateInDay(
        day,
        faker.number.int({ min: 4, max: 6 })
      );
      const endDate = generateUtcDateInDay(
        day,
        faker.number.int({ min: 7, max: 9 })
      );

      const statusToPendingPagoAt = new Date(createdAt);
      statusToPendingPagoAt.setUTCMinutes(
        createdAt.getUTCMinutes() + faker.number.int({ min: 2, max: 5 })
      );

      const statusToPagadoAt = new Date(createdAt);
      statusToPagadoAt.setUTCMinutes(
        createdAt.getUTCMinutes() + faker.number.int({ min: 12, max: 25 })
      );

      await prisma.quotation.create({
        data: {
          codeQuotation: await generateCodeQuotation(clientId, platformId),
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
          status: QuotationStatus.PAGADO,
          description: faker.lorem.sentence(),
          quotationPath: `files/quotation_COT-${quotationCounter}.pdf`,
          paymentReceiptPath: `files/payment_COT-${quotationCounter}.pdf`,
          startDate,
          endDate,
          createdAt,
          statusToPendingPagoAt,
          statusToPagadoAt,
          updatedAt: statusToPagadoAt,
          rejectionReason: null,
        },
      });

      quotationCounter++;
    }
  }

  console.log("✅ Cotizaciones cerradas generadas en UTC con éxito");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
