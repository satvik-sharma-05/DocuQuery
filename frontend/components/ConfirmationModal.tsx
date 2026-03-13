'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning'
}: ConfirmationModalProps) {
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
        console.log('ConfirmationModal props:', { isOpen, title, message, type })
    }

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const handleConfirm = () => {
        onConfirm()
        // Don't close here - let the parent handle closing after async operation
    }

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'text-red-600 bg-red-100',
                    button: 'btn-danger'
                }
            case 'warning':
                return {
                    icon: 'text-yellow-600 bg-yellow-100',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }
            case 'info':
                return {
                    icon: 'text-primary-600 bg-primary-100',
                    button: 'btn-primary'
                }
            default:
                return {
                    icon: 'text-yellow-600 bg-yellow-100',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                }
        }
    }

    const styles = getTypeStyles()

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
                            onClick={onClose}
                        />

                        {/* Modal panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10"
                        >
                            <div className="bg-white px-6 pt-6 pb-4">
                                <div className="flex items-start">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {title}
                                        </h3>
                                        <p className="text-gray-600">
                                            {message}
                                        </p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-4 flex space-x-3 justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className="btn-secondary"
                                >
                                    {cancelText}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirm}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${styles.button}`}
                                >
                                    {confirmText}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )

    // Use portal to render modal at document body level
    if (typeof window !== 'undefined') {
        return createPortal(modalContent, document.body)
    }

    return null
}