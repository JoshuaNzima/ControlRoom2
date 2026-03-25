import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  Building2,
  MapPin,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Users,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  monthly_rate: number;
  contract_end_date: string;
  sites: { id: number; name: string }[];
  supervisor: { id: number; name: string } | null;
}

interface Payment {
  id: number;
  client: { id: number; name: string };
  amount: number;
  payment_date: string;
  status: string;
}

interface Props {
  stats: {
    total_clients: number;
    active_clients: number;
    inactive_clients: number;
    total_sites: number;
    total_monthly_revenue: number;
    contracts_expiring_soon: number;
  };
  recentClients: Client[];
  clientsByStatus: Record<string, number>;
  upcomingPayments: Payment[];
}

export default function ClientsDashboard({
  stats,
  recentClients,
  clientsByStatus,
  upcomingPayments,
}: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
            Clients Dashboard
          </h2>
          <Link href={route('clients.create')}>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>
      }
    >
      <Head title="Clients Dashboard" />

      <div className="py-6">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Clients
                </CardTitle>
                <Building2 className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.total_clients}
                </div>
                <p className="text-xs text-gray-500">
                  {stats.active_clients} active, {stats.inactive_clients} inactive
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Total Sites
                </CardTitle>
                <MapPin className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.total_sites}
                </div>
                <p className="text-xs text-gray-500">
                  Across all clients
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Monthly Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(stats.total_monthly_revenue)}
                </div>
                <p className="text-xs text-gray-500">
                  From active clients
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Contracts Expiring
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.contracts_expiring_soon}
                </div>
                <p className="text-xs text-gray-500">
                  Within 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Active Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.total_clients > 0
                    ? Math.round((stats.active_clients / stats.total_clients) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-gray-500">
                  Client retention
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  Avg Revenue/Client
                </CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.active_clients > 0
                    ? formatCurrency(stats.total_monthly_revenue / stats.active_clients)
                    : formatCurrency(0)}
                </div>
                <p className="text-xs text-gray-500">
                  Per active client
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Clients */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-white">Recent Clients</CardTitle>
                <Link href={route('clients.index')}>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-800 rounded-lg">
                          <Building2 className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{client.name}</p>
                          <p className="text-sm text-gray-500">
                            {client.sites?.length || 0} sites • {client.contact_person}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={client.status === 'active' ? 'default' : 'secondary'}
                          className={
                            client.status === 'active'
                              ? 'bg-emerald-600/20 text-emerald-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }
                        >
                          {client.status}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {formatCurrency(client.monthly_rate)}/mo
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentClients.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No clients yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Payments */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-white">Upcoming Payments</CardTitle>
                <Calendar className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-white">{payment.client?.name}</p>
                        <p className="text-sm text-gray-500">
                          Due {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-emerald-400">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                  {upcomingPayments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No upcoming payments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Link href={route('clients.create')}>
                  <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                    <Plus className="mr-2 h-4 w-4" />
                    New Client
                  </Button>
                </Link>
                <Link href={route('clients.index')}>
                  <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                    <Building2 className="mr-2 h-4 w-4" />
                    View All Clients
                  </Button>
                </Link>
                <Link href={route('client-sites.index')}>
                  <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                    <MapPin className="mr-2 h-4 w-4" />
                    Manage Sites
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
