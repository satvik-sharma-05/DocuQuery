'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import CreateWorkspaceModal from './CreateWorkspaceModal'
import {
    LogOut,
    User as UserIcon,
    ChevronDown,
    LayoutDashboard,
    FileText,
    MessageSquare,
    Building2,
    Mail,
    Bell,
    Plus,
    Users
} from 'lucide-react'
import toast from 'react-hot-toast'

interface HeaderProps {
    user: {
        id: string
        email: string
        full_name?: string
    }
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Team', href: '/dashboard/workspace', icon: Users },
    { name: 'Invitations', href: '/dashboard/invitations', icon: Mail },
]

export default function Header({ user }: HeaderProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { workspaces, currentWorkspace, switchWorkspace, refreshWorkspaces } = useWorkspace()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            localStorage.removeItem('currentWorkspaceId')
            toast.success('Logged out successfully')
            router.push('/')
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Logout failed')
        }
    }

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left: Logo and Navigation */}
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">D</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">DocuQuery</span>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex space-x-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }
                    `}
                                    >
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Right: Workspace Selector and User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Workspace Selector - Always show if workspace exists */}
                        {currentWorkspace && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="max-w-[150px] truncate">{currentWorkspace.name}</span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {showWorkspaceMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowWorkspaceMenu(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                                                Your Workspaces
                                            </div>
                                            {workspaces.map((workspace) => (
                                                <button
                                                    key={workspace.id}
                                                    onClick={() => {
                                                        switchWorkspace(workspace.id)
                                                        setShowWorkspaceMenu(false)
                                                    }}
                                                    className={`
                            flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors
                            ${workspace.id === currentWorkspace.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                          `}
                                                >
                                                    <Building2 className="w-4 h-4 mr-3" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{workspace.name}</div>
                                                        <div className="text-xs text-gray-500 capitalize">{workspace.role}</div>
                                                    </div>
                                                    {workspace.id === currentWorkspace.id && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                                    )}
                                                </button>
                                            ))}
                                            <div className="border-t">
                                                <button
                                                    onClick={() => {
                                                        setShowWorkspaceMenu(false)
                                                        setShowCreateModal(true)
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 mr-3" />
                                                    Create New Workspace
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-white" />
                                </div>
                                <span className="hidden md:block max-w-[120px] truncate">
                                    {user.full_name || user.email}
                                </span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                        <div className="px-4 py-3 border-b">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {user.full_name || 'User'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Workspace Modal */}
            <CreateWorkspaceModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    refreshWorkspaces()
                    toast.success('Workspace created! Refreshing...')
                    setTimeout(() => window.location.reload(), 1000)
                }}
            />
        </header>
    )
}
