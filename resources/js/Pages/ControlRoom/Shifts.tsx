import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import IconMapper from '@/Components/IconMapper';

// This page redirects to the main Shifts Index which has real data
export default function ShiftsRedirect() {
  React.useEffect(() => {
    router.visit(route('control-room.shifts.index'), { replace: true });
  }, []);

  return (
    <AuthenticatedLayout header="Shifts">
      <Head title="Redirecting..." />
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-500">
          <IconMapper name="Loader2" size={20} className="animate-spin" />
          <span>Redirecting to Shift Management...</span>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
