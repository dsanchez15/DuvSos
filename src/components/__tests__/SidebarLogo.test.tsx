import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SidebarLogo from '@/components/SidebarLogo'

describe('SidebarLogo', () => {
  it('renders brand text when expanded', () => {
    render(<SidebarLogo isExpanded={true} />)
    expect(screen.getByText('Aure')).toBeInTheDocument()
  })

  it('hides brand text when collapsed', () => {
    const { container } = render(<SidebarLogo isExpanded={false} />)
    const textSpan = container.querySelector('.opacity-0.w-0')
    expect(textSpan).toBeInTheDocument()
  })

  it('renders the hexagon SVG logo', () => {
    const { container } = render(<SidebarLogo isExpanded={true} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg?.querySelector('path')).toBeTruthy()
  })

  it('logo container has decorative bg style', () => {
    const { container } = render(<SidebarLogo isExpanded={true} />)
    const logoBox = container.querySelector('[style*="--deco-logo-bg"]')
      || container.querySelector('[style*="var(--deco-logo-bg)"]')
    expect(logoBox).toBeTruthy()
  })

  it('logo container has rounded corners', () => {
    const { container } = render(<SidebarLogo isExpanded={true} />)
    const logoBox = container.querySelector('.rounded-\\[8px\\]')
    expect(logoBox).toBeInTheDocument()
  })

  it('has correct dimensions for logo box', () => {
    const { container } = render(<SidebarLogo isExpanded={true} />)
    const logoBox = container.querySelector('.w-10.h-10')
    expect(logoBox).toBeInTheDocument()
  })

  it('has px-6 and mb-10 spacing', () => {
    const { container } = render(<SidebarLogo isExpanded={true} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper?.className).toContain('px-6')
    expect(wrapper?.className).toContain('mb-10')
  })
})