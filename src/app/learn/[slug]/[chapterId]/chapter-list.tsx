'use client';

import Link from 'next/link';

interface Chapter {
  id: string;
  title: string;
  duration: number | null;
  isFree: boolean;
}

interface Props {
  chapters: Chapter[];
  currentChapterId: string;
  slug: string;
  hasFullAccess: boolean;
}

export function ChapterList({ chapters, currentChapterId, slug, hasFullAccess }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-medium">课程目录</h3>
        <p className="text-sm text-gray-400 mt-1">
          共 {chapters.length} 章节
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chapters.map((chapter, index) => {
          const isActive = chapter.id === currentChapterId;
          const canAccess = hasFullAccess || chapter.isFree;

          return (
            <Link
              key={chapter.id}
              href={canAccess ? `/learn/${slug}/${chapter.id}` : '#'}
              className={`
                flex items-center gap-3 p-4 border-b border-gray-700 transition
                ${isActive
                  ? 'bg-blue-600 bg-opacity-20 border-l-2 border-l-blue-500'
                  : canAccess
                    ? 'hover:bg-gray-700'
                    : 'opacity-50 cursor-not-allowed'
                }
              `}
              onClick={(e) => {
                if (!canAccess) {
                  e.preventDefault();
                }
              }}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                  }
                `}
              >
                {isActive ? '▶' : index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`truncate ${isActive ? 'text-blue-400' : ''}`}>
                  {chapter.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  {chapter.duration && <span>{chapter.duration} 分钟</span>}
                  {chapter.isFree && (
                    <span className="px-1.5 py-0.5 bg-green-600 bg-opacity-20 text-green-400 rounded">
                      试看
                    </span>
                  )}
                </div>
              </div>

              {!canAccess && <span className="text-gray-500">🔒</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
