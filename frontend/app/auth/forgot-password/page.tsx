'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        setLoading(true)

        try {
            // TODO: Implement password reset functionality
            // For now, just show a success message
            await new Promise(resolve => setTimeout(resolve, 1000))

            setSent(true)
            toast.success('Password reset instructions sent!', {
                description: 'Check your email for the reset link'
            })
        } catch (error: any) {
            console.error('Password reset error:', error)
            toast.error('Failed to send reset email', {
                description: 'Please try again later'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-red-50 flex items-center justify-center p-6">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary-400 rounded-full blur-3xl opacity-10"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-400 rounded-full blur-3xl opacity-10"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center space-x-3 mb-8">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg"
                    >
                        <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                        DocuQuery
                    </span>
                </Link>

                {/* Reset Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
                >
                    {!sent ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                                <p className="text-gray-600">Enter your email to receive reset instructions</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                            placeholder="you@example.com"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: loading ? 1 : 1.02 }}
                                    whileTap={{ scale: loading ? 1 : 0.98 }}
                                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <span>Send Reset Link</span>
                                    )}
                                </motion.button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                            <p className="text-gray-600 mb-6">
                                We've sent password reset instructions to <span className="font-medium">{email}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                                Didn't receive the email? Check your spam folder or try again.
                            </p>
                        </div>
                    )}

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to login</span>
                        </Link>
                    </div>
                </motion.div>

                {/* Back to Home */}
                <div className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                    >
                        ← Back to home
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
