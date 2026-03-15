'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bell,
    ChevronDown,
    LogOut,
    Settings,
    User,
    Menu,
    Plus,
    Building2,
    Mail
} from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import CreateWorkspaceModal from './CreateWorkspaceModal'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Invitation {
    id: string
    workspace_name: string
    invited_by_name: string
    role: string
    created_at: string
}

interface ResponsiveHeaderProps {
    onMobileMenuToggle: () => void
    isSidebarCollapsed: boolean
}

export default function ResponsiveHeader({
    onMobileMenuToggle,
    isSidebarCollapsed
}: ResponsiveHeaderProps) {
    const { workspaces, currentWorkspace, switchWorkspace, refreshWorkspaces } = useWorkspace()
    const { user, logout } = useAuth() // Use actual user from AuthContext
    const router = useRouter()
    const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const workspaceDropdownRef = useRef<HTMLDivElement>(null)
    const userDropdownRef = useRef<HTMLDivElement>(null)
    const notificationDropdownRef = useRef<HTMLDivElement>(null)

    // Check mobile state
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Fetch invitations
    useEffect(() => {
        fetchInvitations()
        // Poll for new invitations every 30 seconds
        const interval = setInterval(fetchInvitations, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchInvitations = async () => {
        try {
            const response = await api.get('/api/invitations/')
            setInvitations(response.data)
        } catch (error) {
            console.error('Failed to fetch invitations:', error)
        }
    }

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
                setIsWorkspaceDropdownOpen(false)
            }
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false)
            }
            if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
            toast.success('Logged out successfully')
        } catch (error) {
            toast.error('Failed to logout')
        }
    }

    const handleWorkspaceSwitch = async (workspaceId: string) => {
        try {
            await switchWorkspace(workspaceId)
            setIsWorkspaceDropdownOpen(false)
            toast.success('Workspace switched')
        } catch (error) {
            toast.error('Failed to switch workspace')
        }
    }

    const handleCreateWorkspace = () => {
        setIsCreateModalOpen(true)
        setIsWorkspaceDropdownOpen(false)
    }

    const handleProfileClick = () => {
        router.push('/dashboard/profile')
        setIsUserDropdownOpen(false)
    }

    const handleSettingsClick = () => {
        router.push('/dashboard/settings')
        setIsUserDropdownOpen(false)
    }

    const handleWorkspaceCreated = () => {
        refreshWorkspaces()
        setIsCreateModalOpen(false)
    }

    return (
        <>
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`
                    fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30 transition-all duration-300
                    ${!isMobile ? (isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64') : 'left-0'}
                `}
            >
                <div className="flex items-center justify-between h-full px-4 lg:px-6">
                    {/* Mobile Menu Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onMobileMenuToggle}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </motion.button>

                    {/* Page Title - Hidden on mobile when sidebar is present */}
                    <div className="hidden lg:block">
                        <h1 className="text-lg font-semibold text-gray-900">
                            {currentWorkspace?.name || 'DocuQuery'}
                        </h1>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-4">
                        {/* Workspace Selector */}
                        <div className="relative" ref={workspaceDropdownRef}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200"
                            >
                                <Building2 className="w-4 h-4 text-gray-500" />
                                <span className="hidden sm:inline max-w-32 truncate">
                                    {currentWorkspace?.name || 'Select Workspace'}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isWorkspaceDropdownOpen ? 'rotate-180' : ''
                                    }`} />
                            </motion.button>

                            <AnimatePresence>
                                {isWorkspaceDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                                    >
                                        <div className="p-2">
                                            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                Your Workspaces
                                            </div>
                                            <div className="space-y-1">
                                                {workspaces.map((workspace) => (
                                                    <motion.button
                                                        key={workspace.id}
                                                        whileHover={{ x: 4 }}
                                                        onClick={() => handleWorkspaceSwitch(workspace.id)}
                                                        className={`
                                                            w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors text-left
                                                            ${currentWorkspace?.id === workspace.id
                                                                ? 'bg-primary-100 text-primary-700'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                            }
                                                        `}
                                                    >
                                                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <span className="text-primary-700 font-semibold text-xs">
                                                                {workspace.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{workspace.name}</p>
                                                            <p className="text-xs text-gray-500 capitalize">{workspace.role}</p>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-200 mt-2 pt-2">
                                                <motion.button
                                                    whileHover={{ x: 4 }}
                                                    onClick={handleCreateWorkspace}
                                                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 text-gray-500" />
                                                    <span>Create Workspace</span>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications */}
                        <div className="relative" ref={notificationDropdownRef}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {invitations.length > 0 && (
                                    <span className="absolute top-1 right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                                        {invitations.length}
                                    </span>
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {isNotificationDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                                {invitations.length > 0 && (
                                                    <span className="text-xs text-gray-500">{invitations.length} new</span>
                                                )}
                                            </div>

                                            {invitations.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500">No new notifications</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                                    {invitations.map((invitation) => (
                                                        <motion.div
                                                            key={invitation.id}
                                                            whileHover={{ x: 4 }}
                                                            onClick={() => {
                                                                router.push('/dashboard/invitations')
                                                                setIsNotificationDropdownOpen(false)
                                                            }}
                                                            className="p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <Mail className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        Workspace Invitation
                                                                    </p>
                                                                    <p className="text-xs text-gray-600 mt-1">
                                                                        {invitation.invited_by_name} invited you to join <span className="font-medium">{invitation.workspace_name}</span> as {invitation.role}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        {new Date(invitation.created_at).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        onClick={() => {
                                                            router.push('/dashboard/invitations')
                                                            setIsNotificationDropdownOpen(false)
                                                        }}
                                                        className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                                    >
                                                        View all invitations →
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={userDropdownRef}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                        {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 hidden sm:block ${isUserDropdownOpen ? 'rotate-180' : ''
                                    }`} />
                            </motion.button>

                            <AnimatePresence>
                                {isUserDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                                    >
                                        <div className="p-2">
                                            <div className="px-3 py-2 border-b border-gray-200 mb-2">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {user?.full_name || 'User'}
                                                </p>
                                                <p className="text-xs text-gray-500">{user?.email}</p>
                                            </div>

                                            <motion.button
                                                whileHover={{ x: 4 }}
                                                onClick={handleProfileClick}
                                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span>Profile</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ x: 4 }}
                                                onClick={handleSettingsClick}
                                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Settings className="w-4 h-4 text-gray-500" />
                                                <span>Settings</span>
                                            </motion.button>

                                            <div className="border-t border-gray-200 mt-2 pt-2">
                                                <motion.button
                                                    whileHover={{ x: 4 }}
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4 text-red-500" />
                                                    <span>Sign Out</span>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Create Workspace Modal */}
            <CreateWorkspaceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleWorkspaceCreated}
            />
        </>
    )
}