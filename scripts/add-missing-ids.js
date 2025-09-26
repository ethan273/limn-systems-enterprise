const fs = require('fs');
const path = require('path');

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🔧 Adding IDs to models without unique identifiers...');

// Models that need IDs
const modelsNeedingIds = [
  'v_user_management',
  'v_customer_financial_dashboard',
  'warnings_fixed',
  'notification_analytics',
  'user_notification_metrics',
  'integration_health',
  'v_ready_to_invoice',
  'v_order_financial_pipeline',
  'payment_batch_summary',
  'my_permissions',
  'optimization_final_status',
  'policy_count_by_table',
  'cash_flow_summary',
  'database_health_final'
];

let fixedCount = 0;

modelsNeedingIds.forEach(modelName => {
  // Find the model and add an ID field right after the model declaration
  const modelRegex = new RegExp(`(model ${modelName} \\{\\s*\\n)`, 'g');
  
  if (schema.match(modelRegex)) {
    schema = schema.replace(modelRegex, `$1  id String @id @default(uuid()) @db.Uuid\n`);
    fixedCount++;
    console.log(`✅ Added ID to model: ${modelName}`);
  } else {
    console.log(`⚠️  Could not find model: ${modelName}`);
  }
});

// Write the fixed schema back
fs.writeFileSync(schemaPath, schema);

console.log(`\n📊 Fixed ${fixedCount} models`);
console.log('✅ Schema IDs added successfully!');
console.log('📝 Next step: Run "npx prisma validate" to verify the schema');
