import { router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function ClientsDashboard() {
  useEffect(() => {
    router.visit(route('admin.clients.index'), {
      preserveState: true,
      preserveScroll: true,
    });
  }, []);

  return null;
}
