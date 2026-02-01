'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPaymentSettings, updatePaymentSettings, type PaymentSettings } from '@/lib/actions/payment';

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState<PaymentSettings>({
    wechatQrCode: '',
    alipayQrCode: '',
    paymentInstructions: '',
    enableManualConfirm: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getPaymentSettings();
      setSettings({
        wechatQrCode: data.wechatQrCode || '',
        alipayQrCode: data.alipayQrCode || '',
        paymentInstructions: data.paymentInstructions || '',
        enableManualConfirm: data.enableManualConfirm ?? true,
        thirdParty: data.thirdParty,
      });
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await updatePaymentSettings(settings);
      if ('error' in result) {
        setError(result.error as string);
      } else {
        setSuccess('设置已保存');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center text-gray-500 py-12">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-gray-700">
          ← 返回控制台
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">支付设置</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="p-4 bg-green-50 text-green-600 rounded-lg">{success}</div>
        )}

        {/* 手动确认模式 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">收款码设置</h2>
          <p className="text-sm text-gray-500 mb-4">
            上传你的个人收款码，用户下单后将看到此二维码进行扫码支付
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                微信收款码 URL
              </label>
              <input
                type="url"
                name="wechatQrCode"
                value={settings.wechatQrCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://example.com/wechat-qr.png"
              />
              {settings.wechatQrCode && (
                <div className="mt-2">
                  <img
                    src={settings.wechatQrCode}
                    alt="微信收款码预览"
                    className="w-32 h-32 object-contain border rounded"
                  />
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                建议使用图床上传收款码图片，获取 URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支付宝收款码 URL
              </label>
              <input
                type="url"
                name="alipayQrCode"
                value={settings.alipayQrCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://example.com/alipay-qr.png"
              />
              {settings.alipayQrCode && (
                <div className="mt-2">
                  <img
                    src={settings.alipayQrCode}
                    alt="支付宝收款码预览"
                    className="w-32 h-32 object-contain border rounded"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支付说明
              </label>
              <textarea
                name="paymentInstructions"
                value={settings.paymentInstructions}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="例如：请在支付时备注订单号，支付后点击【我已支付】按钮"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableManualConfirm"
                name="enableManualConfirm"
                checked={settings.enableManualConfirm}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="enableManualConfirm" className="text-sm text-gray-700">
                启用手动确认收款模式
              </label>
            </div>
          </div>
        </div>

        {/* 第三方支付（预留）*/}
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-60">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            第三方聚合支付
            <span className="ml-2 text-xs font-normal text-gray-400">即将支持</span>
          </h2>
          <p className="text-sm text-gray-500">
            支持接入 Payjs、虎皮椒、易支付等第三方支付平台，实现自动回调确认。
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
            如需接入第三方支付，请联系技术支持
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </form>
    </div>
  );
}
