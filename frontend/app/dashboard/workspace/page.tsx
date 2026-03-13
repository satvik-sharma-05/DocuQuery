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
        <div className="container-responsive py-6">
            <div className="space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
                    {currentWorkspace && (
                        <div className="mt-4 flex items-center space-x-3">
                            {editingName ? (
                                <>
                                    <input
                                        type="text"
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        disabled={savingName}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSaveWorkspaceName}
                                        disabled={savingName}
                                        className="btn-primary text-sm"
                                    >
                                        {savingName ? 'Saving...' : 'Save'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setEditingName(false)
                                            setWorkspaceName(currentWorkspace.name)
                                        }}
                                        disabled={savingName}
                                        className="btn-secondary text-sm"
                                    >
                                        Cancel
                                    </motion.button>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-600">{currentWorkspace.name}</p>
                                    {currentWorkspace.role === 'owner' && (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => setEditingName(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700"
                                        >
                                            Edit
                                        </motion.button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Invite Member */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="card"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
                    </div>

                    <form onSubmit={handleInvite} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={inviting}
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={inviting || !inviteEmail.trim()}
                            className="btn-primary"
                        >
                            {inviting ? (
                                <div className="flex items-center">
                                    <LoadingSpinner size="sm" />
                                    <span className="ml-2">Sending...</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
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
                    className="card"
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Team Members ({members.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : members.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No members yet</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="space-y-3"
                        >
                            <AnimatePresence>
                                {members.map((member) => (
                                    <motion.div
                                        key={member.id}
                                        variants={item}
                                        layout
                                        whileHover={{ scale: 1.01, x: 4 }}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {member.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{member.full_name}</div>
                                                <div className="text-sm text-gray-500">{member.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full capitalize">
                                                {member.role}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Joined {new Date(member.joined_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
