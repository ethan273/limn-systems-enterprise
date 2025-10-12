const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://kufakdnlhhcwynkfchbb.supabase.co',
  'sb_secret_nZ67pqDex4ATjC55zfCFaQ_kFeLCx9m'  // Using service role key for more access
);

async function discoverAllTables() {
  console.log('🔍 Discovering ALL database tables...\n');
  
  // First, try to get a list using RPC if available
  const { data: rpcTables, error: rpcError } = await supabase.rpc('get_all_tables', {});
  
  if (!rpcError && rpcTables) {
    console.log(`Found ${rpcTables.length} tables via RPC`);
    return rpcTables;
  }
  
  // Manual approach: Try common table patterns
  const discoveredTables = [];
  const tablePatterns = [
    // Core tables we know
    'orders', 'manufacturers', 'materials', 'collections', 'items', 'customers', 'projects',
    'production_tracking', 'shop_drawings', 'leads', 'contacts', 'clients',
    // Auth tables
    'users', 'profiles', 'auth_users',
    // Common patterns
    'invoices', 'payments', 'shipments', 'inventory', 'warehouses', 'suppliers',
    'purchase_orders', 'sales_orders', 'quotes', 'estimates',
    // Product related
    'products', 'product_categories', 'product_variants', 'product_images',
    'product_materials', 'product_specifications',
    // Manufacturing
    'work_orders', 'production_stages', 'quality_control', 'defects',
    'production_lines', 'machines', 'maintenance',
    // Logistics
    'deliveries', 'shipping_addresses', 'tracking', 'carriers',
    // Financial
    'accounts', 'transactions', 'budgets', 'cost_centers',
    // HR/Users
    'employees', 'departments', 'roles', 'permissions',
    // CRM
    'opportunities', 'activities', 'tasks', 'notes', 'documents',
    // Reporting
    'reports', 'dashboards', 'metrics', 'kpis'
  ];
  
  // Try each potential table
  for (const tableName of tablePatterns) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ Found: ${tableName} (${count || 0} rows)`);
        discoveredTables.push({ name: tableName, row_count: count || 0 });
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
  
  // Try with underscores
  const underscorePatterns = tablePatterns.map(t => t.replace(/([A-Z])/g, '_$1').toLowerCase());
  for (const tableName of underscorePatterns) {
    if (discoveredTables.find(t => t.name === tableName)) continue;
    
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ Found: ${tableName} (${count || 0} rows)`);
        discoveredTables.push({ name: tableName, row_count: count || 0 });
      }
    } catch (e) {
      // Table doesn't exist
    }
  }
  
  return discoveredTables;
}

// Get table structure for each discovered table
async function getTableStructure(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (!error && data && data.length > 0) {
      const columns = Object.keys(data[0]);
      const columnTypes = {};
      
      for (const col of columns) {
        const value = data[0][col];
        columnTypes[col] = typeof value;
      }
      
      return { columns, columnTypes };
    }
  } catch (e) {
    console.error(`Error getting structure for ${tableName}:`, e);
  }
  return null;
}

async function main() {
  const tables = await discoverAllTables();
  
  console.log(`\n📊 Total tables discovered: ${tables.length}`);
  
  // Get structure for each table
  const fullSchema = {};
  
  for (const table of tables) {
    console.log(`\nAnalyzing ${table.name}...`);
    const structure = await getTableStructure(table.name);
    if (structure) {
      fullSchema[table.name] = {
        ...table,
        ...structure
      };
    }
  }
  
  // Save complete schema
  fs.writeFileSync('complete-schema.json', JSON.stringify(fullSchema, null, 2));
  console.log('\n✅ Complete schema saved to complete-schema.json');
  
  // Create summary
  const summary = {
    total_tables: Object.keys(fullSchema).length,
    total_rows: tables.reduce((sum, t) => sum + (t.row_count || 0), 0),
    tables: tables.map(t => `${t.name} (${t.row_count} rows)`).join('\n')
  };
  
  fs.writeFileSync('schema-summary.txt', JSON.stringify(summary, null, 2));
  console.log('✅ Summary saved to schema-summary.txt');
}

main();