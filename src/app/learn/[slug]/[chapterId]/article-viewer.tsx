'use client';

import { useEffect } from 'react';

interface ArticleViewerProps {
  chapter: {
    id: string;
    title: string;
    content: string | null;
    duration: number | null;
  };
  courseId: string;
  userId?: string;
}

export function ArticleViewer({ chapter, courseId, userId }: ArticleViewerProps) {
  // 记录阅读进度
  useEffect(() => {
    if (!userId) return;

    // 标记开始阅读
    const markProgress = async (isCompleted: boolean) => {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            chapterId: chapter.id,
            progress: isCompleted ? 100 : 50,
            duration: 100,
            isCompleted,
          }),
        });
      } catch {
        // 忽略错误
      }
    };

    // 标记阅读中
    markProgress(false);

    // 阅读完成时标记
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollHeight > 0 && scrollTop / scrollHeight > 0.9) {
        markProgress(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [courseId, chapter.id, userId]);

  if (!chapter.content) {
    return (
      <div className="p-8 text-center text-gray-400">
        暂无内容
      </div>
    );
  }

  // 简单的 Markdown 渲染
  const renderMarkdown = (content: string) => {
    return content
      // 代码块
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="bg-gray-800 rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm text-gray-100">${escapeHtml(code.trim())}</code></pre>`;
      })
      // 行内代码
      .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1.5 py-0.5 rounded text-sm text-blue-300">$1</code>')
      // 标题
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-4">$1</h1>')
      // 粗体和斜体
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" />')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener">$1</a>')
      // 引用
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 my-4 text-gray-300 italic">$1</blockquote>')
      // 分割线
      .replace(/^---$/gm, '<hr class="border-gray-700 my-6" />')
      // 无序列表
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>')
      // 有序列表
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-gray-300">$1</li>')
      // 段落
      .replace(/\n\n/g, '</p><p class="text-gray-300 leading-relaxed my-4">')
      .replace(/\n/g, '<br />');
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <article
        className="prose prose-invert prose-lg max-w-none"
        dangerouslySetInnerHTML={{
          __html: `<p class="text-gray-300 leading-relaxed my-4">${renderMarkdown(chapter.content)}</p>`,
        }}
      />

      {chapter.duration && (
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm">
          预计阅读时间: {chapter.duration} 分钟
        </div>
      )}
    </div>
  );
}
