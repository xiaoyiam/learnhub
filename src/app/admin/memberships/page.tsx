'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMembershipPlans, updateMembershipPlan } from '@/lib/actions/admin';
import type { MembershipPlan } from '@/db/schema';

const typeBadge: Record<string, { text: string; color: string }> = {
  monthly: { text: '月度', color: 'bg-blue-100 text-blue-600' },
  quarterly: { text: '季度', color: 'bg-green-100 text-green-600' },
  yearly: { text: '年度', color: 'bg-purple-100 text-purple-600' },
  enterprise: { text: '企业', color: 'bg-orange-100 text-orange-600' },
};

export default function MembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    const data = await getMembershipPlans();
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleActive = async (plan: MembershipPlan) => {
    await updateMembershipPlan(plan.id, { isActive: !(plan.isActive ?? true) });
    fetchPlans();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">会员套餐管理</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无套餐
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {plans.map((plan) => {
              const features = Array.isArray(plan.features) ? plan.features as string[] : [];
              return (
                <div
                  key={plan.id}
                  className={`border rounded-xl p-6 ${plan.isActive ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${typeBadge[plan.type]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {typeBadge[plan.type]?.text || plan.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`px-2 py-1 rounded text-xs ${
                        plan.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {plan.isActive ? '启用中' : '已禁用'}
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">¥{plan.price}</span>
                      {plan.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">¥{plan.originalPrice}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.durationDays === 0 ? '永久有效' : `${plan.durationDays}天`}
                    </p>
                  </div>

                  {features.length > 0 && (
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      {features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                      {features.length > 3 && (
                        <li className="text-gray-400">+{features.length - 3} 更多功能</li>
                      )}
                    </ul>
                  )}

                  <Link
                    href={`/admin/memberships/${plan.id}`}
                    className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    编辑套餐
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
