import { PrismaClient, Role, OperatorStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  const operators = [
    {
      firstName: 'Brando',
      lastName: 'Durand',
      email: 'brando.durand@mansercom.io.com',
      username: 'brandod',
      dni: '12345678',
      emoPDFPath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FBRANDO%20DURAND%2FEMO%2FEMODB.pdf?alt=media&token=83e5472c-a478-4d94-9423-e1704abfac14',
      operativityCertificatePath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FBRANDO%20DURAND%2FOperatividad%2FOpBD.pdf?alt=media&token=26cedda5-e620-49df-96a8-5418bd8591e6',
    },
    {
      firstName: 'David',
      lastName: 'Trujillo',
      email: 'david.trujillo@mansercom.io.com',
      username: 'davidt',
      dni: '23456789',
      emoPDFPath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FDAVID%20TRUJILLO%2FEMO%2FEMODT.pdf?alt=media&token=67103b5f-c444-480c-abb3-88fa6b6f1bd2',
      operativityCertificatePath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FDAVID%20TRUJILLO%2FOperatividad%2FOpDT.pdf?alt=media&token=5bc7237d-a83d-4b8e-acb7-3e82ad9dc681',
    },
    {
      firstName: 'Juan',
      lastName: 'Urbina',
      email: 'juan.urbina@mansercom.io.com',
      username: 'juanu',
      dni: '34567890',
      emoPDFPath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FJUAN%20URBINA%2FEMO%2FEMOJU.pdf?alt=media&token=c1dc700e-001d-4c11-909f-1b64a0071f18',
      operativityCertificatePath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FJUAN%20URBINA%2FOperatividad%2FOPJU.pdf?alt=media&token=af024a1e-8a6e-4384-ace1-792a99a6a6f0',
    },
    {
      firstName: 'Franklin',
      lastName: 'Rodriguez',
      email: 'franklin.rodriguez@mansercom.io.com',
      username: 'franklinr',
      dni: '45678901',
      emoPDFPath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FFRANKLIN%20RODRIGUEZ%2FEMO%2FEMOFR.pdf?alt=media&token=e323de85-db55-46e6-baba-5d17ed3d390e',
      operativityCertificatePath:
        'https://firebasestorage.googleapis.com/v0/b/proyecto-desarrollo-8095f.firebasestorage.app/o/operators%2Fz-defecto%2FFRANKLIN%20RODRIGUEZ%2FOperatividad%2FOPFR.pdf?alt=media&token=e6c44e63-adb5-4482-b356-11c104ac88d8',
    },
  ];

  for (const op of operators) {
    // Crear usuario relacionado
    const user = await prisma.user.upsert({
      where: { email: op.email },
      update: {},
      create: {
        email: op.email,
        username: op.username,
        firstName: op.firstName,
        lastName: op.lastName,
        dni: op.dni,
        phone: faker.phone.number(),
        password: '', // hash real en producción
        role: Role.OPERARIO,
        isEmailVerified: true,
        isActive: true,
      },
    });

    // Crear operador relacionado
    await prisma.operator.create({
      data: {
        userId: user.id,
        operatorStatus: OperatorStatus.ACTIVO,
        emoPDFPath: op.emoPDFPath,
        operativityCertificatePath: op.operativityCertificatePath,
        costService: parseFloat((Math.random() * 400 + 100).toFixed(2)), // entre 100 y 500
      },
    });

    console.log(`✔️ Insertado operador: ${op.firstName} ${op.lastName}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding operators:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
