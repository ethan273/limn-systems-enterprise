/**
 * Audit all foreign key constraints in the database
 * Checks CASCADE vs NO ACTION policies
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load environment variables from production-credentials.env
const prodCredsPath = path.join(__dirname, '../production-credentials.env');
if (fs.existsSync(prodCredsPath)) {
  const prodCreds = fs.readFileSync(prodCredsPath, 'utf-8');
  prodCreds.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=["']?([^"'\n]+)["']?$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

interface ForeignKey {
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  delete_rule: string;
  update_rule: string;
  constraint_name: string;
}

async function auditForeignKeys(dbName: string, connectionUrl: string) {
  console.log(`\n🔍 Auditing Foreign Key Constraints: ${dbName}\n`);

  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    const query = `
      SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule,
          tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
          AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `;

    const result = await client.query<ForeignKey>(query);
    const fks = result.rows;

    console.log(`Total Foreign Keys: ${fks.length}\n`);

    // Group by delete_rule
    const byDeleteRule = fks.reduce((acc, fk) => {
      const rule = fk.delete_rule;
      if (!acc[rule]) acc[rule] = [];
      acc[rule].push(fk);
      return acc;
    }, {} as Record<string, ForeignKey[]>);

    console.log('📊 Breakdown by DELETE rule:');
    Object.entries(byDeleteRule).forEach(([rule, list]) => {
      console.log(`   ${rule}: ${list.length} constraints`);
    });

    console.log('\n📋 Sample FKs by DELETE rule:\n');

    // Show samples of each rule type
    Object.entries(byDeleteRule).forEach(([rule, list]) => {
      console.log(`\n${rule.toUpperCase()} (${list.length} total):`);
      console.log('─'.repeat(80));

      // Show first 5 examples
      list.slice(0, 5).forEach((fk) => {
        console.log(
          `  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
        );
      });

      if (list.length > 5) {
        console.log(`  ... and ${list.length - 5} more`);
      }
    });

    // Critical tables to audit
    const criticalTables = [
      'partner_contacts',
      'partners',
      'projects',
      'quotes',
      'quote_items',
      'production_orders',
      'flipbooks',
      'analytics_events',
      'share_link_views',
      'flipbook_share_links',
    ];

    console.log('\n\n🔴 CRITICAL TABLES AUDIT:\n');

    for (const tableName of criticalTables) {
      const tableFKs = fks.filter((fk) => fk.table_name === tableName);

      if (tableFKs.length === 0) {
        console.log(`\n❌ ${tableName}: NO FOREIGN KEYS`);
        continue;
      }

      console.log(`\n✅ ${tableName} (${tableFKs.length} FKs):`);
      console.log('─'.repeat(80));

      tableFKs.forEach((fk) => {
        const deleteIcon =
          fk.delete_rule === 'CASCADE'
            ? '🗑️'
            : fk.delete_rule === 'SET NULL'
            ? '∅'
            : '🚫';
        console.log(
          `  ${deleteIcon} ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
        );
        console.log(`     DELETE: ${fk.delete_rule} | UPDATE: ${fk.update_rule}`);
      });
    }

    // Potential issues: CASCADE that might be dangerous
    console.log('\n\n⚠️  POTENTIAL ISSUES:\n');

    const cascadeDeletes = fks.filter((fk) => fk.delete_rule === 'CASCADE');
    console.log(`CASCADE DELETE count: ${cascadeDeletes.length}`);
    console.log('─'.repeat(80));
    console.log(
      'Note: CASCADE deletes can cause data loss. Review each for appropriateness.\n'
    );

    // Group CASCADE by table
    const cascadeByTable = cascadeDeletes.reduce((acc, fk) => {
      const table = fk.table_name;
      if (!acc[table]) acc[table] = [];
      acc[table].push(fk);
      return acc;
    }, {} as Record<string, ForeignKey[]>);

    Object.entries(cascadeByTable)
      .sort(([, a], [, b]) => b.length - a.length) // Sort by count descending
      .slice(0, 10) // Top 10 tables
      .forEach(([table, list]) => {
        console.log(`\n${table} (${list.length} CASCADE FKs):`);
        list.forEach((fk) => {
          console.log(
            `  🗑️ ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
          );
        });
      });

    // Missing FKs: Look for _id columns without constraints
    console.log('\n\n🔍 CHECKING FOR MISSING FOREIGN KEYS:\n');

    const allTablesQuery = `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND column_name LIKE '%_id'
      AND data_type = 'uuid'
      ORDER BY table_name, column_name;
    `;

    const allColumnsResult = await client.query(allTablesQuery);
    const idColumns = allColumnsResult.rows;

    console.log(`Found ${idColumns.length} *_id columns (UUID type)\n`);

    const missingFKs: Array<{ table_name: string; column_name: string }> = [];

    for (const col of idColumns) {
      const hasFK = fks.some(
        (fk) => fk.table_name === col.table_name && fk.column_name === col.column_name
      );

      if (!hasFK) {
        missingFKs.push({ table_name: col.table_name, column_name: col.column_name });
      }
    }

    if (missingFKs.length > 0) {
      console.log(`⚠️  ${missingFKs.length} columns missing FK constraints:\n`);
      missingFKs.slice(0, 20).forEach((col) => {
        console.log(`  ${col.table_name}.${col.column_name}`);
      });
      if (missingFKs.length > 20) {
        console.log(`  ... and ${missingFKs.length - 20} more`);
      }
    } else {
      console.log('✅ All *_id columns have FK constraints');
    }

    // Save full report to file
    const reportPath = path.join(__dirname, '../fk-audit-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      database: dbName,
      total_fks: fks.length,
      by_delete_rule: Object.entries(byDeleteRule).map(([rule, list]) => ({
        rule,
        count: list.length,
      })),
      all_foreign_keys: fks,
      missing_fks: missingFKs,
      critical_tables_audit: criticalTables.map((tableName) => ({
        table_name: tableName,
        foreign_keys: fks.filter((fk) => fk.table_name === tableName),
      })),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n\n💾 Full report saved to: ${reportPath}`);
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const devUrl = process.env.DEV_DB_URL || process.env.DATABASE_URL;

  if (!devUrl) {
    throw new Error('Missing DEV_DB_URL or DATABASE_URL');
  }

  await auditForeignKeys('DEV', devUrl);

  console.log('\n\n✅ FOREIGN KEY AUDIT COMPLETE\n');
}

main().catch((error) => {
  console.error('\n❌ Audit failed:', error.message);
  process.exit(1);
});
