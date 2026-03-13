'use client'

import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Building2, Users, Calendar, Crown } from 'lucide-react'

export default function WorkspaceInfo() {
    const { currentWorkspace } = useWorkspace()

    if (!currentWorkspace) {
        return null
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{currentWorkspace.name}</h2>
                            {currentWorkspace.description && (
                                <p className="text-sm text-gray-600 mt-1">{currentWorkspace.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Owner Info */}
                        <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                            <Crown className="w-5 h-5 text-yellow-500" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Owner</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {currentWorkspace.owner_name || currentWorkspace.owner_email || 'Unknown'}
                                </p>
                            </div>
                        </div>

                        {/* Members Count */}
                        <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                            <Users className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Members</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {currentWorkspace.member_count} {currentWorkspace.member_count === 1 ? 'member' : 'members'}
                                </p>
                            </div>
                        </div>

                        {/* Created Date */}
                        <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-gray-200">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(currentWorkspace.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Role Badge */}
                <div className="ml-4">
                    <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                        ${currentWorkspace.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                            currentWorkspace.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                'bg-blue-100 text-blue-800'}
                    `}>
                        {currentWorkspace.role.charAt(0).toUpperCase() + currentWorkspace.role.slice(1)}
                    </span>
                </div>
            </div>
        </div>
    )
}
