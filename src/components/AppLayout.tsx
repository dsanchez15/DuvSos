'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider, useSidebar } from '@/components/SidebarContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}>
        {/* Grid overlay — visible only in retrofuturista (classic uses transparent) */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background:
              'linear-gradient(var(--deco-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--deco-grid-line) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}

function MainContent({ children }: { children: ReactNode }) {
  const { isExpanded } = useSidebar();

  // On mobile (<lg), sidebar is an overlay so main has no left margin.
  // On lg+, sidebar is always visible (either w-64 expanded or w-20 collapsed).
  const marginClass = isExpanded
    ? 'ml-0 lg:ml-64'
    : 'ml-0 lg:ml-20';

  return (
    <main className={`flex-1 p-4 lg:p-8 transition-[margin] duration-300 motion-reduce:transition-none ${marginClass}`}>
      {children}
    </main>
  );
}