const fs = require('fs');

// Read the schema file
const schemaPath = '/Users/eko3/limn-systems-enterprise/prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Add @@schema("public") to all models
let modelsFixed = 0;
schema = schema.replace(/^model\s+(\w+)\s*{([^}]*?)^}/gm, (match, modelName, modelContent) => {
  // Check if model already has @@schema
  if (modelContent.includes('@@schema')) {
    return match;
  }
  
  // Add @@schema("public") before the closing brace
  modelsFixed++;
  const lines = match.split('\n');
  const lastLine = lines[lines.length - 1];
  lines[lines.length - 1] = '  @@schema("public")\n' + lastLine;
  
  return lines.join('\n');
});

// Write the updated schema
fs.writeFileSync(schemaPath, schema);

console.log(`✅ Fixed ${modelsFixed} models with @@schema("public")`);
console.log('🔧 Now testing Prisma generate...');
