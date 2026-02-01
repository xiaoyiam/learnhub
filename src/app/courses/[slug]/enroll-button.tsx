'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Course } from '@/db/schema';

interface Props {
  course: Course;
}

export function EnrollButton({ course }: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!user) {
      // 未登录，跳转登录页
      router.push(`/auth/login?redirect=/courses/${course.slug}`);
      return;
    }

    if (course.type === 'free') {
      // 免费课程，直接开始学习
      // TODO: 创建 license 记录
      router.push(`/learn/${course.slug}`);
      return;
    }

    // 付费课程，跳转到支付页面
    setEnrolling(true);
    // TODO: 实现支付流程
    router.push(`/checkout?course=${course.id}`);
  };

  if (loading) {
    return (
      <button
        disabled
        className="w-full py-3 bg-gray-200 text-gray-400 rounded-lg"
      >
        加载中...
      </button>
    );
  }

  if (course.type === 'free') {
    return (
      <button
        onClick={handleEnroll}
        disabled={enrolling}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
      >
        {enrolling ? '处理中...' : '免费学习'}
      </button>
    );
  }

  if (course.type === 'member_only') {
    return (
      <div className="space-y-2">
        <button
          onClick={() => router.push('/membership')}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
        >
          开通会员
        </button>
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
        >
          {enrolling ? '处理中...' : `¥${course.price} 单独购买`}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={enrolling}
      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
    >
      {enrolling ? '处理中...' : user ? '立即购买' : '登录后购买'}
    </button>
  );
}
