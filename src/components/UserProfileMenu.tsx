'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppTranslation } from '@/components/LanguageProvider';
import { useClickOutside } from '@/hooks/useClickOutside';

interface User {
  name: string;
  email: string;
  image?: string;
  tagline?: string;
}

interface UserProfileMenuProps {
  user: User | null;
  isExpanded: boolean;
}

const UserProfileMenu = memo(function UserProfileMenu({ user, isExpanded }: UserProfileMenuProps) {
  const { t } = useAppTranslation();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  useClickOutside(
    profileMenuRef,
    () => setProfileMenuOpen(false),
    profileMenuOpen
  );

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <div className="px-4 w-full mt-auto relative">
      <button
        ref={profileTriggerRef}
        onClick={() => setProfileMenuOpen((open) => !open)}
        aria-expanded={profileMenuOpen}
        aria-haspopup="menu"
        aria-controls="profile-menu"
        className="flex items-center gap-3 w-full p-2 rounded-[8px] transition-colors text-left sidebar-profile-btn"
      >
        <img
          src={
            user?.image ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`
          }
          alt="User Profile"
          className="w-10 h-10 min-w-10 rounded-full border-2 border-primary/20 object-cover shrink-0"
        />
        <div
          className={`overflow-hidden transition-all duration-300 flex-1 min-w-0 ${
            isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
          }`}
        >
          <p className="text-sm font-bold truncate text-text-primary">
            {user?.name || 'User'}
          </p>
          <p className="text-xs truncate text-text-secondary">
            {user?.tagline || 'Productivity Enthusiast'}
          </p>
        </div>
        <span
          className={`material-symbols-outlined transition-transform duration-200 shrink-0 text-text-muted ${
            profileMenuOpen ? 'rotate-180' : ''
          } ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}
        >
          expand_more
        </span>
      </button>

      {/* Profile Dropdown */}
      {profileMenuOpen && (
        <div
          ref={profileMenuRef}
          id="profile-menu"
          role="menu"
          className="absolute left-4 right-4 bottom-full mb-2 rounded-[8px] shadow-lg border border-border bg-bg-surface py-1 z-50"
        >
          <Link
            href="/settings"
            onClick={() => setProfileMenuOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors sidebar-dropdown-item text-text-secondary"
          >
            <span className="material-symbols-outlined text-lg">
              settings
            </span>
            {t('sidebar.settings')}
          </Link>
          <Link
            href="/support"
            onClick={() => setProfileMenuOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors sidebar-dropdown-item text-text-secondary"
          >
            <span className="material-symbols-outlined text-lg">
              help_outline
            </span>
            {t('sidebar.support')}
          </Link>
          <div className="border-t border-border my-1" />
          <button
            onClick={() => {
              setProfileMenuOpen(false);
              handleLogout();
            }}
            role="menuitem"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
          >
            <span className="material-symbols-outlined text-lg">
              logout
            </span>
            {t('sidebar.logout')}
          </button>
        </div>
      )}
    </div>
  );
});

export default UserProfileMenu;
