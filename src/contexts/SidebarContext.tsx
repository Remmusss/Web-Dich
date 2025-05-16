'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  isCollapsed: boolean
  toggle: () => void
  close: () => void
  setIsOpen: (isOpen: boolean) => void
  setIsCollapsed: (isCollapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Effect for mobile sidebar
  useEffect(() => {
    // Control body overflow when sidebar is open on mobile
    if (typeof window !== 'undefined') {
      if (isOpen && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Initialize mobile sidebar state
  useEffect(() => {
    // Get saved mobile sidebar state from localStorage if available
    const savedIsOpen = localStorage.getItem('sidebarOpen')
    if (savedIsOpen !== null) {
      setIsOpen(savedIsOpen === 'true')
    }
  }, [])

  // Save mobile sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isOpen))
  }, [isOpen])

  // Initialize desktop state
  useEffect(() => {
    // Get saved desktop collapsed state from localStorage if available
    const savedIsCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedIsCollapsed !== null) {
      setIsCollapsed(savedIsCollapsed === 'true')
    }
  }, [])

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isCollapsed))
  }, [isCollapsed])

  const toggle = () => setIsOpen(prev => !prev)
  const close = () => setIsOpen(false)

  return (
    <SidebarContext.Provider 
      value={{ 
        isOpen, 
        isCollapsed, 
        toggle, 
        close, 
        setIsOpen, 
        setIsCollapsed 
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
} 