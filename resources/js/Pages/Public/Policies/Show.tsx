import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

export default function PublicPolicyShow() {
  const { policy } = usePage().props as any;
  return (
    <PublicLayout title={policy?.title || 'Policy'}>
      <Head title={policy?.title || 'Policy'} />
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <Link href={route('public.policies.index')} className="inline-flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400">
                <IconMapper name="ArrowLeft" className="w-4 h-4" /> Back to Policies
              </Link>
            </div>
            {policy?.category && (
              <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">{policy.category.name}</div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{policy?.title}</h1>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {policy?.version ? `v${policy.version} · ` : ''}{policy?.effective_date || '-'}
          </div>

          {policy?.summary && (
            <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300">
              {policy.summary}
            </div>
          )}

          <article className="prose prose-sm sm:prose dark:prose-invert max-w-none mt-6">
            {policy?.content ? (
              <div dangerouslySetInnerHTML={{ __html: policy.content }} />
            ) : (
              <p>No content provided.</p>
            )}
          </article>

          {(policy?.files || []).length > 0 && (
            <div className="mt-8">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Attachments</div>
              <div className="space-y-2">
                {(policy.files || []).map((f: any) => (
                  <a key={f.id} href={f.url} target="_blank" className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                      <IconMapper name="FileText" className="w-4 h-4" />
                      <span className="truncate">{f.filename}</span>
                    </div>
                    <IconMapper name="ArrowRight" className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
