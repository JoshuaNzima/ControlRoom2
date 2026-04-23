import React, { useState, useEffect, useCallback } from 'react';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import useNotification from '@/Providers/useNotifications';

type ChatSession = {
  id: number;
  session_id: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  context: string;
  metadata: Record<string, unknown>;
  message_count: number;
  last_message: string | null;
  created_at: string;
  updated_at: string;
};

type ChatMessage = {
  id: number;
  sender_type: 'user' | 'assistant' | 'agent';
  sender_id: number | null;
  message: string;
  created_at: string;
};

type ActiveSession = {
  id: number;
  session_id: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  context: string;
  messages: ChatMessage[];
  transferred_at: string | null;
};

type Props = {
  className?: string;
};

export default function AgentChats({ className = '' }: Props) {
  const { push } = useNotification();
  const [pendingSessions, setPendingSessions] = useState<ChatSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [polling, setPolling] = useState(true);

  const fetchPendingSessions = useCallback(async () => {
    try {
      const res = await fetch(route('agent.chats.pending'));
      const data = await res.json();
      if (data.success) {
        setPendingSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch pending sessions:', error);
    }
  }, []);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await fetch(route('agent.chats.active'));
      const data = await res.json();
      if (data.success) {
        setActiveSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch active sessions:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingSessions();
    fetchActiveSessions();
  }, [fetchPendingSessions, fetchActiveSessions]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      fetchPendingSessions();
      fetchActiveSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, [polling, fetchPendingSessions, fetchActiveSessions]);

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const acceptTransfer = async (sessionId: string) => {
    setLoadingState(`accept-${sessionId}`, true);
    try {
      const res = await fetch(route('agent.chats.accept'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        push('Transfer accepted successfully', 'success');
        fetchPendingSessions();
        fetchActiveSessions();
      } else {
        push(data.message || 'Failed to accept transfer', 'error');
      }
    } catch (error) {
      push('Failed to accept transfer', 'error');
    } finally {
      setLoadingState(`accept-${sessionId}`, false);
    }
  };

  const rejectTransfer = async (sessionId: string) => {
    setLoadingState(`reject-${sessionId}`, true);
    try {
      const res = await fetch(route('agent.chats.reject'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        push('Transfer rejected', 'success');
        fetchPendingSessions();
      } else {
        push(data.message || 'Failed to reject transfer', 'error');
      }
    } catch (error) {
      push('Failed to reject transfer', 'error');
    } finally {
      setLoadingState(`reject-${sessionId}`, false);
    }
  };

  const openChat = (session: ActiveSession) => {
    setSelectedSession(session);
    setShowChatModal(true);
  };

  const sendMessage = async () => {
    if (!responseMessage.trim() || !selectedSession || loading['send']) return;

    setLoadingState('send', true);
    try {
      const res = await fetch(route('agent.chats.respond'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          session_id: selectedSession.session_id,
          message: responseMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResponseMessage('');
        // Refresh the session
        fetchActiveSessions();
        // Update selected session
        const updated = activeSessions.find(s => s.session_id === selectedSession.session_id);
        if (updated) {
          setSelectedSession(updated);
        }
      } else {
        push(data.message || 'Failed to send message', 'error');
      }
    } catch (error) {
      push('Failed to send message', 'error');
    } finally {
      setLoadingState('send', false);
    }
  };

  const resolveChat = async () => {
    if (!selectedSession || loading['resolve']) return;

    setLoadingState('resolve', true);
    try {
      const res = await fetch(route('agent.chats.resolve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ session_id: selectedSession.session_id }),
      });
      const data = await res.json();
      if (data.success) {
        push('Chat resolved successfully', 'success');
        setShowChatModal(false);
        setSelectedSession(null);
        fetchActiveSessions();
      } else {
        push(data.message || 'Failed to resolve chat', 'error');
      }
    } catch (error) {
      push('Failed to resolve chat', 'error');
    } finally {
      setLoadingState('resolve', false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <IconMapper name="Headphones" size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Support Chats</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pendingSessions.length} pending · {activeSessions.length} active
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPolling(!polling)}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              polling
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {polling ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <IconMapper name="Clock" size={16} />
            <span>Pending</span>
            {pendingSessions.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">
                {pendingSessions.length}
              </span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-red-600 border-b-2 border-red-600 dark:text-red-400 dark:border-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <IconMapper name="MessageCircle" size={16} />
            <span>Active</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingSessions.length === 0 ? (
              <div className="text-center py-8">
                <IconMapper name="Inbox" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No pending transfer requests</p>
              </div>
            ) : (
              pendingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IconMapper name="User" size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {session.user?.name || 'Anonymous'}
                        </span>
                        {session.user?.email && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({session.user.email})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {session.last_message || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{session.message_count} messages</span>
                        <span>·</span>
                        <span>{formatDate(session.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => acceptTransfer(session.session_id)}
                        disabled={loading[`accept-${session.session_id}`]}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {loading[`accept-${session.session_id}`] ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectTransfer(session.session_id)}
                        disabled={loading[`reject-${session.session_id}`]}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4">
            {activeSessions.length === 0 ? (
              <div className="text-center py-8">
                <IconMapper name="MessageSquare" size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No active conversations</p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-red-300 dark:hover:border-red-700 transition-colors"
                  onClick={() => openChat(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {session.user?.name || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {session.messages[session.messages.length - 1]?.message || 'No messages'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{session.messages.length} messages</span>
                      <IconMapper name="ChevronRight" size={16} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && selectedSession && (
        <Modal show={true} onClose={() => setShowChatModal(false)} maxWidth="lg">
          <div className="flex flex-col h-[70vh] sm:h-[600px] bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <IconMapper name="User" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold">{selectedSession.user?.name || 'Anonymous'}</h2>
                  <p className="text-xs text-red-100">
                    {selectedSession.user?.email || 'No email'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resolveChat}
                  disabled={loading['resolve']}
                  className="px-3 py-1.5 text-sm bg-white/20 rounded-lg hover:bg-white/30 disabled:opacity-50 transition-colors"
                >
                  {loading['resolve'] ? 'Resolving...' : 'Resolve'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChatModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <IconMapper name="X" size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.sender_type === 'user'
                        ? 'bg-red-600 text-white rounded-br-md'
                        : msg.sender_type === 'agent'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100 rounded-bl-md border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                    }`}
                  >
                    {msg.sender_type === 'agent' && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-blue-600 dark:text-blue-400">
                        <IconMapper name="Headphones" size={12} />
                        <span>You</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.sender_type === 'user'
                          ? 'text-red-200'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your response..."
                  rows={1}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                  disabled={loading['send']}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!responseMessage.trim() || loading['send']}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <IconMapper name="Send" size={18} />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
