import type { ReactNode } from 'react'

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
  icon: ReactNode
  end?: boolean
  show: boolean
  children?: NavSubItem[]
}

export type NavSubItem = {
  to: string
  label: string
  icon: ReactNode
}

export interface LoadingStateProps {
  message?: string
  shell?: boolean
}
