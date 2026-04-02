import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import {
  Hash,
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  Megaphone,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Clock
} from 'lucide-react';

interface Forum {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'public' | 'private' | 'announcement';
  category: string;
  color: string;
  threads_count: number;
  members_count: number;
  unread_count?: number;
  last_thread?: {
    title: string;
    created_at: string;
  };
}

interface Props {
  myForums: Forum[];
  publicForums: Forum[];
}

const categoryColors: Record<string, string> = {
  general: '#6b7280',
  department: '#dc2626',
  project: '#2563eb',
  emergency: '#ea580c',
  social: '#16a34a',
};

const typeIcons = {
  public: Globe,
  private: Lock,
  announcement: Megaphone,
};

const ForumCard: React.FC<{
  forum: Forum;
  isJoined?: boolean;
}> = ({ forum, isJoined }) => {
  const TypeIcon = typeIcons[forum.type];

  return (
    <Card className="group hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: forum.color + '20' }}
          >
            <Hash className="w-7 h-7" style={{ color: forum.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={route('messages.forums.show', forum.slug)}
                  className="font-semibold text-lg text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {forum.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {forum.type}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {forum.category}
                  </span>
                </div>
              </div>

              {forum.unread_count && forum.unread_count > 0 && (
                <Badge className="bg-red-600 text-white">
                  {forum.unread_count} new
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {forum.description || 'No description'}
            </p>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {forum.threads_count} threads
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {forum.members_count} members
              </span>
              {forum.last_thread && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last active {new Date(forum.last_thread.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {isJoined ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(route('messages.forums.show', forum.slug))}
              >
                Enter
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => router.post(route('messages.forums.join', forum.slug))}
              >
                Join
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CreateForumModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'announcement'>('public');
  const [category, setCategory] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('messages.forums.store'), {
      name,
      description,
      type,
      category,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Forum Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., General Discussion"
          required
          className="mt-1 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this forum about?"
          className="mt-1 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="social">Social</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-red-600 hover:bg-red-700">
          Create Forum
        </Button>
      </div>
    </form>
  );
};

const ForumsIndex: React.FC<Props> = ({ myForums, publicForums }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');

  const filteredMyForums = myForums.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPublicForums = publicForums.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = myForums.reduce((sum, f) => sum + (f.unread_count || 0), 0);

  return (
    <MessagesLayout title="Forums" conversations={[]} forums={myForums}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Hash className="w-7 h-7 text-red-600" />
                  Forums
                  {totalUnread > 0 && (
                    <Badge className="bg-red-600 text-white ml-2">
                      {totalUnread} unread
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Join discussions, share updates, and collaborate with your team
                </p>
              </div>

              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Forum
                  </Button>
                </DialogTrigger>
                <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="dark:text-gray-100">Create New Forum</DialogTitle>
                  </DialogHeader>
                  <CreateForumModal onClose={() => setShowCreateModal(false)} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and tabs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search forums..."
                  className="pl-9 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'my' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('my')}
                  className={activeTab === 'my' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  My Forums
                  {myForums.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {myForums.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={activeTab === 'discover' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('discover')}
                  className={activeTab === 'discover' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Discover
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            {activeTab === 'my' ? (
              <>
                {filteredMyForums.length === 0 ? (
                  <div className="text-center py-12">
                    <Hash className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {searchQuery ? 'No forums match your search' : 'You haven\'t joined any forums yet'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {searchQuery ? 'Try a different search term' : 'Browse public forums to get started'}
                    </p>
                    {!searchQuery && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setActiveTab('discover')}
                      >
                        Browse Forums
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredMyForums.map((forum) => (
                    <ForumCard key={forum.id} forum={forum} isJoined />
                  ))
                )}
              </>
            ) : (
              <>
                {filteredPublicForums.length === 0 ? (
                  <div className="text-center py-12">
                    <Globe className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {searchQuery ? 'No forums match your search' : 'No public forums available'}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      {searchQuery ? 'Try a different search term' : 'Be the first to create a public forum'}
                    </p>
                    {!searchQuery && (
                      <Button
                        className="mt-4 bg-red-600 hover:bg-red-700"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Forum
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredPublicForums.map((forum) => (
                    <ForumCard key={forum.id} forum={forum} isJoined={false} />
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MessagesLayout>
  );
};

export default ForumsIndex;
