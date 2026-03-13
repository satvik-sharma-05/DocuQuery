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

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true)
                const response = await api.get('/api/analytics/dashboard')
                setAnalytics(response.data)
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
                toast.error('Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    return (
        <div className="container-responsive py-6">
            <div className="space-y-8">
                {/* Workspace Info */}
                {loading ? <WorkspaceInfoSkeleton /> : <WorkspaceInfoPanel />}

                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your workspace.</p>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {loading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </>
                    ) : (
                        <>
                            <motion.div variants={item} whileHover={{ scale: 1.02 }} className="card group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Documents</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.total_documents || 0}</p>
                                        <p className="text-xs text-gray-500 mt-1">Across your workspace</p>
                                    </div>
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6 text-primary-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={item} whileHover={{ scale: 1.02 }} className="card group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Queries</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.total_queries || 0}</p>
                                        <p className="text-xs text-gray-500 mt-1">Questions asked</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={item} whileHover={{ scale: 1.02 }} className="card group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Team Members</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.team_members || 0}</p>
                                        <p className="text-xs text-gray-500 mt-1">Active collaborators</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6 text-purple-600" />
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
                    className="card"
                >
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/dashboard/documents">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <Upload className="w-6 h-6 text-primary-600 mr-3 group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-primary-700">Upload Document</span>
                            </motion.div>
                        </Link>

                        <Link href="/dashboard/chat">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <MessageSquare className="w-6 h-6 text-green-600 mr-3 group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-green-700">Start Chat</span>
                            </motion.div>
                        </Link>

                        <Link href="/dashboard/workspace">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <Users className="w-6 h-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-purple-700">Invite Team</span>
                            </motion.div>
                        </Link>

                        <Link href="/dashboard/analytics">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <TrendingUp className="w-6 h-6 text-orange-600 mr-3 group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-orange-700">View Analytics</span>
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
                        className="card"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                        <div className="space-y-4">
                            {analytics.recent_activity.slice(0, 5).map((activity, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-3 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                                        <div>
                                            <p className="text-sm text-gray-900">{activity.description}</p>
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
        </div>
    )
}