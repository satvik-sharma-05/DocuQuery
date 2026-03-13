'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2 } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import LoadingSpinner from './LoadingSpinner'

interface CreateWorkspaceModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function CreateWorkspaceModal({ isOpen, onClose, onSuccess }: CreateWorkspaceModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [creating, setCreating] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Name required', {
                description: 'Please enter a workspace name'
            })
            return
        }

        setCreating(true)

        try {
            await api.post('/api/workspaces', {
                name: name.trim(),
                description: description.trim() || null
            })

            toast.success('Workspace created!', {
                description: `${name.trim()} is ready to use`
            })
            setName('')
            setDescription('')
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error('Create workspace error:', error)
            toast.error('Failed to create workspace', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setCreating(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                            onClick={onClose}
                        />

                        {/* Modal panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                        >
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <motion.div
                                            whileHover={{ rotate: 5 }}
                                            className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
                                        >
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        </motion.div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Create New Workspace
                                        </h3>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Workspace Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Marketing Team"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={creating}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="What is this workspace for?"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={creating}
                                        />
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={creating || !name.trim()}
                                            className="flex-1 btn-primary"
                                        >
                                            {creating ? (
                                                <div className="flex items-center justify-center">
                                                    <LoadingSpinner size="sm" />
                                                    <span className="ml-2">Creating...</span>
                                                </div>
                                            ) : (
                                                'Create Workspace'
                                            )}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={onClose}
                                            disabled={creating}
                                            className="flex-1 btn-secondary"
                                        >
                                            Cancel
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}
