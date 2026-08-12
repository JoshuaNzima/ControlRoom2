import React, { useMemo, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Download, Share2, MessageSquare, History, Edit, Trash2, X, Plus } from 'lucide-react';
import { resolveDocumentLayout } from './resolveDocumentLayout';

interface DocumentData {
    id: number;
    title: string;
    description: string | null;
    file_path: string;
    file_type: string;
    module: string;
    category?: { name: string };
    uploader?: { name: string };
    created_at: string;
    file_size: number;
    access_level: string;
    download_count: number;
    tags: string | null;
    comments?: Array<{ id: number; user?: { name: string }; created_at: string; comment: string }>;
    versions?: Array<{ id: number; version_number: number; created_at: string; change_log: string | null }>;
    shares?: Array<{ id: number; user?: { name: string }; permission: string }>;
}

interface ShareableUser {
    id: number;
    name: string;
    email: string;
}

interface DocumentShowProps {
    document: DocumentData;
    isOwner: boolean;
    permission: string;
    shareableUsers: ShareableUser[];
}

export default function DocumentShow({
    document,
    isOwner,
    permission,
    shareableUsers,
}: DocumentShowProps) {
    const page = usePage<any>();
    const roles: string[] = (page?.props?.auth?.user?.roles ?? []).map(String);

    const [showCommentForm, setShowCommentForm] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [showShareForm, setShowShareForm] = useState(false);

    const {
        data: commentData,
        setData: setCommentData,
        post: postComment,
        processing: postingComment,
        errors: commentErrors,
        reset: resetComment,
    } = useForm({ comment: '' });

    const {
        data: shareData,
        setData: setShareData,
        post: postShare,
        processing: sharingDocument,
        errors: shareErrors,
        reset: resetShare,
    } = useForm({ user_id: '', permission: 'view' });

    const { delete: destroy } = useForm();

    const handleAddComment = () => {
        postComment(`/documents/${document.id}/comments`, {
            preserveScroll: true,
            onSuccess: () => {
                resetComment();
                setShowCommentForm(false);
            },
        });
    };

    const handleShareDocument = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        postShare(`/documents/${document.id}/share`, {
            preserveScroll: true,
            onSuccess: () => {
                resetShare();
                setShowShareForm(false);
            },
        });
    };

    const handleDownload = () => {
        window.location.href = `/documents/${document.id}/download`;
    };

    const getAccessLabel = () => {
        const labels: Record<string, string> = {
            private: 'Private',
            department: 'Department',
            module: 'Module',
            public: 'Public',
        };
        return labels[document.access_level] || 'Private';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const Layout = useMemo(
        () => resolveDocumentLayout(roles, document.module),
        [roles, document.module]
    );

    return (
        <Layout title={document.title}>
            <Head title={document.title} />

            <div className="px-6 py-8">
                <div className="mb-8">
                    <Link href="/documents" className="mb-4 inline-block text-blue-600 hover:text-blue-700">
                        ← Back to Documents
                    </Link>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                                {document.title}
                            </h1>
                            <p className="mb-4 text-gray-600 dark:text-gray-400">
                                {document.description}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Uploaded by {document.uploader?.name}</span>
                                <span>•</span>
                                <span>{formatDate(document.created_at)}</span>
                                <span>•</span>
                                <span>{formatFileSize(document.file_size)}</span>
                            </div>
                        </div>

                        {isOwner && (
                            <div className="flex gap-2">
                                <Link
                                    href={route('documents.index', { modal: 'edit', document: document.id })}
                                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                                >
                                    <Edit size={18} />
                                    Edit
                                </Link>
                                <Link
                                    href={route('documents.index', { modal: 'delete', document: document.id })}
                                    className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                                >
                                    <Trash2 size={18} />
                                    Delete
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                {document.file_type === 'image' && (
                                    <img
                                        src={`/storage/${document.file_path}`}
                                        alt={document.title}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                )}
                                {document.file_type === 'video' && (
                                    <video
                                        src={`/storage/${document.file_path}`}
                                        controls
                                        className="max-h-full max-w-full"
                                    />
                                )}
                                {!['image', 'video'].includes(document.file_type) && (
                                    <div className="text-center">
                                        <div className="mb-4 text-6xl">
                                            {document.file_type === 'document' ? '📄' : '📎'}
                                        </div>
                                        <p className="mb-4 text-gray-600 dark:text-gray-400">
                                            Preview not available
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleDownload}
                                            className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                                        >
                                            <Download size={18} />
                                            Download to View
                                        </button>
                                    </div>
                                )}
                            </div>

                            {(document.file_type === 'image' || document.file_type === 'video') && (
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                                >
                                    <Download size={18} />
                                    Download
                                </button>
                            )}
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                                    <MessageSquare size={20} />
                                    Comments ({document.comments?.length || 0})
                                </h2>
                                {permission === 'view' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCommentForm(!showCommentForm)}
                                        className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
                                    >
                                        <Plus size={16} />
                                        Add Comment
                                    </button>
                                )}
                            </div>

                            {showCommentForm && (
                                <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                    <textarea
                                        value={commentData.comment}
                                        onChange={(e) => setCommentData('comment', e.target.value)}
                                        placeholder="Add a comment..."
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                    {commentErrors.comment && (
                                        <p className="mt-2 text-sm text-red-600">{String(commentErrors.comment)}</p>
                                    )}
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddComment}
                                            disabled={postingComment}
                                            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {postingComment ? 'Posting...' : 'Post Comment'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCommentForm(false)}
                                            className="rounded-lg bg-gray-300 px-4 py-2 text-gray-900 transition hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {document.comments?.map((comment) => (
                                    <div key={comment.id} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                        <div className="mb-2 flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {comment.user?.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(comment.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {comment.comment}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                                Information
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">Category</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {document.category?.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">Access Level</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {getAccessLabel()}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">Module</p>
                                    <p className="font-semibold capitalize text-gray-900 dark:text-white">
                                        {document.module.replace(/_/g, ' ')}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-600 dark:text-gray-400">Downloads</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {document.download_count || 0}
                                    </p>
                                </div>

                                {document.tags && (
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">Tags</p>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {document.tags.split(',').map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                >
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {permission === 'edit' && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                                    Actions
                                </h3>

                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowShareForm(!showShareForm)}
                                        className="flex w-full items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                                    >
                                        <Share2 size={18} />
                                        Share Document
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowVersions(!showVersions)}
                                        className="flex w-full items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    >
                                        <History size={18} />
                                        Version History
                                    </button>
                                </div>

                                {showShareForm && (
                                    <form onSubmit={handleShareDocument} className="mt-4 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                                Share with
                                            </label>
                                            <select
                                                value={shareData.user_id}
                                                onChange={(e) => setShareData('user_id', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                                required
                                            >
                                                <option value="">Select a user</option>
                                                {shareableUsers.map((user) => (
                                                    <option key={user.id} value={String(user.id)}>
                                                        {user.name} ({user.email})
                                                    </option>
                                                ))}
                                            </select>
                                            {shareErrors.user_id && (
                                                <p className="mt-1 text-sm text-red-600">{String(shareErrors.user_id)}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                                Permission
                                            </label>
                                            <select
                                                value={shareData.permission}
                                                onChange={(e) => setShareData('permission', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                            >
                                                <option value="view">View</option>
                                                <option value="edit">Edit</option>
                                            </select>
                                            {shareErrors.permission && (
                                                <p className="mt-1 text-sm text-red-600">{String(shareErrors.permission)}</p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={sharingDocument}
                                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {sharingDocument ? 'Sharing...' : 'Share'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowShareForm(false)}
                                                className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-semibold text-gray-900 transition hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {showVersions && document.versions && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                        <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                                            Versions
                                        </p>
                                        <div className="space-y-2">
                                            {document.versions.map((version) => (
                                                <div
                                                    key={version.id}
                                                    className="rounded border border-gray-200 bg-white p-2 text-xs dark:border-gray-500 dark:bg-gray-600"
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        v{version.version_number}
                                                    </div>
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        {formatDate(version.created_at)}
                                                    </div>
                                                    {version.change_log && (
                                                        <div className="mt-1 text-gray-600 dark:text-gray-400">
                                                            {version.change_log}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {document.shares && document.shares.length > 0 && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                                    Shared With
                                </h3>

                                <div className="space-y-2">
                                    {document.shares.map((share) => (
                                        <div
                                            key={share.id}
                                            className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-700"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {share.user?.name}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {share.permission === 'view' ? '👁️ View' : '✏️ Edit'}
                                                </p>
                                            </div>
                                            {permission === 'edit' && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        destroy(`/documents/${document.id}/shares/${share.id}`, {
                                                            onSuccess: () => window.location.reload(),
                                                        });
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
