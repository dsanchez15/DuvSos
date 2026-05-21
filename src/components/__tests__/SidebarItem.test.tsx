import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SidebarItem from '@/components/SidebarItem'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('SidebarItem', () => {
  it('renders with label when expanded', () => {
    render(
      <SidebarItem href="/dashboard" icon="dashboard" label="Dashboard" isExpanded={true} isActive={false} />
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('hides label text when collapsed', () => {
    const { container } = render(
      <SidebarItem href="/dashboard" icon="dashboard" label="Dashboard" isExpanded={false} isActive={false} />
    )
    const textSpan = container.querySelector('.opacity-0.w-0')
    expect(textSpan).toBeInTheDocument()
    expect(textSpan).toHaveTextContent('Dashboard')
  })

  it('applies active class when active', () => {
    render(
      <SidebarItem href="/dashboard" icon="dashboard" label="Dashboard" isExpanded={true} isActive={true} />
    )
    const link = screen.getByRole('link')
    expect(link.className).toContain('active')
  })

  it('does not apply active class when inactive', () => {
    render(
      <SidebarItem href="/todos" icon="check_circle" label="Todos" isExpanded={true} isActive={false} />
    )
    const link = screen.getByRole('link')
    expect(link.className).not.toContain('active')
  })

  it('renders badge when provided', () => {
    render(
      <SidebarItem
        href="/checklists"
        icon="fact_check"
        label="Checklists"
        isExpanded={true}
        isActive={false}
        badge={<span data-testid="badge">3</span>}
      />
    )
    expect(screen.getByTestId('badge')).toBeInTheDocument()
  })

  it('renders sub-item variant with tree connector when expanded', () => {
    const { container } = render(
      <SidebarItem
        href="/goals"
        icon="flag"
        label="Goals"
        isExpanded={true}
        isActive={false}
        variant="sub"
      />
    )
    const branch = container.querySelector('.h-\\[2px\\]')
    expect(branch).toBeInTheDocument()
  })

  it('renders sub-item as top-level style when collapsed', () => {
    const { container } = render(
      <SidebarItem
        href="/goals"
        icon="flag"
        label="Goals"
        isExpanded={false}
        isActive={false}
        variant="sub"
      />
    )
    expect(container.querySelector('.h-\\[2px\\]')).toBeNull()
    const link = screen.getByRole('link')
    expect(link.className).toContain('gap-4')
  })

  it('uses muted text color for inactive sub-items', () => {
    render(
      <SidebarItem
        href="/goals"
        icon="flag"
        label="Goals"
        isExpanded={true}
        isActive={false}
        variant="sub"
      />
    )
    const link = screen.getByRole('link')
    expect(link.className).toContain('text-[var(--color-text-muted)]')
  })

  it('uses primary color for active sub-items', () => {
    render(
      <SidebarItem
        href="/goals"
        icon="flag"
        label="Goals"
        isExpanded={true}
        isActive={true}
        variant="sub"
      />
    )
    const link = screen.getByRole('link')
    expect(link.className).toContain('text-[var(--color-primary)]')
  })

  it('renders icon with -ml-1.5 offset', () => {
    const { container } = render(
      <SidebarItem href="/dashboard" icon="dashboard" label="Dashboard" isExpanded={true} isActive={false} />
    )
    const icon = container.querySelector('.material-symbols-outlined')
    expect(icon?.className).toContain('-ml-1.5')
  })

  it('renders href correctly', () => {
    render(
      <SidebarItem href="/reminders" icon="notifications_active" label="Reminders" isExpanded={true} isActive={false} />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/reminders')
  })
})