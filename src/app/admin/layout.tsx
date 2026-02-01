import { requireAdmin } from '@/lib/admin-auth';
import AdminSidebar from './components/admin-sidebar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin - LearnHub',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
