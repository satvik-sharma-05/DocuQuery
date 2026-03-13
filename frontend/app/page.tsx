'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
    Sparkles,
    Users,
    FileText,
    MessageSquare,
    BarChart3,
    ArrowRight,
    Check,
    Zap,
    Shield,
    Globe
} from 'lucide-react'

const features = [
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Work together seamlessly with your team in shared workspaces'
    },
    {
        icon: FileText,
        title: 'Document Intelligence',
        description: 'Upload and organize documents with AI-powered understanding'
    },
    {
        icon: MessageSquare,
        title: 'AI-Powered Chat',
        description: 'Ask questions and get instant answers from your knowledge base'
    },
    {
        icon: BarChart3,
        title: 'Workspace Analytics',
        description: 'Track usage, queries, and team activity with beautiful dashboards'
    }
]

const steps = [
    {
        number: '01',
        title: 'Create a Workspace',
        description: 'Set up your team workspace in seconds'
    },
    {
        number: '02',
        title: 'Invite Your Team',
        description: 'Collaborate with teammates and manage permissions'
    },
    {
        number: '03',
        title: 'Upload Documents',
        description: 'Add PDFs, docs, and markdown files to your knowledge base'
    },
    {
        number: '04',
        title: 'Ask Questions',
        description: 'Chat with AI to get instant answers from your documents'
    }
]

const benefits = [
    'Unlimited document uploads',
    'AI-powered search',
    'Team collaboration',
    'Advanced analytics',
    'Secure & private',
    'Real-time updates'
]

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                            DocuQuery
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/auth/login"
                            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all hover:scale-105 font-medium shadow-lg shadow-primary-500/30"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full mb-6">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-medium">AI-Powered Knowledge Management</span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Chat with your
                            <br />
                            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                                team's knowledge
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                            Transform your documents into an intelligent knowledge base.
                            Upload, organize, and query your team's information with AI.
                        </p>
                        <div className="flex items-center justify-center space-x-4">
                            <Link
                                href="/auth/register"
                                className="group px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all hover:scale-105 font-semibold shadow-xl shadow-primary-500/30 flex items-center space-x-2"
                            >
                                <span>Start Free Trial</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/auth/login"
                                className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-semibold border border-gray-200 shadow-lg"
                            >
                                Sign In
                            </Link>
                        </div>
                    </motion.div>

                    {/* Hero Image Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-16 relative"
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white p-4">
                            <div className="aspect-video bg-gradient-to-br from-primary-50 to-gray-50 rounded-xl flex items-center justify-center">
                                <div className="text-center">
                                    <MessageSquare className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">Interactive Demo Coming Soon</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500 rounded-full blur-3xl opacity-20"></div>
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything you need to manage knowledge
                        </h2>
                        <p className="text-xl text-gray-600">
                            Powerful features to help your team work smarter
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="p-6 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all group"
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How it works
                        </h2>
                        <p className="text-xl text-gray-600">
                            Get started in minutes
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                <div className="text-6xl font-bold text-primary-100 mb-4">{step.number}</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 -right-4 w-8 h-0.5 bg-primary-200"></div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">
                                Why teams choose DocuQuery
                            </h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Built for modern teams who value efficiency and collaboration
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {benefits.map((benefit) => (
                                    <div key={benefit} className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Check className="w-4 h-4 text-primary-600" />
                                        </div>
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-gradient-to-br from-primary-100 to-purple-100 rounded-2xl flex items-center justify-center">
                                <div className="text-center">
                                    <Shield className="w-24 h-24 text-primary-600 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium">Secure & Reliable</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-12 shadow-2xl"
                    >
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Ready to transform your workflow?
                        </h2>
                        <p className="text-xl text-primary-100 mb-8">
                            Join teams already using DocuQuery to manage their knowledge
                        </p>
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary-600 rounded-xl hover:bg-gray-50 transition-all hover:scale-105 font-semibold shadow-xl"
                        >
                            <span>Get Started Free</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">DocuQuery</span>
                    </div>
                    <p className="text-gray-600 mb-4">
                        AI-powered knowledge management for modern teams
                    </p>
                    <p className="text-sm text-gray-500">
                        © 2026 DocuQuery. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
