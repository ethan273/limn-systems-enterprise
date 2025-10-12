#!/usr/bin/env ts-node

/**
 * Setup Script for Flipbooks Storage
 *
 * Creates the Supabase Storage bucket for flipbooks if it doesn't exist.
 * Run this once before using the flipbooks feature.
 *
 * Usage: npx ts-node scripts/setup-flipbooks-storage.ts
 */

import { getSupabaseAdmin } from "../src/lib/supabase";

async function setupStorage() {
  console.log("🚀 Setting up Flipbooks Storage...\n");

  const supabase = getSupabaseAdmin();
  const BUCKET_NAME = "flipbooks";

  try {
    // Check if bucket exists
    console.log("📦 Checking for existing bucket...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (bucketExists) {
      console.log("✅ Bucket 'flipbooks' already exists!");

      // Get bucket details
      const bucket = buckets.find((b) => b.name === BUCKET_NAME);
      console.log("\n📊 Bucket Details:");
      console.log(`   - Name: ${bucket?.name}`);
      console.log(`   - Public: ${bucket?.public ? 'Yes' : 'No'}`);
      console.log(`   - Created: ${bucket?.created_at}`);

      return;
    }

    // Create bucket
    console.log("📦 Creating 'flipbooks' bucket...");
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ],
    });

    if (createError) {
      throw new Error(`Failed to create bucket: ${createError.message}`);
    }

    console.log("✅ Bucket 'flipbooks' created successfully!");
    console.log("\n📊 Configuration:");
    console.log("   - Public: Yes");
    console.log("   - Max File Size: 50MB");
    console.log("   - Allowed Types: PDF, JPEG, PNG, WebP");

    // Test bucket access
    console.log("\n🧪 Testing bucket access...");
    const { data: testList, error: testError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (testError) {
      throw new Error(`Bucket access test failed: ${testError.message}`);
    }

    console.log("✅ Bucket is accessible!");

    console.log("\n🎉 Setup complete! You can now upload flipbooks.");
    console.log("\n📝 Next steps:");
    console.log("   1. Go to http://localhost:3000/flipbooks");
    console.log("   2. Click 'Upload PDF'");
    console.log("   3. Upload a PDF file");
    console.log("   4. Start creating interactive flipbooks!");

  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message);
    console.error("\n💡 Troubleshooting:");
    console.error("   - Check your Supabase credentials in .env.local");
    console.error("   - Ensure SUPABASE_SERVICE_ROLE_KEY has storage permissions");
    console.error("   - Verify your project has storage enabled");
    process.exit(1);
  }
}

// Run setup
setupStorage();
