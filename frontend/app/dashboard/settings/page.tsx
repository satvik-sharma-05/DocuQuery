'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Bell,
    Shield,
    Palette,
    Globe,
    Save,
    Moon,
    Sun,
    Monitor,
    Volume2,
    VolumeX,
    Eye,
    EyeOff
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'

interface UserSettings {
    notifications: {
        email: boolean
        push: boolean
        desktop: boolean
        sound: boolean
    }
    privacy: {
        profileVisibility: 'public' | 'private' | 'team'
        activityStatus: boolean
        dataSharing: boolean
    }
    appearance: {
        theme: 'light' | 'dark' | 'system'
        language: string
        timezone: string
    }
}

export default function SettingsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [settings, setSettings] = useState<UserSettings>({
        notifications: {
            email: true,
            push: true,
            desktop: false,
            sound: true
        },
        privacy: {
            profileVisibility: 'team',
            activityStatus: true,
            dataSharing: false
        },
        appearance: {
            theme: 'system',
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const response = await api.get('/api/auth/settings')
            setSettings(prev => ({ ...prev, ...response.data }))
        } catch (error) {
            console.error('Failed to load settings:', error)
            // Use default settings if API fails
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await api.put('/api/auth/settings', settings)
            toast.success('Settings saved successfully')
        } catch (error: any) {
            toast.error('Failed to save settings', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setLoading(false)
        }
    }

    const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }))
    }

    const SettingCard = ({ title, description, children }: {
        title: string
        description: string
        children: React.ReactNode
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
        >
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
            </div>
            {children}
        </motion.div>
    )

    const ToggleSwitch = ({
        enabled,
        onChange,
        label,
        description
    }: {
        enabled: boolean
        onChange: (value: boolean) => void
        label: string
        description?: string
    }) => (
        <div className="flex items-center justify-between py-3">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(!enabled)}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${enabled ? 'bg-primary-600' : 'bg-gray-200'}
                `}
            >
                <motion.span
                    animate={{ x: enabled ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                />
            </motion.button>
        </div>
    )

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-2">Manage your account preferences and privacy settings</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Notifications */}
                <SettingCard
                    title="Notifications"
                    description="Choose how you want to be notified about updates and activities"
                >
                    <div className="space-y-1">
                        <ToggleSwitch
                            enabled={settings.notifications.email}
                            onChange={(value) => updateSetting('notifications', 'email', value)}
                            label="Email notifications"
                            description="Receive updates via email"
                        />
                        <ToggleSwitch
                            enabled={settings.notifications.push}
                            onChange={(value) => updateSetting('notifications', 'push', value)}
                            label="Push notifications"
                            description="Browser push notifications"
                        />
                        <ToggleSwitch
                            enabled={settings.notifications.desktop}
                            onChange={(value) => updateSetting('notifications', 'desktop', value)}
                            label="Desktop notifications"
                            description="System desktop notifications"
                        />
                        <ToggleSwitch
                            enabled={settings.notifications.sound}
                            onChange={(value) => updateSetting('notifications', 'sound', value)}
                            label="Sound notifications"
                            description="Play sounds for notifications"
                        />
                    </div>
                </SettingCard>

                {/* Privacy */}
                <SettingCard
                    title="Privacy & Security"
                    description="Control your privacy and data sharing preferences"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile Visibility
                            </label>
                            <select
                                value={settings.privacy.profileVisibility}
                                onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="public">Public</option>
                                <option value="team">Team Only</option>
                                <option value="private">Private</option>
                            </select>
                        </div>

                        <ToggleSwitch
                            enabled={settings.privacy.activityStatus}
                            onChange={(value) => updateSetting('privacy', 'activityStatus', value)}
                            label="Show activity status"
                            description="Let others see when you're online"
                        />

                        <ToggleSwitch
                            enabled={settings.privacy.dataSharing}
                            onChange={(value) => updateSetting('privacy', 'dataSharing', value)}
                            label="Analytics data sharing"
                            description="Help improve DocuQuery with usage data"
                        />
                    </div>
                </SettingCard>

                {/* Appearance */}
                <SettingCard
                    title="Appearance"
                    description="Customize how DocuQuery looks and feels"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Theme
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { value: 'light', icon: Sun, label: 'Light' },
                                    { value: 'dark', icon: Moon, label: 'Dark' },
                                    { value: 'system', icon: Monitor, label: 'System' }
                                ].map(({ value, icon: Icon, label }) => (
                                    <motion.button
                                        key={value}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => updateSetting('appearance', 'theme', value)}
                                        className={`
                                            flex flex-col items-center p-3 rounded-lg border-2 transition-colors
                                            ${settings.appearance.theme === value
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <Icon className="w-5 h-5 mb-1" />
                                        <span className="text-xs font-medium">{label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Language
                            </label>
                            <select
                                value={settings.appearance.language}
                                onChange={(e) => updateSetting('appearance', 'language', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Timezone
                            </label>
                            <select
                                value={settings.appearance.timezone}
                                onChange={(e) => updateSetting('appearance', 'timezone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Chicago">Central Time</option>
                                <option value="America/Denver">Mountain Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>
                    </div>
                </SettingCard>

                {/* Account */}
                <SettingCard
                    title="Account Information"
                    description="Your account details and preferences"
                >
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{user.full_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-400">
                                    Member since {new Date(user.created_at || '').toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Delete Account
                            </motion.button>
                            <p className="text-xs text-gray-500 mt-1 px-4">
                                Permanently delete your account and all associated data
                            </p>
                        </div>
                    </div>
                </SettingCard>
            </div>
        </div>
    )
}