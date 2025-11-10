import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { useForm } from '@inertiajs/react';
import ClientForm from './ClientForm';

interface Service {
  id: number;
  name: string;
  monthly_price: number;
  required_guards?: number;
}

interface Zone { id: number; name: string }

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  services?: Service[];
  zones?: Zone[];
}

export default function AddClientModal({ open, onClose, services = [], zones = [] }: AddClientModalProps) {
  const { post, processing } = useForm();

  const handleSubmit = (formData: any) => {
    post(route('admin.clients.store'), {
      ...formData,
      onSuccess: () => {
        onClose();
      },
    });
  };

  const emptyClient = {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    contract_start_date: '',
    contract_end_date: '',
    monthly_rate: 0,
    billing_start_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'active',
    services: [],
    site: {
      name: 'Home',
      address: '',
      status: 'active',
      site_type: 'residential',
      contact_person: '',
      phone: '',
      special_instructions: '',
      latitude: '',
      longitude: '',
      required_guards: 1,
      zone_id: '',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* Make dialog content a column so we can have a scrollable body and a sticky footer */}
      <DialogContent className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <ClientForm
            initialData={emptyClient}
            services={services}
            onSubmit={handleSubmit}
            submitLabel="Create Client"
            processing={processing}
            hideFooter={true}
            formId="add-client-form"
          />
        </div>

        {/* Sticky footer so actions are always accessible on small screens */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t px-6 py-3 flex gap-4 items-center">
          <Button type="submit" form="add-client-form" disabled={processing} className="flex-1">
            {processing ? 'Creating...' : 'Create Client'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

