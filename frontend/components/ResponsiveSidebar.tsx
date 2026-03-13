'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    BarChart3,
    Users,
    Mail,
    ChevronLeft,
    ChevronRight,
    Menu,
    X
} from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'

interface SidebarProps {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
    isMobileOpen: boolean
    setIsMobileOpen: (open: boolean) => void
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Team', href: '/dashboard/workspace', icon: Users },
    { name: 'Invitations', href: '/dashboard/invitations', icon: Mail },
]

export default function ResponsiveSidebar({
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    setIsMobileOpen
}: SidebarProps) {
    const pathname = usePathname()
    const { currentWorkspace } = useWorkspace()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const sidebarVariants = {
        expanded: { width: 256 },
        collapsed: { width: 64 }
    }

    const mobileSidebarVariants = {
        open: { x: 0 },
        closed: { x: -256 }
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <AnimatePresence mode="wait">
                    {(!isCollapsed || isMobile) && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">DQ</span>
                            </div>
                            <span className="font-semibold text-gray-900">DocuQuery</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop Toggle */}
                {!isMobile && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        ) : (
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        )}
                    </motion.button>
                )}

                {/* Mobile Close */}
                {isMobile && (
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </motion.button>
                )}
            </div>

            {/* Workspace Info */}
            {currentWorkspace && (!isCollapsed || isMobile) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border-b border-gray-200 bg-primary-50"
                >
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <span className="text-primary-700 font-semibold text-sm">
                                {currentWorkspace.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {currentWorkspace.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                                {currentWorkspace.role}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item, index) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link
                                href={item.href}
                                onClick={() => isMobile && setIsMobileOpen(false)}
                                className={`
                                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                                        : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                                    }
                                `}
                                title={isCollapsed && !isMobile ? item.name : undefined}
                            >
                                <Icon className={`
                                    w-5 h-5 transition-colors duration-200
                                    ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-primary-600'}
                                `} />
                                <AnimatePresence>
                                    {(!isCollapsed || isMobile) && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="ml-3"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </motion.div>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
                <AnimatePresence>
                    {(!isCollapsed || isMobile) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-xs text-gray-500 text-center"
                        >
                            DocuQuery v1.0
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                variants={sidebarVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                className="hidden lg:block fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40"
            >
                <SidebarContent />
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar */}
            <motion.aside
                variants={mobileSidebarVariants}
                animate={isMobileOpen ? 'open' : 'closed'}
                className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50"
            >
                <SidebarContent />
            </motion.aside>
        </>
    )
}