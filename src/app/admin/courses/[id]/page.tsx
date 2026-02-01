import { notFound } from 'next/navigation';
import { getCourse } from '@/lib/actions/admin';
import CourseForm from '../components/course-form';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑课程</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <CourseForm course={course} mode="edit" />
      </div>
    </div>
  );
}
