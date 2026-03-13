import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        // Test backend connection
        const response = await fetch(`${API_URL}/health`)
        const data = await response.json()

        return NextResponse.json({
            success: true,
            backend_status: response.status,
            backend_response: data,
            api_url: API_URL
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            api_url: process.env.NEXT_PUBLIC_API_URL
        }, { status: 500 })
    }
}