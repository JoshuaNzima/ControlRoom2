# Loyalty Points Program - Implementation Guide

## Overview

This is a complete, production-ready loyalty points program designed for the ControlRoom2 system. It tracks client loyalty, awards points for payments and activities, and allows clients to redeem rewards.

## Features

### 1. **Point Earning**
- Earn points from client payments (configurable rate)
- Earn bonus points from service subscriptions
- Earn points for contract longevity
- Referral bonuses
- Manual adjustments by admin

### 2. **Tier System**
- 4 configurable tiers: Bronze, Silver, Gold, Platinum
- Automatic tier progression based on points
- Each tier has multipliers and benefits
- Tier-specific perks and support levels

### 3. **Reward Redemption**
- Predefined reward catalog
- Service credits and discounts
- Limited quantity rewards with tracking
- Approval workflow for premium rewards
- Time-limited reward campaigns

### 4. **Transaction Tracking**
- Complete audit trail of all point changes
- Transaction history with timestamps
- Point expiration tracking
- Balance history for reconciliation

### 5. **Admin Management**
- Dashboard with key metrics
- Full rule management (create/edit rules)
- Tier configuration
- Reward catalog management
- Redemption approval workflow
- Client-level point adjustments
- Export reports

## Database Schema

### Key Tables

1. **loyalty_rules** - Define how points are earned
2. **client_loyalty_points** - Current balance per client
3. **client_loyalty_transactions** - Transaction audit trail
4. **loyalty_tiers** - Tier definitions and benefits
5. **loyalty_rewards** - Available rewards catalog
6. **client_loyalty_redemptions** - Redemption requests
7. **loyalty_tiers** - Tier configuration
8. **client_loyalty_expirations** - Points expiration schedule

## Setup Instructions

### 1. Run Migration

```bash
php artisan migrate
```

This creates all necessary tables.

### 2. Seed Default Data

```bash
php artisan db:seed --class=LoyaltyProgramSeeder
```

This creates:
- 4 loyalty rules (payment, service, contract, referral)
- 4 tiers (Bronze → Platinum)
- 6 reward options

You can customize these in the seeder file later.

### 3. Update Client Model

Add relationship to `app/Models/Guards/Client.php`:

```php
public function loyaltyPoints()
{
    return $this->hasOne(ClientLoyaltyPoints::class);
}
```

### 4. Add Routes

Add to `routes/web.php`:

```php
Route::middleware(['auth', 'verified'])->group(function () {
    // Loyalty Points Routes
    Route::prefix('admin/loyalty')->middleware('can:manage-loyalty')->group(function () {
        Route::get('/', [LoyaltyPointsController::class, 'dashboard'])->name('loyalty.dashboard');
        Route::get('rules', [LoyaltyPointsController::class, 'rules'])->name('loyalty.rules');
        Route::post('rules', [LoyaltyPointsController::class, 'storeRule'])->name('loyalty.store-rule');
        Route::get('tiers', [LoyaltyPointsController::class, 'tiers'])->name('loyalty.tiers');
        Route::post('tiers', [LoyaltyPointsController::class, 'storeTier'])->name('loyalty.store-tier');
        Route::get('rewards', [LoyaltyPointsController::class, 'rewards'])->name('loyalty.rewards');
        Route::post('rewards', [LoyaltyPointsController::class, 'storeReward'])->name('loyalty.store-reward');
        Route::post('clients/{client}/award-points', [LoyaltyPointsController::class, 'awardPoints'])->name('loyalty.award-points');
        Route::post('clients/{client}/redeem', [LoyaltyPointsController::class, 'redeemReward'])->name('loyalty.redeem-reward');
        Route::get('clients/{client}/summary', [LoyaltyPointsController::class, 'clientSummary'])->name('loyalty.client-summary');
        Route::post('redemptions/{redemption}/approve', [LoyaltyPointsController::class, 'approveRedemption'])->name('loyalty.approve');
        Route::post('redemptions/{redemption}/reject', [LoyaltyPointsController::class, 'rejectRedemption'])->name('loyalty.reject');
        Route::get('export', [LoyaltyPointsController::class, 'exportReport'])->name('loyalty.export');
    });
});
```

## Usage Examples

### Award Points to Client

```php
use App\Services\LoyaltyPointsService;
use App\Models\Guards\Client;

$client = Client::find(1);

// Award points for payment
LoyaltyPointsService::awardPaymentPoints($client, 50000, $paymentId);

// Manual award
LoyaltyPointsService::awardPoints(
    $client,
    500,
    "Bonus for renewing contract",
    'bonus'
);
```

### Get Client Summary

```php
$summary = LoyaltyPointsService::getClientSummary($client);

// Returns:
// [
//   'total_points' => 5000,
//   'available_points' => 4500,
//   'redeemed_points' => 500,
//   'current_tier' => [...],
//   'next_tier' => [...],
//   'points_to_next_tier' => 1000,
//   'progress_percent' => 65.5,
//   ...
// ]
```

### Redeem a Reward

```php
$redemption = LoyaltyPointsService::redeemReward($client, $rewardId);

if ($redemption) {
    // Reward redeemed successfully
} else {
    // Insufficient points or reward unavailable
}
```

### Get Transaction History

```php
$transactions = LoyaltyPointsService::getTransactionHistory($client, $limit = 50);
```

## Frontend Components

### LoyaltyTrackerWidget

Display loyalty points summary on client pages.

```tsx
import LoyaltyTrackerWidget from '@/Components/Loyalty/LoyaltyTrackerWidget';

<LoyaltyTrackerWidget 
  clientId={client.id} 
  compact={true}
  onViewDetails={() => setShowDetails(true)}
/>
```

**Props:**
- `clientId` - Client ID (required)
- `compact` - Compact view for sidebars (default: false)
- `onViewDetails` - Callback when viewing details

### LoyaltyDetailsModal

Show detailed loyalty information and transaction history.

```tsx
import LoyaltyDetailsModal from '@/Components/Loyalty/LoyaltyDetailsModal';

<LoyaltyDetailsModal
  open={showDetails}
  onClose={() => setShowDetails(false)}
  clientId={client.id}
  clientName={client.name}
/>
```

## Integration Points

### Payment Processing

When recording client payments, automatically award points:

```php
// In ClientPaymentController or similar

$payment = ClientPayment::create($data);

// Award loyalty points
LoyaltyPointsService::awardPaymentPoints(
    $payment->client,
    $payment->amount_paid,
    $payment->id
);
```

### Client Dashboard

Add the widget to client dashboard pages:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Other dashboard items */}
  <LoyaltyTrackerWidget clientId={client.id} onViewDetails={handleViewLoyalty} />
</div>
```

## Configuration

### Customizing Point Calculations

Edit `config/loyalty.php` (optional file to create):

```php
return [
    'payment_points_per_unit' => 10, // 10 points per MWK 1000
    'payment_unit' => 1000, // MWK 1000
    'point_expiry_months' => 24, // Points expire after 24 months
    'tier_multipliers' => [
        'bronze' => 1.0,
        'silver' => 1.25,
        'gold' => 1.5,
        'platinum' => 2.0,
    ],
];
```

### Modifying Tier Benefits

Edit tiers via admin panel or update seeder:

```php
LoyaltyTier::create([
    'name' => 'Diamond',
    'level' => 5,
    'min_points' => 20000,
    'multiplier' => 2.5,
    'benefits' => ['...']] // Array of benefit strings
]);
```

## Scheduled Tasks

### Process Point Expirations

Add to `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    $schedule->call(function () {
        LoyaltyPointsService::processPendingExpirations();
    })->daily()->at('02:00');
}
```

## API Endpoints

### Get Client Loyalty Summary

```
GET /admin/loyalty/clients/{client}/summary

Response:
{
  "summary": {
    "total_points": 5000,
    "available_points": 4500,
    "redeemed_points": 500,
    "current_tier": {...},
    "next_tier": {...},
    ...
  },
  "transactions": [...],
  "pending_redemptions": [...]
}
```

### Award Points

```
POST /admin/loyalty/clients/{client}/award-points

{
  "points": 500,
  "reason": "Bonus for contract renewal",
  "type": "bonus"
}
```

### Redeem Reward

```
POST /admin/loyalty/clients/{client}/redeem

{
  "reward_id": 1
}
```

## Security Considerations

1. **Authorization** - All routes are protected with `can:manage-loyalty` middleware
2. **Input Validation** - All endpoints validate input
3. **Transaction Safety** - Database transactions ensure data consistency
4. **Audit Trail** - All point changes are logged in transactions table
5. **Approval Workflow** - Premium rewards require admin approval

## Monitoring & Reports

### Key Metrics to Track

- Total points distributed
- Points redemption rate
- Popular rewards
- Average points per client
- Tier distribution
- Client engagement trends

### Export Data

```
GET /admin/loyalty/export

Returns CSV with client loyalty data
```

## Troubleshooting

### Points not awarding after payment?

1. Verify loyalty rule for 'payment' type is active
2. Check `client_loyalty_points` table for the client
3. Verify payment was recorded in correct model
4. Check database transaction logs

### Client can't redeem?

1. Check available points >= reward points required
2. Verify reward is active and valid_until >= now()
3. Check quantity_available for limited rewards
4. Verify client tier allows redemption

### Performance Optimization

For high-volume systems:

1. Add indexes on frequently queried fields:
   ```php
   Schema::table('client_loyalty_transactions', function (Blueprint $table) {
       $table->index(['client_id', 'created_at']);
   });
   ```

2. Archive old transactions quarterly
3. Cache loyalty summaries with 1-hour TTL
4. Use pagination for transaction history

## Future Enhancements

- Tier-based point earning multipliers
- Scheduled point expiration policies
- Social sharing bonuses
- Birthday/anniversary bonuses
- Campaign-based point multipliers
- Partner integrations for cross-program points
- Mobile app loyalty card
- SMS/Email notifications for tier changes
