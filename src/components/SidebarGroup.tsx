"use client";

import { memo } from "react";
import SidebarItem from "./SidebarItem";

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

const SidebarGroup = memo(function SidebarGroup({
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
          isActive
            ? "active"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
        }`}
      >
        <span className="material-symbols-outlined shrink-0 -ml-1.5">{icon}</span>
        <span
          className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          }`}
        >
          {label}
        </span>
        {isExpanded && (
          <span
            className="material-symbols-outlined text-sm transition-transform ml-auto"
            style={{
              transform: groupExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            chevron_right
          </span>
        )}
      </button>

      <div
        className="grid transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          gridTemplateRows: groupExpanded ? "1fr" : "0fr",
          opacity: groupExpanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div
            className="relative space-y-0 pt-1"
            style={{ paddingLeft: isExpanded ? "22px" : "0" }}
          >
            {/* Master vertical line: aligned with parent icon center. */}
            {isExpanded && (
              <div
                className="absolute w-[2px]"
                style={{
                  left: "22px",
                  top: "-11px", /* adjusted for pt-1 */
                  bottom: "0",
                  backgroundColor: "var(--color-border)",
                }}
              />
            )}

            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <div key={item.href} className="relative">
                  {/* Cap: masks the vertical line below the last item's center, creating the └ effect */}
                  {isExpanded && isLast && (
                    <div
                      className="absolute w-[2px] z-10"
                      style={{
                        left: "0",
                        top: "52%",
                        bottom: "0",
                        backgroundColor: "var(--color-sidebar-bg)",
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
        </div>
      </div>
    </>
  );
});

export default SidebarGroup;
