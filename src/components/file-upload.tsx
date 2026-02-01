'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  type: 'video' | 'image';
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
}

export function FileUpload({
  type,
  value,
  onChange,
  placeholder = '点击或拖拽上传',
  accept,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAccept = type === 'video'
    ? 'video/mp4,video/webm,video/quicktime'
    : 'image/jpeg,image/png,image/gif,image/webp';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('action', 'direct');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '上传失败');
      }

      onChange(result.url);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      {/* URL 输入 */}
      <div className="flex gap-2">
        <input
          type="url"
          value={value || ''}
          onChange={handleUrlInput}
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          placeholder={`输入${type === 'video' ? '视频' : '图片'} URL 或上传文件`}
        />
        <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer text-sm whitespace-nowrap">
          {uploading ? '上传中...' : '上传'}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept || defaultAccept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* 上传进度 */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* 预览 */}
      {value && !uploading && (
        <div className="mt-2">
          {type === 'image' ? (
            <img
              src={value}
              alt="预览"
              className="max-w-xs max-h-32 object-contain rounded border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-xs text-gray-500 truncate">
              视频: {value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
