'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getCourse, getChapters, deleteChapter, reorderChapters } from '@/lib/actions/admin';
import ChapterForm from '../../components/chapter-form';
import type { Course, Chapter } from '@/db/schema';

export default function ChaptersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [courseData, chaptersData] = await Promise.all([
      getCourse(courseId),
      getChapters(courseId),
    ]);
    setCourse(courseData || null);
    setChapters(chaptersData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个章节吗？')) return;

    const result = await deleteChapter(id);
    if ('error' in result) {
      alert(result.error);
    } else {
      fetchData();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...chapters];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setChapters(newOrder);
    await reorderChapters(courseId, newOrder.map(c => c.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index === chapters.length - 1) return;
    const newOrder = [...chapters];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setChapters(newOrder);
    await reorderChapters(courseId, newOrder.map(c => c.id));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingChapter(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-gray-500 py-12">加载中...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-gray-500 py-12">课程不存在</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/courses"
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          管理章节: {course.title}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            章节列表 ({chapters.length})
          </h2>
          {!showForm && !editingChapter && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              + 添加章节
            </button>
          )}
        </div>

        {(showForm || editingChapter) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {editingChapter ? '编辑章节' : '添加新章节'}
            </h3>
            <ChapterForm
              courseId={courseId}
              chapter={editingChapter || undefined}
              mode={editingChapter ? 'edit' : 'create'}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false);
                setEditingChapter(null);
              }}
            />
          </div>
        )}

        {chapters.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暂无章节，点击上方按钮添加
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:border-gray-300 transition"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === chapters.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ▼
                  </button>
                </div>

                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      chapter.type === 'article'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {chapter.type === 'article' ? '图文' : '视频'}
                    </span>
                    <span className="font-medium text-gray-900">{chapter.title}</span>
                    {chapter.isFree && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-xs">
                        试看
                      </span>
                    )}
                  </div>
                  {chapter.description && (
                    <p className="text-sm text-gray-500 mt-1">{chapter.description}</p>
                  )}
                </div>

                <div className="text-sm text-gray-500">
                  {chapter.duration ? `${chapter.duration} 分钟` : '-'}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingChapter(chapter)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(chapter.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Link
          href={`/admin/courses/${courseId}`}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          编辑课程信息
        </Link>
        <Link
          href="/admin/courses"
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          返回课程列表
        </Link>
      </div>
    </div>
  );
}
