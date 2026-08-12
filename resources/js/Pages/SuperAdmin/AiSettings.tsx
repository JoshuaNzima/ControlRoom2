import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, router, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import useToast from '@/Components/ui/use-toast';

type AiProvider = {
  id: number;
  provider: string;
  enabled: boolean;
  api_key: string | null;
  model: string;
  base_url: string;
  max_tokens: number;
  temperature: string;
  description: string;
  free_tier: boolean;
  free_models: string[];
};

type AiAssistant = {
  id?: number;
  assistant: string;
  enabled: boolean;
  title?: string | null;
  description?: string | null;
};

type PageProps = {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      roles: string[];
    };
  };
  providers: AiProvider[];
  activeProvider: AiProvider | null;

  // Injected via HandleInertiaRequests shared props
  assistants: AiAssistant[];
  activeAssistant: AiAssistant | null;
};

const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  groq: 'Groq',
  together: 'Together AI',
  openrouter: 'OpenRouter',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  mistral: 'Mistral AI',
};

const providerColors: Record<string, string> = {
  openai: 'bg-emerald-600',
  groq: 'bg-orange-600',
  together: 'bg-blue-600',
  openrouter: 'bg-purple-600',
  anthropic: 'bg-amber-700',
  gemini: 'bg-sky-600',
  mistral: 'bg-indigo-600',
};

const assistantLabels: Record<string, string> = {
  'control-room': 'Control Room Assistant',
  'help-center': 'Help Center Assistant',
};

export default function AiSettings() {
  const { auth, providers, activeProvider, assistants, activeAssistant } =
    usePage<PageProps>().props as any;

  const { toast } = useToast();
  const [editingProvider, setEditingProvider] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const [testing, setTesting] = React.useState<string | null>(null);
  const [forms, setForms] = React.useState<Record<string, Partial<AiProvider>>>({});

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const updateForm = (provider: string, data: Partial<AiProvider>) => {
    setForms(prev => ({
      ...prev,
      [provider]: { ...(prev[provider] || {}), ...data },
    }));
  };

  const getFormData = (provider: AiProvider): Partial<AiProvider> => {
    return {
      api_key: provider.api_key || '',
      model: provider.model,
      base_url: provider.base_url,
      max_tokens: provider.max_tokens,
      temperature: provider.temperature,
      ...forms[provider.provider],
    };
  };

  const saveProvider = (provider: AiProvider) => {
    const data = getFormData(provider);
    setLoadingState(provider.provider, true);

    router.put(route('superadmin.ai-settings.update', provider.provider), data, {
      preserveScroll: true,
      onFinish: () => setLoadingState(provider.provider, false),
      onSuccess: () => {
        toast({ title: `${providerLabels[provider.provider]} settings saved` });
        setEditingProvider(null);
      },
      onError: (errors: any) => {
        const msg = Object.values(errors)[0] as string || 'Failed to save settings';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      },
    });
  };

  const enableProvider = (provider: AiProvider) => {
    if (!provider.api_key && !forms[provider.provider]?.api_key) {
      toast({
        title: 'API key required',
        description: 'Please configure the API key first',
        variant: 'destructive',
      });
      return;
    }

    setLoadingState(`enable_${provider.provider}`, true);

    router.post(route('superadmin.ai-settings.enable', provider.provider), {}, {
      preserveScroll: true,
      onFinish: () => setLoadingState(`enable_${provider.provider}`, false),
      onSuccess: () => {
        toast({ title: `${providerLabels[provider.provider]} enabled` });
      },
      onError: (errors: any) => {
        const msg = Object.values(errors)[0] as string || 'Failed to enable provider';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      },
    });
  };

  const disableProvider = (provider: AiProvider) => {
    setLoadingState(`disable_${provider.provider}`, true);

    router.post(route('superadmin.ai-settings.disable', provider.provider), {}, {
      preserveScroll: true,
      onFinish: () => setLoadingState(`disable_${provider.provider}`, false),
      onSuccess: () => {
        toast({ title: `${providerLabels[provider.provider]} disabled` });
      },
    });
  };

  const testProvider = (provider: AiProvider) => {
    setTesting(provider.provider);

    router.post(route('superadmin.ai-settings.test', provider.provider), {}, {
      preserveScroll: true,
      onFinish: () => setTesting(null),
    });
  };

  const enabledAssistantSet = new Set((assistants ?? []).filter((a: AiAssistant) => a?.enabled).map((a: AiAssistant) => a.assistant));

  const isAssistantEnabled = (slug: string) => enabledAssistantSet.has(slug);
  const isAssistantActive = (slug: string) => activeAssistant?.assistant === slug;

  const setAssistantActive = (slug: string) => {
    setLoadingState(`activate_${slug}`, true);
    router.post(route('superadmin.ai-settings.assistants.activate', slug), {}, {
      preserveScroll: true,
      onFinish: () => setLoadingState(`activate_${slug}`, false),
      onSuccess: () => toast({ title: `Active assistant set to ${assistantLabels[slug] || slug}` }),
      onError: (errors: any) => {
        const msg = Object.values(errors)[0] as string || 'Failed to set active assistant';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      },
    });
  };

  const enableAssistant = (slug: string) => {
    setLoadingState(`enable_${slug}`, true);
    router.post(route('superadmin.ai-settings.assistants.enable', slug), {}, {
      preserveScroll: true,
      onFinish: () => setLoadingState(`enable_${slug}`, false),
      onSuccess: () => toast({ title: `${assistantLabels[slug] || slug} enabled` }),
      onError: (errors: any) => {
        const msg = Object.values(errors)[0] as string || 'Failed to enable assistant';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      },
    });
  };

  const disableAssistant = (slug: string) => {
    setLoadingState(`disable_${slug}`, true);
    router.post(route('superadmin.ai-settings.assistants.disable', slug), {}, {
      preserveScroll: true,
      onFinish: () => setLoadingState(`disable_${slug}`, false),
      onSuccess: () => toast({ title: `${assistantLabels[slug] || slug} disabled` }),
      onError: (errors: any) => {
        const msg = Object.values(errors)[0] as string || 'Failed to disable assistant';
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      },
    });
  }; 

  const assistantSlugs = ['control-room', 'help-center'];

  return (
    <AuthenticatedLayout header="AI Settings" user={auth?.user as any}>
      <Head title="AI Settings" />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-700 via-red-600 to-rose-600 text-white shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <IconMapper name="Bot" size={28} className="sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">AI Settings</h1>
                <p className="text-red-100 mt-1 text-sm sm:text-base">Configure AI providers and assistants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Provider Banner */}
        {activeProvider && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${providerColors[activeProvider.provider] || 'bg-gray-600'} text-white`}>
                  <IconMapper name="Zap" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Active Provider</p>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{providerLabels[activeProvider.provider]}</p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
                Model: <span className="font-mono font-medium">{activeProvider.model}</span>
              </div>
            </div>
          </div>
        )}

        {/* Providers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {providers.map((provider: AiProvider) => {
            const isEditing = editingProvider === provider.provider;
            const isLoading = loading[provider.provider];
            const formData = getFormData(provider);

            return (
              <div
                key={provider.provider}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow border transition-all ${
                  provider.enabled
                    ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 sm:p-2.5 rounded-lg ${providerColors[provider.provider] || 'bg-gray-600'} text-white`}>
                        <IconMapper name="Bot" size={20} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {providerLabels[provider.provider]}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {provider.free_tier && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Free Tier
                            </span>
                          )}
                          {provider.enabled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!provider.enabled ? (
                        <button
                          onClick={() => enableProvider(provider)}
                          disabled={loading[`enable_${provider.provider}`]}
                          className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {loading[`enable_${provider.provider}`] ? 'Enabling...' : 'Enable'}
                        </button>
                      ) : (
                        <button
                          onClick={() => disableProvider(provider)}
                          disabled={loading[`disable_${provider.provider}`]}
                          className="px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60"
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{provider.description}</p>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                    <input
                      type="password"
                      placeholder="Enter API key..."
                      value={formData.api_key || ''}
                      onChange={(e) => updateForm(provider.provider, { api_key: e.target.value })}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
                    {provider.free_models && provider.free_models.length > 0 ? (
                      <select
                        value={formData.model || provider.model}
                        onChange={(e) => updateForm(provider.provider, { model: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                      >
                        {provider.free_models.map((model: string) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.model || provider.model}
                        onChange={(e) => updateForm(provider.provider, { model: e.target.value })}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm font-mono"
                      />
                    )}
                  </div>

                  {isEditing && (
                    <>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Base URL</label>
                        <input
                          type="text"
                          value={formData.base_url || provider.base_url}
                          onChange={(e) => updateForm(provider.provider, { base_url: e.target.value })}
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Max Tokens</label>
                          <input
                            type="number"
                            value={formData.max_tokens || provider.max_tokens}
                            onChange={(e) => updateForm(provider.provider, { max_tokens: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Temperature</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={formData.temperature || provider.temperature}
                            onChange={(e) => updateForm(provider.provider, { temperature: e.target.value })}
                            className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setEditingProvider(isEditing ? null : provider.provider)}
                      className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      {isEditing ? 'Hide advanced' : 'Advanced settings'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => testProvider(provider)}
                        disabled={testing === provider.provider || !formData.api_key}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
                      >
                        {testing === provider.provider ? 'Testing...' : 'Test Connection'}
                      </button>

                      <button
                        onClick={() => saveProvider(provider)}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none px-4 py-1.5 text-xs sm:text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Assistants */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">AI Assistants</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assistantSlugs.map((slug) => {
              const enabled = isAssistantEnabled(slug);
              const active = isAssistantActive(slug);

              return (
                <div
                  key={slug}
                  className={`rounded-xl border p-4 ${
                    active
                      ? 'border-red-400 ring-1 ring-red-200 bg-red-50/50 dark:bg-red-950/20'
                      : enabled
                      ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {assistantLabels[slug] || slug}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {active ? 'Active for the chat widget' : enabled ? 'Enabled (not active)' : 'Disabled'}
                      </p>
                    </div>

                    {active && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!enabled ? (
                      <button
                        className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        disabled={!!loading[`enable_${slug}`]}
                        onClick={() => enableAssistant(slug)}
                      >
                        {loading[`enable_${slug}`] ? 'Enabling...' : 'Enable'}
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1.5 text-xs rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60"
                        disabled={!!loading[`disable_${slug}`] || active}
                        onClick={() => disableAssistant(slug)}
                        title={active ? 'Active assistant cannot be disabled without activating another first' : 'Disable assistant'}
                      >
                        {loading[`disable_${slug}`] ? 'Disabling...' : 'Disable'}
                      </button>
                    )}

                    <button
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-60"
                      disabled={!enabled || !!loading[`activate_${slug}`] || active}
                      onClick={() => setAssistantActive(slug)}
                    >
                      {active ? 'Selected' : loading[`activate_${slug}`] ? 'Setting...' : 'Set Active'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
            The floating AI chat widget will follow the <b>Active</b> assistant.
          </p>
        </div>

        {/* Help Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Free Tier Providers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className={`p-1.5 rounded ${providerColors.groq} text-white`}>
                  <IconMapper name="Zap" size={14} />
                </span>
                Groq
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Fastest inference. Generous free tier with Llama 3.1 and Mixtral models.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className={`p-1.5 rounded ${providerColors.gemini} text-white`}>
                  <IconMapper name="Sparkles" size={14} />
                </span>
                Google Gemini
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Free tier with generous limits. Gemini 1.5 Flash is fast and capable.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className={`p-1.5 rounded ${providerColors.openrouter} text-white`}>
                  <IconMapper name="Route" size={14} />
                </span>
                OpenRouter
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Access multiple providers. Several models available for free.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
