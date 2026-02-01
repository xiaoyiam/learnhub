/**
 * LearnHub 数据库连接
 *
 * 使用 Neon Serverless 驱动 + Drizzle ORM
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// 创建 Neon SQL 客户端
const sql = neon(process.env.DATABASE_URL!);

// 创建 Drizzle 实例（带 schema 用于关系查询）
export const db = drizzle(sql, { schema });

// 导出原始 SQL 客户端（用于自定义查询）
export { sql };
