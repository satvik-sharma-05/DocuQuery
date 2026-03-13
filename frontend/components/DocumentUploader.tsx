'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface DocumentUploaderProps {
    onUploadSuccess?: () => void
}

export default function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [description, setDescription] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]

            // Validate file type
            const allowedTypes = ['pdf', 'docx', 'txt', 'md']
            const fileExtension = file.name.split('.').pop()?.toLowerCase()

            if (!fileExtension || !allowedTypes.includes(fileExtension)) {
                toast.error('Invalid file type', {
                    description: 'Please upload a PDF, DOCX, TXT, or MD file'
                })
                return
            }

            // Validate file size (20MB limit)
            if (file.size > 20 * 1024 * 1024) {
                toast.error('File too large', {
                    description: 'File size must be less than 20MB'
                })
                return
            }

            setSelectedFile(file)
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error('No file selected', {
                description: 'Please select a file to upload'
            })
            return
        }

        if (!description.trim()) {
            toast.error('Description required', {
                description: 'Please provide a description for the document'
            })
            return
        }

        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('description', description.trim())

            console.log('Starting upload...', selectedFile.name, selectedFile.size)

            await api.post('/api/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 300000, // 5 minutes for file upload
            })

            console.log('Upload successful!')
            toast.success('Document uploaded successfully!', {
                description: 'Processing your document...'
            })
            setSelectedFile(null)
            setDescription('')
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            onUploadSuccess?.()
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error('Upload failed', {
                description: error.response?.data?.detail || error.message || 'Please try again'
            })
        } finally {
            setUploading(false)
        }
    }

    const handleCancel = () => {
        setSelectedFile(null)
        setDescription('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="w-full space-y-4">
            {/* File Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document
                </label>
                <div className="flex items-center space-x-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt,.md"
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="btn-secondary flex items-center"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                    </motion.button>
                    {selectedFile && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center space-x-2 text-sm text-gray-600"
                        >
                            <FileText className="w-4 h-4" />
                            <span>{selectedFile.name}</span>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleCancel}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </motion.div>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Supports PDF, DOCX, TXT, MD files up to 20MB
                </p>
            </div>

            {/* Description Field */}
            {selectedFile && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this document contains..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Help your team understand what this document is about
                    </p>
                </motion.div>
            )}

            {/* Upload Button */}
            {selectedFile && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex space-x-3"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpload}
                        disabled={uploading || !description.trim()}
                        className="btn-primary"
                    >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancel}
                        disabled={uploading}
                        className="btn-secondary"
                    >
                        Cancel
                    </motion.button>
                </motion.div>
            )}
        </div>
    )
}