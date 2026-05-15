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

  React.useEffect(() => {
    const next = activeAssistant?.assistant;
    if (next && next !== selectedAssistant) setSelectedAssistant(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAssistant?.assistant]);

  const endpointSlug =
    assistantMeta[selectedAssistant as keyof typeof assistantMeta]?.endpointSlug ??
    'control-room';

  const title = assistantMeta[selectedAssistant as keyof typeof assistantMeta]?.title ?? 'AI Assistant';

  const endpoint = `/ai-agent/${endpointSlug}/chat`;
  const historyEndpoint = `/ai-agent/${endpointSlug}/history`;

  return (
    <>
      <script src="/ai-agent/widget.js" />

      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        {/* Simple selector inside the floating widget shell */}
        {enabledAssistants.length > 1 && (
          <div className="mb-2 flex items-center justify-end gap-2">
            <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
              Assistant
            </label>
            <select
              value={selectedAssistant}
              onChange={(e) => setSelectedAssistant(e.target.value)}
              className="text-[12px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 max-w-[180px]"
            >
              {enabledAssistants.map((a) => (
                <option key={a.assistant} value={a.assistant}>
                  {a.title || assistantMeta[a.assistant]?.title || a.assistant}
                </option>
              ))}
            </select>
          </div>
        )}

        <ai-agent-chat
          stream=""
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
          data-active-assistant={selectedAssistant}
        ></ai-agent-chat>
      </div>
    </>
  );
}
