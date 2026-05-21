'use client';

import SidebarItem from './SidebarItem';

interface SubItem {
  href: string;
  icon: string;
  label: string;
}

interface SidebarGroupProps {
  icon: string;
  label: string;
  isExpanded: boolean;
  groupExpanded: boolean;
  onToggle: () => void;
  isActive: boolean;
  items: SubItem[];
  pathname: string;
}

export default function SidebarGroup({
  icon,
  label,
  isExpanded,
  groupExpanded,
  onToggle,
  isActive,
  items,
  pathname,
}: SidebarGroupProps) {
  return (
    <>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-4 px-4 py-3 rounded-[8px] transition-all group whitespace-nowrap relative ${
          isActive ? 'active' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
        }`}
      >
        <span className="material-symbols-outlined shrink-0">{icon}</span>
        <span
          className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
          }`}
        >
          {label}
        </span>
        {isExpanded && (
          <span
            className="material-symbols-outlined text-sm transition-transform ml-auto"
            style={{ transform: groupExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            chevron_right
          </span>
        )}
      </button>

      {groupExpanded && (
        <div className="relative space-y-0" style={{ paddingLeft: '28px' }}>
          {/* Master vertical line: aligned with parent icon center.
              Parent icon center ≈ 16px(nav pad) + 16px(btn pad) + 12px(half icon) = 44px.
              Container is inside nav (16px pad), so line at 44 - 16 = 28px from container left edge.
              Starts ~24px above container top to reach parent icon center. */}
          <div
            className="absolute w-[2px]"
            style={{
              left: '28px',
              top: '-24px',
              bottom: '0',
              backgroundColor: 'var(--color-border)',
            }}
          />

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <div key={item.href} className="relative">
                {/* Cap: masks the vertical line below the last item's center */}
                {isLast && (
                  <div
                    className="absolute top-1/2 w-[2px] z-10"
                    style={{
                      left: '0',
                      bottom: '0',
                      backgroundColor: 'var(--color-sidebar-bg)',
                    }}
                  />
                )}
                <SidebarItem
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isExpanded={isExpanded}
                  isActive={pathname === item.href}
                  variant="sub"
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
