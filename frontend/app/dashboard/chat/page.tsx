'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Conversation } from '@/types'
import { MessageSquare, Plus, Trash2, MoreVertical, X } from 'lucide-react'
import EnhancedChatInterface from '@/components/EnhancedChatInterface'
import LoadingSpinner from '@/components/LoadingSpinner'
import { toast } from 'sonner'

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingTooLong, setLoadingTooLong] = useState(false)
    const [deletingConversation, setDeletingConversation] = useState<string | null>(null)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    const fetchConversations = async () => {
        try {
            console.log('Fetching conversations...')
            setLoading(true)
            setLoadingTooLong(false)

            // Show "loading too long" message after 5 seconds
            const timeoutId = setTimeout(() => {
                setLoadingTooLong(true)
            }, 5000)

            const response = await api.get('/api/chat/conversations')
            console.log('Conversations fetched:', response.data)
            setConversations(response.data)
            clearTimeout(timeoutId)
        } catch (error: any) {
            console.error('Failed to fetch conversations:', error)

            // If it's an auth error, don't show the toast - the API interceptor will handle it
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error('Failed to load conversations', {
                    description: 'Please try refreshing the page'
                })
            }
        } finally {
            setLoading(false)
            setLoadingTooLong(false)
        }
    }

    useEffect(() => {
        fetchConversations()
    }, [])

    const handleNewConversation = (conversationId: string, title: string) => {
        setSelectedConversation(conversationId)
        fetchConversations()
    }

    const handleTitleUpdate = (conversationId: string, title: string) => {
        setConversations(prev =>
            prev.map(conv =>
                conv.id === conversationId
                    ? { ...conv, title }
                    : conv
            )
        )
    }

    const startNewChat = () => {
        setSelectedConversation(null)
        setIsMobileSidebarOpen(false) // Close mobile sidebar when starting new chat
    }

    const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent selecting the conversation

        // Show confirmation toast with action buttons
        toast('Delete conversation?', {
            description: 'This action cannot be undone.',
            action: {
                label: 'Delete',
                onClick: async () => {
                    setDeletingConversation(conversationId)

                    try {
                        await api.delete(`/api/chat/conversations/${conversationId}`)

                        // Remove from local state
                        setConversations(prev => prev.filter(conv => conv.id !== conversationId))

                        // If this was the selected conversation, clear selection
                        if (selectedConversation === conversationId) {
                            setSelectedConversation(null)
                        }

                        toast.success('Conversation deleted successfully')
                    } catch (error: any) {
                        console.error('Failed to delete conversation:', error)
                        toast.error('Failed to delete conversation', {
                            description: error.response?.data?.detail || 'Please try again'
                        })
                    } finally {
                        setDeletingConversation(null)
                    }
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => { }
            }
        })
    }

    const handleConversationSelect = (conversationId: string) => {
        setSelectedConversation(conversationId)
        setIsMobileSidebarOpen(false) // Close mobile sidebar when selecting conversation
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 flex-col space-y-4">
                <div className="spinner-lg text-primary-600"></div>
                <div className="text-center">
                    <p className="text-sm text-gray-600">Loading conversations...</p>
                    {loadingTooLong && (
                        <div className="loading-message-persistent mt-4 max-w-md">
                            ⏳ Loading is taking longer than expected. Sign in again if loading persists or if you face any other problem.
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex relative">
            {/* Mobile Conversations Toggle Button */}
            <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            >
                <MessageSquare className="w-5 h-5 text-gray-600" />
            </button>

            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="h-full flex w-full"
            >
                {/* Conversations Sidebar */}
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`
                        w-64 sm:w-80 border-r border-gray-200 bg-white flex-shrink-0 flex flex-col h-full
                        lg:relative lg:translate-x-0
                        ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 translate-x-0' : 'fixed inset-y-0 left-0 z-50 -translate-x-full lg:translate-x-0'}
                        transition-transform duration-300 ease-in-out
                    `}
                >
                    {/* Sidebar Header */}
                    <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                            <button
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startNewChat}
                            className="w-full btn-primary flex items-center justify-center text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Chat
                        </motion.button>
                    </div>

                    {/* Conversations List */}
                    <div className="overflow-y-auto flex-1">
                        {conversations.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 text-center text-gray-500"
                            >
                                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No conversations yet</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-1 p-2">
                                <AnimatePresence>
                                    {conversations.map((conversation, index) => (
                                        <motion.button
                                            key={conversation.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.02, x: 4 }}
                                            onClick={() => handleConversationSelect(conversation.id)}
                                            className={`
                                                w-full text-left p-3 rounded-lg transition-colors group relative
                                                ${selectedConversation === conversation.id
                                                    ? 'bg-primary-100 text-primary-700'
                                                    : 'hover:bg-gray-100'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center">
                                                <MessageSquare className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {conversation.title || `Chat ${new Date(conversation.created_at).toLocaleDateString()}`}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(conversation.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                {/* Delete Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                                    disabled={deletingConversation === conversation.id}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                                                >
                                                    {deletingConversation === conversation.id ? (
                                                        <div className="spinner-sm text-red-500" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </motion.button>
                                            </div>
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Chat Interface */}
                <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex-1 bg-white min-w-0"
                >
                    <EnhancedChatInterface
                        key={selectedConversation || 'new'}
                        conversationId={selectedConversation || undefined}
                        conversationTitle={conversations.find(c => c.id === selectedConversation)?.title}
                        onNewConversation={handleNewConversation}
                        onTitleUpdate={handleTitleUpdate}
                    />
                </motion.div>
            </motion.div>
        </div>
    )
}