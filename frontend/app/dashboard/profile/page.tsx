'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Calendar, Building2, Save, Edit2, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function ProfilePage() {
    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        email: ''
    })

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || ''
            })
        }
    }, [user])

    const handleSave = async () => {
        if (!formData.full_name.trim()) {
            toast.error('Name is required')
            return
        }

        setLoading(true)
        try {
            const response = await api.put('/api/auth/profile', {
                full_name: formData.full_name.trim()
            })

            // Update the user context with new data
            if (response.data) {
                // Force a refresh of user data by calling the auth endpoint
                const userResponse = await api.get('/api/auth/me')
                // The AuthContext should automatically update via the auth state change
            }

            toast.success('Profile updated successfully')
            setIsEditing(false)
        } catch (error: any) {
            toast.error('Failed to update profile', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || ''
            })
        }
        setIsEditing(false)
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        )
    }
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-2">Manage your account information</p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card max-w-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                    {!isEditing ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditing(true)}
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                        </motion.button>
                    ) : (
                        <div className="flex space-x-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSave}
                                disabled={loading}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>{loading ? 'Saving...' : 'Save'}</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancel}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                            </motion.button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">
                                {user.full_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                            <p className="text-gray-500">Member since {new Date(user.created_at || '').toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            {isEditing ? (
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-900">{user.full_name || 'Not set'}</span>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">{user.email}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>

                        {/* Current Workspace */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Workspace
                            </label>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">{currentWorkspace?.name || 'No workspace'}</span>
                            </div>
                        </div>

                        {/* Join Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Member Since
                            </label>
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-900">
                                    {new Date(user.created_at || '').toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}