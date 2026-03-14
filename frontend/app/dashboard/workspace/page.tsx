'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Users, Mail, UserPlus, Trash2 } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from 'sonner'

interface Member {
    id: string
    user_id: string
    email: string
    full_name: string
    role: string
    joined_at: string
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function WorkspacePage() {
    const { currentWorkspace, refreshWorkspaces, loading: workspaceLoading } = useWorkspace()
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('member')
    const [inviteMessage, setInviteMessage] = useState('')
    const [inviting, setInviting] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [workspaceName, setWorkspaceName] = useState('')
    const [savingName, setSavingName] = useState(false)

    useEffect(() => {
        if (currentWorkspace) {
            setWorkspaceName(currentWorkspace.name)
            fetchMembers()
        }
    }, [currentWorkspace])

    const fetchMembers = async () => {
        if (!currentWorkspace) return

        try {
            const response = await api.get(`/api/workspaces/${currentWorkspace.id}/members`)
            setMembers(response.data)
        } catch (error) {
            console.error('Failed to fetch members:', error)
            toast.error('Failed to load members', {
                description: 'Please try refreshing the page'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!inviteEmail.trim()) {
            toast.error('Email required', {
                description: 'Please enter an email address'
            })
            return
        }

        setInviting(true)

        try {
            await api.post('/api/invitations/send', {
                email: inviteEmail.trim(),
                role: inviteRole,
                message: inviteMessage.trim() || null
            })

            toast.success('Invitation sent!', {
                description: `Sent to ${inviteEmail.trim()}`
            })
            setInviteEmail('')
            setInviteMessage('')
            setInviteRole('member')
        } catch (error: any) {
            console.error('Invite error:', error)
            toast.error('Failed to send invitation', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setInviting(false)
        }
    }

    const handleSaveWorkspaceName = async () => {
        if (!currentWorkspace || !workspaceName.trim()) {
            toast.error('Name required', {
                description: 'Please enter a workspace name'
            })
            return
        }

        if (workspaceName === currentWorkspace.name) {
            setEditingName(false)
            return
        }

        setSavingName(true)

        try {
            await api.put(`/api/workspaces/${currentWorkspace.id}`, {
                name: workspaceName.trim()
            })

            toast.success('Workspace updated!', {
                description: 'Name changed successfully'
            })
            setEditingName(false)
            refreshWorkspaces()
        } catch (error: any) {
            console.error('Update error:', error)
            toast.error('Failed to update workspace', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setSavingName(false)
        }
    }

    // Show loading while workspace context is loading
    if (workspaceLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    // Show message if no workspace exists
    if (!currentWorkspace) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-center items-center h-64 space-y-4"
            >
                <p className="text-gray-600 text-lg">No workspace selected</p>
                <p className="text-gray-500 text-sm">Please select a workspace from the header or create a new one</p>
            </motion.div>
        )
    }

    return (
        <div className="space-y-mobile">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center sm:text-left"
            >
                <h1 className="heading-responsive">Workspace Settings</h1>
                {currentWorkspace && (
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        {editingName ? (
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                <input
                                    type="text"
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="input-mobile focus-ring-enhanced"
                                    disabled={savingName}
                                />
                                <div className="flex space-x-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSaveWorkspaceName}
                                        disabled={savingName}
                                        className="btn-primary btn-mobile flex-1 sm:flex-none"
                                    >
                                        {savingName ? (
                                            <div className="flex items-center justify-center">
                                                <div className="spinner-sm mr-2"></div>
                                                Saving...
                                            </div>
                                        ) : (
                                            'Save'
                                        )}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setEditingName(false)
                                            setWorkspaceName(currentWorkspace.name)
                                        }}
                                        disabled={savingName}
                                        className="btn-secondary btn-mobile flex-1 sm:flex-none"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                <p className="subheading-responsive">{currentWorkspace.name}</p>
                                {currentWorkspace.role === 'owner' && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => setEditingName(true)}
                                        className="text-sm text-blue-600 hover:text-blue-700 self-start sm:self-auto"
                                    >
                                        Edit
                                    </motion.button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Invite Member */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card-responsive"
            >
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invite Team Member</h2>
                </div>

                <form onSubmit={handleInvite} className="form-mobile">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="input-mobile focus-ring-enhanced"
                            disabled={inviting}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role
                        </label>
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="input-mobile focus-ring-enhanced"
                            disabled={inviting}
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message (Optional)
                        </label>
                        <textarea
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            placeholder="Add a personal message..."
                            rows={3}
                            className="input-mobile focus-ring-enhanced resize-none"
                            disabled={inviting}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={inviting || !inviteEmail.trim()}
                        className="btn-primary w-full sm:w-auto hover-lift"
                    >
                        {inviting ? (
                            <div className="flex items-center justify-center">
                                <div className="spinner-sm mr-2"></div>
                                Sending...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center">
                                <Mail className="w-4 h-4 mr-2" />
                                Send Invitation
                            </div>
                        )}
                    </motion.button>
                </form>
            </motion.div>

            {/* Team Members */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card-responsive"
            >
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Team Members ({members.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner size="lg" message="Loading team members..." />
                    </div>
                ) : members.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 sm:py-12"
                    >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
                        <p className="text-sm sm:text-base text-gray-500">Invite your first team member to get started</p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-3 sm:space-y-4"
                    >
                        <AnimatePresence>
                            {members.map((member) => (
                                <motion.div
                                    key={member.id}
                                    variants={item}
                                    layout
                                    whileHover={{ scale: 1.01, x: 4 }}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all space-y-3 sm:space-y-0"
                                >
                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-medium text-sm sm:text-base">
                                                {member.full_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{member.full_name}</div>
                                            <div className="text-xs sm:text-sm text-gray-500 truncate">{member.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-right">
                                        <span className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full capitalize self-start sm:self-auto">
                                            {member.role}
                                        </span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
