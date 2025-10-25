#!/usr/bin/env tsx

/**
 * Debug script to check flipbook data in database
 * Usage: npx tsx scripts/check-flipbook-debug.ts <flipbook-id>
 */

import { prisma } from "../src/lib/prisma";

const flipbookId = process.argv[2];

if (!flipbookId) {
  console.error("Usage: npx tsx scripts/check-flipbook-debug.ts <flipbook-id>");
  process.exit(1);
}

async function main() {
  console.log(`\n[Debug] Checking flipbook: ${flipbookId}\n`);

  // Check if flipbook exists
  const flipbook = await prisma.flipbooks.findUnique({
    where: { id: flipbookId },
    select: {
      id: true,
      title: true,
      page_count: true,
      status: true,
      created_at: true,
      created_by_user_id: true,
    },
  });

  if (!flipbook) {
    console.error("❌ Flipbook NOT FOUND in database");
    return;
  }

  console.log("✅ Flipbook found:");
  console.log(JSON.stringify(flipbook, null, 2));

  // Check pages
  const pages = await prisma.flipbook_pages.findMany({
    where: { flipbook_id: flipbookId },
    orderBy: { page_number: "asc" },
    select: {
      id: true,
      page_number: true,
      image_url: true,
      thumbnail_url: true,
      page_type: true,
    },
  });

  console.log(`\n📄 Pages found: ${pages.length}`);
  if (pages.length > 0) {
    console.log("First 3 pages:");
    console.log(JSON.stringify(pages.slice(0, 3), null, 2));
  } else {
    console.error("❌ NO PAGES FOUND");
  }

  // Try the same query that tRPC uses
  console.log("\n🔍 Testing tRPC-style query...");
  const fullFlipbook = await prisma.flipbooks.findUnique({
    where: { id: flipbookId },
    include: {
      flipbook_pages: {
        orderBy: { page_number: "asc" },
        include: {
          hotspots: true,
        },
      },
    },
  });

  console.log(`\ntRPC query result:`);
  console.log(`- Flipbook found: ${fullFlipbook ? "YES" : "NO"}`);
  console.log(`- Pages in array: ${fullFlipbook?.flipbook_pages?.length || 0}`);
}

main()
  .then(() => {
    console.log("\n✅ Debug complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
