import React, { useState } from 'react';
import { Head, Link, usePage, useForm } from '@inertiajs/react';
import { Download, Share2, MessageSquare, History, Lock, Edit, Trash2, X, Plus } from 'lucide-react';
import Layout from '@/Layouts/AppLayout';

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

interface DocumentShowProps {
    document: DocumentData;
    isOwner: boolean;
    permission: string;
}

export default function DocumentShow({ document, isOwner, permission }: DocumentShowProps) {
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [showShareForm, setShowShareForm] = useState(false);
    const [commentText, setCommentText] = useState('');

    const { post, delete: destroy } = useForm();

    const handleAddComment = () => {
        post(`/documents/${document.id}/comments`, {
            onSuccess: () => {
                setCommentText('');
                setShowCommentForm(false);
                window.location.reload();
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
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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

    return (
        <Layout>
            <Head title={document.title} />

            <div className="px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/documents" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
                        ← Back to Documents
                    </Link>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {document.title}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {document.description}
                            </p>
                            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                                    href={`/documents/${document.id}/edit`}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Edit size={18} />
                                    Edit
                                </Link>
                                <button
                                    onClick={() => destroy(`/documents/${document.id}`, {
                                        onSuccess: () => window.location.href = '/documents',
                                    })}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                >
                                    <Trash2 size={18} />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                                {document.file_type === 'image' && (
                                    <img
                                        src={`/storage/${document.file_path}`}
                                        alt={document.title}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                )}
                                {document.file_type === 'video' && (
                                    <video
                                        src={`/storage/${document.file_path}`}
                                        controls
                                        className="max-w-full max-h-full"
                                    />
                                )}
                                {!['image', 'video'].includes(document.file_type) && (
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">
                                            {document.file_type === 'document' ? '📄' : '📎'}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                                            Preview not available
                                        </p>
                                        <button
                                            onClick={handleDownload}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mx-auto"
                                        >
                                            <Download size={18} />
                                            Download to View
                                        </button>
                                    </div>
                                )}
                            </div>

                            {(document.file_type === 'image' || document.file_type === 'video') && (
                                <button
                                    onClick={handleDownload}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Download size={18} />
                                    Download
                                </button>
                            )}
                        </div>

                        {/* Comments */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MessageSquare size={20} />
                                    Comments ({document.comments?.length || 0})
                                </h2>
                                {permission === 'view' && (
                                    <button
                                        onClick={() => setShowCommentForm(!showCommentForm)}
                                        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                    >
                                        <Plus size={16} />
                                        Add Comment
                                    </button>
                                )}
                            </div>

                            {showCommentForm && (
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder="Add a comment..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={handleAddComment}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Post Comment
                                        </button>
                                        <button
                                            onClick={() => setShowCommentForm(false)}
                                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {document.comments?.map((comment: any) => (
                                    <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
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

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Document Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
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
                                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
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
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {document.tags.split(',').map((tag: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                                                >
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {isOwner && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                    Actions
                                </h3>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => setShowShareForm(!showShareForm)}
                                        className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        <Share2 size={18} />
                                        Share Document
                                    </button>

                                    <button
                                        onClick={() => setShowVersions(!showVersions)}
                                        className="w-full flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                    >
                                        <History size={18} />
                                        Version History
                                    </button>
                                </div>

                                {showVersions && document.versions && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                            Versions
                                        </p>
                                        <div className="space-y-2">
                                            {document.versions?.map((version: any) => (
                                                <div
                                                    key={version.id}
                                                    className="text-xs p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500"
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        v{version.version_number}
                                                    </div>
                                                    <div className="text-gray-600 dark:text-gray-400">
                                                        {formatDate(version.created_at)}
                                                    </div>
                                                    {version.change_log && (
                                                        <div className="text-gray-600 dark:text-gray-400 mt-1">
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

                        {/* Shared With */}
                        {document.shares && document.shares.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                    Shared With
                                </h3>

                                <div className="space-y-2">
                                    {document.shares.map((share: any) => (
                                        <div
                                            key={share.id}
                                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {share.user?.name}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {share.permission === 'view' ? '👁️ View' : '✏️ Edit'}
                                                </p>
                                            </div>
                                            {isOwner && (
                                                <button
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
