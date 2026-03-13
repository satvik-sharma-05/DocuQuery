'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { Document } from '@/types'
import { FileText, Trash2, Calendar, User, Package, Upload, AlertCircle } from 'lucide-react'
import DocumentUploader from '@/components/DocumentUploader'
import { DocumentCardSkeleton } from '@/components/SkeletonLoader'
import ConfirmationModal from '@/components/ConfirmationModal'
import { toast } from 'sonner'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; document: Document | null }>({
        isOpen: false,
        document: null
    })

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            const response = await api.get('/api/documents/')
            setDocuments(response.data)
        } catch (error: any) {
            console.error('Failed to fetch documents:', error)

            // Don't show error toast for auth errors (will redirect)
            if (error.response?.status !== 401 && error.response?.status !== 403) {
                toast.error('Failed to load documents', {
                    description: 'Please try refreshing the page'
                })
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [])

    const handleDelete = async (document: Document) => {
        setDeleteModal({ isOpen: true, document })
    }

    const confirmDelete = async () => {
        if (!deleteModal.document) return

        setDeleting(deleteModal.document.id)
        try {
            await api.delete(`/api/documents/${deleteModal.document.id}`)
            setDocuments(documents.filter(doc => doc.id !== deleteModal.document!.id))
            toast.success('Document deleted', {
                description: `${deleteModal.document.name} has been removed`
            })
        } catch (error: any) {
            console.error('Delete error:', error)
            toast.error('Failed to delete document', {
                description: error.response?.data?.detail || 'Please try again'
            })
        } finally {
            setDeleting(null)
            setDeleteModal({ isOpen: false, document: null })
        }
    }

    const handleUploadSuccess = () => {
        toast.success('Document uploaded successfully!', {
            description: 'Processing your document...'
        })
        fetchDocuments()
    }

    return (
        <div className="container-responsive py-6">
            <div className="space-y-8">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
                    <p className="text-gray-600 mt-2">Upload and manage your team's documents</p>
                </motion.div>

                {/* Upload Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="card"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Upload New Document</h2>
                    </div>
                    <DocumentUploader onUploadSuccess={handleUploadSuccess} />
                </motion.div>

                {/* Documents List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Team Documents ({documents.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            <DocumentCardSkeleton />
                            <DocumentCardSkeleton />
                            <DocumentCardSkeleton />
                        </div>
                    ) : documents.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16"
                        >
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
                            <p className="text-gray-500 mb-6">Upload your first document to get started</p>
                            <div className="inline-flex items-center space-x-2 text-blue-600 text-sm font-medium">
                                <AlertCircle className="w-4 h-4" />
                                <span>Supported formats: PDF, DOCX, TXT, MD</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="space-y-4"
                        >
                            <AnimatePresence>
                                {documents.map((document) => (
                                    <motion.div
                                        key={document.id}
                                        variants={item}
                                        layout
                                        exit={{ opacity: 0, x: -100 }}
                                        whileHover={{ scale: 1.01 }}
                                        className="flex items-start justify-between p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all group bg-white"
                                    >
                                        <div className="flex items-start space-x-4 flex-1">
                                            <motion.div
                                                whileHover={{ rotate: 5 }}
                                                className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0"
                                            >
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            </motion.div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                                                    {document.name}
                                                </h3>
                                                {document.description && (
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {document.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center space-x-2">
                                                        <User className="w-4 h-4" />
                                                        <span className="font-medium">{document.uploader_name || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(document.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}</span>
                                                    </div>
                                                    {document.chunk_count !== undefined && (
                                                        <div className="flex items-center space-x-2">
                                                            <Package className="w-4 h-4" />
                                                            <span>{document.chunk_count} chunks</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(document)}
                                            disabled={deleting === document.id}
                                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors ml-4 flex-shrink-0 disabled:opacity-50"
                                            title="Delete document"
                                        >
                                            {deleting === document.id ? (
                                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Trash2 className="w-5 h-5" />
                                            )}
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </motion.div>

                {/* Delete Confirmation Modal */}
                <ConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, document: null })}
                    onConfirm={confirmDelete}
                    title="Delete Document"
                    message={`Are you sure you want to delete "${deleteModal.document?.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>
        </div>
    )
}