/**
 * 重置数据库 - 删除所有业务表
 *
 * 运行: node --env-file=.env scripts/reset-db.ts
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function resetDatabase() {
  console.log('🗑️  正在删除所有业务表...\n');

  // 按依赖顺序删除表
  const tables = [
    'user_progress',
    'licenses',
    'order_items',
    'orders',
    'chapters',
    'courses',
    'resources',
    'membership_plans',
    'user_profiles',
    'organizations',
  ];

  for (const table of tables) {
    try {
      await sql(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`  ✓ 已删除表: ${table}`);
    } catch (error) {
      console.log(`  ✗ 删除失败: ${table}`, error.message);
    }
  }

  // 删除枚举类型
  const enums = [
    'user_role',
    'org_status',
    'course_status',
    'course_type',
    'resource_type',
    'membership_type',
    'order_status',
    'payment_method',
    'license_type',
  ];

  console.log('\n🗑️  正在删除枚举类型...\n');

  for (const enumType of enums) {
    try {
      await sql(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
      console.log(`  ✓ 已删除枚举: ${enumType}`);
    } catch (error) {
      console.log(`  ✗ 删除失败: ${enumType}`, error.message);
    }
  }

  console.log('\n✅ 数据库已重置，可以重新运行 drizzle-kit push');
}

resetDatabase();
