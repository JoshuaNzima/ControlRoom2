# Defensive Programming - Router Call Fixes

## Pattern Guide for Adding Error Handling

### 1. Add Required Imports
```typescript
// For notifications
import useNotification from '@/Providers/useNotifications';
// OR
import useToast from '@/Components/ui/use-toast';
```

### 2. Initialize Hooks in Component
```typescript
const { push } = useNotification();
// OR
const { toast } = useToast();
```

### 3. Add Loading States
```typescript
// For single actions
const [processing, setProcessing] = useState(false);

// For per-row actions
const [processingId, setProcessingId] = useState<number | null>(null);

// For multiple named actions
const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
```

### 4. Standard Router Call Pattern

#### Basic Pattern (with single loading state)
```typescript
const handleAction = () => {
  setProcessing(true);
  router.post(route('route.name'), payload, {
    preserveScroll: true,
    onFinish: () => setProcessing(false),
    onSuccess: () => {
      push('Action completed', 'success');
      // or: toast({ title: 'Action completed' });
    },
    onError: (errs) => {
      push(Object.values(errs)[0] || 'Action failed', 'error');
      // or: toast({ title: Object.values(errs)[0] || 'Action failed', variant: 'destructive' });
    },
  });
};
```

#### Per-Row Pattern (for tables/lists)
```typescript
const handleRowAction = (id: number) => {
  setProcessingId(id);
  router.post(route('route.name', id), payload, {
    preserveScroll: true,
    onFinish: () => setProcessingId(null),
    onSuccess: () => push('Success message', 'success'),
    onError: (errs) => {
      setProcessingId(null);
      push(Object.values(errs)[0] || 'Failed', 'error');
    },
  });
};

// In JSX - disable button and show spinner when processing
<button disabled={processingId === item.id}>
  {processingId === item.id ? <IconMapper name="Loader2" className="animate-spin" /> : 'Action'}
</button>
```

#### Named Actions Pattern (for modals with multiple actions)
```typescript
const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

const handleAssign = () => {
  setActionLoading(prev => ({ ...prev, assign: true }));
  router.post(route('route.name'), payload, {
    preserveScroll: true,
    onFinish: () => setActionLoading(prev => ({ ...prev, assign: false })),
    onSuccess: () => push('Assigned', 'success'),
    onError: (errs) => push(Object.values(errs)[0] || 'Failed', 'error'),
  });
};

// In JSX
<Button disabled={actionLoading.assign}>
  {actionLoading.assign ? 'Assigning...' : 'Assign'}
</Button>
```

### 5. Full Transform Example

**BEFORE:**
```typescript
const handleDelete = () => {
  router.delete(route('admin.guards.destroy', id), {
    onSuccess: () => router.reload(),
  });
};

<button onClick={handleDelete}>Delete</button>
```

**AFTER:**
```typescript
const [deleteProcessing, setDeleteProcessing] = useState(false);
const { push } = useNotification();

const handleDelete = () => {
  if (!confirm('Are you sure?')) return;
  setDeleteProcessing(true);
  router.delete(route('admin.guards.destroy', id), {
    preserveScroll: true,
    onFinish: () => setDeleteProcessing(false),
    onSuccess: () => {
      push('Deleted successfully', 'success');
      router.reload();
    },
    onError: (errs) => {
      push(Object.values(errs)[0] || 'Delete failed', 'error');
    },
  });
};

<button onClick={handleDelete} disabled={deleteProcessing}>
  {deleteProcessing ? 'Deleting...' : 'Delete'}
</button>
```

## Files Still Needing Fixes (Priority Order)

### High Priority (7+ router calls each)
- [ ] `resources/js/Pages/FrontOffice/Tasks/Index.tsx` (7 calls)
- [ ] `resources/js/Pages/HR/Employees.tsx` (5 calls)
- [ ] `resources/js/Pages/HR/Policies.tsx` (5 calls)
- [ ] `resources/js/Pages/Admin/Settings/Index.tsx` (4 calls)
- [ ] `resources/js/Pages/Finance/PettyCash/Index.tsx` (4 calls)
- [ ] `resources/js/Pages/HR/Training.tsx` (4 calls)

### Medium Priority (3-4 router calls each)
- [ ] `resources/js/Pages/SuperAdmin/Roles.tsx` (4 calls)
- [ ] `resources/js/Pages/SuperAdmin/Users.tsx` (4 calls)
- [ ] `resources/js/Pages/Training/TrainerGuards/Index.tsx` (4 calls)
- [ ] `resources/js/Pages/ZoneCommander/Downs.tsx` (4 calls)
- [ ] 100+ additional files...

## Quick Checklist for Each File

1. [ ] Add import for notification hook
2. [ ] Initialize hook in component
3. [ ] Add loading state(s)
4. [ ] For each router call:
   - [ ] Add `preserveScroll: true`
   - [ ] Set loading state at start
   - [ ] Reset loading state in `onFinish`
   - [ ] Show success message in `onSuccess`
   - [ ] Show error message in `onError`
5. [ ] Disable buttons during loading
6. [ ] Show loading indicators (spinner or text)
