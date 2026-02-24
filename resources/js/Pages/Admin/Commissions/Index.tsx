import React, { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Pagination } from '@/Components/ui/Pagination';
import { PageProps } from '@/types';
import { ArrowLeft, Plus, Search, Filter, DollarSign, Users, CheckCircle, Clock } from 'lucide-react';

interface CommissionSplit {
  id: number;
  user_id: number;
  user: { name: string; email: string };
  percentage: number;
  amount: number;
  role: string;
}

interface Commission {
  id: number;
  client_id: number;
  client: { name: string };
  total_amount: number;
  source: string;
  description: string | null;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  splits: CommissionSplit[];
}

interface Stats {
  total_pending: number;
  total_approved: number;
  total_paid: number;
  total_amount_pending: number;
  total_amount_paid: number;
}

interface CommissionsPageProps extends PageProps {
  commissions: {
    data: Commission[];
    current_page: number;
    last_page: number;
    total: number;
  };
  stats: Stats;
  filters: { status?: string; source?: string };
}

export default function CommissionsIndex() {
  const { commissions, stats, filters } = usePage<CommissionsPageProps>().props;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [sourceFilter, setSourceFilter] = useState(filters.source || 'all');

  const handleFilter = () => {
    router.get(route('admin.commissions.index'), {
      status: statusFilter,
      source: sourceFilter,
    }, { preserveState: true });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'client_acquisition': return 'Client Acquisition';
      case 'contract_renewal': return 'Contract Renewal';
      case 'upsell': return 'Upsell';
      default: return source;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Commissions" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link href={route('admin.dashboard')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Commissions</h1>
          </div>
          <Link href={route('admin.commissions.create')}>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Commission
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total_pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total_approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Paid Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.total_amount_paid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Amt</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.total_amount_pending)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{commissions.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="client_acquisition">Client Acquisition</SelectItem>
                    <SelectItem value="contract_renewal">Contract Renewal</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleFilter} variant="secondary">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Commissions Table */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Commission Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-400">Client</TableHead>
                    <TableHead className="dark:text-gray-400">Amount</TableHead>
                    <TableHead className="dark:text-gray-400">Source</TableHead>
                    <TableHead className="dark:text-gray-400">Splits</TableHead>
                    <TableHead className="dark:text-gray-400">Status</TableHead>
                    <TableHead className="dark:text-gray-400">Date</TableHead>
                    <TableHead className="dark:text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.data.map((commission) => (
                    <TableRow key={commission.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{commission.client?.name}</TableCell>
                      <TableCell className="font-medium dark:text-gray-300">
                        {formatCurrency(commission.total_amount)}
                      </TableCell>
                      <TableCell className="dark:text-gray-400">{getSourceLabel(commission.source)}</TableCell>
                      <TableCell className="dark:text-gray-400">
                        {commission.splits?.length} user(s)
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(commission.status)} text-white`}>
                          {commission.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="dark:text-gray-400">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={route('admin.commissions.show', commission.id)}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {commissions.last_page > 1 && (
              <Pagination
                currentPage={commissions.current_page}
                lastPage={commissions.last_page}
                total={commissions.total}
                perPage={20}
                from={(commissions.current_page - 1) * 20 + 1}
                to={Math.min(commissions.current_page * 20, commissions.total)}
                baseUrl={route('admin.commissions.index')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
