import CourseForm from '../components/course-form';

export default function NewCoursePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">创建新课程</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <CourseForm mode="create" />
      </div>
    </div>
  );
}
