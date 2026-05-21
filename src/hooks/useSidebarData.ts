'use client';

import { useState, useEffect } from 'react';

interface SidebarData {
  user: { name: string; email: string; image?: string; tagline?: string; checklistAlertDays?: number } | null;
  expiringCount: number;
  isLoading: boolean;
}

let cachedData: SidebarData | null = null;
let fetchPromise: Promise<SidebarData> | null = null;

export function useSidebarData(): SidebarData {
  const [data, setData] = useState<SidebarData>(
    cachedData || {
      user: null,
      expiringCount: 0,
      isLoading: true,
    }
  );

  useEffect(() => {
    if (cachedData) return; // Already loaded

    let cancelled = false;

    if (!fetchPromise) {
      fetchPromise = Promise.all([
        fetch('/api/auth/me').then((res) => (res.ok ? res.json() : null)),
        fetch('/api/checklists').then((res) => (res.ok ? res.json() : [])),
      ]).then(([userData, checklists]) => {
        const user = userData?.user ?? null;
        const days = user?.checklistAlertDays ?? 3;
        let expiringCount = 0;

        if (days > 0 && Array.isArray(checklists)) {
          const now = new Date().getTime();
          expiringCount = checklists.filter((c: { endDate?: string | null }) => {
            if (!c.endDate) return false;
            const d = Math.ceil((new Date(c.endDate).getTime() - now) / 86400000);
            return d >= 0 && d <= days;
          }).length;
        }

        const result = { user, expiringCount, isLoading: false };
        cachedData = result;
        return result;
      }).catch(() => {
        return { user: null, expiringCount: 0, isLoading: false };
      });
    }

    fetchPromise.then((result) => {
      if (!cancelled) setData(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
