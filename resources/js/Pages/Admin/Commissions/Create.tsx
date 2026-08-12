import React, { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { PageProps } from '@/types';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Client {
  id: number;
  name: string;
}

interface Split {
  user_id: number;
  percentage: number;
  role: 'primary' | 'split';
}

interface CreatePageProps extends PageProps {
  clients: Client[];
  users: User[];
  preselectedClient: Client | null;
}

export default function CommissionsCreate() {
  const { clients, users, preselectedClient } = usePage<CreatePageProps>().props;
  const [clientId, setClientId] = useState(preselectedClient?.id?.toString() || '');
  const [totalAmount, setTotalAmount] = useState('');
  const [source, setSource] = useState('client_acquisition');
  const [description, setDescription] = useState('');
  const [splits, setSplits] = useState<Split[]>([{ user_id: 0, percentage: 100, role: 'primary' }]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSplit = () => {
    setSplits([...splits, { user_id: 0, percentage: 0, role: 'split' }]);
  };

  const removeSplit = (index: number) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index));
    }
  };

  const updateSplit = (index: number, field: keyof Split, value: number | string) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const getTotalPercentage = () => {
    return splits.reduce((sum, split) => sum + (parseFloat(split.percentage.toString()) || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (getTotalPercentage() !== 100) {
      setErrors({ splits: 'Total percentage must equal 100%' });
      return;
    }

    router.post(route('admin.commissions.store'), {
      client_id: clientId,
      total_amount: totalAmount,
      source,
      description,
      splits: JSON.stringify(splits),
      notes,
    }, {
      onError: (errors) => setErrors(errors as Record<string, string>),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head title="Add Commission" />
      
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={route('admin.commissions.index')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Commission</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Commission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client" className="dark:text-gray-300">Client</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 mt-1">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.client_id && <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>}
                  </div>

                  <div>
                    <Label htmlFor="source" className="dark:text-gray-300">Source</Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_acquisition">Client Acquisition</SelectItem>
                        <SelectItem value="contract_renewal">Contract Renewal</SelectItem>
                        <SelectItem value="upsell">Upsell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="amount" className="dark:text-gray-300">Total Amount (ZAR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 mt-1"
                    placeholder="0.00"
                  />
                  {errors.total_amount && <p className="text-red-500 text-sm mt-1">{errors.total_amount}</p>}
                </div>

                <div>
                  <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 mt-1"
                    placeholder="Optional description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Splits */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Commission Splits
                  </CardTitle>
                  <Button type="button" variant="outline" onClick={addSplit}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Split
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {splits.map((split, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-sm dark:text-gray-300">User</Label>
                        <Select
                          value={split.user_id.toString()}
                          onValueChange={(value) => updateSplit(index, 'user_id', parseInt(value))}
                        >
                          <SelectTrigger className="dark:bg-gray-600 dark:border-gray-500 mt-1">
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Label className="text-sm dark:text-gray-300">Percentage (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={split.percentage}
                          onChange={(e) => updateSplit(index, 'percentage', parseFloat(e.target.value) || 0)}
                          className="dark:bg-gray-600 dark:border-gray-500 mt-1"
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-sm dark:text-gray-300">Role</Label>
                        <Select
                          value={split.role}
                          onValueChange={(value) => updateSplit(index, 'role', value as 'primary' | 'split')}
                        >
                          <SelectTrigger className="dark:bg-gray-600 dark:border-gray-500 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="split">Split</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-6">
                        {splits.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSplit(index)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Percentage */}
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium dark:text-gray-200">Total Allocated:</span>
                    <span className={`font-bold ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {getTotalPercentage()}%
                    </span>
                  </div>
                  {getTotalPercentage() !== 100 && (
                    <p className="text-red-500 text-sm mt-1">
                      Total must equal 100%
                    </p>
                  )}
                  {errors.splits && <p className="text-red-500 text-sm mt-1">{errors.splits}</p>}
                </div>

                {/* Preview */}
                {totalAmount && getTotalPercentage() === 100 && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Split Preview</h4>
                    <div className="space-y-1">
                      {splits.map((split, index) => {
                        const amount = (parseFloat(totalAmount) || 0) * (split.percentage / 100);
                        const user = users.find(u => u.id === split.user_id);
                        return (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="dark:text-gray-300">{user?.name || 'Unselected'} ({split.percentage}%)</span>
                            <span className="font-medium dark:text-gray-200">{formatCurrency(amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-gray-100">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Link href={route('admin.commissions.index')}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                disabled={getTotalPercentage() !== 100}
              >
                Create Commission
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
