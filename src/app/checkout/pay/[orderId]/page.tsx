'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPaymentSettings, getOrderForPayment, submitPaymentConfirmation } from '@/lib/actions/payment';
import type { PaymentSettings } from '@/lib/actions/payment';
import type { Order, OrderItem } from '@/db/schema';

type OrderWithItems = Order & { items: OrderItem[] };

export default function PayPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [orderData, settingsData] = await Promise.all([
        getOrderForPayment(orderId),
        getPaymentSettings(),
      ]);

      setOrder(orderData as OrderWithItems | null);
      setSettings(settingsData);

      // 默认选择有收款码的支付方式
      if (!settingsData.wechatQrCode && settingsData.alipayQrCode) {
        setPaymentMethod('alipay');
      }

      setLoading(false);
    };
    fetchData();
  }, [orderId]);

  const handleSubmitPayment = async () => {
    setSubmitting(true);
    setError('');

    const result = await submitPaymentConfirmation(orderId, paymentMethod);

    if ('error' in result) {
      setError(result.error || '提交失败');
      setSubmitting(false);
    } else {
      router.push(`/checkout/pay/${orderId}/pending`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">订单不存在或无权访问</p>
          <Link href="/orders" className="text-blue-600 hover:underline">
            返回我的订单
          </Link>
        </div>
      </div>
    );
  }

  if (order.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            {order.status === 'paid' ? '订单已支付' : '订单状态异常'}
          </p>
          <Link href="/orders" className="text-blue-600 hover:underline">
            返回我的订单
          </Link>
        </div>
      </div>
    );
  }

  // 用户已提交支付
  if (order.paymentNo?.startsWith('SUBMITTED_')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">等待确认</h1>
          <p className="text-gray-500 mb-6">
            您已提交支付，请等待管理员确认收款。通常在 1-24 小时内完成确认。
          </p>
          <div className="text-sm text-gray-400 mb-6">
            订单号: {order.orderNo}
          </div>
          <Link
            href="/orders"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            查看我的订单
          </Link>
        </div>
      </div>
    );
  }

  const qrCode = paymentMethod === 'wechat' ? settings?.wechatQrCode : settings?.alipayQrCode;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* 订单信息 */}
          <div className="border-b pb-4 mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">扫码支付</h1>
            <p className="text-sm text-gray-500">订单号: {order.orderNo}</p>
          </div>

          {/* 商品列表 */}
          <div className="mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2">
                <span className="text-gray-700">{item.productName}</span>
                <span className="text-gray-900">¥{item.totalPrice}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between">
              <span className="font-medium text-gray-900">应付金额</span>
              <span className="text-xl font-bold text-red-600">¥{order.totalAmount}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* 支付方式选择 */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">选择支付方式</p>
            <div className="flex gap-4">
              {settings?.wechatQrCode && (
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={`flex-1 p-4 rounded-lg border-2 transition ${
                    paymentMethod === 'wechat'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">💬</span>
                  <p className="mt-1 text-sm font-medium text-gray-700">微信支付</p>
                </button>
              )}
              {settings?.alipayQrCode && (
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={`flex-1 p-4 rounded-lg border-2 transition ${
                    paymentMethod === 'alipay'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">💰</span>
                  <p className="mt-1 text-sm font-medium text-gray-700">支付宝</p>
                </button>
              )}
            </div>
          </div>

          {/* 收款码 */}
          {qrCode ? (
            <div className="text-center mb-6">
              <div className="bg-gray-50 p-4 rounded-lg inline-block">
                <img
                  src={qrCode}
                  alt={paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p className="mt-3 text-sm text-gray-500">
                请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫描上方二维码完成支付
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂未配置收款码，请联系管理员
            </div>
          )}

          {/* 支付说明 */}
          {settings?.paymentInstructions && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 text-sm text-yellow-800">
              <p className="font-medium mb-1">支付说明</p>
              <p>{settings.paymentInstructions}</p>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmitPayment}
            disabled={submitting || !qrCode}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '我已完成支付'}
          </button>

          <p className="mt-4 text-xs text-gray-400 text-center">
            点击上方按钮后，管理员将在 1-24 小时内确认您的付款
          </p>

          <div className="mt-6 text-center">
            <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700">
              返回我的订单
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
