const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kufakdnlhhcwynkfchbb.supabase.co';
const serviceKey = 'sb_secret_nZ67pqDex4ATjC55zfCFaQ_kFeLCx9m';

const supabase = createClient(supabaseUrl, serviceKey);

async function listTables() {
  try {
    // Query the information schema to get all tables
    const { data, error } = await supabase
      .rpc('get_tables_list');
    
    if (error) {
      // Try alternative approach - query common tables
      console.log('Trying alternative approach...');
      const tables = [
        'orders', 'manufacturers', 'factory_reviews', 'shop_drawings',
        'materials', 'collections', 'design_boards', 'production_tracking',
        'customers', 'items', 'projects', 'leads', 'contacts', 'clients'
      ];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`✅ Table exists: ${table} (${count} rows)`);
          }
        } catch (e) {
          // Table doesn't exist
        }
      }
    } else {
      console.log('Tables found:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

listTables();
