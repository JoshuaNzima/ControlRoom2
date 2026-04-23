import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import IconMapper from '@/Components/IconMapper';
import useNotification from '@/Providers/useNotifications';

type VideoType = 'youtube' | 'vimeo' | 'upload';

type Tutorial = {
  id: number;
  title: string;
  description?: string;
  content_type: 'video' | 'document' | 'text';
  content?: string;
  file_url?: string;
  video_url?: string;
  video_type?: VideoType;
  embed_url?: string;
  is_uploaded_video?: boolean;
  order: number;
  created_by?: string;
  created_at?: string;
};

type Props = {
  dashboard: 'admin' | 'superadmin' | 'control-room' | 'assets' | 'client' | 'hr' | 'finance' | 'operations' | 'marketing' | 'training' | 'front-office' | 'business-dev' | 'supervisor' | 'zone-commander';
  canManage?: boolean;
};

export default function TutorialSection({ dashboard, canManage = false }: Props) {
  const { push } = useNotification();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    content_type: 'text' as 'video' | 'document' | 'text',
    content: '',
    video_url: '',
    video_type: 'youtube' as VideoType,
    file: null as File | null,
  });

  useEffect(() => {
    fetchTutorials();
  }, [dashboard]);

  const fetchTutorials = async () => {
    setLoading(true);
    try {
      const res = await fetch(route('tutorials.index', { dashboard }));
      const data = await res.json();
      if (data.success) {
        setTutorials(data.tutorials);
      }
    } catch (error) {
      console.error('Failed to fetch tutorials:', error);
    } finally {
      setLoading(false);
    }
  };

  const openTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
  };

  const closeTutorial = () => {
    setActiveTutorial(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      push('Title is required', 'error');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('dashboard', dashboard);
    formData.append('title', form.title);
    formData.append('description', form.description || '');
    formData.append('content_type', form.content_type);
    formData.append('content', form.content || '');
    formData.append('video_url', form.video_url || '');
    formData.append('video_type', form.video_type);
    if (form.file) {
      formData.append('file', form.file);
    }

    try {
      const res = await fetch(route('tutorials.store'), {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        push('Tutorial added successfully', 'success');
        setShowAddModal(false);
        setForm({ title: '', description: '', content_type: 'text', content: '', video_url: '', video_type: 'youtube', file: null });
        fetchTutorials();
      } else {
        push(data.message || 'Failed to add tutorial', 'error');
      }
    } catch (error) {
      push('Failed to add tutorial', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tutorial: Tutorial) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      const res = await fetch(route('tutorials.destroy', { tutorial: tutorial.id }), {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
      });
      const data = await res.json();
      if (data.success) {
        push('Tutorial deleted', 'success');
        setActiveTutorial(null);
        fetchTutorials();
      }
    } catch (error) {
      push('Failed to delete tutorial', 'error');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'document':
        return 'FileText';
      default:
        return 'File';
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <>
      {/* Collapsible Tutorial Section */}
      <div className="mb-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <IconMapper name="HelpCircle" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                Help & Tutorials
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {tutorials.length} {tutorials.length === 1 ? 'guide' : 'guides'} available
              </p>
            </div>
          </div>
          <IconMapper
            name={expanded ? 'ChevronUp' : 'ChevronDown'}
            size={20}
            className="text-gray-500 dark:text-gray-400"
          />
        </button>

        {expanded && (
          <div className="border-t border-blue-200 dark:border-blue-800 px-4 py-3">
            {tutorials.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No tutorials available yet
              </p>
            ) : (
              <div className="space-y-2">
                {tutorials.map((tutorial) => (
                  <button
                    key={tutorial.id}
                    type="button"
                    onClick={() => openTutorial(tutorial)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors text-left"
                  >
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <IconMapper name={getContentTypeIcon(tutorial.content_type)} size={16} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {tutorial.title}
                      </h4>
                      {tutorial.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {tutorial.description}
                        </p>
                      )}
                    </div>
                    <IconMapper name="ChevronRight" size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 transition-colors"
              >
                <IconMapper name="Plus" size={16} />
                Add Tutorial
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tutorial Viewer Modal */}
      {activeTutorial && (
        <Modal show={true} onClose={closeTutorial} maxWidth="2xl">
          <div className="p-4 sm:p-6 bg-white dark:bg-gray-900">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {activeTutorial.title}
                </h2>
                {activeTutorial.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activeTutorial.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(activeTutorial)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete tutorial"
                  >
                    <IconMapper name="Trash2" size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeTutorial}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <IconMapper name="X" size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4">
              {activeTutorial.content_type === 'video' && (
                <>
                  {activeTutorial.is_uploaded_video && activeTutorial.embed_url ? (
                    // Uploaded video - use native video player
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <video
                        src={activeTutorial.embed_url}
                        className="w-full h-full"
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : activeTutorial.embed_url ? (
                    // YouTube/Vimeo embed
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <iframe
                        src={activeTutorial.embed_url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : null}
                </>
              )}

              {activeTutorial.content_type === 'document' && activeTutorial.file_url && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <a
                    href={activeTutorial.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <IconMapper name="Download" size={18} />
                    Download Document
                  </a>
                </div>
              )}

              {activeTutorial.content_type === 'text' && activeTutorial.content && (
                <div className="prose dark:prose-invert max-w-none rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {activeTutorial.content}
                  </div>
                </div>
              )}
            </div>

            {activeTutorial.created_by && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Added by {activeTutorial.created_by} {activeTutorial.created_at}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Add Tutorial Modal */}
      {showAddModal && (
        <Modal show={true} onClose={() => setShowAddModal(false)} maxWidth="2xl">
          <form onSubmit={handleAddSubmit} className="p-4 sm:p-6 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <IconMapper name="Plus" size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add Tutorial</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="How to use this dashboard"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this tutorial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content Type
                </label>
                <select
                  value={form.content_type}
                  onChange={(e) => setForm({ ...form, content_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text Guide</option>
                  <option value="video">Video (YouTube/Vimeo)</option>
                  <option value="document">Document (PDF/DOC)</option>
                </select>
              </div>

              {form.content_type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Content
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your tutorial content here..."
                  />
                </div>
              )}

              {form.content_type === 'video' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Video Type
                    </label>
                    <select
                      value={form.video_type}
                      onChange={(e) => setForm({ ...form, video_type: e.target.value as VideoType, video_url: '', file: null })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                      <option value="upload">Upload Video</option>
                    </select>
                  </div>

                  {(form.video_type === 'youtube' || form.video_type === 'vimeo') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Video URL ({form.video_type === 'youtube' ? 'YouTube' : 'Vimeo'})
                      </label>
                      <input
                        type="url"
                        value={form.video_url}
                        onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                        placeholder={form.video_type === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://vimeo.com/...'}
                      />
                    </div>
                  )}

                  {form.video_type === 'upload' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Video File
                      </label>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                        className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-100"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 500MB. Supported: MP4, WebM, MOV</p>
                    </div>
                  )}
                </>
              )}

              {form.content_type === 'document' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Document File (PDF, DOC, etc.)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                    onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
                    className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Max 500MB</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Add Tutorial'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
