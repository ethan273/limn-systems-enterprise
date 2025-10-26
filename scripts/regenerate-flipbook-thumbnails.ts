/**
 * Regenerate Thumbnails for Existing Flipbooks
 * 
 * Updates thumbnail URLs for existing flipbook pages to use new aspect-ratio-preserving settings
 */

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function regenerateThumbnails(flipbookId: string) {
  console.log(`\n🔄 Regenerating thumbnails for flipbook: ${flipbookId}`);

  // Get all pages for this flipbook
  const pages = await prisma.flipbook_pages.findMany({
    where: { flipbook_id: flipbookId },
    orderBy: { page_number: 'asc' },
  });

  console.log(`   Found ${pages.length} pages`);

  // Get the Cloudinary public ID from the first page
  // Format: https://res.cloudinary.com/[cloud]/image/upload/[transformations]/[public_id].jpg
  const firstPageUrl = pages[0]?.image_url;
  if (!firstPageUrl) {
    console.log('   ❌ No pages found');
    return;
  }

  // Extract public ID from URL
  const urlParts = firstPageUrl.split('/upload/');
  if (urlParts.length < 2) {
    console.log('   ❌ Could not parse Cloudinary URL');
    return;
  }

  const afterUpload = urlParts[1];
  // Remove transformations and get base public ID
  const publicIdMatch = afterUpload.match(/pg_\d+\/(.+?)\.jpg/);
  if (!publicIdMatch) {
    console.log('   ❌ Could not extract public ID');
    return;
  }

  const basePublicId = publicIdMatch[1];
  console.log(`   Base public ID: ${basePublicId}`);

  // Update each page with new thumbnail URL
  for (const page of pages) {
    const newThumbnailUrl = cloudinary.url(basePublicId, {
      resource_type: 'image',
      format: 'jpg',
      page: page.page_number,
      width: 200,
      crop: 'limit', // Preserve aspect ratio
      quality: 'auto:low',
    });

    await prisma.flipbook_pages.update({
      where: { id: page.id },
      data: { thumbnail_url: newThumbnailUrl },
    });

    console.log(`   ✅ Updated page ${page.page_number}: ${newThumbnailUrl}`);
  }

  console.log(`   ✅ All thumbnails regenerated for flipbook ${flipbookId}`);
}

async function main() {
  const flipbookId = process.argv[2];

  if (!flipbookId) {
    console.error('Usage: tsx scripts/regenerate-flipbook-thumbnails.ts <flipbook-id>');
    process.exit(1);
  }

  await regenerateThumbnails(flipbookId);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
