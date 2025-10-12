const fs = require('fs');

// Read the complete schema
const schemaData = JSON.parse(fs.readFileSync('supabase-complete-schema.json', 'utf8'));

// Generate proper Prisma schema
let prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Generated from 260 Supabase tables
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
      let isUuid = false;
      
      if (props.format === 'uuid') {
        prismaType = 'String';
        isUuid = true;
      } else if (props.type === 'integer') {
        prismaType = 'Int';
      } else if (props.type === 'number') {
        prismaType = 'Float';
      } else if (props.type === 'boolean') {
        prismaType = 'Boolean';
      } else if (props.format === 'date-time') {
        prismaType = 'DateTime';
      } else if (props.type === 'object' || props.type === 'array') {
        prismaType = 'Json';
      }
      
      // Check if nullable
      const isOptional = !definition.required || !definition.required.includes(field) ? '?' : '';
      
      // Clean field name
      const cleanField = field.replace(/[^a-zA-Z0-9_]/g, '_');
      
      // Build field definition
      prismaSchema += `  ${cleanField} ${prismaType}${isOptional}`;
      
      // Add decorators
      if (field === 'id') {
        prismaSchema += ' @id';
        if (isUuid) prismaSchema += ' @default(uuid()) @db.Uuid';
      } else if (isUuid) {
        prismaSchema += ' @db.Uuid';
      }
      
      if (field === 'created_at') prismaSchema += ' @default(now())';
      if (field === 'updated_at') prismaSchema += ' @updatedAt';
      
      prismaSchema += '\n';
    });
  } else {
    // Minimal schema if no definition
    prismaSchema += '  id String @id @default(uuid()) @db.Uuid\n';
    prismaSchema += '  created_at DateTime? @default(now())\n';
    prismaSchema += '  updated_at DateTime? @updatedAt\n';
  }
  
  prismaSchema += '}\n\n';
});

// Save the corrected schema
fs.writeFileSync('prisma/schema-fixed.prisma', prismaSchema);
console.log('✅ Fixed Prisma schema generated!');
console.log('Total tables: ' + schemaData.tables.length);