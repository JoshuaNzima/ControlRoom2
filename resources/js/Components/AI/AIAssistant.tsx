import React from 'react';
import { usePage } from '@inertiajs/react';

type Props = {
  context?: string;
  className?: string;
  showHelpLink?: boolean;
  userRole?: string;
};

type AiAssistant = {
  id?: number;
  assistant: string;
  enabled: boolean;
  title?: string | null;
  description?: string | null;
};

const assistantMeta: Record<
  string,
  { title: string; endpointSlug: 'control-room' | 'help-center' }
> = {
  'control-room': { title: 'Control Room Assistant', endpointSlug: 'control-room' },
  'help-center': { title: 'Help Center Assistant', endpointSlug: 'help-center' },
};

const WIDGET_SCRIPT_SRC = '/ai-agent/widget.js';

let widgetScriptPromise: Promise<void> | null = null;

function loadWidgetScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.customElements?.get('ai-agent-chat')) {
    return Promise.resolve();
  }

  if (widgetScriptPromise) {
    return widgetScriptPromise;
  }

  widgetScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SCRIPT_SRC}"]`);

    const handleLoad = () => resolve();
    const handleError = () => reject(new Error('Failed to load AI assistant widget'));

    if (existingScript) {
      if (window.customElements?.get('ai-agent-chat')) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    widgetScriptPromise = null;
    throw error;
  });

  return widgetScriptPromise;
}

export default function AIAssistant({ className = '' }: Props) {
  const page = usePage();

  const role =
    (page.props as any)?.auth?.user?.roles?.[0] ??
    (page.props as any)?.auth?.user_role ??
    'user';

  const activeAssistant = (page.props as any)?.activeAssistant as
    | AiAssistant
    | null
    | undefined;

  const assistants = ((page.props as any)?.assistants ?? []) as AiAssistant[];

  const enabledAssistants = assistants.filter((a) => a?.enabled && a?.assistant);

  const [selectedAssistant, setSelectedAssistant] = React.useState<string>(
    activeAssistant?.assistant ?? enabledAssistants[0]?.assistant ?? 'control-room'
  );
  const [widgetReady, setWidgetReady] = React.useState(false);
  const [widgetError, setWidgetError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const next = activeAssistant?.assistant;
    if (next && next !== selectedAssistant) setSelectedAssistant(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAssistant?.assistant]);

  React.useEffect(() => {
    let mounted = true;

    loadWidgetScript()
      .then(() => {
        if (mounted) setWidgetReady(true);
      })
      .catch((error: unknown) => {
        if (mounted) {
          setWidgetError(error instanceof Error ? error.message : 'Failed to load AI assistant');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const endpointSlug =
    assistantMeta[selectedAssistant as keyof typeof assistantMeta]?.endpointSlug ??
    'control-room';

  const title =
    assistantMeta[selectedAssistant as keyof typeof assistantMeta]?.title ?? 'AI Assistant';

  const endpoint = `/ai-agent/${endpointSlug}/chat`;
  const historyEndpoint = `/ai-agent/${endpointSlug}/history`;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {enabledAssistants.length > 1 && (
        <div className="mb-2 flex items-center justify-end gap-2">
          <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
            Assistant
          </label>
          <select
            value={selectedAssistant}
            onChange={(e) => setSelectedAssistant(e.target.value)}
            className="max-w-[180px] rounded border border-gray-300 bg-white px-2 py-1 text-[12px] dark:border-gray-700 dark:bg-gray-800"
          >
            {enabledAssistants.map((a) => (
              <option key={a.assistant} value={a.assistant}>
                {a.title || assistantMeta[a.assistant]?.title || a.assistant}
              </option>
            ))}
          </select>
        </div>
      )}

      {!widgetError ? (
        widgetReady ? (
          <ai-agent-chat
            key={selectedAssistant}
            persist-messages=""
            endpoint={endpoint}
            history-endpoint={historyEndpoint}
            title={title}
            subtitle=""
            placeholder="Type your question..."
            lang="en"
            primary-color="#dc2626"
            position="bottom-right"
            button-icon="💬"
            button-size="56px"
            data-user-role={role}
          ></ai-agent-chat>
        ) : (
          <div className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            Loading AI assistant...
          </div>
        )
      ) : (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          AI assistant failed to load.
        </div>
      )}
    </div>
  );
}
