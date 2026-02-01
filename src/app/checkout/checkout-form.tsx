'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createCourseOrder, createMembershipOrder, simulatePayment } from '@/lib/actions/order';

interface Props {
  product: {
    type: 'course' | 'membership';
    id: string;
    name: string;
    price: string;
    originalPrice: string | null;
  };
}

export function CheckoutForm({ product }: Props) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/checkout?${product.type}=${product.id}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 创建订单
      let result;
      if (product.type === 'course') {
        result = await createCourseOrder(user.id, product.id);
      } else {
        result = await createMembershipOrder(user.id, product.id);
      }

      if ('error' in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // 2. 模拟支付（实际项目中应跳转到支付页面）
      const payResult = await simulatePayment(result.orderId, paymentMethod);

      if ('error' in payResult) {
        setError(payResult.error);
        setLoading(false);
        return;
      }

      // 3. 支付成功，跳转到成功页面
      router.push(`/checkout/success?order=${result.orderNo}`);
    } catch (err) {
      setError('支付失败，请重试');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? (parseFloat(product.originalPrice) - parseFloat(product.price)).toFixed(2)
    : null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm sticky top-4">
      <h3 className="font-bold mb-4">支付方式</h3>

      <div className="space-y-2 mb-6">
        <label
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
            paymentMethod === 'wechat' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="payment"
            value="wechat"
            checked={paymentMethod === 'wechat'}
            onChange={() => setPaymentMethod('wechat')}
            className="sr-only"
          />
          <span className="text-2xl">💚</span>
          <span className="font-medium">微信支付</span>
          {paymentMethod === 'wechat' && (
            <span className="ml-auto text-green-500">✓</span>
          )}
        </label>

        <label
          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
            paymentMethod === 'alipay' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="payment"
            value="alipay"
            checked={paymentMethod === 'alipay'}
            onChange={() => setPaymentMethod('alipay')}
            className="sr-only"
          />
          <span className="text-2xl">💙</span>
          <span className="font-medium">支付宝</span>
          {paymentMethod === 'alipay' && (
            <span className="ml-auto text-blue-500">✓</span>
          )}
        </label>
      </div>

      <div className="border-t pt-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">商品金额</span>
          <span>¥{product.originalPrice || product.price}</span>
        </div>
        {discount && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">优惠</span>
            <span className="text-red-500">-¥{discount}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg mt-3">
          <span>应付金额</span>
          <span className="text-blue-600">¥{product.price}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '处理中...' : user ? `立即支付 ¥${product.price}` : '登录后支付'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        支付即表示同意《用户协议》和《隐私政策》
      </p>
    </div>
  );
}
