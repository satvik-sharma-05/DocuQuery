'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, FileText } from 'lucide-react'
import api from '@/lib/api'
import { ChatMessage, ChatResponse } from '@/types'
import LoadingSpinner from './LoadingSpinner'
import TypingIndicator from './TypingIndicator'
import { toast } from 'sonner'

interface ChatInterfaceProps {
    conversationId?: string
    onNewConversation?: (conversationId: string) => void
}

export default function ChatInterface({ conversationId, onNewConversation }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentConversationId, setCurrentConversationId] = useState(conversationId)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        // When conversationId prop changes
        if (conversationId === undefined) {
            // New chat - clear everything
            setMessages([])
            setCurrentConversationId(undefined)
        } else if (conversationId !== currentConversationId) {
            // Load existing conversation
            loadConversation(conversationId)
        }
    }, [conversationId])

    const loadConversation = async (convId: string) => {
        try {
            const response = await api.get(`/api/chat/conversations/${convId}`)
            setMessages(response.data.messages || [])
            setCurrentConversationId(convId)
        } catch (error) {
            console.error('Failed to load conversation:', error)
            toast.error('Failed to load conversation', {
                description: 'Please try again'
            })
        }
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
        setInput('')
        setLoading(true)

        try {
            const response = await api.post('/api/chat/query', {
                query: input.trim(),
                conversation_id: currentConversationId
            })

            const chatResponse: ChatResponse = response.data

            // Update conversation ID if this is a new conversation
            if (!currentConversationId) {
                setCurrentConversationId(chatResponse.conversation_id)
                onNewConversation?.(chatResponse.conversation_id)
            }

            const assistantMessage: ChatMessage = {
                id: chatResponse.message_id,
                conversation_id: chatResponse.conversation_id,
                role: 'assistant',
                content: chatResponse.answer,
                timestamp: new Date().toISOString()
            }

            setMessages(prev => [...prev, assistantMessage])

        } catch (error: any) {
            console.error('Chat error:', error)
            toast.error('Failed to send message', {
                description: error.response?.data?.detail || 'Please try again'
            })

            // Remove the user message on error
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-gray-500 mt-8"
                    >
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Start a conversation by asking a question about your documents</p>
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
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    className={`
                  max-w-3xl px-4 py-2 rounded-lg whitespace-pre-wrap
                  ${message.role === 'user'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                        }
                `}
                                >
                                    {message.content}
                                </motion.div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {loading && (
                    <TypingIndicator />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your documents..."
                        className="flex-1 input-field"
                        disabled={loading}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </motion.button>
                </form>
            </div>
        </div>
    )
}