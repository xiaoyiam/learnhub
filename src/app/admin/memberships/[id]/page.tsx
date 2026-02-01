'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMembershipPlan, updateMembershipPlan } from '@/lib/actions/admin';
import type { MembershipPlan } from '@/db/schema';

export default function EditMembershipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    durationDays: 0,
    features: '',
    isActive: true,
  });

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      const data = await getMembershipPlan(id);
      if (data) {
        setPlan(data);
        const features = Array.isArray(data.features) ? data.features as string[] : [];
        setFormData({
          name: data.name,
          price: data.price,
          originalPrice: data.originalPrice || '',
          durationDays: data.durationDays,
          features: features.join('\n'),
          isActive: data.isActive ?? true,
        });
      }
      setLoading(false);
    };
    fetchPlan();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const features = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const result = await updateMembershipPlan(id, {
        name: formData.name,
        price: formData.price,
        originalPrice: formData.originalPrice || undefined,
        durationDays: formData.durationDays,
        features,
        isActive: formData.isActive,
      });

      if ('error' in result) {
        setError(result.error as string);
      } else {
        router.push('/admin/memberships');
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

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center text-gray-500 py-12">套餐不存在</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/memberships"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          编辑套餐
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              套餐名称 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                价格 (元) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原价 (元)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="用于显示折扣"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                有效期 (天)
              </label>
              <input
                type="number"
                name="durationDays"
                value={formData.durationDays}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">0 表示永久有效</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              功能列表
            </label>
            <textarea
              name="features"
              value={formData.features}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="每行一个功能点，例如:&#10;无限观看所有课程&#10;专属会员社群&#10;优先获取新课程"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">启用此套餐</span>
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存修改'}
            </button>
            <Link
              href="/admin/memberships"
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
