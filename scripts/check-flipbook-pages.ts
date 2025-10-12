import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPages() {
  const flipbook = await prisma.flipbooks.findUnique({
    where: { id: 'bd68fad1-93e2-4402-a425-5676f1c7dd41' },
    include: { pages: { orderBy: { page_number: 'asc' }, take: 3 } }
  });

  console.log('Flipbook:', {
    id: flipbook?.id,
    title: flipbook?.title,
    page_count: flipbook?.page_count,
    pdf_source_url: flipbook?.pdf_source_url?.substring(0, 100),
    cover_image_url: flipbook?.cover_image_url?.substring(0, 100)
  });

  console.log('\nFirst 3 Pages:');
  flipbook?.pages.forEach(p => {
    console.log(`Page ${p.page_number}:`);
    console.log(`  image_url: ${p.image_url?.substring(0, 120)}`);
    console.log(`  thumbnail_url: ${p.thumbnail_url?.substring(0, 120)}`);
  });

  await prisma.$disconnect();
}

checkPages().catch(console.error);
