import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import MessagesLayout from '@/Layouts/MessagesLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
  ArrowLeft,
  Pin,
  Lock,
  Check,
  Clock,
  Eye,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Reply,
  Trash2,
  Edit2,
  Flag,
  CheckCircle2,
  Share2,
  Bookmark
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
  tags?: string[];
  is_solved?: boolean;
}

interface Forum {
  id: number;
  name: string;
  slug: string;
  type: 'public' | 'private' | 'announcement';
  color: string;
  is_member: boolean;
  is_moderator: boolean;
}

interface Props {
  forum: Forum;
  thread: ForumThread;
  replies: ForumReply[];
}

const ReplyCard: React.FC<{
  reply: ForumReply;
  isOp: boolean;
  isModerator: boolean;
  currentUserId: number;
  onVote: (replyId: number, vote: 'up' | 'down') => void;
  onMarkSolution: (replyId: number) => void;
  onReply: (reply: ForumReply) => void;
}> = ({ reply, isOp, isModerator, currentUserId, onVote, onMarkSolution, onReply }) => {
  const isAuthor = reply.user.id === currentUserId;
  const canMarkSolution = isOp && !reply.is_solution;

  return (
    <div
      id={`reply-${reply.id}`}
      className={cn(
        'flex gap-4 p-4 rounded-xl transition-all',
        reply.is_solution
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800'
      )}
    >
      {/* Vote sidebar */}
      <div className="flex flex-col items-center gap-1 min-w-[48px]">
        <button
          onClick={() => onVote(reply.id, 'up')}
          className={cn(
            'p-1.5 rounded transition-colors',
            reply.user_vote === 'up'
              ? 'bg-green-100 dark:bg-green-900/40 text-green-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
          )}
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <span
          className={cn(
            'text-sm font-semibold',
            reply.votes_count > 0
              ? 'text-green-600'
              : reply.votes_count < 0
                ? 'text-red-600'
                : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {reply.votes_count}
        </span>
        <button
          onClick={() => onVote(reply.id, 'down')}
          className={cn(
            'p-1.5 rounded transition-colors',
            reply.user_vote === 'down'
              ? 'bg-red-100 dark:bg-red-900/40 text-red-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'
          )}
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-sm font-semibold text-white">
              {reply.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {reply.user.name}
              </span>
              {isAuthor && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  You
                </Badge>
              )}
            </div>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {new Date(reply.created_at).toLocaleDateString()}
            </span>
            {reply.updated_at && reply.updated_at !== reply.created_at && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                (edited)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {reply.is_solution && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Solution
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canMarkSolution && (
                  <DropdownMenuItem onClick={() => onMarkSolution(reply.id)}>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                    Mark as Solution
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onReply(reply)}>
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                {isAuthor && (
                  <>
                    <DropdownMenuItem>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {isModerator && !isAuthor && (
                  <DropdownMenuItem className="text-red-600">
                    <Flag className="w-4 h-4 mr-2" />
                    Moderate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 prose dark:prose-invert max-w-none">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {reply.content}
          </p>
        </div>
      </div>
    </div>
  );
};

const ThreadShow: React.FC<Props> = ({ forum, thread, replies: initialReplies }) => {
  const page = usePage();
  const currentUserId = (page.props.auth.user as any)?.id;
  const [replies, setReplies] = useState<ForumReply[]>(initialReplies);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ForumReply | null>(null);
  const isOp = thread.user.id === currentUserId;

  const handleVote = async (replyId: number, vote: 'up' | 'down') => {
    try {
      await axios.post(route('messages.forums.replies.vote', replyId), { vote });
      // Optimistic update
      setReplies(prev => prev.map(r => {
        if (r.id !== replyId) return r;
        const currentVote = r.user_vote;
        let voteChange = 0;
        if (currentVote === vote) {
          // Remove vote
          voteChange = vote === 'up' ? -1 : 1;
          return { ...r, user_vote: null, votes_count: r.votes_count + voteChange };
        } else if (currentVote) {
          // Change vote
          voteChange = vote === 'up' ? 2 : -2;
          return { ...r, user_vote: vote, votes_count: r.votes_count + voteChange };
        } else {
          // New vote
          voteChange = vote === 'up' ? 1 : -1;
          return { ...r, user_vote: vote, votes_count: r.votes_count + voteChange };
        }
      }));
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  const handleMarkSolution = async (replyId: number) => {
    try {
      await axios.post(route('messages.forums.replies.solution', replyId));
      setReplies(prev => prev.map(r => ({
        ...r,
        is_solution: r.id === replyId
      })));
    } catch (error) {
      console.error('Mark solution failed:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || isSubmitting) return;

    setIsSubmitting(true);
    router.post(
      route('messages.forums.replies.store', [forum.slug, thread.id]),
      {
        content: newReply,
        reply_to_id: replyingTo?.id,
      },
      {
        onSuccess: () => {
          setNewReply('');
          setReplyingTo(null);
          setIsSubmitting(false);
        },
        onError: () => setIsSubmitting(false),
      }
    );
  };

  const handleReplyClick = (reply: ForumReply) => {
    setReplyingTo(reply);
    document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const sortedReplies = [...replies].sort((a, b) => {
    // Sort solutions first, then by votes
    if (a.is_solution && !b.is_solution) return -1;
    if (!a.is_solution && b.is_solution) return 1;
    return b.votes_count - a.votes_count;
  });

  return (
    <MessagesLayout title={thread.title} conversations={[]} forums={[]}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <Link
                  href={route('messages.forums.index')}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Forums
                </Link>
                <span>/</span>
                <Link
                  href={route('messages.forums.show', forum.slug)}
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                  style={{ color: forum.color }}
                >
                  {forum.name}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
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
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {thread.title}
                  </h1>

                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {thread.views_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {replies.length} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {(isOp || forum.is_moderator) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {forum.is_moderator && (
                          <>
                            <DropdownMenuItem>
                              <Pin className="w-4 h-4 mr-2" />
                              {thread.is_pinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Lock className="w-4 h-4 mr-2" />
                              {thread.is_locked ? 'Unlock' : 'Lock'}
                            </DropdownMenuItem>
                          </>
                        )}
                        {isOp && (
                          <DropdownMenuItem>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {(isOp || forum.is_moderator) && (
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
            {/* Original post */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-sm font-semibold text-white">
                  {thread.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {thread.user.name}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">
                    Original Poster
                  </span>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {thread.content}
                </p>
              </div>

              {thread.tags && thread.tags.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {thread.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Replies */}
            <div className="space-y-3">
              {sortedReplies.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No replies yet. Be the first to respond!
                  </p>
                </div>
              ) : (
                sortedReplies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    isOp={isOp}
                    isModerator={forum.is_moderator}
                    currentUserId={currentUserId}
                    onVote={handleVote}
                    onMarkSolution={handleMarkSolution}
                    onReply={handleReplyClick}
                  />
                ))
              )}
            </div>

            {/* Reply form */}
            {forum.is_member && !thread.is_locked && (
              <div id="reply-form" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
                {replyingTo && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Replying to <strong>{replyingTo.user.name}</strong>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                )}

                <form onSubmit={handleSubmitReply}>
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write your reply..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <Button
                      type="submit"
                      disabled={!newReply.trim() || isSubmitting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isSubmitting ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {thread.is_locked && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <Lock className="w-5 h-5 mx-auto mb-2" />
                This thread is locked and no new replies can be added.
              </div>
            )}
          </div>
        </div>
      </div>
    </MessagesLayout>
  );
};

export default ThreadShow;
