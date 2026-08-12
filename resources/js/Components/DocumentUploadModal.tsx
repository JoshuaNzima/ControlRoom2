import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Pencil, Upload, X } from 'lucide-react';
import Modal from '@/Components/Modal';

interface DocumentUploadModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    onClose: () => void;
    categories: Array<{ id: number; name: string }>;
    modules: Record<string, string>;

    /**
     * Where to POST / PUT the document payload.
     * - Create: /documents
     * - Edit: /documents/{id}
     */
    submitUrl: string;

    onSuccess?: () => void;

    /**
     * Optional defaults (useful for create or edit flows).
     */
    initialModule?: string;
    initialAccessLevel?: string;
    initialCategoryId?: string;

    initialValues?: Partial<UploadFormState>;

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

function buildInitialState(props: Pick<DocumentUploadModalProps, 'initialModule' | 'initialAccessLevel' | 'initialCategoryId' | 'initialValues'>): UploadFormState {
    return {
        title: props.initialValues?.title ?? '',
        description: props.initialValues?.description ?? '',
        file: props.initialValues?.file ?? null,
        category_id: props.initialValues?.category_id ?? props.initialCategoryId ?? '',
        module: props.initialValues?.module ?? props.initialModule ?? 'finance',
        access_level: props.initialValues?.access_level ?? props.initialAccessLevel ?? 'department',
        tags: props.initialValues?.tags ?? '',
        expires_at: props.initialValues?.expires_at ?? '',
        pinned: props.initialValues?.pinned ?? false,
    };
}

export default function DocumentUploadModal({
    open,
    mode,
    onClose,
    categories,
    modules,
    submitUrl,
    onSuccess,
    initialModule,
    initialAccessLevel,
    initialCategoryId,
    initialValues,
    onModuleChange,
}: DocumentUploadModalProps) {
    const initialState = useMemo(
        () =>
            buildInitialState({
                initialModule,
                initialAccessLevel,
                initialCategoryId,
                initialValues,
            }),
        [initialModule, initialAccessLevel, initialCategoryId, initialValues]
    );

    const { data, setData, post, put, processing, errors, reset } = useForm<UploadFormState>(initialState);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (!open) return;
        reset();
        setData(initialState);
    }, [open, initialState, reset, setData]);

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

        setData(name as keyof UploadFormState, value);

        if (name === 'module') {
            onModuleChange?.(value);
        }
    };

    const handleClose = () => {
        reset();
        setData(initialState);
        setDragActive(false);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onSuccess?.();
                handleClose();
            },
        };

        if (mode === 'create') {
            post(submitUrl, {
                ...options,
                forceFormData: true,
            });
            return;
        }

        put(submitUrl, options);
    };

    const title = mode === 'create' ? 'Upload Document' : 'Edit Document';
    const icon = mode === 'create' ? <Upload size={24} /> : <Pencil size={24} />;

    return (
        <Modal show={open} onClose={handleClose} maxWidth="2xl">
            <div className="bg-white dark:bg-gray-800">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        {icon}
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-6">
                        {mode === 'create' && (
                            <div>
                                <label className="mb-3 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Document *
                                </label>
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
                                        dragActive
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={handleChange}
                                        className="hidden"
                                        id="document-file-upload"
                                        accept=".jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                                        required
                                    />
                                    <label htmlFor="document-file-upload" className="cursor-pointer">
                                        <div className="mb-2 text-4xl">📁</div>
                                        <p className="mb-1 font-semibold text-gray-900 dark:text-white">
                                            {data.file ? data.file.name : 'Drag and drop or click to upload'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Max 512MB • Supported: Images, videos, documents, archives
                                        </p>
                                    </label>
                                </div>
                                {errors.file && (
                                    <p className="mt-2 text-sm text-red-600">{String(errors.file)}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={data.title}
                                onChange={handleChange}
                                placeholder="Enter document title"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600">{String(errors.title)}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={data.description}
                                onChange={handleChange}
                                placeholder="Optional description"
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600">{String(errors.description)}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Category *
                                </label>
                                <select
                                    name="category_id"
                                    value={data.category_id}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                                    <p className="mt-1 text-sm text-red-600">
                                        {String(errors.category_id)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Module *
                                </label>
                                <select
                                    name="module"
                                    value={data.module}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    {Object.entries(modules).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                {errors.module && (
                                    <p className="mt-1 text-sm text-red-600">{String(errors.module)}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                Access Level *
                            </label>
                            <select
                                name="access_level"
                                value={data.access_level}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                required
                            >
                                <option value="private">Private (Only you)</option>
                                <option value="department">Department</option>
                                <option value="module">Module</option>
                                <option value="public">Public</option>
                            </select>
                            {errors.access_level && (
                                <p className="mt-1 text-sm text-red-600">
                                    {String(errors.access_level)}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                Pin important document
                            </label>

                            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
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
                                <p className="mt-1 text-sm text-red-600">{String(errors.pinned)}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                Tags (comma-separated)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={data.tags}
                                onChange={handleChange}
                                placeholder="e.g. invoice, important, 2024"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.tags && (
                                <p className="mt-1 text-sm text-red-600">{String(errors.tags)}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                Expires At (Optional)
                            </label>
                            <input
                                type="date"
                                name="expires_at"
                                value={data.expires_at}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.expires_at && (
                                <p className="mt-1 text-sm text-red-600">
                                    {String(errors.expires_at)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-900 transition hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {mode === 'create' ? <Upload size={18} /> : <Pencil size={18} />}
                            {processing ? (mode === 'create' ? 'Uploading...' : 'Saving...') : (mode === 'create' ? 'Upload' : 'Save Changes')}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
