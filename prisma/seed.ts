import { prisma } from '../src/lib/db';

async function main() {
  console.log('Seeding default categories...');

  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    const existingGeneral = await prisma.category.findFirst({
      where: { userId: user.id, name: 'General' }
    });

    if (!existingGeneral) {
      await prisma.category.create({
        data: {
          name: 'General',
          color: '#6b7280',
          icon: 'folder',
          description: 'Default category for uncategorized items',
          scopes: ['habit', 'checklist', 'todo', 'study'],
          userId: user.id
        }
      });
      console.log(`Created General category for user ${user.id}`);
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
