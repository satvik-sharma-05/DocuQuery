'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/lib/api'
import { toast } from 'react-hot-toast'

interface Workspace {
    id: string
    name: string
    description?: string
    role: string
    member_count: number
    created_at: string
    owner_id?: string
    owner_name?: string
    owner_email?: string
}

interface WorkspaceContextType {
    workspaces: Workspace[]
    currentWorkspace: Workspace | null
    loading: boolean
    switchWorkspace: (workspaceId: string) => void
    refreshWorkspaces: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchWorkspaces = async () => {
        try {
            console.log('Fetching workspaces...')
            const response = await api.get('/api/workspaces/')
            const workspaceList = response.data
            console.log('Workspaces fetched:', workspaceList)

            setWorkspaces(workspaceList)

            // Set current workspace from localStorage or default to first
            const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
            const workspace = savedWorkspaceId
                ? workspaceList.find((w: Workspace) => w.id === savedWorkspaceId)
                : workspaceList[0]

            console.log('Setting current workspace:', workspace)
            if (workspace) {
                setCurrentWorkspace(workspace)
                localStorage.setItem('currentWorkspaceId', workspace.id)
            } else {
                console.warn('No workspace found')
            }
        } catch (error) {
            console.error('Failed to fetch workspaces:', error)
            toast.error('Failed to load workspaces')
        } finally {
            setLoading(false)
        }
    }

    const switchWorkspace = (workspaceId: string) => {
        const workspace = workspaces.find(w => w.id === workspaceId)
        if (workspace) {
            setCurrentWorkspace(workspace)
            localStorage.setItem('currentWorkspaceId', workspaceId)
            toast.success(`Switched to ${workspace.name}`)

            // Reload the page to refresh all workspace-specific data
            window.location.reload()
        }
    }

    const refreshWorkspaces = async () => {
        await fetchWorkspaces()
    }

    useEffect(() => {
        fetchWorkspaces()
    }, [])

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                currentWorkspace,
                loading,
                switchWorkspace,
                refreshWorkspaces,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    )
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext)
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider')
    }
    return context
}
