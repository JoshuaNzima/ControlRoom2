# Loyalty Points Program - Multi-Role Setup Guide

## Updated Overview

The loyalty program is now accessible to **3 user roles**:

### 1. **Clients** (View & Redeem)
- View their loyalty points balance
- See tier status and benefits
- Browse available rewards
- Request redemptions
- View transaction history
- Cancel pending redemptions

### 2. **Finance Officers** (Review & Approve)
- View loyalty program dashboard with key metrics
- See all clients' loyalty summaries
- Approve/reject redemption requests
- View client-specific details
- Export loyalty reports

### 3. **Admins** (Full Management)
- Manage loyalty rules (how points are earned)
- Configure tiers and benefits
- Create/manage reward catalog
- Award bonus points to clients
- Approve/reject redemptions
- Full reporting and export

---

## Complete Setup Guide

### Step 1: Run Migration & Seeder

```bash
php artisan migrate
php artisan db:seed --class=LoyaltyProgramSeeder
```

### Step 2: Register Policy

Update `app/Providers/AuthServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\ClientLoyaltyPoints;
use App\Policies\ClientLoyaltyPointsPolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        ClientLoyaltyPoints::class => ClientLoyaltyPointsPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
```

### Step 3: Add Routes

Add to `routes/web.php`:

```php
<?php

use App\Http\Controllers\Admin\LoyaltyPointsController as AdminLoyaltyController;
use App\Http\Controllers\Finance\LoyaltyPointsController as FinanceLoyaltyController;
use App\Http\Controllers\Client\LoyaltyPointsController as ClientLoyaltyController;

Route::middleware(['auth', 'verified'])->group(function () {
    // ===== CLIENT ROUTES =====
    Route::prefix('loyalty')->group(function () {
        Route::get('/', [ClientLoyaltyController::class, 'dashboard'])
            ->name('client.loyalty.dashboard');
        
        Route::get('/api/summary', [ClientLoyaltyController::class, 'getSummary'])
            ->name('client.loyalty.api.summary');
        
        Route::get('/api/rewards', [ClientLoyaltyController::class, 'getRewards'])
            ->name('client.loyalty.api.rewards');
        
        Route::post('/request-redemption', [ClientLoyaltyController::class, 'requestRedemption'])
            ->name('client.loyalty.request-redemption');
        
        Route::get('/redemptions', [ClientLoyaltyController::class, 'redemptions'])
            ->name('client.loyalty.redemptions');
        
        Route::post('/redemptions/{redemption}/cancel', [ClientLoyaltyController::class, 'cancelRedemption'])
            ->name('client.loyalty.cancel');
    });

    // ===== FINANCE OFFICER ROUTES =====
    Route::prefix('finance/loyalty')->middleware('can:viewReports')->group(function () {
        Route::get('/', [FinanceLoyaltyController::class, 'dashboard'])
            ->name('finance.loyalty.dashboard');
        
        Route::get('/clients/{client}', [FinanceLoyaltyController::class, 'clientDetails'])
            ->name('finance.loyalty.client');
        
        Route::get('/pending', [FinanceLoyaltyController::class, 'pendingRedemptions'])
            ->name('finance.loyalty.pending');
        
        Route::post('/redemptions/{redemption}/approve', [FinanceLoyaltyController::class, 'approveRedemption'])
            ->name('finance.loyalty.approve');
        
        Route::post('/redemptions/{redemption}/reject', [FinanceLoyaltyController::class, 'rejectRedemption'])
            ->name('finance.loyalty.reject');
        
        Route::get('/export', [FinanceLoyaltyController::class, 'exportReport'])
            ->name('loyalty.export.finance');
    });

    // ===== ADMIN ROUTES =====
    Route::prefix('admin/loyalty')->middleware('can:manage,loyaltyPoints')->group(function () {
        Route::get('/', [AdminLoyaltyController::class, 'dashboard'])
            ->name('loyalty.dashboard');
        
        Route::get('/rules', [AdminLoyaltyController::class, 'rules'])
            ->name('loyalty.rules');
        
        Route::post('/rules', [AdminLoyaltyController::class, 'storeRule'])
            ->name('loyalty.store-rule');
        
        Route::get('/tiers', [AdminLoyaltyController::class, 'tiers'])
            ->name('loyalty.tiers');
        
        Route::post('/tiers', [AdminLoyaltyController::class, 'storeTier'])
            ->name('loyalty.store-tier');
        
        Route::get('/rewards', [AdminLoyaltyController::class, 'rewards'])
            ->name('loyalty.rewards');
        
        Route::post('/rewards', [AdminLoyaltyController::class, 'storeReward'])
            ->name('loyalty.store-reward');
        
        Route::post('/clients/{client}/award-points', [AdminLoyaltyController::class, 'awardPoints'])
            ->name('loyalty.award-points');
        
        Route::post('/clients/{client}/redeem', [AdminLoyaltyController::class, 'redeemReward'])
            ->name('loyalty.redeem-reward');
        
        Route::get('/clients/{client}/summary', [AdminLoyaltyController::class, 'clientSummary'])
            ->name('loyalty.client-summary');
        
        Route::post('/redemptions/{redemption}/approve', [AdminLoyaltyController::class, 'approveRedemption'])
            ->name('loyalty.approve');
        
        Route::post('/redemptions/{redemption}/reject', [AdminLoyaltyController::class, 'rejectRedemption'])
            ->name('loyalty.reject');
        
        Route::get('/export', [AdminLoyaltyController::class, 'exportReport'])
            ->name('loyalty.export');
    });
});
```

### Step 4: Add Namespaced Imports

At the top of `routes/web.php`, ensure you have the controller imports:

```php
use App\Http\Controllers\Admin\LoyaltyPointsController as AdminLoyaltyController;
use App\Http\Controllers\Finance\LoyaltyPointsController as FinanceLoyaltyController;
use App\Http\Controllers\Client\LoyaltyPointsController as ClientLoyaltyController;
```

### Step 5: Ensure Layouts Exist

Make sure you have these layouts:
- `resources/js/Layouts/ClientLayout.tsx`
- `resources/js/Layouts/FinanceLayout.tsx`
- `resources/js/Layouts/AdminLayout.tsx` (already exists)

If missing, create them similar to `AdminLayout`.

### Step 6: Update User Model

Ensure `app/Models/User.php` has the relationship:

```php
public function client()
{
    return $this->belongsTo(\App\Models\Guards\Client::class);
}
```

### Step 7: Integrate with Payment System

When recording client payments, award loyalty points:

```php
// In ClientPaymentController or payment processing service

use App\Services\LoyaltyPointsService;

$payment = ClientPayment::create($validated);

// Award loyalty points automatically
LoyaltyPointsService::awardPaymentPoints(
    $payment->client,
    $payment->amount_paid,
    $payment->id
);
```

---

## User Access Levels

### Client Dashboard
**URL:** `/loyalty`

**Features:**
- View personal loyalty points
- See tier status
- Browse and redeem rewards
- View transaction history
- Manage redemptions

**Authorization:** Only authenticated clients can view their own data

### Finance Officer Dashboard
**URL:** `/finance/loyalty`

**Features:**
- See all clients' loyalty overview
- View key metrics (total points, redemptions, etc.)
- Approve/reject pending redemptions
- View client details
- Export reports

**Authorization:** User with 'finance' role or can 'viewReports'

### Admin Dashboard
**URL:** `/admin/loyalty`

**Features:**
- Full program configuration
- Manage earning rules
- Configure tiers and benefits
- Create reward catalog
- Award bonus points
- Approve/reject redemptions
- Full reporting

**Authorization:** User with 'admin' or 'superadmin' role

---

## Authorization Policy Reference

The `ClientLoyaltyPointsPolicy` enforces:

| Action | Client | Finance | Admin |
|--------|--------|---------|-------|
| `view` | Own only | All | All |
| `viewSummary` | Own only | All | All |
| `redeem` | Own only | No | Yes |
| `manage` | No | No | Yes |
| `approveRedemptions` | No | Yes | Yes |
| `viewReports` | No | Yes | Yes |

---

## API Endpoints

### Client APIs (Authenticated Client)

**Get Loyalty Summary**
```
GET /loyalty/api/summary
Response: { summary, transactions }
```

**Get Available Rewards**
```
GET /loyalty/api/rewards
Response: { available_points, rewards[] }
```

**Request Reward Redemption**
```
POST /loyalty/request-redemption
Body: { reward_id, notes? }
Response: { success, message, redemption }
```

**Cancel Pending Redemption**
```
POST /loyalty/redemptions/{redemption}/cancel
Response: { success, message }
```

### Finance Officer APIs

**Get Client Details**
```
GET /finance/loyalty/clients/{client}
Response: Client loyalty data, transactions, redemptions
```

**Approve Redemption**
```
POST /finance/loyalty/redemptions/{redemption}/approve
Response: { success, message }
```

**Reject Redemption**
```
POST /finance/loyalty/redemptions/{redemption}/reject
Body: { reason }
Response: { success, message }
```

### Admin APIs

All endpoints documented in `LOYALTY_POINTS_GUIDE.md`

---

## Testing Access

### As Client:
1. Log in as a client user
2. Visit `/loyalty`
3. Should see their points, rewards, and transaction history

### As Finance Officer:
1. Log in as finance user
2. Visit `/finance/loyalty`
3. Should see all clients and pending approvals

### As Admin:
1. Log in as admin/superadmin
2. Visit `/admin/loyalty`
3. Should see full management interface

---

## Database Considerations

For high-volume systems:

1. **Indexes:** Already included in migration
2. **Caching:** Consider caching loyalty summaries
3. **Archival:** Archive old transactions annually
4. **Backups:** Include loyalty tables in backup strategy

---

## Permissions (In Permissions Table)

Add these permissions to your permissions seeder if using spatie/laravel-permission:

```php
Permission::create(['name' => 'loyalty.view']);
Permission::create(['name' => 'loyalty.redeem']);
Permission::create(['name' => 'loyalty.approve']);
Permission::create(['name' => 'loyalty.manage']);
```

Then assign to roles:
- `client` → `loyalty.view`, `loyalty.redeem`
- `finance` → `loyalty.view`, `loyalty.approve`
- `admin` → all permissions

---

## Troubleshooting

### Client Can't See Loyalty Page
- Check if user has `client` role
- Verify `User->client_id` is set
- Check route middleware allows access

### Finance Not Seeing Approvals
- Verify user has `finance` role
- Check if redemptions have `requires_approval = true`

### Points Not Awarding
- Verify payment rule is active
- Check `LoyaltyPointsService::awardPaymentPoints()` is called
- Review transaction log in database

---

## Next Steps

1. Test in development environment
2. Create sample data with different client tiers
3. Test redemption workflow
4. Train finance staff on approval process
5. Launch in production
