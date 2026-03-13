'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import ResponsiveDashboardLayout from '@/components/ResponsiveDashboardLayout'

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <WorkspaceProvider>
                <ResponsiveDashboardLayout>
                    {children}
                </ResponsiveDashboardLayout>
            </WorkspaceProvider>
        </AuthProvider>
    )
}