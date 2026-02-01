/**
 * 检查数据库 schema
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  console.log('📊 检查数据库 schema...\n');

  // 检查所有 schema
  const schemas = await sql`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    ORDER BY schema_name
  `;
  console.log('可用的 Schema:');
  schemas.forEach(s => console.log(`  - ${s.schema_name}`));

  // 检查 neon_auth schema 中的表
  console.log('\n检查 neon_auth schema 中的表:');
  try {
    const neonAuthTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'neon_auth'
      ORDER BY table_name
    `;
    if (neonAuthTables.length === 0) {
      console.log('  ⚠️  neon_auth schema 不存在或没有表');
      console.log('  👉 请在 Neon Console 中启用 Auth 功能');
    } else {
      neonAuthTables.forEach(t => console.log(`  - ${t.table_name}`));
    }
  } catch (error) {
    console.log('  ⚠️  无法访问 neon_auth schema:', error.message);
  }

  // 检查 public schema 中的表
  console.log('\n检查 public schema 中的表:');
  const publicTables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  if (publicTables.length === 0) {
    console.log('  (无表)');
  } else {
    publicTables.forEach(t => console.log(`  - ${t.table_name}`));
  }
}

checkSchema().catch(console.error);
