'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Analytics } from '@/types'
import { FileText, MessageSquare, Users, Upload, TrendingUp } from 'lucide-react'
import WorkspaceInfoPanel from '@/components/WorkspaceInfoPanel'
import { StatCardSkeleton, WorkspaceInfoSkeleton } from '@/components/SkeletonLoader'
import { toast } from 'sonner'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingTooLong, setLoadingTooLong] = useState(false)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true)
                setLoadingTooLong(false)

                const response = await api.get('/api/analytics/dashboard')
                setAnalytics(response.data)
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
                toast.error('Failed to load dashboard data', {
                    description: 'Please try refreshing the page'
                })
            } finally {
                setLoading(false)
                setLoadingTooLong(false)
            }
        }

        fetchAnalytics()
    }, [])

    return (
        <div className="space-y-mobile">
            {/* Workspace Info */}
            {loading ? (
                <div>
                    <WorkspaceInfoSkeleton />
                    {loadingTooLong && (
                        <div className="loading-message-persistent">
                            ⏳ Loading is taking longer than expected. Sign in again if loading persists or if you face any other problem.
                        </div>
                    )}
                </div>
            ) : (
                <WorkspaceInfoPanel />
            )}

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center sm:text-left"
            >
                <h1 className="heading-responsive">Dashboard</h1>
                <p className="subheading-responsive mt-2">Welcome back! Here's what's happening with your workspace.</p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="responsive-grid-1-2-3"
            >
                {loading ? (
                    <>
                        <div>
                            <StatCardSkeleton />
                            <div className="loading-message">Loading dashboard data...</div>
                        </div>
                        <div>
                            <StatCardSkeleton />
                            <div className="loading-message">Loading analytics...</div>
                        </div>
                        <div>
                            <StatCardSkeleton />
                            <div className="loading-message">Loading team info...</div>
                        </div>
                    </>
                ) : (
                    <>
                        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="card-responsive group cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{analytics?.total_documents || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Across your workspace</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="card-responsive group cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-600">Total Queries</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{analytics?.total_queries || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Questions asked</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={item} whileHover={{ scale: 1.02 }} className="card-responsive group cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-600">Team Members</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{analytics?.team_members || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Active collaborators</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card-responsive"
            >
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Quick Actions</h2>
                <div className="responsive-grid-1-2-4">
                    <Link href="/dashboard/documents">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 mr-3 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span className="font-medium text-primary-700 text-sm sm:text-base">Upload Document</span>
                        </motion.div>
                    </Link>

                    <Link href="/dashboard/chat">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mr-3 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span className="font-medium text-green-700 text-sm sm:text-base">Start Chat</span>
                        </motion.div>
                    </Link>

                    <Link href="/dashboard/workspace">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span className="font-medium text-purple-700 text-sm sm:text-base">Invite Team</span>
                        </motion.div>
                    </Link>

                    <Link href="/dashboard/analytics">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 mr-3 group-hover:scale-110 transition-transform flex-shrink-0" />
                            <span className="font-medium text-orange-700 text-sm sm:text-base">View Analytics</span>
                        </motion.div>
                    </Link>
                </div>
            </motion.div>

            {/* Recent Activity */}
            {!loading && analytics?.recent_activity && analytics.recent_activity.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="card-responsive"
                >
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Recent Activity</h2>
                    <div className="space-y-3 sm:space-y-4">
                        {analytics.recent_activity.slice(0, 5).map((activity, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-3 rounded-lg transition-colors"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    )
}