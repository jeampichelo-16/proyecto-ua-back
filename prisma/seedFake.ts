import { PrismaClient, Role, OperatorStatus, PlatformStatus, PlatformType } from '@prisma/client';
import { Faker, es_MX, en } from '@faker-js/faker';

const faker = new Faker({ locale: [es_MX, en] });
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SeedMini: creando 5 operadores, plataformas y clientes...');

  // 1. Crear Operadores (usuarios con rol OPERARIO y estado ACTIVO)
  for (let i = 0; i < 5; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    const username = faker.internet.userName({ firstName, lastName });

    const user = await prisma.user.create({
      data: {
        email,
        username,
        firstName,
        lastName,
        dni: faker.string.numeric(8),
        password: '12345678', // En producción: hashear esta clave
        role: Role.OPERARIO,
        phone: `+51 9${faker.string.numeric(8)}`,
        isEmailVerified: true,
      },
    });

    await prisma.operator.create({
      data: {
        userId: user.id,
        operatorStatus: OperatorStatus.ACTIVO, // 🔥 siempre ACTIVO
        emoPDFPath: `/pdfs/emo_${user.id}.pdf`,
        operativityCertificatePath: `/pdfs/cert_op_${user.id}.pdf`,
      },
    });
  }

  // 2. Crear Plataformas (status ACTIVO)
  for (let i = 0; i < 5; i++) {
    await prisma.platform.create({
      data: {
        serial: faker.string.alphanumeric(8).toUpperCase(),
        brand: faker.vehicle.manufacturer(),
        model: faker.vehicle.model(),
        typePlatform: faker.helpers.arrayElement(Object.values(PlatformType)),
        price: parseFloat(faker.finance.amount({ min: 20000, max: 80000 })),
        status: PlatformStatus.ACTIVO, // ✅ siempre ACTIVO
        horometerMaintenance: 200,
        description: faker.lorem.sentence(),
        operativityCertificatePath: `/platforms/cert_${i}.pdf`,
        ownershipDocumentPath: `/platforms/owner_${i}.pdf`,
      },
    });
  }

  // 3. Crear Clientes
  for (let i = 0; i < 5; i++) {
    await prisma.client.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: `+51 9${faker.string.numeric(8)}`,
        ruc: faker.string.numeric(11),
        companyName: faker.company.name(),
        address: faker.location.streetAddress({ useFullAddress: true }),
      },
    });
  }

  console.log('✅ SeedMini completado con éxito 🚀');
}

main()
  .catch((err) => {
    console.error('❌ Error en el SeedMini:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
