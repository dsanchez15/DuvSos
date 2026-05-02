'use client';

import AppLayout from '@/components/AppLayout';

export default function UnderConstructionPage({ title, icon }: { title: string; icon: string }) {
    return (
        <AppLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <span className="material-symbols-outlined text-6xl text-primary/40 mb-4">construction</span>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
                <p className="max-w-md" style={{ color: 'var(--color-text-muted)' }}>
                    This section is under construction. We&apos;re working on it and it will be available soon.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-primary">
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                    <span>Coming soon</span>
                </div>
            </div>
        </AppLayout>
    );
}
