'use client';

import { useState, useRef } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '输入 Markdown 内容...',
  minHeight = '300px',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange(newText);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      formData.append('action', 'direct');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '上传失败');
      }

      // 插入图片 Markdown
      insertText(`![${file.name}](${result.url})`, '\n');
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toolbar = [
    { icon: 'B', title: '粗体', action: () => insertText('**', '**') },
    { icon: 'I', title: '斜体', action: () => insertText('*', '*') },
    { icon: 'H', title: '标题', action: () => insertText('## ', '') },
    { icon: '—', title: '分割线', action: () => insertText('\n---\n', '') },
    { icon: '•', title: '列表', action: () => insertText('- ', '') },
    { icon: '1.', title: '有序列表', action: () => insertText('1. ', '') },
    { icon: '""', title: '引用', action: () => insertText('> ', '') },
    { icon: '<>', title: '代码', action: () => insertText('`', '`') },
    { icon: '```', title: '代码块', action: () => insertText('\n```\n', '\n```\n') },
    { icon: '🔗', title: '链接', action: () => insertText('[', '](url)') },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b flex-wrap">
        {toolbar.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={item.action}
            title={item.title}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition"
          >
            {item.icon}
          </button>
        ))}
        <label
          className={`px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition cursor-pointer ${
            uploading ? 'opacity-50' : ''
          }`}
          title="上传图片"
        >
          {uploading ? '⏳' : '📷'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <div className="flex-1" />
        <div className="flex bg-gray-200 rounded">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1 text-sm rounded transition ${
              activeTab === 'edit' ? 'bg-white shadow' : 'text-gray-600'
            }`}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 text-sm rounded transition ${
              activeTab === 'preview' ? 'bg-white shadow' : 'text-gray-600'
            }`}
          >
            预览
          </button>
        </div>
      </div>

      {/* 编辑区 / 预览区 */}
      {activeTab === 'edit' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 outline-none resize-none font-mono text-sm"
          style={{ minHeight }}
        />
      ) : (
        <div
          className="p-4 prose prose-sm max-w-none overflow-auto"
          style={{ minHeight }}
        >
          <MarkdownPreview content={value} />
        </div>
      )}
    </div>
  );
}

// 简单的 Markdown 预览组件
function MarkdownPreview({ content }: { content: string }) {
  if (!content) {
    return <p className="text-gray-400">暂无内容</p>;
  }

  // 简单的 Markdown 转换（生产环境应使用 react-markdown）
  const html = content
    // 代码块
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 标题
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 链接和图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
    // 引用
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 text-gray-600">$1</blockquote>')
    // 分割线
    .replace(/^---$/gm, '<hr />')
    // 无序列表
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    // 有序列表
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // 段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  );
}
