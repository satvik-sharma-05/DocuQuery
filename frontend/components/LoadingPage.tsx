'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface LoadingPageProps {
    message?: string
}

export default function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                    <Sparkles className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">DocuQuery</h2>
                <p className="text-gray-600">{message}</p>
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mt-4"
                >
                    <div className="w-8 h-1 bg-primary-500 rounded-full mx-auto"></div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 max-w-md mx-auto mt-4"
                >
                    ⚡ Running on free tier with free AI models. Services may take longer or temporarily shut down.
                </motion.div>
            </motion.div>
        </div>
    )
}