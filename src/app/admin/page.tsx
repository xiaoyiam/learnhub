import { getAdminStats } from '@/lib/actions/admin';
import Link from 'next/link';

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const statCards = [
    { label: '课程总数', value: stats.courseCount, href: '/admin/courses', color: 'blue' },
    { label: '已支付订单', value: stats.orderCount, href: '/admin/orders', color: 'green' },
    { label: '总收入', value: `¥${stats.revenue.toFixed(2)}`, href: '/admin/orders', color: 'yellow' },
    { label: '用户数', value: stats.userCount, href: '#', color: 'purple' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">控制台概览</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 hover:shadow-md transition ${colorClasses[card.color]}`}
          >
            <p className="text-gray-500 text-sm">{card.label}</p>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="space-y-3">
            <Link
              href="/admin/courses/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">+</span>
              <span className="text-gray-700">创建新课程</span>
            </Link>
            <Link
              href="/admin/orders?status=pending"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">!</span>
              <span className="text-gray-700">查看待处理订单</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
          <div className="space-y-2 text-gray-600">
            <p>版本: LearnHub v1.0.0</p>
            <p>框架: Next.js 15</p>
            <p>数据库: PostgreSQL (Neon)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
