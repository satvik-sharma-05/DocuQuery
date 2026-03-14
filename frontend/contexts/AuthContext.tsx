'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import api from '@/lib/api'
import { User } from '@/types'
import { toast } from 'sonner'

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (fullName: string, email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [initialized, setInitialized] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                console.log('Initializing auth...')
                const { data: { session } } = await supabase.auth.getSession()
                console.log('Initial session:', session ? 'exists' : 'none')

                if (session && mounted) {
                    console.log('Session found, getting user info...')
                    try {
                        const response = await api.get('/api/auth/me')
                        console.log('User info received:', response.data)
                        if (mounted) {
                            setUser(response.data)
                        }
                    } catch (error: any) {
                        console.error('Failed to get user info:', error)
                        if (error.response?.status === 401 || error.response?.status === 403) {
                            console.log('User info request failed with auth error, clearing session')
                            await supabase.auth.signOut()
                            if (mounted) {
                                setUser(null)
                            }
                        }
                    }
                } else if (mounted) {
                    console.log('No session found')
                    setUser(null)
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
                if (mounted) {
                    setUser(null)
                }
            } finally {
                if (mounted) {
                    console.log('Auth initialization complete')
                    setLoading(false)
                    setInitialized(true)
                }
            }
        }

        initializeAuth()

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state change:', event, session ? 'session exists' : 'no session')

                if (!mounted) return

                if (event === 'SIGNED_OUT' || !session) {
                    setUser(null)
                } else if (event === 'SIGNED_IN' && session) {
                    try {
                        const response = await api.get('/api/auth/me')
                        if (mounted) {
                            setUser(response.data)
                        }
                    } catch (error) {
                        console.error('Failed to get user info after sign in:', error)
                        if (mounted) {
                            setUser(null)
                        }
                    }
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    // Handle redirects after auth state is initialized
    useEffect(() => {
        if (!initialized) return

        if (!user && pathname?.startsWith('/dashboard')) {
            console.log('No user on dashboard route, redirecting to login')
            router.push('/auth/login')
        }
    }, [user, initialized, pathname, router])

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/api/auth/login', { email, password })
            const { user, access_token, refresh_token } = response.data

            // Set the session in Supabase
            await supabase.auth.setSession({ access_token, refresh_token })

            // Store workspace ID
            if (user.workspace_id) {
                localStorage.setItem('currentWorkspaceId', user.workspace_id)
            }

            setUser(user)
            console.log('Login successful, user set:', user)
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    const register = async (fullName: string, email: string, password: string) => {
        try {
            const response = await api.post('/api/auth/register', {
                full_name: fullName,
                email,
                password
            })

            const { user, access_token, refresh_token } = response.data

            // Set the session in Supabase
            await supabase.auth.setSession({ access_token, refresh_token })

            // Store workspace ID
            if (user.workspace_id) {
                localStorage.setItem('currentWorkspaceId', user.workspace_id)
            }

            setUser(user)
            console.log('Registration successful, user set:', user)
        } catch (error) {
            console.error('Registration error:', error)
            throw error
        }
    }

    const logout = async () => {
        try {
            // Clear all local storage and session storage
            localStorage.clear()
            sessionStorage.clear()

            // Sign out from Supabase
            await supabase.auth.signOut()

            // Clear user state
            setUser(null)

            // Redirect to login
            router.push('/auth/login')

            // Show success toast
            toast.success('Signed out successfully')
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Failed to sign out')
        }
    }

    // Show loading spinner only on dashboard routes during initialization
    if (loading && !initialized && pathname?.startsWith('/dashboard')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}