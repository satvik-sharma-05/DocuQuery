'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import ModernHeader from './ModernHeader'
import { Toaster } from 'sonner'

interface DashboardLayoutProps {
    children: ReactNode
    user: {
        id: string
        email: string
        full_name?: string
    }
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Toast Notifications */}
            <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                    style: {
                        background: 'white',
                        border: '1px solid #e5e7eb',
                    },
                }}
            />

            {/* Sidebar */}
            <Sidebar />

            {/* Header */}
            <ModernHeader user={user} />

            {/* Main Content */}
            <motion.main
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="pt-16 md:pl-[280px] min-h-screen"
            >
                <div className="p-6 md:p-8">
                    {children}
                </div>
            </motion.main>
        </div>
    )
}
