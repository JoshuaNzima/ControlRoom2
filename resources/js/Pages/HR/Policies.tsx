import React from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';

export default function HRPolicies() {
  const { auth, categories = [], policies, filters = {} } = usePage().props as any;
  const [openPolicy, setOpenPolicy] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<any | null>(null);
  const [openCategory, setOpenCategory] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<any | null>(null);

  const [flt, setFlt] = React.useState<any>({
    q: filters.q || '',
    category_id: filters.category_id || '',
    published: filters.published ?? '',
    perPage: filters.perPage || 15,
  });

  React.useEffect(() => {
    setFlt({ q: filters.q || '', category_id: filters.category_id || '', published: filters.published ?? '', perPage: filters.perPage || 15 });
  }, [filters]);

  const applyFilters = () => {
    router.get(route('hr.policies.index'), { ...flt }, { preserveState: true, replace: true, preserveScroll: true });
  };
  const resetFilters = () => {
    const base = { q: '', category_id: '', published: '', perPage: 15 } as any;
    setFlt(base);
    router.get(route('hr.policies.index'), base, { preserveState: true, replace: true, preserveScroll: true });
  };

  const togglePublish = (p: any) => {
    router.post(route('hr.policies.toggle', { policy: p.id }), {}, { preserveScroll: true });
  };
  const delPolicy = (p: any) => {
    if (!confirm('Delete policy?')) return;
    router.delete(route('hr.policies.destroy', { policy: p.id }), { preserveScroll: true });
  };

  const delCategory = (c: any) => {
    if (!confirm('Delete category?')) return;
    router.delete(route('hr.policy-categories.destroy', { category: c.id }), { preserveScroll: true });
  };

  return (
    <AuthenticatedLayout header="HR - Policies" user={auth?.user as any}>
      <Head title="Policies" />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Policies</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage internal policies and choose which ones are public.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditingCategory(null); setOpenCategory(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white">
                <IconMapper name="FolderPlus" className="w-4 h-4" /> New Category
              </button>
              <button onClick={() => { setEditingPolicy(null); setOpenPolicy(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                <IconMapper name="FilePlus2" className="w-4 h-4" /> New Policy
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="col-span-2 sm:col-span-3">
                <input placeholder="Search policies..." value={flt.q} onChange={(e) => setFlt((s: any) => ({ ...s, q: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
              </div>
              <select value={flt.category_id} onChange={(e) => setFlt((s: any) => ({ ...s, category_id: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All categories</option>
                {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={flt.published} onChange={(e) => setFlt((s: any) => ({ ...s, published: e.target.value }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                <option value="">All</option>
                <option value="1">Published</option>
                <option value="0">Draft</option>
              </select>
              <select value={flt.perPage} onChange={(e) => setFlt((s: any) => ({ ...s, perPage: Number(e.target.value) }))} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                {[10,15,20,30].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <div className="flex items-center gap-2">
                <button onClick={applyFilters} className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white w-full">Apply</button>
                <button onClick={resetFilters} className="px-3 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 w-full">Reset</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Policies</div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {(!policies || (policies.data || []).length === 0) && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 py-6">No policies found.</div>
                )}
                {(policies?.data || []).map((p: any) => (
                  <div key={p.id} className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.title}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{p.category?.name || 'Uncategorized'} · {p.version ? `v${p.version} · ` : ''}{p.effective_date || '-'}</div>
                        {p.summary && <div className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{p.summary}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${p.published ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{p.published ? 'Published' : 'Draft'}</span>
                        <button onClick={() => togglePublish(p)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs"><IconMapper name="Globe" className="w-3 h-3" /> Toggle</button>
                        <button onClick={() => { setEditingPolicy(p); setOpenPolicy(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs"><IconMapper name="Pencil" className="w-3 h-3" /> Edit</button>
                        <button onClick={() => delPolicy(p)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs"><IconMapper name="Trash" className="w-3 h-3" /> Del</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {policies && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Page {policies.current_page} of {policies.last_page}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={!policies.prev_page_url} onClick={() => router.visit(policies.prev_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Prev</button>
                    <button disabled={!policies.next_page_url} onClick={() => router.visit(policies.next_page_url, { preserveState: true, replace: true, preserveScroll: true })} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">Next</button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                <span>Categories</span>
                <button onClick={() => { setEditingCategory(null); setOpenCategory(true); }} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs"><IconMapper name="Plus" className="w-3 h-3" /> New</button>
              </div>
              <div className="space-y-2">
                {(categories || []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{c.slug}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditingCategory(c); setOpenCategory(true); }} className="px-2 py-1 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">Edit</button>
                      <button onClick={() => delCategory(c)} className="px-2 py-1 text-[10px] rounded bg-rose-600 text-white">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PolicyModal open={openPolicy} onClose={() => setOpenPolicy(false)} categories={categories} policy={editingPolicy} />
          <CategoryModal open={openCategory} onClose={() => setOpenCategory(false)} category={editingCategory} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

function BasicEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);
  const exec = (cmd: string) => document.execCommand(cmd, false);
  const onInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };
  return (
    <div className="border rounded-md dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-2 px-2 py-1 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button type="button" onClick={() => exec('bold')} className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100">B</button>
        <button type="button" onClick={() => exec('italic')} className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100">I</button>
        <button type="button" onClick={() => exec('underline')} className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100">U</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100">• List</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100">1. List</button>
        <button type="button" onClick={() => exec('removeFormat')} className="ml-auto px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100">Clear</button>
      </div>
      <div
        ref={ref}
        onInput={onInput}
        className="min-h-[160px] p-3 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 prose-sm prose dark:prose-invert"
        contentEditable
        suppressContentEditableWarning
      />
    </div>
  );
}

function PolicyModal({ open, onClose, categories, policy }: { open: boolean; onClose: () => void; categories: any[]; policy: any | null }) {
  const isEdit = !!policy;
  const form: any = useForm<any>({
    hr_policy_category_id: policy?.category?.id || policy?.hr_policy_category_id || '',
    title: policy?.title || '',
    slug: policy?.slug || '',
    version: policy?.version || '',
    effective_date: policy?.effective_date || '',
    published: policy?.published ?? false,
    summary: policy?.summary || '',
    content: policy?.content || '',
  } as any);
  React.useEffect(() => {
    form.setData({
      hr_policy_category_id: policy?.category?.id || policy?.hr_policy_category_id || '',
      title: policy?.title || '',
      slug: policy?.slug || '',
      version: policy?.version || '',
      effective_date: policy?.effective_date || '',
      published: policy?.published ?? false,
      summary: policy?.summary || '',
      content: policy?.content || '',
    });
  }, [policy]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      form.put(route('hr.policies.update', { policy: policy.id }), { onSuccess: onClose, preserveScroll: true });
    } else {
      form.post(route('hr.policies.store'), { onSuccess: onClose, preserveScroll: true });
    }
  };
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEdit || !policy) return;
    const f = e.target.files?.[0];
    if (!f) return;
    router.post(route('hr.policies.files.store', { policy: policy.id }), { file: f } as any, { forceFormData: true, preserveScroll: true, onSuccess: () => { (e.target as HTMLInputElement).value = ''; } });
  };
  const removeFile = (file: any) => {
    if (!confirm('Remove file?')) return;
    router.delete(route('hr.policies.files.destroy', { file: file.id }), { preserveScroll: true });
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="2xl">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Policy' : 'New Policy'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.title as any} onChange={(e) => form.setData('title', e.target.value)} />
              {form.errors.title && <p className="text-xs text-red-600 mt-1">{form.errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Version</label>
              <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.version as any} onChange={(e) => form.setData('version', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.hr_policy_category_id as any} onChange={(e) => form.setData('hr_policy_category_id', e.target.value)}>
                <option value="">Uncategorized</option>
                {(categories || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Effective Date</label>
              <input type="date" className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.effective_date as any} onChange={(e) => form.setData('effective_date', e.target.value)} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.data.published} onChange={(e) => form.setData('published', e.target.checked)} />
                <span>Published</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Slug (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.slug as any} onChange={(e) => form.setData('slug', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Summary</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.summary as any} onChange={(e) => form.setData('summary', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Content</label>
            <BasicEditor value={form.data.content as any} onChange={(html) => form.setData('content', html)} />
          </div>
          {isEdit && (
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Attachments</label>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs cursor-pointer">
                  <IconMapper name="Paperclip" className="w-3.5 h-3.5" /> Upload
                  <input type="file" onChange={onUpload} className="hidden" />
                </label>
              </div>
              <div className="space-y-2">
                {(policy?.files || []).map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded border border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-gray-800 dark:text-gray-200 truncate">{f.filename}</div>
                    <div className="flex items-center gap-2">
                      <a href={`/storage/${f.path}`} target="_blank" className="px-2 py-1 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">View</a>
                      <button type="button" onClick={() => removeFile(f)} className="px-2 py-1 text-[10px] rounded bg-rose-600 text-white">Remove</button>
                    </div>
                  </div>
                ))}
                {(policy?.files || []).length === 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">No files uploaded.</div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">{form.processing ? 'Saving…' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function CategoryModal({ open, onClose, category }: { open: boolean; onClose: () => void; category: any | null }) {
  const isEdit = !!category;
  const form: any = useForm<any>({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
  } as any);
  React.useEffect(() => {
    form.setData({ name: category?.name || '', slug: category?.slug || '', description: category?.description || '' });
  }, [category]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      form.put(route('hr.policy-categories.update', { category: category.id }), { onSuccess: onClose, preserveScroll: true });
    } else {
      form.post(route('hr.policy-categories.store'), { onSuccess: onClose, preserveScroll: true });
    }
  };
  return (
    <Modal show={open} onClose={onClose} maxWidth="md">
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Category' : 'New Category'}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="px-6 py-4 bg-white dark:bg-gray-900">
        <form className="grid grid-cols-1 gap-3" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.name as any} onChange={(e) => form.setData('name', e.target.value)} />
            {form.errors.name && <p className="text-xs text-red-600 mt-1">{form.errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Slug (optional)</label>
            <input className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.slug as any} onChange={(e) => form.setData('slug', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows={3} className="w-full border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" value={form.data.description as any} onChange={(e) => form.setData('description', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" disabled={form.processing}>Cancel</button>
            <button type="submit" disabled={form.processing} className="px-4 py-2 text-sm rounded-md bg-slate-700 text-white hover:bg-slate-800">{form.processing ? 'Saving…' : (isEdit ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
