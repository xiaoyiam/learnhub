'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrders } from '@/lib/actions/admin';
import { confirmPayment, getPendingConfirmOrders } from '@/lib/actions/payment';
import type { Order, OrderItem } from '@/db/schema';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'awaiting', label: '待确认', highlight: true },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '已付款' },
  { key: 'cancelled', label: '已取消' },
  { key: 'refunded', label: '已退款' },
];

const statusBadge: Record<string, { text: string; color: string }> = {
  pending: { text: '待付款', color: 'bg-yellow-100 text-yellow-600' },
  awaiting: { text: '待确认', color: 'bg-orange-100 text-orange-600' },
  paid: { text: '已付款', color: 'bg-green-100 text-green-600' },
  cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-600' },
  refunded: { text: '已退款', color: 'bg-red-100 text-red-600' },
};

type OrderWithItems = Order & { items: OrderItem[] };

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [awaitingCount, setAwaitingCount] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);

    if (activeTab === 'awaiting') {
      const data = await getPendingConfirmOrders();
      setOrders(data as OrderWithItems[]);
    } else {
      const data = await getOrders(activeTab);
      setOrders(data as OrderWithItems[]);
    }

    // 获取待确认订单数量
    const awaitingOrders = await getPendingConfirmOrders();
    setAwaitingCount(awaitingOrders.length);

    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleConfirm = async (orderId: string) => {
    if (!confirm('确认已收到此订单的付款吗？')) return;

    setConfirming(orderId);
    const result = await confirmPayment(orderId);

    if ('error' in result) {
      alert(result.error);
    } else {
      fetchOrders();
    }
    setConfirming(null);
  };

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

  const getOrderDisplayStatus = (order: Order) => {
    if (order.status === 'pending' && order.paymentNo?.startsWith('SUBMITTED_')) {
      return 'awaiting';
    }
    return order.status;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">订单管理</h1>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex gap-1 p-2 flex-wrap">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : tab.highlight && awaitingCount > 0
                    ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                {tab.key === 'awaiting' && awaitingCount > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === 'awaiting'
                      ? 'bg-white text-blue-600'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {awaitingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {activeTab === 'awaiting' ? '暂无待确认订单' : '暂无订单'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">商品</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">金额</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">支付方式</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => {
                const displayStatus = getOrderDisplayStatus(order);
                return (
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.paymentMethod === 'wechat' ? '微信' :
                       order.paymentMethod === 'alipay' ? '支付宝' : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${statusBadge[displayStatus].color}`}>
                        {statusBadge[displayStatus].text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {displayStatus === 'awaiting' && (
                          <button
                            onClick={() => handleConfirm(order.id)}
                            disabled={confirming === order.id}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {confirming === order.id ? '确认中...' : '确认收款'}
                          </button>
                        )}
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                        >
                          详情
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
