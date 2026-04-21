import React, { useState, createContext, useContext } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import type { User } from '@/types';
import AdminLayout from '@/Layouts/AdminLayout';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import ControlRoomLayout from '@/Layouts/ControlRoomLayout';
import FinanceLayout from '@/Layouts/FinanceLayout';
import AssetManagementLayout from '@/Layouts/AssetManagementLayout';
import HRLayout from '@/Layouts/HRLayout';
import SupervisorLayout from '@/Layouts/SupervisorLayout';
import ZoneCommanderLayout from '@/Layouts/ZoneCommanderLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Hash,
  Users,
  Plus,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';

// Types
interface Participant {
  id: number;
  name: string;
}

interface LastMessage {
  content: string;
  sender?: { name: string };
  created_at: string;
}

interface Conversation {
  id: number;
  type: 'direct' | 'group' | 'broadcast';
  title?: string | null;
  name?: string | null;
  unread_count?: number;
  last_message?: LastMessage | null;
  participants?: Participant[];
  is_online?: boolean;
  typing?: boolean;
}

interface Forum {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'public' | 'private' | 'announcement';
  category: string;
  color: string;
  unread_count?: number;
  threads_count?: number;
  members_count?: number;
}

interface MessagesContextType {
  conversations: Conversation[];
  forums: Forum[];
  activeTab: 'conversations' | 'forums';
  setActiveTab: (tab: 'conversations' | 'forums') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  totalUnread: number;
}

const MessagesContext = createContext<MessagesContextType | null>(null);

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) throw new Error('useMessages must be used within MessagesProvider');
  return context;
}

function normalizeRoles(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((r) => String(r));
  if (typeof raw === 'string' && raw.length) return [raw];
  return [];
}

// Sidebar Item Components
const ConversationItem: React.FC<{
  conversation: Conversation;
  isActive?: boolean;
  currentUserId: number;
}> = ({ conversation, isActive, currentUserId }) => {
  const isDirect = conversation.type === 'direct';
  const otherParticipant = isDirect
    ? conversation.participants?.find(p => p.id !== currentUserId)
    : null;
  const displayName = isDirect
    ? otherParticipant?.name || 'Unknown'
    : conversation.title || 'Group Chat';
  const currentUserName = (usePage().props.auth.user as any)?.name;

  return (
    <Link
      href={route('messages.conversations.show', conversation.id)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-800/80',
        isActive && 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600'
      )}
    >
      <div className="relative flex-shrink-0">
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold',
          isDirect ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        )}>
          {isDirect ? displayName.charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
        </div>
        {conversation.is_online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'font-medium truncate',
            conversation.unread_count ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
          )}>
            {displayName}
          </span>
          {conversation.last_message && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {conversation.typing ? (
              <span className="text-red-600 dark:text-red-400 italic">typing...</span>
            ) : conversation.last_message ? (
              <>
                <span className="text-gray-600 dark:text-gray-300">
                  {conversation.last_message.sender?.name === currentUserName ? 'You: ' : ''}
                </span>
                {conversation.last_message.content}
              </>
            ) : (
              'No messages'
            )}
          </p>
          {conversation.unread_count && conversation.unread_count > 0 && (
            <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
              {conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
};

const ForumItem: React.FC<{
  forum: Forum;
  isActive?: boolean;
}> = ({ forum, isActive }) => {
  return (
    <Link
      href={route('messages.forums.show', forum.slug)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-800/80',
        isActive && 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600'
      )}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: forum.color + '20' }}
      >
        <Hash className="w-6 h-6" style={{ color: forum.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'font-medium truncate',
            forum.unread_count ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
          )}>
            {forum.name}
          </span>
          {forum.type === 'private' && (
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
              Private
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {forum.description || `${forum.threads_count || 0} threads · ${forum.members_count || 0} members`}
        </p>
      </div>

      {forum.unread_count && forum.unread_count > 0 && (
        <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
          {forum.unread_count}
        </Badge>
      )}
    </Link>
  );
};

// Sidebar Component
const MessageSidebar: React.FC<{
  conversations: Conversation[];
  forums: Forum[];
  currentUserId: number;
}> = ({ conversations, forums, currentUserId }) => {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery, sidebarOpen, setSidebarOpen, totalUnread } = useMessages();
  const page = usePage();
  const currentRoute = page.url;

  const filteredConversations = conversations.filter(c =>
    (c.title || c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participants?.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredForums = forums.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
        'flex flex-col transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Messages</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 bg-gray-100 dark:bg-gray-800 border-0 dark:text-gray-100"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={activeTab === 'conversations' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('conversations')}
              className={cn('flex-1', activeTab === 'conversations' && 'bg-red-600 hover:bg-red-700')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chats
              {conversations.some(c => c.unread_count) && (
                <span className="ml-1.5 w-2 h-2 bg-white rounded-full" />
              )}
            </Button>
            <Button
              variant={activeTab === 'forums' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('forums')}
              className={cn('flex-1', activeTab === 'forums' && 'bg-red-600 hover:bg-red-700')}
            >
              <Hash className="w-4 h-4 mr-2" />
              Forums
              {forums.some(f => f.unread_count) && (
                <span className="ml-1.5 w-2 h-2 bg-white rounded-full" />
              )}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === 'conversations' ? (
            <>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 mb-2 dark:border-gray-700 dark:text-gray-300"
                onClick={() => router.visit(route('messages.conversations.index'), { data: { new: true } })}
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </Button>

              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    currentUserId={currentUserId}
                    isActive={currentRoute.includes(`/conversations/${conversation.id}`)}
                  />
                ))
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 mb-2 dark:border-gray-700 dark:text-gray-300"
                onClick={() => router.visit(route('messages.forums.index'), { data: { new: true } })}
              >
                <Plus className="w-4 h-4" />
                Browse Forums
              </Button>

              {filteredForums.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No forums yet</p>
                </div>
              ) : (
                filteredForums.map((forum) => (
                  <ForumItem
                    key={forum.id}
                    forum={forum}
                    isActive={currentRoute.includes(`/forums/${forum.slug}`)}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

// Main MessagesLayout
interface MessagesLayoutProps {
  title: string;
  children: React.ReactNode;
  conversations?: Conversation[];
  forums?: Forum[];
  hideSidebar?: boolean;
}

export default function MessagesLayout({
  title,
  children,
  conversations = [],
  forums = [],
  hideSidebar = false,
}: MessagesLayoutProps) {
  const page = usePage<any>();
  const user = page.props?.auth?.user as User | undefined;
  const currentUserId = user?.id || 0;

  const [activeTab, setActiveTab] = useState<'conversations' | 'forums'>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) +
    forums.reduce((sum, f) => sum + (f.unread_count || 0), 0);

  const contextValue: MessagesContextType = {
    conversations,
    forums,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    sidebarOpen,
    setSidebarOpen,
    totalUnread,
  };

  const content = (
    <MessagesContext.Provider value={contextValue}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        {!hideSidebar && (
          <MessageSidebar conversations={conversations} forums={forums} currentUserId={currentUserId} />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="lg:hidden flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-10 w-10 touch-target-min">
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">{title}</h1>
          </div>

          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </MessagesContext.Provider>
  );

  const rawRoles = (user?.roles || []) as (string | { id: number; name: string })[];
  const roles = rawRoles.map((r) => (typeof r === 'string' ? r : r.name));
  const has = (role: string) => roles.includes(role);
  const isSuperAdmin = has('super_admin');
  const isAdmin = has('admin') || isSuperAdmin;
  const isControlRoom = roles.some((r: string) => ['control_room_operator', 'operations_officer'].includes(r));
  const isFinance = roles.some((r: string) => ['finance_officer', 'accountant', 'finance', 'accounting'].includes(r));
  const isAssets = roles.some((r: string) => ['asset_manager', 'assets_manager'].includes(r));
  const isHr = roles.some((r: string) => ['hr', 'human_resources', 'hr_manager'].includes(r));
  const isZoneCommander = has('zone_commander');
  const isSupervisor = roles.some((r: string) => ['supervisor', 'sergeant'].includes(r));

  if (isSuperAdmin) return <SuperAdminLayout title={title} user={user}>{content}</SuperAdminLayout>;
  if (isAdmin) return <AdminLayout title={title} user={user}>{content}</AdminLayout>;
  if (isControlRoom) return <ControlRoomLayout title={title} user={user}>{content}</ControlRoomLayout>;
  if (isFinance) return <FinanceLayout title={title} user={user}>{content}</FinanceLayout>;
  if (isAssets) return <AssetManagementLayout title={title} user={user}>{content}</AssetManagementLayout>;
  if (isHr) return <HRLayout title={title} user={user}>{content}</HRLayout>;
  if (isZoneCommander) return <ZoneCommanderLayout title={title}>{content}</ZoneCommanderLayout>;
  if (isSupervisor) return <SupervisorLayout title={title}>{content}</SupervisorLayout>;

  return (
    <AuthenticatedLayout user={user as any} header={<h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{title}</h2>}>
      <Head title={title} />
      {content}
    </AuthenticatedLayout>
  );
}

export { MessagesContext };
export type { Conversation, Forum, MessagesContextType };
