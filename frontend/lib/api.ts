import axios from 'axios'
import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 minute timeout (increased for RAG queries)
})

// Request interceptor to add auth token and workspace ID
api.interceptors.request.use(
    async (config) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            console.log('API request interceptor - session:', session ? 'exists' : 'none')

            if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`
                console.log('Added auth header to request')
            } else {
                console.log('No auth token available for request')
            }

            // Add workspace ID to headers if available
            const workspaceId = localStorage.getItem('currentWorkspaceId')
            if (workspaceId) {
                config.headers['X-Workspace-ID'] = workspaceId
                console.log('Added workspace ID to request:', workspaceId)
            } else {
                console.log('No workspace ID available - this may cause issues for workspace-specific endpoints')
            }

            return config
        } catch (error) {
            console.error('Error in request interceptor:', error)
            return config
        }
    },
    (error) => {
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
    }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => {
        console.log('API response:', response.status, response.config.url)
        return response
    },
    async (error) => {
        console.error('API error:', error.response?.status, error.response?.data, error.config?.url, error.code)

        // Handle timeout errors
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            console.error('Request timeout')
            return Promise.reject(new Error('Request timeout - please try again'))
        }

        // Handle network errors
        if (!error.response) {
            console.error('Network error - backend may be down')
            return Promise.reject(new Error('Cannot connect to server - please check if backend is running'))
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
            console.error('Authentication error detected')

            // Don't auto-logout on auth endpoints - let them handle their own errors
            const isAuthEndpoint = error.config?.url?.includes('/api/auth/')

            if (!isAuthEndpoint) {
                console.error('Non-auth endpoint failed with auth error, signing out')

                // Prevent infinite loop - only sign out once
                const isAlreadySigningOut = sessionStorage.getItem('signing_out')
                if (!isAlreadySigningOut) {
                    sessionStorage.setItem('signing_out', 'true')

                    // Token expired or invalid, redirect to login
                    await supabase.auth.signOut()

                    if (typeof window !== 'undefined') {
                        window.location.href = '/auth/login'
                    }
                }
            } else {
                console.log('Auth endpoint failed, not auto-logging out')
            }
        }
        return Promise.reject(error)
    }
)

export default api