'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)

        try {
            const response = await api.post('/api/auth/login', {
                email,
                password
            })

            const { user, access_token, refresh_token } = response.data

            // Clear any signing out flag
            sessionStorage.removeItem('signing_out')

            // Set Supabase session
            await supabase.auth.setSession({
                access_token,
                refresh_token
            })

            // Store workspace ID
            if (user.workspace_id) {
                localStorage.setItem('currentWorkspaceId', user.workspace_id)
            }

            toast.success('Welcome back!', {
                description: 'Redirecting to dashboard...'
            })

            setTimeout(() => {
                router.push('/dashboard')
            }, 500)

        } catch (error: any) {
            console.error('Login error:', error)

            // Provide specific error messages
            let errorMessage = 'Login failed'
            let errorDescription = 'Please try again'

            if (error.response?.status === 401) {
                errorMessage = 'Invalid credentials'
                errorDescription = 'Incorrect email or password'
            } else if (error.response?.status === 404) {
                errorMessage = 'Account not found'
                errorDescription = 'No account found with that email address'
            } else if (error.response?.data?.detail) {
                errorDescription = error.response.data.detail
            }

            toast.error(errorMessage, {
                description: errorDescription
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

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-600">Sign in to your account to continue</p>
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

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex items-center justify-end">
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                            >
                                Forgot password?
                            </Link>
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
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Sign Up Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                href="/auth/register"
                                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                            >
                                Sign up
                            </Link>
                        </p>
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
