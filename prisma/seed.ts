import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

async function main() {
  const adminPassword = 'admin123';
  const users = [
    { username: 'samuel', name: 'Samuel', role: 'ADMIN' as const, email: 'samuel@caronte.local' },
    { username: 'mario', name: 'Mario', role: 'ADMIN' as const, email: 'mario@caronte.local' },
    { username: 'alejandro', name: 'Alejandro', role: 'ADMIN' as const, email: 'alejandro@caronte.local' },
    { username: 'admin', name: 'Administrador Caronte', role: 'ADMIN' as const, email: 'admin@caronte.com' },
  ];

  console.log('Seeding users...');

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  for (const user of users) {
    const existingUser = await prismaAny.user.findFirst({
      where: {
        OR: [
          { username: user.username },
          { email: user.email },
        ],
      },
    });

    if (existingUser) {
      await prismaAny.user.update({
        where: { id: existingUser.id },
        data: {
          username: user.username,
          email: user.email,
          name: user.name,
          passwordHash: hashedPassword,
          role: user.role,
        },
      });
      continue;
    }

    await prismaAny.user.create({
      data: {
        username: user.username,
        email: user.email,
        name: user.name,
        passwordHash: hashedPassword,
        role: user.role,
      },
    });
  }

  console.log('Usuarios de prueba listos: samuel, mario, alejandro, admin');
  console.log(`Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
