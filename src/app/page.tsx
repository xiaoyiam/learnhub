import Link from 'next/link';
import { UserMenu } from '@/components/user-menu';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LearnHub
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/courses" className="text-gray-600 hover:text-gray-900">
              课程
            </Link>
            <Link href="/membership" className="text-gray-600 hover:text-gray-900">
              会员
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            开启你的学习之旅
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            LearnHub 提供专业的在线课程、会员服务和数字资源，助你技能提升
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/courses"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-medium"
            >
              浏览课程
            </Link>
            <Link
              href="/membership"
              className="px-8 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-lg font-medium"
            >
              了解会员
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">为什么选择 LearnHub</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">
                📚
              </div>
              <h3 className="text-xl font-semibold mb-3">优质课程</h3>
              <p className="text-gray-500">
                精选行业专家打造的专业课程，从入门到精通，系统化学习路径
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 text-xl">
                👑
              </div>
              <h3 className="text-xl font-semibold mb-3">会员特权</h3>
              <p className="text-gray-500">
                订阅会员畅享全站资源，专属折扣和优先服务，性价比超高
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 text-xl">
                🏢
              </div>
              <h3 className="text-xl font-semibold mb-3">企业培训</h3>
              <p className="text-gray-500">
                为企业提供定制化培训方案，学习数据可视化，团队管理便捷
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>&copy; 2024 LearnHub. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
