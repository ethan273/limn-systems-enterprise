const fetch = require('node-fetch');

// Supabase Management API to get complete schema
async function getCompleteSchema() {
  const projectRef = 'kufakdnlhhcwynkfchbb';
  const serviceKey = 'sb_secret_nZ67pqDex4ATjC55zfCFaQ_kFeLCx9m';
  
  console.log('🔍 Fetching complete database schema from Management API...\n');
  
  // Get all tables using PostgREST API
  const baseUrl = 'https://kufakdnlhhcwynkfchbb.supabase.co';
  
  try {
    // Fetch OpenAPI spec which contains all exposed tables
    const response = await fetch(`${baseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    
    const spec = await response.json();
    
    // Extract all table names from paths
    const tables = new Set();
    if (spec.paths) {
      Object.keys(spec.paths).forEach(path => {
        const match = path.match(/^\/([^?\/]+)/);
        if (match && match[1] !== 'rpc') {
          tables.add(match[1]);
        }
      });
    }
    
    console.log(`Found ${tables.size} tables in API spec:\n`);
    
    // Get details for each table
    const tableDetails = {};
    for (const tableName of tables) {
      console.log(`Analyzing ${tableName}...`);
      
      // Get schema from definitions
      if (spec.definitions && spec.definitions[tableName]) {
        tableDetails[tableName] = spec.definitions[tableName];
      }
    }
    
    return { tables: Array.from(tables), definitions: tableDetails, full_spec: spec };
    
  } catch (error) {
    console.error('Error fetching schema:', error);
  }
}

async function main() {
  const schema = await getCompleteSchema();
  
  if (schema) {
    // Save complete schema
    require('fs').writeFileSync(
      'supabase-complete-schema.json', 
      JSON.stringify(schema, null, 2)
    );
    
    console.log('\n✅ Complete schema saved to supabase-complete-schema.json');
    console.log(`Total tables found: ${schema.tables.length}`);
    console.log('\nTables:', schema.tables.join(', '));
  }
}

main();