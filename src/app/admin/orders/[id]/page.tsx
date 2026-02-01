'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getOrder, updateOrderStatus } from '@/lib/actions/admin';
import type { Order, OrderItem } from '@/db/schema';

const statusBadge: Record<string, { text: string; color: string }> = {
  pending: { text: '待付款', color: 'bg-yellow-100 text-yellow-600' },
  paid: { text: '已付款', color: 'bg-green-100 text-green-600' },
  cancelled: { text: '已取消', color: 'bg-gray-100 text-gray-600' },
  refunded: { text: '已退款', color: 'bg-red-100 text-red-600' },
};

type OrderWithItems = Order & { items: OrderItem[] };

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    const data = await getOrder(id);
    setOrder(data as OrderWithItems | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleRefund = async () => {
    if (!confirm('确定要将此订单标记为已退款吗？相关课程授权将被取消。')) return;

    setUpdating(true);
    await updateOrderStatus(id, 'refunded');
    fetchOrder();
    setUpdating(false);
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消此订单吗？')) return;

    setUpdating(true);
    await updateOrderStatus(id, 'cancelled');
    fetchOrder();
    setUpdating(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-gray-500 py-12">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-gray-500 py-12">订单不存在</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/orders"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          订单详情
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              订单号: {order.orderNo}
            </h2>
            <span className={`px-3 py-1 rounded text-sm ${statusBadge[order.status].color}`}>
              {statusBadge[order.status].text}
            </span>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">¥{order.totalAmount}</p>
            {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
              <p className="text-sm text-green-600">已优惠 ¥{order.discountAmount}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">时间信息</h3>
            <div className="space-y-1 text-gray-700">
              <p>创建时间: {formatDate(order.createdAt)}</p>
              <p>支付时间: {formatDate(order.paidAt)}</p>
              <p>更新时间: {formatDate(order.updatedAt)}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">支付信息</h3>
            <div className="space-y-1 text-gray-700">
              <p>支付方式: {order.paymentMethod || '-'}</p>
              <p>支付流水号: {order.paymentNo || '-'}</p>
              <p>用户ID: <span className="font-mono text-sm">{order.userId}</span></p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">商品明细</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">商品名称</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">类型</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">数量</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">单价</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">小计</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.productType === 'course' ? '课程' :
                       item.productType === 'membership' ? '会员' : item.productType}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">¥{item.unitPrice}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      ¥{item.totalPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {order.status === 'paid' && (
          <button
            onClick={handleRefund}
            disabled={updating}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {updating ? '处理中...' : '标记退款'}
          </button>
        )}
        {order.status === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={updating}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            {updating ? '处理中...' : '取消订单'}
          </button>
        )}
        <Link
          href="/admin/orders"
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          返回列表
        </Link>
      </div>
    </div>
  );
}
