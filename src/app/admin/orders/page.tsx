'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrders } from '@/lib/actions/admin';
import type { Order, OrderItem } from '@/db/schema';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '已付款' },
  { key: 'cancelled', label: '已取消' },
  { key: 'refunded', label: '已退款' },
];

const statusBadge: Record<string, { text: string; color: string }> = {
  pending: { text: '待付款', color: 'bg-yellow-100 text-yellow-600' },
  paid: { text: '已付款', color: 'bg-green-100 text-green-600' },
  cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-600' },
  refunded: { text: '已退款', color: 'bg-red-100 text-red-600' },
};

type OrderWithItems = Order & { items: OrderItem[] };

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const data = await getOrders(activeTab);
    setOrders(data as OrderWithItems[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">订单管理</h1>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex gap-1 p-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无订单
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">商品</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">金额</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">{order.orderNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-gray-700">
                          {item.productName}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    ¥{order.totalAmount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${statusBadge[order.status].color}`}>
                      {statusBadge[order.status].text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
