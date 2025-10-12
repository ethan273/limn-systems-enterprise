import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local first (takes precedence), then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const userId = 'f146d819-3eed-43e3-80af-835915a5cc14';

async function createUserProfile() {
  // Create Supabase client directly to avoid module-level env var issues
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false }
    }
  );

  // First check if user profile already exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) {
    console.log('✅ User profile already exists:');
    console.log(JSON.stringify(existingProfile, null, 2));
    return;
  }

  // Get user from Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

  if (authError || !authUser) {
    console.log('❌ User not found in Supabase Auth:', authError?.message);
    return;
  }

  console.log('📧 Auth user email:', authUser.user.email);

  // Create user profile
  const { data: newProfile, error: createError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email: authUser.user.email,
      name: authUser.user.email?.split('@')[0] || 'User',
      user_type: 'employee',
      department: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.log('❌ Error creating user profile:', createError.message);
    return;
  }

  console.log('✅ User profile created successfully:');
  console.log(JSON.stringify(newProfile, null, 2));
}

createUserProfile().then(() => process.exit(0));
