import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Search, Upload, Grid, Filter, Download, Eye, Lock, Share2, MoreVertical } from 'lucide-react';
import Layout from '@/Layouts/AppLayout';

interface DocumentCategory {
    id: number;
    name: string;
}

interface Document {
    id: number;
    title: string;
    description: string | null;
    file_path: string;
    file_type: string;
    category?: DocumentCategory;
    access_level: string;
    file_size: number;
    download_count: number;
}

interface DocumentsIndexProps {
    documents: {
        data: Document[];
        total: number;
        last_page: number;
        links: Array<{ url?: string; label: string; active: boolean }>;
    };
    categories: DocumentCategory[];
    modules: Record<string, string>;
    fileTypes: Record<string, string>;
}

export default function DocumentsIndex({ 
    documents, 
    categories, 
    modules, 
    fileTypes 
}: DocumentsIndexProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedFileType, setSelectedFileType] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedFileType) params.append('file_type', selectedFileType);
        if (selectedModule) params.append('module', selectedModule);
        if (sortBy) params.append('sort', sortBy);
        
        window.location.href = `/documents?${params.toString()}`;
    };

    const getFileIcon = (fileType: string) => {
        const icons: Record<string, string> = {
            'image': '🖼️',
            'video': '🎥',
            'document': '📄',
            'archive': '📦',
        };
        return icons[fileType] || '📎';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getAccessBadge = (accessLevel: string) => {
        const colors: Record<string, string> = {
            private: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            department: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            module: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            public: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
        
        const labels: Record<string, string> = {
            private: 'Private',
            department: 'Department',
            module: 'Module',
            public: 'Public',
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[accessLevel] || colors.private}`}>
                {labels[accessLevel] || 'Private'}
            </span>
        );
    };

    return (
        <Layout>
            <Head title="Documents" />
            
            <div className="px-6 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Documents
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {documents.total} documents available
                        </p>
                    </div>
                    <Link
                        href="/documents/create"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Upload size={18} />
                        Upload Document
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="col-span-full md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat: DocumentCategory) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>

                        {/* File Type Filter */}
                        <select
                            value={selectedFileType}
                            onChange={(e) => setSelectedFileType(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Types</option>
                            {Object.entries(fileTypes).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        {/* Module Filter */}
                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Modules</option>
                            {Object.entries(modules).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="most_downloaded">Most Downloaded</option>
                            <option value="name">Name</option>
                        </select>

                        {/* Apply Button */}
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            <Filter size={18} />
                            Apply
                        </button>
                    </div>
                </div>

                {/* Documents Grid */}
                {documents.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {documents.data.map((doc: Document) => (
                            <Link
                                key={doc.id}
                                href={`/documents/${doc.id}`}
                                className="group bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                            >
                                <div className="relative bg-gray-100 dark:bg-gray-700 aspect-video flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition">
                                    {doc.file_type === 'image' ? (
                                        <img
                                            src={`/storage/${doc.file_path}`}
                                            alt={doc.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : doc.file_type === 'video' ? (
                                        <video
                                            src={`/storage/${doc.file_path}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-4xl">{getFileIcon(doc.file_type)}</div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                        {doc.title}
                                    </h3>

                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        {getAccessBadge(doc.access_level)}
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                            {doc.category?.name}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                        {doc.description}
                                    </p>

                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                                        <span>{formatFileSize(doc.file_size)}</span>
                                        <span>{doc.download_count || 0} downloads</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            No documents found. Try adjusting your filters or upload a new document.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {documents.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {documents.links?.map((link: any, idx: number) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                className={`px-4 py-2 rounded ${
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
