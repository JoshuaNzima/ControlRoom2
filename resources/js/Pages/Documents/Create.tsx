import React, { useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import DocumentUploadModal from '@/Components/DocumentUploadModal';
import { resolveDocumentLayout } from './resolveDocumentLayout';

type DocumentCategory = { id: number; name: string };

type ModulesMap = Record<string, string>;

type CreateProps = {
    categories: DocumentCategory[];
    modules: ModulesMap;
};

export default function DocumentsCreate({ categories, modules }: CreateProps) {
    const page = usePage<any>();
    const roles: string[] = (page?.props?.auth?.user?.roles ?? []).map(String);
    const [selectedModule, setSelectedModule] = useState<string>('finance');

    const Layout = useMemo(
        () => resolveDocumentLayout(roles, selectedModule),
        [roles, selectedModule]
    );

    return (
        <Layout title="Upload Document">
            <Head title="Upload Document" />
            <div className="p-4">
                <DocumentUploadModal
                    isOpen={true}
                    onClose={() => {
                        // noop (modal is always open on this page)
                    }}
                    categories={categories}
                    modules={modules}
                    submitUrl="/documents"
                    initialModule={selectedModule}
                    onModuleChange={setSelectedModule}
                    onUploadSuccess={() => {
                        window.location.href = '/documents';
                    }}
                />
            </div>
        </Layout>
    );
}
