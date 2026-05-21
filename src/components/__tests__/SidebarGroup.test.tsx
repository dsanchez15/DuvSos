import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SidebarGroup from '@/components/SidebarGroup'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

const items = [
  { href: '/goals', icon: 'flag', label: 'Goals' },
  { href: '/progress', icon: 'trending_up', label: 'Progress' },
]

describe('SidebarGroup', () => {
  it('renders group label when expanded', () => {
    render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={false}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    expect(screen.getByText('Plan')).toBeInTheDocument()
  })

  it('hides label text when collapsed', () => {
    const { container } = render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={false}
        groupExpanded={false}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    const textSpan = container.querySelector('.opacity-0.w-0')
    expect(textSpan).toBeInTheDocument()
  })

  it('calls onToggle when button is clicked', () => {
    const onToggle = vi.fn()
    render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={false}
        onToggle={onToggle}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('shows chevron icon when expanded', () => {
    render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={false}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    expect(screen.getByText('chevron_right')).toBeInTheDocument()
  })

  it('does not show chevron when collapsed', () => {
    render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={false}
        groupExpanded={false}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    expect(screen.queryByText('chevron_right')).not.toBeInTheDocument()
  })

  it('renders sub-items when group is expanded', () => {
    render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={true}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('renders sub-items when group is collapsed (icon-only mode)', () => {
    render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={false}
        groupExpanded={false}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('shows tree line when expanded and group is open', () => {
    const { container } = render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={true}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    const treeLine = container.querySelector('.w-\\[2px\\]')
    expect(treeLine).toBeInTheDocument()
  })

  it('does not show tree line when collapsed', () => {
    const { container } = render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={false}
        groupExpanded={true}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    const treeLines = container.querySelectorAll('.w-\\[2px\\]')
    expect(treeLines.length).toBe(0)
  })

  it('applies active class when isActive is true', () => {
    render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={false}
        onToggle={() => {}}
        isActive={true}
        pathname="/dashboard"
        items={items}
      />
    )
    const button = screen.getByRole('button')
    expect(button.className).toContain('active')
  })

  it('uses CSS Grid for expand/collapse animation', () => {
    const { container } = render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={true}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    const gridContainer = container.querySelector('.grid')
    expect(gridContainer).toBeInTheDocument()
  })

  it('sets paddingRight to 22px on sub-items when expanded', () => {
    const { container } = render(
      <SidebarGroup
        icon="track_changes"
        label="Plan"
        isExpanded={true}
        groupExpanded={true}
        onToggle={() => {}}
        isActive={false}
        pathname="/dashboard"
        items={items}
      />
    )
    const subItemContainer = container.querySelector('[style*="22px"]')
    expect(subItemContainer).toBeInTheDocument()
  })
})