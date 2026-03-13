'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Invitation } from '@/types'
import { Mail, Check, X, Clock, AlertCircle } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from 'sonner'

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

export default function InvitationsPage() {
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        fetchInvitations()
    }, [])

    const fetchInvitations = async () => {
        try {
            const response = await api.get('/api/invitations/pending')
            setInvitations(response.data)
        } catch (error) {
            console.error('Failed to fetch invitations:', error)
            toast.error('Failed to load invitations', {
                description: 'Please try refreshing the page'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async (invitationId: string, workspaceName: string) => {
        setProcessing(invitationId)
        try {
            await api.post(`/api/invitations/${invitationId}/accept`)
            toast.success('Invitation accepted!', {
                description: `Welcome to ${workspaceName}`
            })
            // Remove from list
            setInvitations(invitations.filter(inv => inv.id !== invitationId))
            // Reload page to refresh workspaces
            setTimeout(() => window.location.href = '/dashboard', 1000)
        } catch (error: any) {
            console.error('Accept error:', error)
            toast.error('Failed to accept invitation', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async (invitationId: string) => {
        setProcessing(invitationId)
        try {
            await api.post(`/api/invitations/${invitationId}/reject`)
            toast.success('Invitation rejected')
            setInvitations(invitations.filter(inv => inv.id !== invitationId))
        } catch (error: any) {
            console.error('Reject error:', error)
            toast.error('Failed to reject invitation', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
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
                    <h1 className="text-3xl font-bold text-gray-900">Workspace Invitations</h1>
                    <p className="text-gray-600 mt-2">Manage your pending workspace invitations</p>
                </motion.div>

                {invitations.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="card text-center py-12"
                    >
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
                        <p className="text-gray-500">You don't have any workspace invitations at the moment</p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4"
                    >
                        <AnimatePresence>
                            {invitations.map((invitation) => (
                                <motion.div
                                    key={invitation.id}
                                    variants={item}
                                    layout
                                    exit={{ opacity: 0, x: -100 }}
                                    whileHover={{ scale: 1.01 }}
                                    className="card hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <motion.div
                                                    whileHover={{ rotate: 5 }}
                                                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center"
                                                >
                                                    <Mail className="w-6 h-6 text-white" />
                                                </motion.div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {invitation.workspace_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        Invited by {invitation.inviter_name}
                                                    </p>
                                                </div>
                                            </div>

                                            {invitation.message && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="bg-gray-50 rounded-lg p-3 mb-3"
                                                >
                                                    <p className="text-sm text-gray-700 italic">
                                                        "{invitation.message}"
                                                    </p>
                                                </motion.div>
                                            )}

                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <AlertCircle className="w-4 h-4 mr-1" />
                                                    Role: <span className="font-medium ml-1 capitalize">{invitation.role}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex space-x-2 ml-6">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleAccept(invitation.id, invitation.workspace_name)}
                                                disabled={processing === invitation.id}
                                                className="btn-primary flex items-center"
                                            >
                                                {processing === invitation.id ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Accept
                                                    </>
                                                )}
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleReject(invitation.id)}
                                                disabled={processing === invitation.id}
                                                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Reject
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
