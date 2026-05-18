import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Upload, X } from 'lucide-react';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Array<{ id: number; name: string }>;
    modules: Record<string, string>;

    /**
     * Where to POST the multipart/form-data.
     * - Create: /documents
     * - Version upload: /documents/{id}/versions
     */
    submitUrl: string;

    onUploadSuccess?: () => void;

    /**
     * Optional defaults (useful for edit/version flows).
     */
    initialModule?: string;
    initialAccessLevel?: string;
    initialCategoryId?: string;

    /**
     * Optional callback fired when user changes the "Module" select.
     * Useful for switching the hosting page layout dynamically.
     */
    onModuleChange?: (moduleKey: string) => void;
}

type UploadFormState = {
    title: string;
    description: string;
    file: File | null;
    category_id: string;
    module: string;
    access_level: string;
    tags: string;
    expires_at: string;
    pinned: boolean;
};

export default function DocumentUploadModal({
    isOpen,
    onClose,
    categories,
    modules,
    submitUrl,
    onUploadSuccess,
    initialModule,
    initialAccessLevel,
    initialCategoryId,
    onModuleChange,
}: DocumentUploadModalProps) {
    const { data, setData, post, processing, errors } = useForm<UploadFormState>({
        title: '',
        description: '',
        file: null,
        category_id: initialCategoryId ?? '',
        module: initialModule ?? 'finance',
        access_level: initialAccessLevel ?? 'department',
        tags: '',
        expires_at: '',
        pinned: false,
    });

    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setData('file', e.dataTransfer.files[0]);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === 'file' && 'files' in e.target) {
            const file = (e.target as HTMLInputElement).files?.[0] || null;
            setData(name as keyof UploadFormState, file);
            return;
        }

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setData(name as keyof UploadFormState, checked);
            return;
        }

        const nextValue = value;
        setData(name as keyof UploadFormState, nextValue);

        if (name === 'module') {
            onModuleChange?.(nextValue);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(submitUrl, {
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
            category_id: initialCategoryId ?? '',
            module: initialModule ?? 'finance',
            access_level: initialAccessLevel ?? 'department',
            tags: '',
            expires_at: '',
            pinned: false,
        });
        onClose();
    };

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            role="presentation"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) handleClose();
            }}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Upload size={24} />
                        Upload Document
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
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
                                        {data.file ? data.file.name : 'Drag and drop or click to upload'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Max 512MB • Supported: Images, videos, documents, archives
                                    </p>
                                </label>
                            </div>
                            {errors.file && (
                                <p className="text-red-600 text-sm mt-2">{String(errors.file)}</p>
                            )}
                        </div>

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
                                <p className="text-red-600 text-sm mt-1">{String(errors.title)}</p>
                            )}
                        </div>

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
                                <p className="text-red-600 text-sm mt-1">{String(errors.description)}</p>
                            )}
                        </div>

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
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <p className="text-red-600 text-sm mt-1">{String(errors.category_id)}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    Department *
                                </label>
                                <select
                                    name="module"
                                    value={data.module}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    {Object.entries(modules).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                {errors.module && (
                                    <p className="text-red-600 text-sm mt-1">{String(errors.module)}</p>
                                )}
                            </div>
                        </div>

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
                                <p className="text-red-600 text-sm mt-1">{String(errors.access_level)}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Pin important document
                            </label>

                            <div className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-3">
                                <input
                                    id="pinned"
                                    type="checkbox"
                                    name="pinned"
                                    checked={data.pinned}
                                    onChange={handleChange}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="pinned" className="text-sm text-gray-700 dark:text-gray-200">
                                    Pinned documents appear first for users with access.
                                </label>
                            </div>

                            {errors.pinned && (
                                <p className="text-red-600 text-sm mt-1">{String(errors.pinned)}</p>
                            )}
                        </div>

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
                                <p className="text-red-600 text-sm mt-1">{String(errors.tags)}</p>
                            )}
                        </div>

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
                                <p className="text-red-600 text-sm mt-1">{String(errors.expires_at)}</p>
                            )}
                        </div>
                    </div>

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
