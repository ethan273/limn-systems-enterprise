const fs = require('fs');

// Read the complete schema we discovered
const schemaData = JSON.parse(fs.readFileSync('supabase-complete-schema.json', 'utf8'));

// Generate Prisma schema from discovered tables
let prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Generated from 260 discovered Supabase tables
// Date: ${new Date().toISOString()}

`;

// Process each table
schemaData.tables.forEach(tableName => {
  const definition = schemaData.definitions[tableName];
  
  prismaSchema += `model ${tableName} {\n`;
  
  if (definition && definition.properties) {
    Object.entries(definition.properties).forEach(([field, props]) => {
      // Map SQL types to Prisma types
      let prismaType = 'String';
      
      if (props.type === 'integer') prismaType = 'Int';
      else if (props.type === 'number') prismaType = 'Float';
      else if (props.type === 'boolean') prismaType = 'Boolean';
      else if (props.format === 'date-time') prismaType = 'DateTime';
      else if (props.format === 'uuid') prismaType = 'String @db.Uuid';
      else if (props.type === 'object' || props.type === 'array') prismaType = 'Json';
      
      // Check if nullable
      const isOptional = !definition.required || !definition.required.includes(field) ? '?' : '';
      
      // Add field
      prismaSchema += `  ${field.replace(/[^a-zA-Z0-9_]/g, '_')} ${prismaType}${isOptional}`;
      
      // Add decorators
      if (field === 'id') prismaSchema += ' @id @default(uuid())';
      else if (field === 'created_at') prismaSchema += ' @default(now())';
      else if (field === 'updated_at') prismaSchema += ' @updatedAt';
      
      prismaSchema += '\n';
    });
  } else {
    // Minimal schema if no definition
    prismaSchema += '  id String @id @default(uuid())\n';
    prismaSchema += '  created_at DateTime @default(now())\n';
    prismaSchema += '  updated_at DateTime @updatedAt\n';
  }
  
  prismaSchema += '}\n\n';
});

// Save complete Prisma schema
fs.writeFileSync('prisma/schema-complete.prisma', prismaSchema);
console.log('✅ Complete Prisma schema generated with 260 tables!');
console.log('📁 Saved to: prisma/schema-complete.prisma');
console.log('\nNext step: Copy to prisma/schema.prisma and run npx prisma generate');