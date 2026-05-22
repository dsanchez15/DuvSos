'use client';

import React from 'react';

interface SidebarLogoProps {
  isExpanded: boolean;
}

export default React.memo(function SidebarLogo({ isExpanded }: SidebarLogoProps) {
  return (
    <div className="px-6 mb-10 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white shadow-lg shrink-0 -ml-1.5"
        style={{
          background: 'var(--deco-logo-bg)',
          boxShadow: 'var(--deco-logo-shadow)',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-white"
        >
          <path
            d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M12 6L8 9V15L12 18L16 15V9L12 6Z" fill="currentColor" />
        </svg>
      </div>
      <span
        className={`text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 text-text-primary ${
          isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
        }`}
      >
        Aure
      </span>
    </div>
  );
});
