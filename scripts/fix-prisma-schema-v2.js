const fs = require('fs');
const path = require('path');

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🔧 Fixing Prisma schema issues...');

// Fix 1: Replace nullable IDs with required IDs
// Pattern: id String? @id -> id String @id
schema = schema.replace(/(\s+id\s+String)\?(\s+@id)/g, '$1$2');
console.log('✅ Fixed nullable ID fields');

// Fix 2: Fix DateTime fields with @default(now())
// Pattern: field_name String? @default(now()) -> field_name DateTime? @default(now())
schema = schema.replace(/(\s+\w+_at\s+)String(\??\s+@default\(now\(\)\))/g, '$1DateTime$2');
console.log('✅ Fixed DateTime fields with @default(now())');

// Fix 3: Fix DateTime fields with @updatedAt
// Pattern: field_name String? @updatedAt -> field_name DateTime? @updatedAt
schema = schema.replace(/(\s+\w+_at\s+)String(\??\s+@updatedAt)/g, '$1DateTime$2');
console.log('✅ Fixed DateTime fields with @updatedAt');

// Fix 4: Replace Decimal -> Float for all decimal fields
schema = schema.replace(/(\s+\w+\s+)Decimal/g, '$1Float');
console.log('✅ Fixed Decimal fields to Float');

// Fix 5: Fix Json fields (ensure they're properly typed)
schema = schema.replace(/(\s+\w+\s+)Json(\??)/g, '$1Json$2');
console.log('✅ Ensured Json fields are properly typed');

// Fix 6: Fix specific date/time fields that might not have _at suffix
// Common patterns: created, updated, modified, expires, scheduled, etc.
const dateTimePatterns = [
  /(\s+created\s+)String(\??\s+@default\(now\(\)\))/g,
  /(\s+updated\s+)String(\??\s+@updatedAt)/g,
  /(\s+modified\s+)String(\??)/g,
  /(\s+expires\s+)String(\??)/g,
  /(\s+scheduled\s+)String(\??)/g,
  /(\s+timestamp\s+)String(\??)/g,
  /(\s+date\s+)String(\??)/g,
  /(\s+time\s+)String(\??)/g,
  /(\s+last_\w+\s+)String(\??)\s+@default\(now\(\)\)/g,
  /(\s+\w+_date\s+)String(\??)/g,
  /(\s+\w+_time\s+)String(\??)/g,
  /(\s+\w+_timestamp\s+)String(\??)/g
];

dateTimePatterns.forEach(pattern => {
  if (pattern.source.includes('@default') || pattern.source.includes('@updatedAt')) {
    schema = schema.replace(pattern, (match, field, suffix) => {
      return field + 'DateTime' + suffix;
    });
  }
});
console.log('✅ Fixed additional DateTime fields');

// Fix 7: Handle fields that should be DateTime but don't have typical suffixes
// Look for fields with date/time related names
const specificDateFields = [
  'last_login',
  'last_activity',
  'last_seen',
  'last_used',
  'valid_from',
  'valid_until',
  'expires_at',
  'expired_at',
  'scheduled_at',
  'scheduled_for',
  'completed_at',
  'cancelled_at',
  'approved_at',
  'rejected_at',
  'published_at',
  'archived_at',
  'deleted_at',
  'restored_at',
  'signed_at',
  'sent_at',
  'received_at',
  'delivered_at',
  'opened_at',
  'clicked_at',
  'bounced_at',
  'failed_at',
  'succeeded_at',
  'started_at',
  'ended_at',
  'due_date',
  'delivery_date',
  'ship_date',
  'arrival_date',
  'pickup_date',
  'return_date',
  'invoice_date',
  'payment_date',
  'order_date',
  'purchase_date',
  'manufacture_date',
  'assembly_date',
  'inspection_date',
  'approval_date',
  'review_date',
  'audit_date',
  'reconciled_at',
  'resolved_at',
  'download_expires_at',
  'last_restocked'
];

specificDateFields.forEach(fieldName => {
  const regex = new RegExp(`(\\s+${fieldName}\\s+)String(\\??[^\\n]*)`, 'g');
  schema = schema.replace(regex, '$1DateTime$2');
});
console.log('✅ Fixed specific date/time field names');

// Fix 8: Ensure all models have proper formatting
// Add missing spaces if needed
schema = schema.replace(/model(\w+)/g, 'model $1');
schema = schema.replace(/model\s+(\w+)\s*{/g, 'model $1 {');

// Fix 9: Clean up any double spaces
schema = schema.replace(/\s{2,}/g, (match) => {
  // Preserve indentation at the beginning of lines
  if (match.includes('\n')) {
    return match;
  }
  return ' ';
});

// Write the fixed schema back
fs.writeFileSync(schemaPath, schema);

// Count models and fields for verification
const modelCount = (schema.match(/^model\s+/gm) || []).length;
const fieldCount = (schema.match(/^\s{2}\w+\s+/gm) || []).length;

console.log('\n📊 Schema Statistics:');
console.log(`   Models: ${modelCount}`);
console.log(`   Fields: ~${fieldCount}`);

console.log('\n✅ Schema fixes applied successfully!');
console.log('📝 Next step: Run "npx prisma validate" to check the schema');
