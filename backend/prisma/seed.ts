import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const categories = [
        { name: 'Cars' },
        { name: 'Bicycles' },
        { name: 'Cameras' },
        { name: 'Camping Gear' },
        { name: 'Power Tools' },
        { name: 'Gaming Consoles' },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
    }

    console.log('Seed completed: categories created');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
