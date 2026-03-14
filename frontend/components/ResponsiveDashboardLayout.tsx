'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Toaster } from 'sonner'
import ResponsiveSidebar from './ResponsiveSidebar'
import ResponsiveHeader from './ResponsiveHeader'

interface ResponsiveDashboardLayoutProps {
    children: React.ReactNode
}

export default function ResponsiveDashboardLayout({ children }: ResponsiveDashboardLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const pathname = usePathname()

    // Check if current page is chat
    const isChatPage = pathname === '/dashboard/chat'

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024
            setIsMobile(mobile)

            // Auto-collapse sidebar on smaller desktop screens
            if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
                setIsSidebarCollapsed(true)
            }
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Close mobile sidebar when route changes
    useEffect(() => {
        setIsMobileSidebarOpen(false)
    }, [pathname])

    const handleMobileMenuToggle = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <ResponsiveSidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                setIsMobileOpen={setIsMobileSidebarOpen}
            />

            {/* Header */}
            <ResponsiveHeader
                onMobileMenuToggle={handleMobileMenuToggle}
                isSidebarCollapsed={isSidebarCollapsed}
            />

            {/* Main Content */}
            <motion.main
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`
                    pt-16 min-h-screen transition-all duration-300 ease-in-out
                    ${!isMobile ? (isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''}
                `}
            >
                {isChatPage ? (
                    // Chat page gets full height without container padding
                    <div className="h-[calc(100vh-4rem)]">
                        {children}
                    </div>
                ) : (
                    // Other pages get normal container padding
                    <div className="container-responsive py-6">
                        {children}
                    </div>
                )}
            </motion.main>

            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    },
                    className: 'font-medium',
                }}
                icons={{
                    success: '✅',
                    error: '❌',
                    warning: '⚠️',
                    info: 'ℹ️',
                }}
            />
        </div>
    )
}