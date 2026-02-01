'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCourse, updateCourse } from '@/lib/actions/admin';
import type { Course } from '@/db/schema';

interface CourseFormProps {
  course?: Course;
  mode: 'create' | 'edit';
}

export default function CourseForm({ course, mode }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: course?.title || '',
    slug: course?.slug || '',
    description: course?.description || '',
    coverImage: course?.coverImage || '',
    type: course?.type || 'paid',
    price: course?.price || '0',
    originalPrice: course?.originalPrice || '',
    instructor: course?.instructor || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSlugGenerate = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'create') {
        const result = await createCourse({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          coverImage: formData.coverImage,
          type: formData.type as 'free' | 'paid' | 'member_only',
          price: formData.price,
          originalPrice: formData.originalPrice || undefined,
          instructor: formData.instructor,
        });

        if ('error' in result) {
          setError(result.error as string);
        } else {
          router.push('/admin/courses');
        }
      } else if (course) {
        const result = await updateCourse(course.id, {
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          coverImage: formData.coverImage,
          type: formData.type as 'free' | 'paid' | 'member_only',
          price: formData.price,
          originalPrice: formData.originalPrice || undefined,
          instructor: formData.instructor,
        });

        if ('error' in result) {
          setError(result.error as string);
        } else {
          router.push('/admin/courses');
        }
      }
    } catch {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          课程标题 *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="输入课程标题"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL 标识 (slug) *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            required
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="course-url-slug"
          />
          <button
            type="button"
            onClick={handleSlugGenerate}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
          >
            自动生成
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">用于课程URL，只能包含字母、数字和连字符</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          课程描述
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder="输入课程描述"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          封面图片 URL
        </label>
        <input
          type="url"
          name="coverImage"
          value={formData.coverImage}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="https://example.com/cover.jpg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            课程类型 *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="free">免费</option>
            <option value="paid">付费</option>
            <option value="member_only">会员专属</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            价格 (元)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            原价 (元)
          </label>
          <input
            type="number"
            name="originalPrice"
            value={formData.originalPrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="可选，用于显示折扣"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          讲师名称 *
        </label>
        <input
          type="text"
          name="instructor"
          value={formData.instructor}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="讲师姓名"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : (mode === 'create' ? '创建课程' : '保存修改')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          取消
        </button>
      </div>
    </form>
  );
}
