import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCustomerData() {
  const customer = await prisma.customers.findFirst({
    where: { id: '75d4973a-cfbe-45ae-a932-b5205a9a5950' }
  });

  console.log('Customer record:');
  console.log(JSON.stringify(customer, null, 2));

  await prisma.$disconnect();
}

checkCustomerData();
