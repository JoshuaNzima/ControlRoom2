import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Search, Upload, Filter } from 'lucide-react';
import DocumentUploadModal from '@/Components/DocumentUploadModal';
import { resolveDocumentLayout } from './resolveDocumentLayout';

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
    fileTypes,
}: DocumentsIndexProps) {
    const page = usePage<any>();
    const roles: string[] = (page?.props?.auth?.user?.roles ?? []).map(String);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedFileType, setSelectedFileType] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedModuleForUpload, setSelectedModuleForUpload] = useState<string>('finance');

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
            image: '🖼️',
            video: '🎥',
            document: '📄',
            archive: '📦',
        };

        return icons[fileType] || '📎';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
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
            <span className={`rounded px-2 py-1 text-xs font-semibold ${colors[accessLevel] || colors.private}`}>
                {labels[accessLevel] || 'Private'}
            </span>
        );
    };

    const Layout = useMemo(
        () => resolveDocumentLayout(roles, selectedModule || undefined),
        [roles, selectedModule]
    );

    return (
        <Layout title="Documents">
            <Head title="Documents" />

            <div className="px-6 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                            Documents
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {documents.total} documents available
                        </p>
                    </div>

                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                    >
                        <Upload size={18} />
                        Upload Document
                    </button>
                </div>

                <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="col-span-full md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={String(cat.id)}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedFileType}
                            onChange={(e) => setSelectedFileType(e.target.value)}
                            className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Types</option>
                            {Object.entries(fileTypes).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">All Modules</option>
                            {Object.entries(modules).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="most_downloaded">Most Downloaded</option>
                            <option value="name">Name</option>
                        </select>

                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                        >
                            <Filter size={18} />
                            Apply
                        </button>
                    </form>
                </div>

                {documents.data.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {documents.data.map((doc) => (
                            <Link
                                key={doc.id}
                                href={`/documents/${doc.id}`}
                                className="group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg dark:bg-gray-800"
                            >
                                <div className="relative flex aspect-video items-center justify-center bg-gray-100 transition group-hover:bg-gray-200 dark:bg-gray-700 dark:group-hover:bg-gray-600">
                                    {doc.file_type === 'image' ? (
                                        <img
                                            src={`/storage/${doc.file_path}`}
                                            alt={doc.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : doc.file_type === 'video' ? (
                                        <video
                                            src={`/storage/${doc.file_path}`}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-4xl">{getFileIcon(doc.file_type)}</div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900 dark:text-white">
                                        {doc.title}
                                    </h3>

                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {getAccessBadge(doc.access_level)}
                                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                            {doc.category?.name}
                                        </span>
                                    </div>

                                    <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                        {doc.description}
                                    </p>

                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>{formatFileSize(doc.file_size)}</span>
                                        <span>{doc.download_count || 0} downloads</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-600 dark:text-gray-400">
                            No documents found. Try adjusting your filters or upload a new document.
                        </p>
                    </div>
                )}

                {documents.last_page > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {documents.links?.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                className={`rounded px-4 py-2 ${
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                <DocumentUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    categories={categories}
                    modules={modules}
                    submitUrl="/documents"
                    initialModule={selectedModuleForUpload}
                    onModuleChange={setSelectedModuleForUpload}
                    onUploadSuccess={() => {
                        setIsUploadModalOpen(false);
                        window.location.href = '/documents';
                    }}
                />
            </div>
        </Layout>
    );
}
