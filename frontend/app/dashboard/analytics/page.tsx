'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Analytics, TimeSeriesAnalytics } from '@/types'
import { TrendingUp, Users, FileText, MessageSquare } from 'lucide-react'
import { ChartSkeleton, StatCardSkeleton } from '@/components/SkeletonLoader'
import { toast } from 'sonner'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

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

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingTooLong, setLoadingTooLong] = useState(false)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true)
                setLoadingTooLong(false)

                // Show "loading too long" message after 5 seconds
                const timeoutId = setTimeout(() => {
                    setLoadingTooLong(true)
                }, 5000)

                const [dashboardRes, timeSeriesRes] = await Promise.all([
                    api.get('/api/analytics/dashboard'),
                    api.get('/api/analytics/time-series?days=30')
                ])
                setAnalytics(dashboardRes.data)
                setTimeSeriesData(timeSeriesRes.data)
                clearTimeout(timeoutId)
            } catch (error: any) {
                console.error('Failed to fetch analytics:', error)

                // Don't show error toast for auth errors (will redirect)
                if (error.response?.status !== 401 && error.response?.status !== 403) {
                    toast.error('Failed to load analytics', {
                        description: 'Please try refreshing the page'
                    })
                }
            } finally {
                setLoading(false)
                setLoadingTooLong(false)
            }
        }

        fetchAnalytics()
    }, [])

    return (
        <div className="space-y-mobile">
            <div className="space-y-mobile">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center sm:text-left"
                >
                    <h1 className="heading-responsive">Analytics</h1>
                    <p className="subheading-responsive mt-2">Insights and metrics for your workspace</p>
                </motion.div>

                {/* Stats Overview */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="responsive-grid-1-2-4"
                >
                    {loading ? (
                        <>
                            <div>
                                <StatCardSkeleton />
                                <div className="loading-message">Loading documents...</div>
                            </div>
                            <div>
                                <StatCardSkeleton />
                                <div className="loading-message">Loading queries...</div>
                            </div>
                            <div>
                                <StatCardSkeleton />
                                <div className="loading-message">Loading team data...</div>
                            </div>
                            <div>
                                <StatCardSkeleton />
                                <div className="loading-message">Loading analytics...</div>
                            </div>
                            {loadingTooLong && (
                                <div className="col-span-full">
                                    <div className="loading-message-persistent">
                                        ⏳ Loading is taking longer than expected. Sign in again if loading persists or if you face any other problem.
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <motion.div variants={item} whileHover={{ scale: 1.03 }} className="card-responsive hover-lift">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-600">Documents</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{analytics?.total_documents || 0}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={item} whileHover={{ scale: 1.03 }} className="card-responsive hover-lift">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-600">Queries</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{analytics?.total_queries || 0}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={item} whileHover={{ scale: 1.03 }} className="card-responsive hover-lift">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-600">Members</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{analytics?.team_members || 0}</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={item} whileHover={{ scale: 1.03 }} className="card-responsive hover-lift">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-600">Avg Queries/Day</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                                            {timeSeriesData?.queries_over_time.length
                                                ? Math.round(
                                                    timeSeriesData.queries_over_time.reduce((sum, d) => sum + d.count, 0) /
                                                    timeSeriesData.queries_over_time.length
                                                )
                                                : 0}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </motion.div>

                {/* Charts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="responsive-grid-1-2-3 lg:grid-cols-2"
                >
                    {/* Queries Over Time */}
                    <motion.div whileHover={{ scale: 1.01 }} className="card-responsive hover-lift">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Queries Over Time</h2>
                        {loading ? (
                            <div>
                                <ChartSkeleton />
                                <div className="loading-message">Loading query trends...</div>
                            </div>
                        ) : (
                            <div className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timeSeriesData?.queries_over_time || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            stroke="#6B7280"
                                            fontSize={12}
                                        />
                                        <YAxis stroke="#6B7280" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Queries" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </motion.div>

                    {/* User Activity */}
                    <motion.div whileHover={{ scale: 1.01 }} className="card-responsive hover-lift">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">User Activity</h2>
                        {loading ? (
                            <div>
                                <ChartSkeleton />
                                <div className="loading-message">Loading user activity...</div>
                            </div>
                        ) : (
                            <div className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={timeSeriesData?.user_activity || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                                        <YAxis stroke="#6B7280" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="query_count" fill="#10B981" name="Queries" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </motion.div>

                    {/* Document Statistics */}
                    <motion.div whileHover={{ scale: 1.01 }} className="card-responsive hover-lift">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Document Distribution</h2>
                        {loading ? (
                            <div>
                                <ChartSkeleton />
                                <div className="loading-message">Loading document stats...</div>
                            </div>
                        ) : (
                            <div className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={timeSeriesData?.document_stats.map(d => ({
                                                name: d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name,
                                                value: d.chunk_count
                                            })) || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                            outerRadius={window.innerWidth < 640 ? 60 : 80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {timeSeriesData?.document_stats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </motion.div>

                    {/* Top Queries */}
                    <motion.div whileHover={{ scale: 1.01 }} className="card-responsive hover-lift">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Top Queries</h2>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                ))}
                                <div className="loading-message">Loading popular queries...</div>
                            </div>
                        ) : analytics?.top_queries && analytics.top_queries.length > 0 ? (
                            <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                                {analytics.top_queries.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.query}</p>
                                        </div>
                                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                            {item.count}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No queries yet</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>

                {/* Recent Activity */}
                {!loading && analytics?.recent_activity && analytics.recent_activity.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="card"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                        <div className="space-y-3">
                            {analytics.recent_activity.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center space-x-3">
                                        <MessageSquare className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-900">{activity.description}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
