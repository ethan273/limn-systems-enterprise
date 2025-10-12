import 'dotenv/config';
import { getSupabaseAdmin } from '../src/lib/supabase';

const userId = 'f146d819-3eed-43e3-80af-835915a5cc14';

async function checkUserProfile() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, name, user_type, department')
    .eq('id', userId)
    .maybeSingle();

  if (data) {
    console.log('✅ User profile FOUND:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('❌ User profile NOT FOUND for ID:', userId);
    if (error) {
      console.log('Error:', error.message);
    }
  }
}

checkUserProfile().then(() => process.exit(0));
