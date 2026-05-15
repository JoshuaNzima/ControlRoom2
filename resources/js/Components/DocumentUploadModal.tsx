import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Upload, X } from 'lucide-react';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Array<{ id: number; name: string }>;
    modules: Record<string, string>;
    onUploadSuccess?: () => void;
}

export default function DocumentUploadModal({ 
    isOpen, 
    onClose, 
    categories, 
    modules, 
    onUploadSuccess 
}: DocumentUploadModalProps) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        file: null as File | null,
        category_id: '',
        module: 'finance',
        access_level: 'department',
        tags: '',
        expires_at: '',
    });

    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData('file', e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'file' && 'files' in e.target) {
            setData(name as keyof typeof data, (e.target as HTMLInputElement).files?.[0] || null);
        } else {
            setData(name as keyof typeof data, value);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/documents', {
            forceFormData: true,
            onSuccess: () => {
                onUploadSuccess?.();
                handleClose();
            },
        });
    };

    const handleClose = () => {
        setData({
            title: '',
            description: '',
            file: null,
            category_id: '',
            module: 'finance',
            access_level: 'department',
            tags: '',
            expires_at: '',
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Upload size={24} />
                        Upload Document
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                Document *
                            </label>
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                                    dragActive
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                            >
                                <input
                                    type="file"
                                    name="file"
                                    onChange={handleChange}
                                    className="hidden"
                                    id="file-upload"
                                    accept=".jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                                    required
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="text-4xl mb-2">📁</div>
                                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                        {data.file ? (data.file as any).name : 'Drag and drop or click to upload'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Max 512MB • Supported: Images, videos, documents, archives
                                    </p>
                                </label>
                            </div>
                            {errors.file && (
                                <p className="text-red-600 text-sm mt-2">{errors.file}</p>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={data.title}
                                onChange={handleChange}
                                placeholder="Enter document title"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            />
                            {errors.title && (
                                <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={data.description}
                                onChange={handleChange}
                                placeholder="Optional description"
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.description && (
                                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                            )}
                        </div>

                        {/* Category and Module */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category_id"
                                    value={data.category_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories?.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="text-red-600 text-sm mt-1">{errors.category_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Module *
                                </label>
                                <select
                                    name="module"
                                    value={data.module}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    {Object.entries(modules || {}).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                {errors.module && (
                                    <p className="text-red-600 text-sm mt-1">{errors.module}</p>
                                )}
                            </div>
                        </div>

                        {/* Access Level */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Access Level *
                            </label>
                            <select
                                name="access_level"
                                value={data.access_level}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="private">Private (Only you)</option>
                                <option value="department">Department</option>
                                <option value="module">Module</option>
                                <option value="public">Public</option>
                            </select>
                            {errors.access_level && (
                                <p className="text-red-600 text-sm mt-1">{errors.access_level}</p>
                            )}
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={data.tags}
                                onChange={handleChange}
                                placeholder="e.g. invoice, important, 2024"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.tags && (
                                <p className="text-red-600 text-sm mt-1">{errors.tags}</p>
                            )}
                        </div>

                        {/* Expiration */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Expires At (Optional)
                            </label>
                            <input
                                type="date"
                                name="expires_at"
                                value={data.expires_at}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.expires_at && (
                                <p className="text-red-600 text-sm mt-1">{errors.expires_at}</p>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Upload size={18} />
                            {processing ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
