export interface NavbarProps {
  title: string
  collapsed: boolean
  onToggle: () => void
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  end?: boolean
  show: boolean
}

export interface RBACLayoutProps {
  permission?: string
  adminOnly?: boolean
}
