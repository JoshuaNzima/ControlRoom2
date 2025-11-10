import React from 'react';
import { Head } from '@inertiajs/react';
import ControlRoomLayout from '@/Layouts/Operations/ControlRoomLayout';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

const OperationsManagerApprovals = ({ pendingAssignments }: any) => {
  return (
    <ControlRoomLayout title="Manager Approvals">
      <Head title="Manager Approvals" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">Pending Assignments</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAssignments?.data?.length ? (
                pendingAssignments.data.map((pa: any) => (
                  <div key={pa.id} className="p-3 bg-white rounded shadow-sm flex items-center justify-between">
                    <div>
                      <div className="font-medium">{pa.guard?.name ?? '—'}</div>
                      <div className="text-sm text-gray-500">{pa.site?.name ?? '—'}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm">Approve</Button>
                      <Button variant="ghost" size="sm">Reject</Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">No pending assignments.</div>
              )}
            </div>

            <div className="mt-4">
              {/* Pagination would go here if needed */}
              <Button>Load more</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ControlRoomLayout>
  );
};

export default OperationsManagerApprovals;
