import React, { useMemo, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FileUp, Save, Upload, RotateCw } from 'lucide-react';
import { resolveDocumentLayout } from './resolveDocumentLayout';

type DocumentCategory = { id: number; name: string };
type ModulesMap = Record<string, string>;

type Props = {
    document: {
        id: number;
        title: string;
        description: string | null;
        module: string;
        category_id?: number | null;
        access_level: string;
        tags: string | null;
        expires_at: string | null;
        pinned: boolean;
        file_path: string;
        original_filename: string;
    };
    categories: DocumentCategory[];
    modules: ModulesMap;
};

function formatDateInput(dateString: string | null) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 10);
}

export default function DocumentEdit({ document, categories, modules }: Props) {
    const page = usePage<any>();
    const roles: string[] = (page?.props?.auth?.user?.roles ?? []).map(String);
    const [selectedModule] = useState(document.module);

    const {
        data: metadata,
        setData: setMetadata,
        put,
        processing: savingMetadata,
        errors: metadataErrors,
        recentlySuccessful: metadataSaved,
    } = useForm({
        title: document.title,
        description: document.description ?? '',
        category_id: document.category_id ? String(document.category_id) : '',
        access_level: document.access_level,
        tags: document.tags ?? '',
        expires_at: formatDateInput(document.expires_at),
        pinned: document.pinned ?? false,
    });

    const {
        data: versionData,
        setData: setVersionData,
        post: postVersion,
        processing: uploadingVersion,
        errors: versionErrors,
        reset: resetVersion,
    } = useForm<{
        file: File | null;
        change_log: string;
        pinned: boolean;
    }>({
        file: null,
        change_log: '',
        pinned: document.pinned ?? false,
    });

    const Layout = useMemo(
        () => resolveDocumentLayout(roles, selectedModule),
        [roles, selectedModule]
    );

    const handleMetadataSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(`/documents/${document.id}`, {
            preserveScroll: true,
        });
    };

    const handleVersionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        postVersion(`/documents/${document.id}/versions`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                resetVersion('file', 'change_log');
            },
        });
    };

    return (
        <Layout title={`Edit: ${document.title}`}>
            <Head title={`Edit: ${document.title}`} />

            <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <Link href={`/documents/${document.id}`} className="text-blue-600 hover:text-blue-700">
                            ← Back to document
                        </Link>
                        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                            Edit Document
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Update metadata or upload a new version for {document.original_filename}.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <form onSubmit={handleMetadataSubmit} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-6 flex items-center gap-2">
                            <Save size={18} className="text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Document details</h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={metadata.title}
                                    onChange={(e) => setMetadata('title', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                                {metadataErrors.title && (
                                    <p className="mt-1 text-sm text-red-600">{String(metadataErrors.title)}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Description
                                </label>
                                <textarea
                                    value={metadata.description}
                                    onChange={(e) => setMetadata('description', e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                {metadataErrors.description && (
                                    <p className="mt-1 text-sm text-red-600">{String(metadataErrors.description)}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                        Category *
                                    </label>
                                    <select
                                        value={metadata.category_id}
                                        onChange={(e) => setMetadata('category_id', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {metadataErrors.category_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {String(metadataErrors.category_id)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                        Access Level *
                                    </label>
                                    <select
                                        value={metadata.access_level}
                                        onChange={(e) => setMetadata('access_level', e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        required
                                    >
                                        <option value="private">Private</option>
                                        <option value="department">Department</option>
                                        <option value="module">Module</option>
                                        <option value="public">Public</option>
                                    </select>
                                    {metadataErrors.access_level && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {String(metadataErrors.access_level)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Tags
                                </label>
                                <input
                                    type="text"
                                    value={metadata.tags}
                                    onChange={(e) => setMetadata('tags', e.target.value)}
                                    placeholder="invoice, important, 2024"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                {metadataErrors.tags && (
                                    <p className="mt-1 text-sm text-red-600">{String(metadataErrors.tags)}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Expires At
                                </label>
                                <input
                                    type="date"
                                    value={metadata.expires_at}
                                    onChange={(e) => setMetadata('expires_at', e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                {metadataErrors.expires_at && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {String(metadataErrors.expires_at)}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                                <input
                                    id="pinned"
                                    type="checkbox"
                                    checked={metadata.pinned}
                                    onChange={(e) => setMetadata('pinned', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="pinned" className="text-sm text-gray-700 dark:text-gray-200">
                                    Pin this document to keep it near the top of the documents list.
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={savingMetadata}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {savingMetadata ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {metadataSaved && (
                            <p className="mt-3 text-sm font-medium text-green-600">Changes saved successfully.</p>
                        )}
                    </form>

                    <form
                        onSubmit={handleVersionSubmit}
                        className="rounded-lg bg-white p-6 shadow dark:bg-gray-800"
                    >
                        <div className="mb-6 flex items-center gap-2">
                            <FileUp size={18} className="text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upload new version</h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    File *
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setVersionData('file', e.target.files?.[0] ?? null)}
                                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                />
                                {versionErrors.file && (
                                    <p className="mt-1 text-sm text-red-600">{String(versionErrors.file)}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                    Change log
                                </label>
                                <textarea
                                    value={versionData.change_log}
                                    onChange={(e) => setVersionData('change_log', e.target.value)}
                                    rows={4}
                                    placeholder="Describe what changed in this version"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                {versionErrors.change_log && (
                                    <p className="mt-1 text-sm text-red-600">{String(versionErrors.change_log)}</p>
                                )}
                            </div>

                            <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                                <input
                                    id="version-pinned"
                                    type="checkbox"
                                    checked={versionData.pinned}
                                    onChange={(e) => setVersionData('pinned', e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="version-pinned" className="text-sm text-gray-700 dark:text-gray-200">
                                    Keep this document pinned after uploading the new version.
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={uploadingVersion}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Upload size={18} />
                                {uploadingVersion ? 'Uploading...' : 'Upload Version'}
                            </button>
                            <button
                                type="button"
                                onClick={() => resetVersion()}
                                className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                            >
                                <RotateCw size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
