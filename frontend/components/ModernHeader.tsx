'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/contexts/AuthContext'
import {
    Building2,
    ChevronDown,
    LogOut,
    User as UserIcon,
    Plus,
    Bell,
    Check
} from 'lucide-react'
import { toast } from 'sonner'
import CreateWorkspaceModal from './CreateWorkspaceModal'

interface ModernHeaderProps {
    user: {
        id: string
        email: string
        full_name?: string
    }
}

export default function ModernHeader({ user }: ModernHeaderProps) {
    const { workspaces, currentWorkspace, switchWorkspace, refreshWorkspaces } = useWorkspace()
    const { logout } = useAuth()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const handleLogout = async () => {
        try {
            setShowUserMenu(false)
            await logout()
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Failed to sign out')
        }
    }

    return (
        <>
            <header className="fixed top-0 right-0 left-0 md:left-[280px] h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-30">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Workspace Selector */}
                    {currentWorkspace && (
                        <div className="relative">
                            <button
                                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">
                                        {currentWorkspace.name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{currentWorkspace.role}</p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </button>

                            <AnimatePresence>
                                {showWorkspaceMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowWorkspaceMenu(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20"
                                        >
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Your Workspaces
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {workspaces.map((workspace) => (
                                                    <button
                                                        key={workspace.id}
                                                        onClick={() => {
                                                            switchWorkspace(workspace.id)
                                                            setShowWorkspaceMenu(false)
                                                        }}
                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                                <Building2 className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium text-gray-900">{workspace.name}</p>
                                                                <p className="text-xs text-gray-500 capitalize">{workspace.role}</p>
                                                            </div>
                                                        </div>
                                                        {workspace.id === currentWorkspace.id && (
                                                            <Check className="w-4 h-4 text-blue-600" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-200 mt-2 pt-2">
                                                <button
                                                    onClick={() => {
                                                        setShowWorkspaceMenu(false)
                                                        setShowCreateModal(true)
                                                    }}
                                                    className="w-full flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Create Workspace</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Right Side */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate hidden md:block">
                                    {user.full_name || user.email}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            <AnimatePresence>
                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowUserMenu(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20"
                                        >
                                            <div className="px-4 py-3 border-b border-gray-200">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user.full_name || 'User'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span className="text-sm font-medium">Sign out</span>
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </header>

            {/* Create Workspace Modal */}
            <CreateWorkspaceModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    refreshWorkspaces()
                    toast.success('Workspace created successfully!')
                    setTimeout(() => window.location.reload(), 1000)
                }}
            />
        </>
    )
}
