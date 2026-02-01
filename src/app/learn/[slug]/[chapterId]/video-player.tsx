'use client';

import { useEffect, useRef, useState } from 'react';

interface Chapter {
  id: string;
  title: string;
  videoUrl: string | null;
  duration: number | null;
}

interface Props {
  chapter: Chapter;
  courseId: string;
  userId?: string;
}

export function VideoPlayer({ chapter, courseId, userId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // 保存进度（每10秒保存一次）
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const currentTime = Math.floor(videoRef.current.currentTime);
        const totalDuration = Math.floor(videoRef.current.duration || 0);

        // 保存进度到服务器
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            chapterId: chapter.id,
            progress: currentTime,
            duration: totalDuration,
            isCompleted: currentTime >= totalDuration * 0.9, // 观看90%视为完成
          }),
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userId, courseId, chapter.id, isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 如果没有视频URL，显示占位符
  if (!chapter.videoUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-xl font-medium mb-2">{chapter.title}</h3>
        <p className="text-gray-300 text-center max-w-md">
          视频内容准备中，敬请期待...
        </p>
        {chapter.duration && (
          <p className="text-gray-400 mt-4">
            预计时长: {chapter.duration} 分钟
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black group">
      <video
        ref={videoRef}
        src={chapter.videoUrl}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls
      />

      {/* Custom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 opacity-0 group-hover:opacity-100 transition">
        <div
          className="h-full bg-blue-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
