import Link from 'next/link';

export default function PaymentPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⏳</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">支付已提交</h1>
        <p className="text-gray-500 mb-6">
          感谢您的支付！管理员将在 1-24 小时内确认您的付款。确认后您将获得课程访问权限。
        </p>
        <div className="space-y-3">
          <Link
            href="/orders"
            className="block w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            查看我的订单
          </Link>
          <Link
            href="/courses"
            className="block w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            继续浏览课程
          </Link>
        </div>
      </div>
    </div>
  );
}
