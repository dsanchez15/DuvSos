'use client';

import { forwardRef } from 'react';
import Link from 'next/link';

interface SidebarItemProps {
  href: string;
  icon: string;
  label: string;
  isExpanded: boolean;
  isActive: boolean;
  badge?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'sub';
}

const SidebarItem = forwardRef<HTMLAnchorElement, SidebarItemProps>(
  ({ href, icon, label, isExpanded, isActive, badge, className = '', variant = 'default' }, ref) => {
    const isSub = variant === 'sub';

    if (isSub) {
      const baseClass =
        'relative flex items-center gap-2 py-2.5 rounded-[8px] transition-all group whitespace-nowrap text-sm';
      const stateClass = isActive
        ? 'active text-[var(--color-primary)]'
        : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]';

      return (
        <Link href={href} className={`${baseClass} ${stateClass} ${className}`} ref={ref}>
          {/* Horizontal branch connector: joins the master vertical line to this item's icon */}
          <span className="relative w-4 flex-shrink-0 self-stretch" aria-hidden="true">
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px]"
              style={{ backgroundColor: 'var(--color-border)' }}
            />
          </span>

          <span className="material-symbols-outlined shrink-0 text-[16px]">{icon}</span>
          <span
            className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${
              isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}
          >
            {label}
          </span>
          {badge}
        </Link>
      );
    }

    const baseClass =
      'flex items-center gap-4 px-4 py-3 rounded-[8px] transition-all group whitespace-nowrap';
    const activeClass = isActive
      ? 'active'
      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]';

    return (
      <Link href={href} className={`${baseClass} ${activeClass} ${className}`} ref={ref}>
        <span className="material-symbols-outlined shrink-0">{icon}</span>
        <span
          className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
          }`}
        >
          {label}
        </span>
        {badge}
      </Link>
    );
  }
);
SidebarItem.displayName = 'SidebarItem';

export default SidebarItem;
