const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kufakdnlhhcwynkfchbb.supabase.co';
const serviceKey = 'sb_secret_nZ67pqDex4ATjC55zfCFaQ_kFeLCx9m';

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectTable(tableName) {
  console.log(`\n=== Inspecting table: ${tableName} ===`);
  
  try {
    // Get one row to see the structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`Error: ${error.message}`);
      return;
    }
    
    if (data && data.length > 0) {
      const row = data[0];
      console.log('Columns found:');
      for (const [key, value] of Object.entries(row)) {
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${key}: ${type} (sample: ${JSON.stringify(value)?.substring(0, 50)})`);
      }
    } else {
      console.log('Table is empty, cannot determine structure');
    }
  } catch (err) {
    console.error(`Error inspecting ${tableName}:`, err);
  }
}

async function inspectAllTables() {
  const tables = [
    'orders', 'manufacturers', 'factory_reviews', 'shop_drawings',
    'materials', 'collections', 'design_boards', 'production_tracking',
    'customers', 'items', 'projects'
  ];
  
  for (const table of tables) {
    await inspectTable(table);
  }
}

inspectAllTables();
