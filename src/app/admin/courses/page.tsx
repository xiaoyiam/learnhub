'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCourses, updateCourseStatus, deleteCourse } from '@/lib/actions/admin';
import type { Course } from '@/db/schema';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'published', label: '已发布' },
  { key: 'archived', label: '已归档' },
];

const statusBadge: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'bg-gray-100 text-gray-600' },
  published: { text: '已发布', color: 'bg-green-100 text-green-600' },
  archived: { text: '已归档', color: 'bg-yellow-100 text-yellow-600' },
};

const typeBadge: Record<string, { text: string; color: string }> = {
  free: { text: '免费', color: 'bg-blue-100 text-blue-600' },
  paid: { text: '付费', color: 'bg-purple-100 text-purple-600' },
  member_only: { text: '会员', color: 'bg-orange-100 text-orange-600' },
};

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    const data = await getCourses(activeTab);
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, [activeTab]);

  const handleStatusChange = async (id: string, status: 'draft' | 'published' | 'archived') => {
    await updateCourseStatus(id, status);
    fetchCourses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个课程吗？此操作无法撤销。')) return;

    const result = await deleteCourse(id);
    if ('error' in result) {
      alert(result.error);
    } else {
      fetchCourses();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
        <Link
          href="/admin/courses/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + 创建课程
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b">
          <div className="flex gap-1 p-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            暂无课程
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">课程</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">类型</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">价格</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">章节</th>
                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{course.title}</p>
                      <p className="text-sm text-gray-500">{course.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${typeBadge[course.type].color}`}>
                      {typeBadge[course.type].text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    ¥{course.price}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${statusBadge[course.status].color}`}>
                      {statusBadge[course.status].text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {course.chapterCount} 章
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        编辑
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}/chapters`}
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                      >
                        章节
                      </Link>
                      {course.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(course.id, 'published')}
                          className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded"
                        >
                          发布
                        </button>
                      )}
                      {course.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(course.id, 'archived')}
                          className="px-3 py-1 text-sm text-yellow-600 hover:bg-yellow-50 rounded"
                        >
                          归档
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
