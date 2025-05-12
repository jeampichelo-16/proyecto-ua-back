import { PrismaClient, Role, PlatformStatus, PlatformType, OperatorStatus, QuotationStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Eliminando datos existentes...');
  await prisma.quotation.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.client.deleteMany();
  await prisma.platform.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creando usuarios...');
  const users = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email(),
          username: faker.internet.userName(),
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          dni: faker.string.numeric(8),
          password: faker.internet.password(),
          role: Role.OPERARIO,
          isEmailVerified: true,
          isActive: true,
        },
      })
    )
  );

  console.log('🔧 Creando operadores...');
  const operators = await Promise.all(
    users.map((user) =>
      prisma.operator.create({
        data: {
          userId: user.id,
          emoPDFPath: 'emo.pdf',
          operativityCertificatePath: 'cert.pdf',
          costService: faker.number.float({ min: 100, max: 500 }),
          operatorStatus: faker.helpers.arrayElement(Object.values(OperatorStatus)),
        },
      })
    )
  );

  console.log('🏗️ Creando plataformas...');
  const platforms = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      prisma.platform.create({
        data: {
          serial: faker.string.uuid(),
          brand: faker.company.name(),
          model: faker.string.alphanumeric(6),
          price: faker.number.float({ min: 300, max: 1000 }),
          status: faker.helpers.arrayElement(Object.values(PlatformStatus)),
          typePlatform: faker.helpers.arrayElement(Object.values(PlatformType)),
          operativityCertificatePath: 'cert_path.pdf',
          ownershipDocumentPath: 'ownership.pdf',
        },
      })
    )
  );

  console.log('👥 Creando clientes...');
  const clients = await Promise.all(
    Array.from({ length: 20 }).map(() =>
      prisma.client.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          ruc: faker.string.numeric(11),
          companyName: faker.company.name(),
          address: faker.location.streetAddress(),
        },
      })
    )
  );

  console.log('📄 Creando cotizaciones...');
  const now = new Date();

  await Promise.all(
    Array.from({ length: 200 }).map(() => {
      const client = faker.helpers.arrayElement(clients);
      const platform = faker.helpers.arrayElement(platforms);
      const operator = faker.helpers.arrayElement(operators);
      const status = faker.helpers.arrayElement(Object.values(QuotationStatus));

      const startDate = faker.date.recent({ days: 60 });
      const endDate = faker.date.soon({ days: 10, refDate: startDate });

      const subtotal = faker.number.float({ min: 300, max: 2000 });
      const igv = subtotal * 0.18;
      const total = subtotal + igv;

      return prisma.quotation.create({
        data: {
          clientId: client.id,
          platformId: platform.id,
          operatorId: operator.id,
          description: faker.lorem.paragraph(),
          amount: total,
          subtotal,
          igv,
          total,
          typeCurrency: 'PEN',
          isNeedOperator: true,
          status,
          quotationPath: 'file.pdf',
          startDate,
          endDate,
          createdAt: startDate,
          statusToPendingPagoAt: status === 'PENDIENTE_PAGO' ? faker.date.between({ from: startDate, to: endDate }) : undefined,
          statusToPagadoAt: status === 'PAGADO' ? faker.date.between({ from: startDate, to: endDate }) : undefined,
          statusToRechazadoAt: status === 'RECHAZADO' ? faker.date.between({ from: startDate, to: endDate }) : undefined,
        },
      });
    })
  );

  console.log('✅ Seed finalizado con datos fake.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
