'use client'

import { useState } from 'react'
import api from '@/lib/api'

export default function DebugPage() {
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const testAPI = async () => {
        setLoading(true)
        try {
            // Test health endpoint
            const healthResponse = await fetch('http://localhost:8000/health')
            const healthData = await healthResponse.json()

            // Test login endpoint with invalid data (should return 422)
            const loginResponse = await api.post('/api/auth/login', {
                email: 'test@test.com',
                password: 'wrongpassword'
            })

            setResult({
                success: true,
                health: { status: healthResponse.status, data: healthData },
                login: { status: loginResponse.status, data: loginResponse.data }
            })
        } catch (error: any) {
            setResult({
                success: false,
                error: error.message,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data
                } : null
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>

            <button
                onClick={testAPI}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {loading ? 'Testing...' : 'Test API Connection'}
            </button>

            {result && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <h2 className="font-bold mb-2">Result:</h2>
                    <pre className="text-sm overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
                <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
                <p>This page tests the API connection from the browser.</p>
            </div>
        </div>
    )
}