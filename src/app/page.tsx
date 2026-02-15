'use client';

import Sidebar from '@/components/Sidebar';
import RightSidebar from '@/components/RightSidebar';
import DashboardContent from '@/components/DashboardContent';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 flex flex-col gap-8 lg:flex-row">
        <DashboardContent />
        <RightSidebar />
      </main>

      {/* Mobile Action Button */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <button className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
          <span className="material-symbols-outlined">bolt</span>
        </button>
      </div>
    </div>
  );
}
