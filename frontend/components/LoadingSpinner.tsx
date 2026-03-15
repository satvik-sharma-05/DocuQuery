import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    message?: string
    showPersistentMessage?: boolean
}

export default function LoadingSpinner({
    size = 'md',
    message = 'Loading...',
    showPersistentMessage = false
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col justify-center items-center space-y-4"
        >
            <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary-600`}></div>
            {message && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-gray-600 animate-pulse"
                >
                    {message}
                </motion.p>
            )}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 max-w-md text-center"
            >
                ⚡ Running on free tier with free AI models. Services may take longer or temporarily shut down.
            </motion.div>
            {showPersistentMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5 }}
                    className="loading-message-persistent max-w-md text-center"
                >
                    ⏳ Loading is taking longer than expected. Sign in again if loading persists or if you face any other problem.
                </motion.div>
            )}
        </motion.div>
    )
}