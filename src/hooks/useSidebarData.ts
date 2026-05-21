'use client';

import { useState, useEffect } from 'react';

interface SidebarData {
  user: { name: string; email: string; image?: string; tagline?: string; checklistAlertDays?: number } | null;
  expiringCount: number;
  isLoading: boolean;
}

export function useSidebarData(): SidebarData {
  const [data, setData] = useState<SidebarData>({
    user: null,
    expiringCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/auth/me').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/checklists').then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([userData, checklists]) => {
        if (cancelled) return;
        const user = userData?.user ?? null;
        const days = user?.checklistAlertDays ?? 3;
        let expiringCount = 0;

        if (days > 0 && Array.isArray(checklists)) {
          const now = new Date().getTime();
          expiringCount = checklists.filter((c: any) => {
            if (!c.endDate) return false;
            const d = Math.ceil((new Date(c.endDate).getTime() - now) / 86400000);
            return d >= 0 && d <= days;
          }).length;
        }

        setData({ user, expiringCount, isLoading: false });
      })
      .catch(() => {
        if (!cancelled) setData((prev) => ({ ...prev, isLoading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
