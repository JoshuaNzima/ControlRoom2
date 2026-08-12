import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import MessagesLayout from '@/Layouts/MessagesLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
  Hash,
  ArrowLeft,
  Plus,
  MessageSquare,
  Users,
  MoreVertical,
  Pin,
  Lock,
  Globe,
  Megaphone,
  ThumbsUp,
  ThumbsDown,
  Check,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Reply,
  Trash2,
  Edit2,
  Flag
} from 'lucide-react';

interface ForumReply {
  id: number;
  content: string;
  user: { id: number; name: string };
  created_at: string;
  updated_at?: string;
  votes_count: number;
  user_vote?: 'up' | 'down' | null;
  is_solution?: boolean;
}

interface ForumThread {
  id: number;
  title: string;
  content: string;
  user: { id: number; name: string };
  created_at: string;
  updated_at?: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  last_reply_at?: string;
  tags?: string[];
  is_solved?: boolean;
}

interface Forum {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'public' | 'private' | 'announcement';
  category: string;
  color: string;
  members_count: number;
  is_member: boolean;
  is_moderator: boolean;
}

interface Props {
  forum: Forum;
  threads: ForumThread[];
}

const typeIcons = {
  public: Globe,
  private: Lock,
  announcement: Megaphone,
};

const ThreadCard: React.FC<{
  thread: ForumThread;
  forum: Forum;
  isActive?: boolean;
}> = ({ thread, forum, isActive }) => {
  const TypeIcon = typeIcons[forum.type];

  return (
    <div
      className={cn(
        'group flex gap-4 p-4 rounded-xl transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-800/80',
        isActive && 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600',
        'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
      )}
    >
      {/* Vote sidebar */}
      <div className="flex flex-col items-center gap-1 min-w-[60px]">
        <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ChevronUp className="w-5 h-5 text-gray-400" />
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {thread.replies_count}
        </span>
        <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.is_pinned && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Pin className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {thread.is_locked && (
                <Badge variant="secondary">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
              {thread.is_solved && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Check className="w-3 h-3 mr-1" />
                  Solved
                </Badge>
              )}

              <Link
                href={route('messages.forums.threads.show', [forum.slug, thread.id])}
                className="font-semibold text-lg text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-2"
              >
                {thread.title}
              </Link>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {thread.replies_count} replies
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {thread.views_count} views
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(thread.created_at).toLocaleDateString()}
              </span>
            </div>

            {thread.tags && thread.tags.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {thread.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateThreadModal: React.FC<{
  forum: Forum;
  onClose: () => void;
}> = ({ forum, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsLoading(true);
    router.post(route('messages.forums.threads.store', forum.slug), {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    }, {
      onSuccess: () => {
        setIsLoading(false);
        onClose();
      },
      onError: () => setIsLoading(false),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thread Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          required
          className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe your question or topic..."
          required
          rows={6}
          className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags (comma separated)
        </label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="help, question, feature..."
          className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !title.trim() || !content.trim()}
          className="bg-red-600 hover:bg-red-700"
        >
          {isLoading ? 'Creating...' : 'Create Thread'}
        </Button>
      </div>
    </form>
  );
};

const ForumShow: React.FC<Props> = ({ forum, threads }) => {
  const page = usePage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'pinned'>('latest');
  const [isJoining, setIsJoining] = useState(false);
  const currentUserId = (page.props.auth.user as any)?.id;

  const filteredThreads = threads
    .filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
      }
      if (sortBy === 'popular') {
        return (b.views_count + b.replies_count) - (a.views_count + a.replies_count);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const pinnedThreads = filteredThreads.filter(t => t.is_pinned);
  const regularThreads = filteredThreads.filter(t => !t.is_pinned);

  const handleJoinLeave = async () => {
    setIsJoining(true);
    if (forum.is_member) {
      router.post(route('messages.forums.leave', forum.slug), {}, {
        onFinish: () => setIsJoining(false),
      });
    } else {
      router.post(route('messages.forums.join', forum.slug), {}, {
        onFinish: () => setIsJoining(false),
      });
    }
  };

  const TypeIcon = typeIcons[forum.type];

  return (
    <MessagesLayout title={forum.name} conversations={[]} forums={[]}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Forum Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="p-4 sm:p-6">
            <div className="max-w-5xl mx-auto">
              <Link
                href={route('messages.forums.index')}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Forums
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: forum.color + '20' }}
                  >
                    <Hash className="w-8 h-8" style={{ color: forum.color }} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {forum.name}
                      </h1>
                      <Badge variant="secondary">
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {forum.type}
                      </Badge>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                      {forum.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {forum.members_count} members
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {threads.length} threads
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {forum.is_moderator && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Forum
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Forum
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {forum.is_member ? (
                    <Button
                      variant="outline"
                      onClick={handleJoinLeave}
                      disabled={isJoining}
                    >
                      Leave Forum
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinLeave}
                      disabled={isJoining}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Join Forum
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filters bar */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'latest' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('latest')}
                  className={sortBy === 'latest' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Latest
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                  className={sortBy === 'popular' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Popular
                </Button>
                <Button
                  variant={sortBy === 'pinned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('pinned')}
                  className={sortBy === 'pinned' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Pinned
                </Button>
              </div>

              {forum.is_member && (
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Thread
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl dark:bg-gray-900 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="dark:text-gray-100">Create New Thread</DialogTitle>
                    </DialogHeader>
                    <CreateThreadModal forum={forum} onClose={() => setShowCreateModal(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-3">
            {!forum.is_member ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <Lock className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Join to view threads
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
                  You need to join this forum to see and participate in discussions
                </p>
                <Button
                  onClick={handleJoinLeave}
                  disabled={isJoining}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Join Forum
                </Button>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {searchQuery ? 'No threads match your search' : 'No threads yet'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {searchQuery ? 'Try a different search term' : 'Be the first to start a discussion'}
                </p>
                {!searchQuery && (
                  <Button
                    className="mt-4 bg-red-600 hover:bg-red-700"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start a Thread
                  </Button>
                )}
              </div>
            ) : (
              <>
                {pinnedThreads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} forum={forum} />
                ))}
                {regularThreads.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} forum={forum} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </MessagesLayout>
  );
};

export default ForumShow;
