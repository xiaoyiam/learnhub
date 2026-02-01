'use client';

import { useState } from 'react';
import { createChapter, updateChapter } from '@/lib/actions/admin';
import { FileUpload } from '@/components/file-upload';
import { MarkdownEditor } from '@/components/markdown-editor';
import type { Chapter } from '@/db/schema';

interface ChapterFormProps {
  courseId: string;
  chapter?: Chapter;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChapterForm({ courseId, chapter, mode, onSuccess, onCancel }: ChapterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: chapter?.title || '',
    description: chapter?.description || '',
    type: (chapter?.type as 'video' | 'article') || 'video',
    videoUrl: chapter?.videoUrl || '',
    content: chapter?.content || '',
    duration: chapter?.duration?.toString() || '',
    isFree: chapter?.isFree || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const durationNum = parseInt(formData.duration) || 0;

    // 验证
    if (formData.type === 'video' && !formData.videoUrl) {
      setError('请填写视频 URL');
      setLoading(false);
      return;
    }
    if (formData.type === 'article' && !formData.content) {
      setError('请填写图文内容');
      setLoading(false);
      return;
    }

    try {
      const chapterData = {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type as 'video' | 'article',
        videoUrl: formData.type === 'video' ? formData.videoUrl : undefined,
        content: formData.type === 'article' ? formData.content : undefined,
        duration: durationNum,
        isFree: formData.isFree,
      };

      if (mode === 'create') {
        const result = await createChapter(courseId, chapterData);
        if ('error' in result) {
          setError(result.error as string);
        } else {
          onSuccess();
        }
      } else if (chapter) {
        const result = await updateChapter(chapter.id, chapterData);
        if ('error' in result) {
          setError(result.error as string);
        } else {
          onSuccess();
        }
      }
    } catch {
      setError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            章节标题 *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="输入章节标题"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            章节类型 *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="video">视频课程</option>
            <option value="article">图文课程</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          章节简介
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={2}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          placeholder="简短描述本章节内容"
        />
      </div>

      {/* 视频类型内容 */}
      {formData.type === 'video' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            视频 *
          </label>
          <FileUpload
            type="video"
            value={formData.videoUrl}
            onChange={(url) => setFormData(prev => ({ ...prev, videoUrl: url }))}
          />
        </div>
      )}

      {/* 图文类型内容 */}
      {formData.type === 'article' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            图文内容 *
          </label>
          <MarkdownEditor
            value={formData.content}
            onChange={(content) => setFormData(prev => ({ ...prev, content }))}
            minHeight="250px"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            预计时长 (分钟)
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder={formData.type === 'video' ? '视频时长' : '阅读时长'}
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isFree"
              checked={formData.isFree}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">免费试看</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? '保存中...' : (mode === 'create' ? '添加章节' : '保存修改')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          取消
        </button>
      </div>
    </form>
  );
}
