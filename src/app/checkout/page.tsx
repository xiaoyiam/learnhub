import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/db';
import { courses, membershipPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CheckoutForm } from './checkout-form';

interface Props {
  searchParams: Promise<{ course?: string; plan?: string }>;
}

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const { course: courseId, plan: planId } = params;

  if (!courseId && !planId) {
    redirect('/courses');
  }

  let product: {
    type: 'course' | 'membership';
    id: string;
    name: string;
    description: string | null;
    price: string;
    originalPrice: string | null;
    image: string | null;
  } | null = null;

  if (courseId) {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    });
    if (course) {
      product = {
        type: 'course',
        id: course.id,
        name: course.title,
        description: course.description,
        price: course.price,
        originalPrice: course.originalPrice,
        image: course.coverImage,
      };
    }
  } else if (planId) {
    const plan = await db.query.membershipPlans.findFirst({
      where: eq(membershipPlans.id, planId),
    });
    if (plan) {
      product = {
        type: 'membership',
        id: plan.id,
        name: plan.name,
        description: `${plan.durationDays} 天会员权益`,
        price: plan.price,
        originalPrice: plan.originalPrice,
        image: null,
      };
    }
  }

  if (!product) {
    redirect('/courses');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LearnHub
          </Link>
          <span className="mx-4 text-gray-300">/</span>
          <span className="text-gray-600">确认订单</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6">订单信息</h2>

              <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-3xl text-white">👑</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                      {product.type === 'course' ? '课程' : '会员'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">¥{product.price}</div>
                  {product.originalPrice && (
                    <div className="text-sm text-gray-400 line-through">
                      ¥{product.originalPrice}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="md:col-span-1">
            <CheckoutForm product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
