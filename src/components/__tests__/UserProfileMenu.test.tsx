import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UserProfileMenu from '@/components/UserProfileMenu'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/components/LanguageProvider', () => ({
  useAppTranslation: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: vi.fn(),
  }),
}))

const mockUser = {
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.jpg',
  tagline: 'Productivity Master',
}

describe('UserProfileMenu', () => {
  it('renders user name when expanded', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('renders tagline when expanded', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    expect(screen.getByText('Productivity Master')).toBeInTheDocument()
  })

  it('shows fallback name when user is null', () => {
    render(<UserProfileMenu user={null} isExpanded={true} />)
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('shows fallback tagline when user has no tagline', () => {
    render(<UserProfileMenu user={{ name: 'A', email: 'a@b.com' }} isExpanded={true} />)
    expect(screen.getByText('Productivity Enthusiast')).toBeInTheDocument()
  })

  it('opens dropdown on button click', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('sidebar.settings')).toBeInTheDocument()
    expect(screen.getByText('sidebar.support')).toBeInTheDocument()
    expect(screen.getByText('sidebar.logout')).toBeInTheDocument()
  })

  it('closes dropdown on outside click', () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <UserProfileMenu user={mockUser} isExpanded={true} />
      </div>
    )
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes dropdown on Escape key', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes dropdown when clicking a menu link', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    const button = screen.getByRole('button')
    fireEvent.click(button)

    const settingsLink = screen.getByRole('menuitem', { name: /settings/i })
    fireEvent.click(settingsLink)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('renders user avatar image', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    const img = screen.getByAltText('User Profile')
    expect(img).toHaveAttribute('src', mockUser.image)
  })

  it('uses fallback avatar when no image', () => {
    const userNoImage = { name: 'No Image', email: 'noimg@test.com' }
    render(<UserProfileMenu user={userNoImage} isExpanded={true} />)
    const img = screen.getByAltText('User Profile')
    expect(img.getAttribute('src')).toContain('ui-avatars.com')
  })

  it('has correct aria attributes on button', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-haspopup', 'menu')
    expect(button).toHaveAttribute('aria-controls', 'profile-menu')
  })

  it('dropdown has menu role and id', () => {
    render(<UserProfileMenu user={mockUser} isExpanded={true} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toHaveAttribute('id', 'profile-menu')
  })
})