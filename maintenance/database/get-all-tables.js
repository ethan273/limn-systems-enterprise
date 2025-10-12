const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://kufakdnlhhcwynkfchbb.supabase.co',
  'sb_publishable_Vhi9mzNZrn6FfqiTXbd8vA_6kA7I5SS'
);

async function getAllTables() {
  console.log('🔍 Fetching ALL tables from database...\n');
  
  // Query information_schema to get ALL tables
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('*')
    .in('table_schema', ['public', 'auth', 'storage'])
    .order('table_name');
  
  if (error) {
    console.error('Error:', error);
    
    // Alternative: Use pg_tables
    const { data: pgTables, error: pgError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public');
      
    if (pgError) {
      console.error('pg_tables error:', pgError);
    } else {
      console.log(`Found ${pgTables?.length || 0} tables in pg_tables`);
      return pgTables;
    }
  }
  
  console.log(`Found ${tables?.length || 0} total tables`);
  return tables;
}

getAllTables().then(tables => {
  if (tables) {
    fs.writeFileSync('all-tables.json', JSON.stringify(tables, null, 2));
    console.log('\n✅ Saved to all-tables.json');
  }
});