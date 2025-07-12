import { PrismaClient, QuotationStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { randomBytes } from "crypto";

faker.seed(42);

const prisma = new PrismaClient();

let CLIENT_IDS: number[] = [];
let PLATFORM_IDS: number[] = [];
let OPERATOR_IDS: number[] = [];

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
  const platform = await prisma.platform.findUnique({ where: { id: platformId } });

  if (!client || !platform) throw new Error("Cliente o plataforma no encontrados");

  const clientName = client.name.replace(/\s+/g, "_").toUpperCase();
  const platformSerial = platform.serial.replace(/\s+/g, "_").toUpperCase();
  const timestamp = createdAt.getTime();
  const randomPart = randomBytes(3).toString("hex").toUpperCase();

  return `${clientName}_${platformSerial}_${timestamp}_${randomPart}`;
}

const DAILY_QUOTATIONS: { date: string; paid: number; total: number }[] = [
  { date: "2025-05-01", paid: 10, total: 10 },
  { date: "2025-05-02", paid: 9, total: 10 },
  { date: "2025-05-03", paid: 10, total: 11 },
  { date: "2025-05-04", paid: 9, total: 11 },
  { date: "2025-05-05", paid: 8, total: 10 },
  { date: "2025-05-06", paid: 6, total: 12 },
  { date: "2025-05-07", paid: 7, total: 11 },
  { date: "2025-05-08", paid: 10, total: 11 },
  { date: "2025-05-09", paid: 11, total: 13 },
  { date: "2025-05-10", paid: 8, total: 13 },
  { date: "2025-05-11", paid: 11, total: 13 },
  { date: "2025-05-12", paid: 9, total: 9 },
  { date: "2025-05-13", paid: 8, total: 9 },
  { date: "2025-05-14", paid: 9, total: 10 },
  { date: "2025-05-15", paid: 10, total: 13 },
  { date: "2025-05-16", paid: 10, total: 11 },
  { date: "2025-05-17", paid: 6, total: 9 },
  { date: "2025-05-18", paid: 9, total: 10 },
  { date: "2025-05-19", paid: 7, total: 12 },
  { date: "2025-05-20", paid: 7, total: 9 },
  { date: "2025-05-21", paid: 11, total: 12 },
  { date: "2025-05-22", paid: 9, total: 10 },
];

const RESPONSE_TIMES_BY_DATE: Record<string, number> = {
  "2025-05-01": 4.5,
  "2025-05-02": 3.2,
  "2025-05-03": 3.45,
  "2025-05-04": 3.36,
  "2025-05-05": 5.9,
  "2025-05-06": 3.75,
  "2025-05-07": 4.27,
  "2025-05-08": 4.0,
  "2025-05-09": 3.31,
  "2025-05-10": 3.08,
  "2025-05-11": 2.31,
  "2025-05-12": 5.22,
  "2025-05-13": 5.0,
  "2025-05-14": 3.1,
  "2025-05-15": 3.77,
  "2025-05-16": 3.09,
  "2025-05-17": 3.89,
  "2025-05-18": 3.6,
  "2025-05-19": 2.58,
  "2025-05-20": 4.67,
  "2025-05-21": 3.25,
  "2025-05-22": 3.9,
};

async function main() {
  await prisma.quotation.deleteMany({});

  CLIENT_IDS = (await prisma.client.findMany({ select: { id: true } })).map(c => c.id);
  PLATFORM_IDS = (await prisma.platform.findMany({ select: { id: true } })).map(p => p.id);
  OPERATOR_IDS = (await prisma.operator.findMany({ select: { id: true } })).map(o => o.id);

  for (const { date, paid, total } of DAILY_QUOTATIONS) {
    const baseDate = new Date(`${date}T00:00:00Z`);
    const avgResponseMin = RESPONSE_TIMES_BY_DATE[date];

    for (let i = 0; i < total; i++) {
      const isPaid = i < paid;
      const clientId = faker.helpers.arrayElement(CLIENT_IDS);
      const platformId = faker.helpers.arrayElement(PLATFORM_IDS);
      const isNeedOperator = faker.datatype.boolean();
      const operatorId = isNeedOperator ? faker.helpers.arrayElement(OPERATOR_IDS) : null;

      const amount = faker.number.float({ min: 1000, max: 3000, fractionDigits: 2 });
      const deliveryAmount = isNeedOperator ? 200 : null;
      const subtotal = amount + (deliveryAmount || 0);
      const igv = parseFloat((subtotal * 0.18).toFixed(2));
      const totalAmount = parseFloat((subtotal + igv).toFixed(2));

      const createdAt = generateLimaDate(baseDate, faker.number.int({ min: 0, max: 2 }));
      const startDate = generateLimaDate(baseDate, faker.number.int({ min: 3, max: 5 }));
      const endDate = generateLimaDate(baseDate, faker.number.int({ min: 6, max: 8 }));

      let status: QuotationStatus;
      let statusToPendingPagoAt: Date | null = null;
      let statusToPagadoAt: Date | null = null;
      let statusToRechazadoAt: Date | null = null;
      let rejectionReason: string | null = null;

      if (isPaid) {
        status = QuotationStatus.PAGADO;

        const offsetVariation = faker.number.float({ min: -0.25, max: 0.25 });
        const finalResponseMin = avgResponseMin + offsetVariation;
        statusToPendingPagoAt = new Date(createdAt.getTime() + finalResponseMin * 60 * 1000);

        statusToPagadoAt = new Date(createdAt.getTime() + faker.number.int({ min: 10, max: 25 }) * 60 * 1000);
      } else {
        status = QuotationStatus.RECHAZADO;
        statusToRechazadoAt = new Date(createdAt.getTime() + faker.number.int({ min: 10, max: 20 }) * 60 * 1000);
        rejectionReason = faker.helpers.arrayElement([
          "Datos incompletos",
          "Cliente canceló",
          "No disponibilidad de plataforma",
        ]);
      }

      await prisma.quotation.create({
        data: {
          codeQuotation: await generateCodeQuotation(clientId, platformId, createdAt),
          clientId,
          platformId,
          operatorId,
          isNeedOperator,
          amount,
          deliveryAmount,
          subtotal,
          igv,
          total: totalAmount,
          typeCurrency: "PEN",
          status,
          description: faker.lorem.sentence(),
          quotationPath: `https://storage.googleapis.com/sandbox-566f/quotations%2Fdemo.pdf`,
          paymentReceiptPath: status === QuotationStatus.PAGADO ? `https://storage.googleapis.com/sandbox-566f/receipts%2Fdemo.pdf` : null,
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
    }
  }

  console.log("✅ Se generaron exactamente 239 cotizaciones con tasas fijas por día (81.18%) y tiempos de respuesta predefinidos.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });