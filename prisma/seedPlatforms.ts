import { PrismaClient, PlatformStatus, PlatformType } from "@prisma/client";
import { generatePlatformSerial } from "../src/common/utils/generate-platform-serial.util";

const prisma = new PrismaClient();

async function main() {
  const machines = [
    {
      name: "800AJ",
      type: PlatformType.DIESEL,
      brand: "JLG",
      pricePerDay: 600,
      file: "https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/machines%2Fz-defecto%2F800AJ.pdf?alt=media&token=a03b609a-08b6-4f2a-9f76-b1610984facd",
    },
    {
      name: "600AJ",
      pricePerDay: 550,
      type: PlatformType.DIESEL,
      brand: "JLG",
      file: "https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/machines%2Fz-defecto%2F600AJ.pdf?alt=media&token=366a6f2f-542e-46ea-9e01-7a9210dc4bdb",
    },
    {
      name: "450J",
      pricePerDay: 400,
      type: PlatformType.DIESEL,
      brand: "JLG",
      file: "https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/machines%2Fz-defecto%2F450J.pdf?alt=media&token=2fd721e0-1054-4ec3-bf93-ceaa0c043204",
    },
    {
      name: "Z45/25",
      pricePerDay: 400,
      type: PlatformType.ELECTRICO,
      brand: "GENIE",
      file: "https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/machines%2Fz-defecto%2FZ45.pdf?alt=media&token=fe5a2534-88e6-4dce-bffd-93f2a713c035",
    },
    {
      name: "3246ES",
      pricePerDay: 300,
      type: PlatformType.ELECTRICO,
      brand: "JLG",
      file: "https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/machines%2Fz-defecto%2F3246.pdf?alt=media&token=f708fd7b-b1f0-4136-b0cb-813ccb513c77",
    },
  ];

  for (const machine of machines) {
    await prisma.platform.create({
      data: {
        serial: generatePlatformSerial(),
        brand:  machine.brand,
        model: machine.name,
        typePlatform: machine.type,
        price: machine.pricePerDay,
        status: PlatformStatus.ACTIVO,
        horometerMaintenance: 200,
        description: `Plataforma modelo ${machine.name}`,
        operativityCertificatePath: machine.file,
        ownershipDocumentPath: machine.file,
      },
    });

    console.log(`✔️ Plataforma creada: ${machine.name}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding platforms:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
