import Link from 'next/link';
import { db } from '@/db';
import { membershipPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UserMenu } from '@/components/user-menu';
import { PlanCard } from './plan-card';

export default async function MembershipPage() {
  // 获取所有激活的会员套餐
  const plans = await db
    .select()
    .from(membershipPlans)
    .where(eq(membershipPlans.isActive, true))
    .orderBy(membershipPlans.sortOrder);

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-purple-700">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            LearnHub
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/courses" className="text-purple-200 hover:text-white">
              课程
            </Link>
            <Link href="/membership" className="font-medium">
              会员
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <div className="inline-block px-4 py-2 bg-purple-600 bg-opacity-50 rounded-full text-sm mb-6">
          👑 成为 LearnHub 会员
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          解锁全部学习资源
        </h1>
        <p className="text-xl text-purple-200 max-w-2xl mx-auto">
          订阅会员即可畅享全站课程、独家资源和专属服务，
          <br />
          助你更快成长
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPopular={index === 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">会员专属权益</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">全站课程免费学</h3>
              <p className="text-purple-200">
                会员期内可免费学习所有标记为"会员专享"的课程
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">独家资源下载</h3>
              <p className="text-purple-200">
                免费下载会员专属的模板、素材和工具资源
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">专属学习群</h3>
              <p className="text-purple-200">
                加入会员专属学习群，与同学交流互助
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-semibold mb-2">作业批改</h3>
              <p className="text-purple-200">
                提交课程作业，获得讲师专业点评反馈
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">1v1 答疑</h3>
              <p className="text-purple-200">
                季度/年度会员享受一对一答疑服务
              </p>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-2">专属证书</h3>
              <p className="text-purple-200">
                年度会员完成课程可获得专属学习证书
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-purple-700">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">常见问题</h2>

          <div className="space-y-6">
            <div className="bg-white bg-opacity-5 rounded-xl p-6">
              <h3 className="font-semibold mb-2">会员可以学习所有课程吗？</h3>
              <p className="text-purple-200">
                会员可以免费学习所有标记为"会员专享"的课程。部分特价课程需要单独购买。
              </p>
            </div>

            <div className="bg-white bg-opacity-5 rounded-xl p-6">
              <h3 className="font-semibold mb-2">会员到期后还能继续学习吗？</h3>
              <p className="text-purple-200">
                会员到期后，已购买的课程可以继续学习，但会员专享课程需要续费后才能访问。
              </p>
            </div>

            <div className="bg-white bg-opacity-5 rounded-xl p-6">
              <h3 className="font-semibold mb-2">支持退款吗？</h3>
              <p className="text-purple-200">
                购买后 7 天内，如未开始学习任何课程，可申请全额退款。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-purple-700 text-center text-purple-300 text-sm">
        <p>&copy; 2024 LearnHub. All rights reserved.</p>
      </footer>
    </main>
  );
}
