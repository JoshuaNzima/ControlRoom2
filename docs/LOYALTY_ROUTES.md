# Routes for Loyalty Points Program

Add the following routes to `routes/web.php`:

## Client Routes (Client Dashboard)

```php
Route::middleware(['auth', 'verified'])->group(function () {
    // Client loyalty points routes
    Route::prefix('loyalty')->group(function () {
        Route::get('/dashboard', [Client\LoyaltyPointsController::class, 'dashboard'])
            ->name('client.loyalty.dashboard')
            ->middleware('can:viewSummary,client');
        
        Route::get('/api/summary', [Client\LoyaltyPointsController::class, 'getSummary'])
            ->name('client.loyalty.api.summary');
        
        Route::get('/api/rewards', [Client\LoyaltyPointsController::class, 'getRewards'])
            ->name('client.loyalty.api.rewards');
        
        Route::post('/request-redemption', [Client\LoyaltyPointsController::class, 'requestRedemption'])
            ->name('client.loyalty.request-redemption');
        
        Route::get('/redemptions', [Client\LoyaltyPointsController::class, 'redemptions'])
            ->name('client.loyalty.redemptions');
        
        Route::post('/redemptions/{redemption}/cancel', [Client\LoyaltyPointsController::class, 'cancelRedemption'])
            ->name('client.loyalty.cancel');
    });
});
```

## Finance Officer Routes

```php
Route::middleware(['auth', 'verified', 'can:viewReports'])->group(function () {
    Route::prefix('finance/loyalty')->group(function () {
        Route::get('/', [Finance\LoyaltyPointsController::class, 'dashboard'])
            ->name('finance.loyalty.dashboard');
        
        Route::get('/clients/{client}', [Finance\LoyaltyPointsController::class, 'clientDetails'])
            ->name('finance.loyalty.client');
        
        Route::get('/pending', [Finance\LoyaltyPointsController::class, 'pendingRedemptions'])
            ->name('finance.loyalty.pending');
        
        Route::post('/redemptions/{redemption}/approve', [Finance\LoyaltyPointsController::class, 'approveRedemption'])
            ->name('finance.loyalty.approve');
        
        Route::post('/redemptions/{redemption}/reject', [Finance\LoyaltyPointsController::class, 'rejectRedemption'])
            ->name('finance.loyalty.reject');
        
        Route::get('/export', [Finance\LoyaltyPointsController::class, 'exportReport'])
            ->name('loyalty.export.finance');
    });
});
```

## Admin Routes (kept from original)

```php
Route::middleware(['auth', 'verified', 'can:manage,loyaltyPoints'])->group(function () {
    Route::prefix('admin/loyalty')->group(function () {
        Route::get('/', [Admin\LoyaltyPointsController::class, 'dashboard'])
            ->name('loyalty.dashboard');
        
        Route::get('/rules', [Admin\LoyaltyPointsController::class, 'rules'])
            ->name('loyalty.rules');
        
        Route::post('/rules', [Admin\LoyaltyPointsController::class, 'storeRule'])
            ->name('loyalty.store-rule');
        
        Route::get('/tiers', [Admin\LoyaltyPointsController::class, 'tiers'])
            ->name('loyalty.tiers');
        
        Route::post('/tiers', [Admin\LoyaltyPointsController::class, 'storeTier'])
            ->name('loyalty.store-tier');
        
        Route::get('/rewards', [Admin\LoyaltyPointsController::class, 'rewards'])
            ->name('loyalty.rewards');
        
        Route::post('/rewards', [Admin\LoyaltyPointsController::class, 'storeReward'])
            ->name('loyalty.store-reward');
        
        Route::post('/clients/{client}/award-points', [Admin\LoyaltyPointsController::class, 'awardPoints'])
            ->name('loyalty.award-points');
        
        Route::post('/clients/{client}/redeem', [Admin\LoyaltyPointsController::class, 'redeemReward'])
            ->name('loyalty.redeem-reward');
        
        Route::get('/clients/{client}/summary', [Admin\LoyaltyPointsController::class, 'clientSummary'])
            ->name('loyalty.client-summary');
        
        Route::post('/redemptions/{redemption}/approve', [Admin\LoyaltyPointsController::class, 'approveRedemption'])
            ->name('loyalty.approve');
        
        Route::post('/redemptions/{redemption}/reject', [Admin\LoyaltyPointsController::class, 'rejectRedemption'])
            ->name('loyalty.reject');
        
        Route::get('/export', [Admin\LoyaltyPointsController::class, 'exportReport'])
            ->name('loyalty.export');
    });
});
```

## Provider Registration

Also register the policy in `app/Providers/AuthServiceProvider.php`:

```php
use App\Models\ClientLoyaltyPoints;
use App\Policies\ClientLoyaltyPointsPolicy;

protected $policies = [
    ClientLoyaltyPoints::class => ClientLoyaltyPointsPolicy::class,
];
```

Or add inside the `boot()` method:

```php
Gate::policy(ClientLoyaltyPoints::class, ClientLoyaltyPointsPolicy::class);
```
