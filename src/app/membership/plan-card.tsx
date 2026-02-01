'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface Plan {
  id: string;
  code: string;
  name: string;
  type: string;
  price: string;
  originalPrice: string | null;
  durationDays: number;
  features: unknown;
}

interface Props {
  plan: Plan;
  isPopular?: boolean;
}

export function PlanCard({ plan, isPopular }: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const features = Array.isArray(plan.features) ? plan.features : [];

  const handleSubscribe = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/membership`);
      return;
    }
    router.push(`/checkout?plan=${plan.id}`);
  };

  const discount = plan.originalPrice
    ? Math.round((1 - parseFloat(plan.price) / parseFloat(plan.originalPrice)) * 100)
    : 0;

  return (
    <div
      className={`
        relative rounded-2xl p-6 transition
        ${isPopular
          ? 'bg-gradient-to-b from-purple-500 to-purple-700 scale-105 shadow-2xl'
          : 'bg-white bg-opacity-10 hover:bg-opacity-15'
        }
      `}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-medium rounded-full">
          最受欢迎
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <p className="text-purple-200 text-sm">
          {plan.durationDays} 天有效期
        </p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl">¥</span>
          <span className="text-5xl font-bold">{Math.floor(parseFloat(plan.price))}</span>
        </div>
        {plan.originalPrice && (
          <div className="mt-2">
            <span className="text-purple-300 line-through text-sm">
              ¥{plan.originalPrice}
            </span>
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded">
              省 {discount}%
            </span>
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <span className="text-green-400">✓</span>
            <span>{String(feature)}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        className={`
          w-full py-3 rounded-lg font-medium transition
          ${isPopular
            ? 'bg-white text-purple-700 hover:bg-purple-100'
            : 'bg-purple-600 hover:bg-purple-500'
          }
        `}
      >
        立即订阅
      </button>
    </div>
  );
}
