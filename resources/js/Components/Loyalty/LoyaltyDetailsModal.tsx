import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import IconMapper from '@/Components/IconMapper';

interface Transaction {
  id: number;
  type: string;
  type_label: string;
  type_color: string;
  points: number;
  balance_before: number;
  balance_after: number;
  reason: string;
  status: string;
  created_at: string;
  created_at_relative: string;
}

interface LoyaltyDetailsModalProps {
  open: boolean;
  onClose: () => void;
  clientId: number;
  clientName: string;
}

export default function LoyaltyDetailsModal({
  open,
  onClose,
  clientId,
  clientName,
}: LoyaltyDetailsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const availablePoints = transactions.length > 0 ? Math.floor(transactions[0].balance_after) : 0;
  const totalEarned = transactions
    .filter((transaction) => transaction.type === 'earned' || transaction.type === 'bonus')
    .reduce((sum, transaction) => sum + transaction.points, 0)
    .toFixed(0);
  const totalRedeemed = transactions
    .filter((transaction) => transaction.type === 'redeemed')
    .reduce((sum, transaction) => sum + transaction.points, 0)
    .toFixed(0);

  React.useEffect(() => {
    if (!open) return;

        const fetchDetails = async () => {
      try {
        const res = await fetch(route('admin.loyalty.client-summary', clientId));
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('Failed to load loyalty details:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchDetails();
  }, [open, clientId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMapper name="Gift" size={20} className="text-amber-500" />
            {clientName} - Loyalty Points
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View transaction history and loyalty program details
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <IconMapper name="Loader2" size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Transaction History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Points Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Available Points</p>
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {availablePoints}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {totalEarned}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</span>
                    <Badge variant="outline">{transactions.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Redeemed</span>
                      <Badge variant="outline">{totalRedeemed}</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              {transactions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    <p>No transactions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={transaction.type_color}>
                            {transaction.type_label}
                          </Badge>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {transaction.points > 0 ? '+' : ''}{transaction.points.toFixed(0)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.created_at_relative}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {transaction.reason}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Balance: {transaction.balance_before.toFixed(0)} → {transaction.balance_after.toFixed(0)}</span>
                        <span className="capitalize">{transaction.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <div className="flex gap-2 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
