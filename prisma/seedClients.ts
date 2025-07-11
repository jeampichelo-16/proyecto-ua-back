import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const clients = [
    {
      name: "CARRERA CRUZADO GUSTAVO",
      companyName: "HVAC MULTISERVICIOS G & C S.A.C.",
      ruc: "20609182564",
      address: "L. LOS NOGALES MZA. L LOTE. 11 ASC. SHANGRILLA PUENTE PIED",
      email: "empresa@hvacmultiserviciosio.com",
      phone: "953102755",
    },
    {
      name: "FRANCISCO ESQUIVEL",
      companyName: "EL MUNDIAL SERVICIOS GENERALES S.A.C.",
      ruc: "20601425042",
      address: "MZA. J3 LOTE. 26 URB. SAN ANDRES V ETAPA LA LIBERTAD",
      email: "fjesquivel@enerpleio.com",
      phone: "904782668",
    },
    {
      name: "JACK",
      companyName: "CANADA SMART CHEMICALS S.A.C.",
      ruc: "20611108932",
      address: "AV. INDUSTRIAL NRO. 4 OTR. LAS PRADERAS DE LURIN.",
      email: "jack@canadasmartchemicalsio.com",
      phone: "963350797",
    },
    {
      name: "HECTOR LOPEZ",
      companyName: "JMT OUTDOORS S.A.C.",
      ruc: "20513953012",
      address: "AV. EL DERBY NRO. 254 DPTO. 1004 URB. EL DERBY LIMA",
      email: "hector.lopez@imtoutdoorsio.com.pe",
      phone: "981392833",
    },
    {
      name: "AYRTON POMA A.",
      companyName: "FERROSALT S.A.",
      ruc: "20464265504",
      address: "AV. INDUSTRIAL LOTE. 4 URB. LAS PRADERAS (ALT. KM. 40 - LURIN)",
      email: "proyectos@ferrosaltio.com.pe",
      phone: "990261953",
    },
  ];

  for (const client of clients) {
    await prisma.client.upsert({
      where: { ruc: client.ruc },
      update: {},
      create: {
        name: client.name,
        companyName: client.companyName,
        ruc: client.ruc,
        address: client.address,
        email: client.email ?? undefined,
        phone: client.phone,
        isActive: true,
      },
    });

    console.log(`✔️ Cliente registrado: ${client.companyName}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error al insertar clientes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
