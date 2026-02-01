'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createCourseOrder, createMembershipOrder } from '@/lib/actions/order';
import { getPaymentSettings } from '@/lib/actions/payment';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasQrCode, setHasQrCode] = useState(false);

  useEffect(() => {
    // 检查是否配置了收款码
    const checkPaymentSettings = async () => {
      const settings = await getPaymentSettings();
      setHasQrCode(!!(settings.wechatQrCode || settings.alipayQrCode));
    };
    checkPaymentSettings();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/checkout?${product.type}=${product.id}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 创建订单
      let result;
      if (product.type === 'course') {
        result = await createCourseOrder(user.id, product.id);
      } else {
        result = await createMembershipOrder(user.id, product.id);
      }

      if ('error' in result) {
        setError(result.error || '订单创建失败');
        setLoading(false);
        return;
      }

      // 跳转到支付页面
      router.push(`/checkout/pay/${result.orderId}`);
    } catch {
      setError('创建订单失败，请重试');
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
      <h3 className="font-bold mb-4">订单信息</h3>

      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <p className="font-medium text-gray-900">{product.name}</p>
        <p className="text-sm text-gray-500 mt-1">
          {product.type === 'course' ? '课程' : '会员套餐'}
        </p>
      </div>

      <div className="border-t pt-4 mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">商品金额</span>
          <span>¥{product.originalPrice || product.price}</span>
        </div>
        {discount && parseFloat(discount) > 0 && (
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

      {!hasQrCode && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
          暂未配置收款方式，请联系管理员
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !hasQrCode}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '处理中...' : user ? '提交订单' : '登录后购买'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        提交订单后将跳转到支付页面
      </p>
    </div>
  );
}
