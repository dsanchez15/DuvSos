"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/SidebarContext";
import { useAppTranslation } from "@/components/LanguageProvider";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { useSidebarData } from "@/hooks/useSidebarData";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import SidebarItem from "@/components/SidebarItem";
import SidebarGroup from "@/components/SidebarGroup";
import SidebarLogo from "@/components/SidebarLogo";
import UserProfileMenu from "@/components/UserProfileMenu";

export default function Sidebar() {
  const { t } = useAppTranslation();
  const pathname = usePathname();
  const { isExpanded, isMobileOverlayOpen, toggle, closeMobileOverlay } =
    useSidebar();
  const { user, expiringCount } = useSidebarData();
  const { flags } = useFeatureFlags();

  const [planExpanded, setPlanExpanded] = useLocalStorageState(
    "sidebar-plan-expanded",
    false,
  );
  const [studyExpanded, setStudyExpanded] = useLocalStorageState(
    "sidebar-study-expanded",
    false,
  );

  // Auto-expand study group when navigating into /study
  useEffect(() => {
    if (pathname.startsWith('/study')) {
      setStudyExpanded(true);
    }
  }, [pathname, setStudyExpanded]);

  // Auto-expand plan group when navigating into goals/progress
  useEffect(() => {
    if (pathname.startsWith('/goals') || pathname.startsWith('/progress')) {
      setPlanExpanded(true);
    }
  }, [pathname, setPlanExpanded]);

  const toggleStudy = useCallback(() => setStudyExpanded((v) => !v), [setStudyExpanded]);
  const togglePlan = useCallback(() => setPlanExpanded((v) => !v), [setPlanExpanded]);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);

  // Use the custom focus trap hook
  useFocusTrap(sidebarRef, isMobileOverlayOpen, toggleRef);

  const handleToggleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  const handleBackdropClick = useCallback(
    () => closeMobileOverlay(),
    [closeMobileOverlay],
  );

  const sidebarWidthClass = isExpanded ? "w-64" : "w-20";

  const checklistsBadge =
    expiringCount > 0 && isExpanded ? (
      <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {expiringCount}
      </span>
    ) : undefined;

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileOverlayOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="main-sidebar"
        className={`
                    border-r border-primary/10 flex flex-col py-8 fixed h-full z-40 bg-sidebar-bg
                    ${isMobileOverlayOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    ${sidebarWidthClass}
                    transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                    motion-reduce:transition-none
                `}
      >
        {/* Decorative top line */}
        <div
          style={{
            height: "1px",
            background: "var(--deco-sidebar-top-line)",
            opacity: 0.6,
          }}
        />

        {/* Toggle Button */}
        <button
          ref={toggleRef}
          onClick={toggle}
          onKeyDown={handleToggleKeyDown}
          aria-expanded={isExpanded || isMobileOverlayOpen}
          aria-controls="main-sidebar"
          aria-label={
            isExpanded || isMobileOverlayOpen
              ? "Collapse sidebar"
              : "Expand sidebar"
          }
          className="absolute -right-2.5 top-9 w-5 h-5 rounded-full flex items-center justify-center shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-slate-400/50 hidden lg:flex backdrop-blur-sm transition-all bg-bg-surface-hover text-text-secondary"
        >
          <span className="material-symbols-outlined text-xs">
            {isExpanded ? "chevron_left" : "chevron_right"}
          </span>
        </button>

        {/* Logo */}
        <SidebarLogo isExpanded={isExpanded} />

        {/* Navigation */}
        <nav className="flex-1 w-full px-4 space-y-1 overflow-y-auto">
          <SidebarItem
            href="/dashboard"
            icon="dashboard"
            label={t("sidebar.dashboard")}
            isExpanded={isExpanded}
            isActive={pathname === "/dashboard"}
            ref={pathname === "/dashboard" ? firstFocusableRef : undefined}
          />
          <SidebarItem
            href="/todos"
            icon="check_circle"
            label={t("sidebar.todos")}
            isExpanded={isExpanded}
            isActive={pathname === "/todos"}
          />
          {flags.checklists && (
            <SidebarItem
              href="/checklists"
              icon="fact_check"
              label={t("sidebar.checklists")}
              isExpanded={isExpanded}
              isActive={pathname === "/checklists"}
              badge={checklistsBadge}
            />
          )}
          {flags.reminders && (
            <SidebarItem
              href="/reminders"
              icon="notifications_active"
              label={t("sidebar.reminders")}
              isExpanded={isExpanded}
              isActive={pathname === "/reminders"}
            />
          )}
          {flags.habits && (
            <SidebarItem
              href="/habits"
              icon="routine"
              label={t("sidebar.habits")}
              isExpanded={isExpanded}
              isActive={pathname === "/habits"}
            />
          )}

          {flags.study && (
            <SidebarGroup
              icon="school"
              label="Estudio"
              isExpanded={isExpanded}
              groupExpanded={studyExpanded}
              onToggle={toggleStudy}
              isActive={pathname.startsWith("/study")}
              pathname={pathname}
              items={[
                { href: "/study/review", icon: "play_circle", label: "Repaso" },
                { href: "/study/questions", icon: "quiz", label: "Preguntas" },
              ]}
            />
          )}

          {(flags.goals || flags.progress) && (
            <SidebarGroup
              icon="track_changes"
              label={t("sidebar.plan")}
              isExpanded={isExpanded}
              groupExpanded={planExpanded}
              onToggle={togglePlan}
              isActive={
                pathname.startsWith("/goals") || pathname.startsWith("/progress")
              }
              pathname={pathname}
              items={[
                ...(flags.goals ? [{ href: "/goals", icon: "flag", label: t("sidebar.goals") }] : []),
                ...(flags.progress
                  ? [{
                      href: "/progress",
                      icon: "trending_up",
                      label: t("sidebar.progressAndCheckIn"),
                    }]
                  : []),
              ]}
            />
          )}
        </nav>

        {/* User Profile */}
        <UserProfileMenu user={user} isExpanded={isExpanded} />
      </aside>

      {/* Mobile Header Toggle */}
      <button
        onClick={toggle}
        onKeyDown={handleToggleKeyDown}
        aria-expanded={isMobileOverlayOpen}
        aria-controls="main-sidebar"
        aria-label={isMobileOverlayOpen ? "Close sidebar" : "Open sidebar"}
        className="fixed top-4 left-4 z-50 p-2 border border-primary/10 rounded-[8px] shadow-sm lg:hidden bg-bg-surface"
      >
        <span className="material-symbols-outlined">
          {isMobileOverlayOpen ? "close" : "menu"}
        </span>
      </button>
    </>
  );
}
