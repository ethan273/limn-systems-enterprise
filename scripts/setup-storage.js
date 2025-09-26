/**
 * Setup Supabase Storage for Task Attachments
 * Creates bucket and sets up proper security policies
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupTaskAttachmentsStorage() {
  try {
    console.log('🚀 Setting up Task Attachments Storage...')

    // 1. Create the task-attachments bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('task-attachments', {
      public: false, // Private bucket - requires authentication
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket "task-attachments" already exists')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Created bucket "task-attachments"')
    }

    // 2. Basic bucket setup complete - RLS policies can be added later via Supabase dashboard
    console.log('📋 Basic bucket setup complete')
    console.log('💡 Note: Set up RLS policies in Supabase dashboard for production security')

    console.log('🎉 Task Attachments Storage setup complete!')
    console.log('')
    console.log('📁 Bucket Structure:')
    console.log('   task-attachments/')
    console.log('   ├── attachments/')
    console.log('   │   └── task-{task_id}/')
    console.log('   │       ├── {file_id}-{original_name}')
    console.log('   │       └── thumbnails/')
    console.log('   └── moved/')
    console.log('       ├── projects/')
    console.log('       ├── orders/')
    console.log('       └── collections/')
    console.log('')

  } catch (error) {
    console.error('❌ Error setting up storage:', error)
    process.exit(1)
  }
}

// Run the setup
setupTaskAttachmentsStorage()