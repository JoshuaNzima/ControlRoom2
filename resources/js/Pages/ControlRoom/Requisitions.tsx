import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { 
  FileText, Plus, Search, Filter, Eye, 
  CheckCircle, Clock, AlertCircle, XCircle 
} from 'lucide-react';

interface Requisition {
  id: number;
  req_id: string;
  type: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requested_by: string;
  created_at: string;
}

interface Props {
  requisitions: Requisition[];
  stats?: {
    total: number;
    pending: number;
    approved: number;
    fulfilled: number;
  };
}

export default function Requisitions({ requisitions, stats }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'fulfilled': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      fulfilled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };
    return variants[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return variants[priority] || 'bg-gray-100 text-gray-800';
  };

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = req.description.toLowerCase().includes(search.toLowerCase()) ||
                         req.req_id.toLowerCase().includes(search.toLowerCase()) ||
                         req.requested_by.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthenticatedLayout header="Requisitions">
      <Head title="Control Room - Requisitions" />
      
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Requisitions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track resource requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total || 0}</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.pending || 0}</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats?.approved || 0}</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">Fulfilled</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.fulfilled || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requisitions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
              <Link href={route('requisitions.index')}>
                <Button className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Requisition
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Requisitions List */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Recent Requisitions</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRequisitions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No requisitions found</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create a new requisition to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequisitions.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        {getStatusIcon(req.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{req.req_id}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{req.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 sm:px-4">
                      <p className="text-gray-900 dark:text-gray-100 line-clamp-1">{req.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        by {req.requested_by} • {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getPriorityBadge(req.priority)}>
                        {req.priority}
                      </Badge>
                      <Badge className={getStatusBadge(req.status)}>
                        {req.status}
                      </Badge>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        ${req.amount.toLocaleString()}
                      </p>
                      <Link href={route('requisitions.show', req.id)}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
