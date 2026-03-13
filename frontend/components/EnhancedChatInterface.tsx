'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, FileText, Copy, Check, Edit2, Save, X } from 'lucide-react'
import api from '@/lib/api'
import { ChatMessage, ChatResponse } from '@/types'
import LoadingSpinner from './LoadingSpinner'
import TypingIndicator from './TypingIndicator'
import Tooltip from './Tooltip'
import { toast } from 'sonner'

interface EnhancedChatInterfaceProps {
    conversationId?: string
    conversationTitle?: string
    onNewConversation?: (conversationId: string, title: string) => void
    onTitleUpdate?: (conversationId: string, title: string) => void
}

export default function EnhancedChatInterface({
    conversationId,
    conversationTitle,
    onNewConversation,
    onTitleUpdate
}: EnhancedChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState(conversationId)
    const [title, setTitle] = useState(conversationTitle || '')
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editTitleValue, setEditTitleValue] = useState('')
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (conversationId === undefined) {
            setMessages([])
            setCurrentConversationId(undefined)
            setTitle('')
            setLoading(false) // Ensure loading is false when no conversation is selected
        } else if (conversationId !== currentConversationId) {
            loadConversation(conversationId)
        }
    }, [conversationId])

    useEffect(() => {
        setTitle(conversationTitle || '')
    }, [conversationTitle])

    const loadConversation = async (convId: string) => {
        setLoading(true)
        try {
            console.log('Loading conversation:', convId)
            const response = await api.get(`/api/chat/conversations/${convId}`)
            setMessages(response.data.messages || [])
            setCurrentConversationId(convId)
            setTitle(response.data.title || '')
            console.log('Conversation loaded successfully')
        } catch (error: any) {
            console.error('Failed to load conversation:', error)

            // If it's an auth error, don't show the toast - the API interceptor will handle it
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error('Failed to load conversation', {
                    description: 'Please try again'
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const generateTitle = (firstMessage: string): string => {
        // Clean the message and generate a meaningful title
        const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ')

        // If it's a question, use it as is (up to 60 chars)
        if (cleanMessage.includes('?')) {
            return cleanMessage.length > 60
                ? cleanMessage.substring(0, 60) + '...'
                : cleanMessage
        }

        // For statements, try to extract key topics
        const words = cleanMessage.split(' ')
        if (words.length <= 8) {
            return cleanMessage
        }

        // Take first 8 words for longer messages
        return words.slice(0, 8).join(' ') + '...'
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            conversation_id: currentConversationId || '',
            role: 'user',
            content: input.trim(),
            timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, userMessage])
        const currentInput = input.trim()
        setInput('')
        setLoading(true)

        try {
            console.log('Sending chat query:', currentInput)
            const response = await api.post('/api/chat/query', {
                query: currentInput,
                conversation_id: currentConversationId
            }, {
                timeout: 120000 // 2 minute timeout for RAG queries
            })
            console.log('Chat response received:', response.data)

            const chatResponse: ChatResponse = response.data

            // Update conversation ID if this is a new conversation
            if (!currentConversationId) {
                const newTitle = generateTitle(currentInput)
                setCurrentConversationId(chatResponse.conversation_id)
                setTitle(newTitle)

                // Save the generated title to the backend (non-critical)
                try {
                    await api.put(`/api/chat/conversations/${chatResponse.conversation_id}`, {
                        title: newTitle
                    })
                    console.log('Conversation title saved successfully')
                } catch (titleError) {
                    console.warn('Failed to save conversation title (non-critical):', titleError)
                    // Don't show error to user - title will be auto-generated on next load
                }

                onNewConversation?.(chatResponse.conversation_id, newTitle)
            }

            const assistantMessage: ChatMessage = {
                id: chatResponse.message_id,
                conversation_id: chatResponse.conversation_id,
                role: 'assistant',
                content: chatResponse.answer,
                timestamp: new Date().toISOString()
            }

            setMessages(prev => [...prev, assistantMessage])
            setLoading(false)

        } catch (error: any) {
            console.error('Chat error:', error)
            setLoading(false)

            // Don't show toast for auth errors
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error('Failed to send message', {
                    description: error.response?.data?.detail || 'Please try again'
                })
            }
            setMessages(prev => prev.slice(0, -1))
        } finally {
            inputRef.current?.focus()
        }
    }

    const handleCopyMessage = async (content: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedMessageId(messageId)
            toast.success('Message copied to clipboard')
            setTimeout(() => setCopiedMessageId(null), 2000)
        } catch (error) {
            toast.error('Failed to copy message')
        }
    }

    const handleEditTitle = () => {
        setEditTitleValue(title)
        setIsEditingTitle(true)
    }

    const handleSaveTitle = async () => {
        if (!currentConversationId || !editTitleValue.trim()) return

        try {
            await api.put(`/api/chat/conversations/${currentConversationId}`, {
                title: editTitleValue.trim()
            })

            setTitle(editTitleValue.trim())
            setIsEditingTitle(false)
            onTitleUpdate?.(currentConversationId, editTitleValue.trim())
            toast.success('Conversation title updated')
        } catch (error) {
            toast.error('Failed to update title')
        }
    }

    const handleCancelEdit = () => {
        setEditTitleValue('')
        setIsEditingTitle(false)
    }

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Chat Header */}
            {currentConversationId && (
                <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        {isEditingTitle ? (
                            <div className="flex items-center space-x-2 flex-1">
                                <input
                                    type="text"
                                    value={editTitleValue}
                                    onChange={(e) => setEditTitleValue(e.target.value)}
                                    className="flex-1 px-3 py-1 text-lg font-semibold bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle()
                                        if (e.key === 'Escape') handleCancelEdit()
                                    }}
                                    autoFocus
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveTitle}
                                    className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleCancelEdit}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    {title || `Chat ${new Date().toLocaleDateString()}`}
                                </h2>
                                <Tooltip content="Edit conversation title">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleEditTitle}
                                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </motion.button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                {messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-gray-500 mt-12"
                    >
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                        <p className="text-gray-500">Ask a question about your documents to get started</p>
                    </motion.div>
                ) : (
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`
                                    max-w-3xl group relative
                                    ${message.role === 'user' ? 'ml-12' : 'mr-12'}
                                `}>
                                    <div className={`
                                        px-4 py-3 rounded-2xl whitespace-pre-wrap relative
                                        ${message.role === 'user'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                                        }
                                    `}>
                                        {message.content}

                                        {/* Message Actions */}
                                        <div className={`
                                            absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity
                                            ${message.role === 'user' ? '-left-10' : '-right-10'}
                                        `}>
                                            <Tooltip content="Copy message">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleCopyMessage(message.content, message.id)}
                                                    className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all"
                                                >
                                                    {copiedMessageId === message.id ? (
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="w-3 h-3 text-gray-600" />
                                                    )}
                                                </motion.button>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <div className={`
                                        text-xs text-gray-500 mt-1
                                        ${message.role === 'user' ? 'text-right' : 'text-left'}
                                    `}>
                                        {formatTimestamp(message.timestamp)}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSubmit} className="flex space-x-3 max-w-full">
                    <div className="flex-1 relative min-w-0">
                        <Tooltip content="Ask questions about your workspace documents" position="top">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question about your documents..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                                disabled={loading}
                            />
                        </Tooltip>
                    </div>
                    <Tooltip content="Send message">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="flex-shrink-0 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </motion.button>
                    </Tooltip>
                </form>
            </div>
        </div>
    )
}