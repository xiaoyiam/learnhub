import Link from 'next/link';

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNo = params.order;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 shadow-sm max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✓</span>
        </div>

        <h1 className="text-2xl font-bold mb-2">支付成功</h1>
        <p className="text-gray-500 mb-6">
          感谢您的购买，现在可以开始学习了
        </p>

        {orderNo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">订单号</p>
            <p className="font-mono font-medium">{orderNo}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            开始学习
          </Link>
          <Link
            href="/orders"
            className="block w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            查看订单
          </Link>
        </div>
      </div>
    </main>
  );
}
