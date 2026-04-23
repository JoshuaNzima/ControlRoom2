import React, { useState, useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import useNotification from '@/Providers/useNotifications';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: Date;
  isHelpLink?: boolean;
};

type Props = {
  context?: string;
  className?: string;
  showHelpLink?: boolean;
  userRole?: string;
};

// Context-aware quick questions based on role and area
const getQuickQuestions = (context: string, userRole: string): string[] => {
  // Landing page - potential customers
  if (context === 'landing') {
    return [
      'What services do you offer?',
      'How can I request security?',
      'What are your pricing options?',
      'How do I contact you?',
    ];
  }

  // Role-specific questions
  switch (userRole) {
    case 'super_admin':
      return [
        'How do I manage system modules?',
        'How do I create a new role?',
        'How do I view audit logs?',
        'How do I backup the system?',
      ];
    case 'admin':
      return [
        'How do I add a new user?',
        'How do I add a new guard?',
        'How do I create a new client?',
        'How do I process payroll?',
      ];
    case 'hr':
      return [
        'How do I add a new employee?',
        'How do I manage training?',
        'How do I process leave requests?',
        'How do I view HR reports?',
      ];
    case 'finance':
      return [
        'How do I process payroll?',
        'How do I create a requisition?',
        'How do I generate an invoice?',
        'How do I view financial reports?',
      ];
    case 'asset_manager':
      return [
        'How do I add a new vehicle?',
        'How do I dispatch a vehicle?',
        'How do I add equipment?',
        'How do I schedule maintenance?',
      ];
    case 'control_room':
      return [
        'How do I check in a guard?',
        'How do I create an incident?',
        'How do I scan a QR code?',
        'How do I view guard locations?',
      ];
    case 'supervisor':
    case 'zone_commander':
      return [
        'How do I view my zone guards?',
        'How do I handle attendance?',
        'How do I report an incident?',
        'How do I view zone reports?',
      ];
    case 'client':
      return [
        'How do I view my sites?',
        'How do I see my guards?',
        'How do I view my invoices?',
        'How do I request support?',
      ];
    default:
      return [
        'What can I do in this system?',
        'How do I navigate?',
        'Where can I find help?',
        'How do I update my profile?',
      ];
  }
};

export default function AIAssistant({ context = 'dashboard', className = '', showHelpLink = true, userRole }: Props) {
  const { push } = useNotification();
  const page = usePage();
  
  // Get user role from props or page props
  const effectiveRole = userRole || (page.props.auth?.user?.roles?.[0] as string) || 'user';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [sessionId, setSessionId] = useState<string>('');
  const [transferred, setTransferred] = useState(false);
  const [transferRequested, setTransferRequested] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Generate session ID on mount
  useEffect(() => {
    setSessionId('chat_' + Math.random().toString(36).substring(2, 15));
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const setLoadingState = (key: string, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading['send']) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoadingState('send', true);

    try {
      const res = await fetch(route('ai.chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context,
          session_id: sessionId,
          user_role: effectiveRole,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: data.transferred ? 'agent' : 'assistant',
          content: data.response,
          timestamp: new Date(),
          isHelpLink: data.help_articles,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.transferred) {
          setTransferred(true);
        }

        if (data.transfer_requested) {
          setTransferRequested(true);
          // Auto-trigger transfer
          setTimeout(() => requestTransfer(), 1000);
        }
      } else {
        push(data.message || 'Failed to get response', 'error');
      }
    } catch (error) {
      push('Failed to communicate with AI assistant', 'error');
    } finally {
      setLoadingState('send', false);
    }
  };

  const requestTransfer = async () => {
    setLoadingState('transfer', true);

    try {
      const res = await fetch(route('ai.transfer'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({
          session_id: sessionId,
          reason: 'User requested human assistance',
        }),
      });

      const data = await res.json();

      if (data.success) {
        const transferMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, transferMessage]);
        setTransferred(data.transferred);
        setTransferRequested(false);
      } else {
        push(data.message || 'Transfer failed', 'error');
      }
    } catch (error) {
      push('Failed to request transfer', 'error');
    } finally {
      setLoadingState('transfer', false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTransferred(false);
    setTransferRequested(false);
    setSessionId('chat_' + Math.random().toString(36).substring(2, 15));
  };

  const quickQuestions = getQuickQuestions(context, effectiveRole);

  // Parse message content for links
  const renderMessageContent = (content: string) => {
    // Convert markdown-style links to actual links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    content.replace(linkRegex, (match, text, url, offset) => {
      // Add text before link
      if (offset > lastIndex) {
        parts.push(content.substring(lastIndex, offset));
      }
      // Add link
      if (url.startsWith('http')) {
        parts.push(
          <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-red-300 hover:underline">
            {text}
          </a>
        );
      } else {
        parts.push(
          <Link key={key++} href={url} className="text-red-300 hover:underline">
            {text}
          </Link>
        );
      }
      lastIndex = offset + match.length;
      return match;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 ${className}`}
        title="AI Assistant - Get Help"
      >
        <IconMapper name="Bot" size={24} />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <Modal show={true} onClose={() => setIsOpen(false)} maxWidth="md">
          <div className="flex flex-col h-[70vh] sm:h-[550px] bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <IconMapper name={transferred ? "Headphones" : "Bot"} size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">
                    {transferred ? 'Support Agent' : 'AI Assistant'}
                  </h2>
                  <p className="text-xs text-red-100">
                    {transferred ? 'Connected to support' : 'Ask me anything about the system'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showHelpLink && (
                  <Link
                    href={route('help.index')}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Help Center"
                  >
                    <IconMapper name="BookOpen" size={18} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={clearChat}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="New conversation"
                >
                  <IconMapper name="Plus" size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <IconMapper name="X" size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                    <IconMapper name="Bot" size={32} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    How can I help you?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {context === 'landing' 
                      ? 'Ask about our security services' 
                      : `Ask about ${context.replace('-', ' ')} - your role: ${effectiveRole}`}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setInput(q);
                          inputRef.current?.focus();
                        }}
                        className="px-3 py-1.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          message.role === 'user'
                            ? 'bg-red-600 text-white rounded-br-md'
                            : message.role === 'agent'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100 rounded-bl-md border border-blue-200 dark:border-blue-800'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                        }`}
                      >
                        {message.role === 'agent' && (
                          <div className="flex items-center gap-2 mb-1 text-xs text-blue-600 dark:text-blue-400">
                            <IconMapper name="User" size={12} />
                            <span>Support Agent</span>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' 
                              ? 'text-red-200' 
                              : message.role === 'agent'
                              ? 'text-blue-500 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(loading['send'] || loading['transfer']) && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {loading['transfer'] ? 'Connecting to agent...' : 'Thinking...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Transfer Button */}
            {!transferred && messages.length > 0 && !transferRequested && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  type="button"
                  onClick={requestTransfer}
                  disabled={loading['transfer']}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <IconMapper name="UserCheck" size={16} />
                  <span>Talk to a human agent</span>
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={transferred ? "Type your message to the agent..." : "Type your question..."}
                  rows={1}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                  disabled={loading['send'] || loading['transfer']}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading['send'] || loading['transfer']}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <IconMapper name="Send" size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
