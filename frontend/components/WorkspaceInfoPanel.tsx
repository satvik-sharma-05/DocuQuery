'use client'

import { motion } from 'framer-motion'
import { Building2, Users, FileText, Calendar, Crown } from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export default function WorkspaceInfoPanel() {
    const { currentWorkspace } = useWorkspace()

    if (!currentWorkspace) return null

    const infoItems = [
        {
            icon: Building2,
            label: 'Workspace',
            value: currentWorkspace.name,
            color: 'text-primary-600 bg-primary-100'
        },
        {
            icon: Crown,
            label: 'Owner',
            value: currentWorkspace.owner_name || 'Unknown',
            color: 'text-yellow-600 bg-yellow-100'
        },
        {
            icon: Users,
            label: 'Members',
            value: `${currentWorkspace.member_count || 0} members`,
            color: 'text-blue-600 bg-blue-100'
        },
        {
            icon: FileText,
            label: 'Documents',
            value: `${currentWorkspace.document_count || 0} documents`,
            color: 'text-green-600 bg-green-100'
        },
        {
            icon: Calendar,
            label: 'Created',
            value: new Date(currentWorkspace.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            color: 'text-purple-600 bg-purple-100'
        }
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mb-8"
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Workspace Information</h2>
                <div className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${currentWorkspace.role === 'owner'
                        ? 'bg-primary-100 text-primary-700'
                        : currentWorkspace.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                    {currentWorkspace.role}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {infoItems.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {item.label}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {item.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}