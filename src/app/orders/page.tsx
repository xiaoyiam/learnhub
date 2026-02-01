'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getUserOrders } from '@/lib/actions/order';
import { UserMenu } from '@/components/user-menu';

interface Order {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: string;
  paymentMethod: string | null;
  paidAt: Date | null;
  createdAt: Date;
  items: {
    id: string;
    productType: string;
    productName: string;
    unitPrice: string;
  }[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/orders');
      return;
    }

    if (user) {
      getUserOrders(user.id).then((data) => {
        setOrders(data as Order[]);
        setLoading(false);
      });
    }
  }, [user, authLoading, router]);

  const getStatusText = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      pending: { text: '待支付', color: 'text-yellow-600 bg-yellow-50' },
      paid: { text: '已支付', color: 'text-green-600 bg-green-50' },
      cancelled: { text: '已取消', color: 'text-gray-600 bg-gray-50' },
      refunded: { text: '已退款', color: 'text-red-600 bg-red-50' },
    };
    return map[status] || { text: status, color: 'text-gray-600 bg-gray-50' };
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              LearnHub
            </Link>
            <UserMenu />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LearnHub
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">我的订单</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-4">暂无订单</p>
            <Link
              href="/courses"
              className="text-blue-600 hover:underline"
            >
              去选购课程
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = getStatusText(order.status);
              return (
                <div key={order.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>订单号: {order.orderNo}</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
                      {status.text}
                    </span>
                  </div>

                  <div className="p-6">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded mr-2">
                            {item.productType === 'course' ? '课程' : '会员'}
                          </span>
                          <span className="font-medium">{item.productName}</span>
                        </div>
                        <span className="font-medium">¥{item.unitPrice}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between px-6 py-3 border-t bg-gray-50">
                    <div className="text-sm text-gray-500">
                      {order.paymentMethod === 'wechat' && '微信支付'}
                      {order.paymentMethod === 'alipay' && '支付宝'}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 mr-2">实付</span>
                      <span className="text-lg font-bold text-blue-600">
                        ¥{order.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
