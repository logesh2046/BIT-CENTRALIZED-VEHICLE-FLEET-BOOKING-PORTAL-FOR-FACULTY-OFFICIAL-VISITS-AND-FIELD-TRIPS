const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ DATABASE CONNECTION SUCCESSFUL!');
    const usersCount = await prisma.user.count();
    console.log(`User records in database: ${usersCount}`);
  } catch (err) {
    console.error('❌ DATABASE CONNECTION FAILED:');
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
