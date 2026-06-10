# Loyalty Points Relationship Analysis

## 1. Client Model - All Relationships

**Location:** [app/Models/Guards/Client.php](app/Models/Guards/Client.php)

### Current Relationships:
```php
public function services()  // BelongsToMany
public function sites()  // HasMany -> ClientSite
public function supervisor()  // BelongsTo -> User
public function sergeant()  // BelongsTo -> Guard
public function payments()  // HasMany -> ClientPayment
public function loyaltyPoints()  // HasOne -> ClientLoyaltyPoints
public function users()  // BelongsToMany -> User
public function contracts()  // HasMany -> Contract
```

### Complete Client Model Definition:
[app/Models/Guards/Client.php](app/Models/Guards/Client.php#L1-L300)

---

## 2. LoyaltyPoints Relationship Definition

**Location:** [app/Models/Guards/Client.php](app/Models/Guards/Client.php#L66-L68)

```php
public function loyaltyPoints(): HasOne
{
    return $this->hasOne(\App\Models\ClientLoyaltyPoints::class, 'client_id');
}
```

**Type:** HasOne relationship  
**Foreign Key:** client_id  
**Related Model:** ClientLoyaltyPoints

---

## 3. ClientLoyaltyPoints Model

**Location:** [app/Models/ClientLoyaltyPoints.php](app/Models/ClientLoyaltyPoints.php)

### Model Relationships:
```php
public function client(): BelongsTo
{
    return $this->belongsTo(\App\Models\Guards\Client::class);
}

public function transactions(): HasMany
{
    return $this->hasMany(ClientLoyaltyTransaction::class);
}

public function expirations(): HasMany
{
    return $this->hasMany(ClientLoyaltyExpiration::class);
}
```

### Attributes:
- `client_id` (foreign key)
- `total_points` (decimal:2)
- `available_points` (decimal:2)
- `redeemed_points` (decimal:2)
- `pending_points` (decimal:2)
- `last_earned_at` (timestamp)
- `last_redeemed_at` (timestamp)
- `tier_metadata` (json)

### Methods:
- `getCurrentTier()` - Gets current tier based on available points
- `getNextTier()` - Gets next tier progression
- `getPointsToNextTier()` - Calculates points needed for next tier

---

## 4. Database Schema

**Location:** [database/migrations/2026_05_21_000001_create_loyalty_points_tables.php](database/migrations/2026_05_21_000001_create_loyalty_points_tables.php)

### Tables Created:
1. **loyalty_rules** - Configuration for earning rules
2. **client_loyalty_points** - Client balance tracking (unique per client)
3. **client_loyalty_transactions** - Audit log for all point transactions
4. **loyalty_tiers** - Tier configuration (Bronze, Silver, Gold, etc.)
5. **loyalty_rewards** - Redemption options catalog
6. **client_loyalty_redemptions** - Redemption requests
7. **client_loyalty_expirations** - Point expiry tracking

---

## 5. Where loyaltyPoints Relationship is Accessed

### Controllers

#### [Finance/LoyaltyPointsController.php](app/Http/Controllers/Finance/LoyaltyPointsController.php)

**Line 21** - Dashboard:
```php
$clients = Client::active()->with('loyaltyPoints')->paginate(20);
```

**Line 138** - Export Report:
```php
$clients = Client::active()->with('loyaltyPoints')->get();
```

### Service Classes

#### [app/Services/LoyaltyPointsService.php](app/Services/LoyaltyPointsService.php)

**getClientSummary() method** (starting around line 593) accesses:
- `$loyaltyPoints->getCurrentTier()`
- `$loyaltyPoints->getNextTier()`
- `$loyaltyPoints->getPointsToNextTier()`
- `$loyaltyPoints->available_points`
- `$loyaltyPoints->total_points`
- `$loyaltyPoints->redeemed_points`
- `$loyaltyPoints->pending_points`
- `$loyaltyPoints->last_earned_at`
- `$loyaltyPoints->last_redeemed_at`

**getLockedClientPoints() method** (line 658):
```php
private static function getLockedClientPoints(Client $client): ClientLoyaltyPoints
{
    $loyaltyPoints = ClientLoyaltyPoints::query()
        ->where('client_id', $client->id)
        ->lockForUpdate()
        ->first();
    
    if ($loyaltyPoints) {
        return $loyaltyPoints;
    }
    
    return ClientLoyaltyPoints::create([...]);
}
```

### Test Files

#### [tests/Feature/LoyaltyHardeningTest.php](tests/Feature/LoyaltyHardeningTest.php)

Multiple usages:
- Line 71: `$points = ClientLoyaltyPoints::where('client_id', $client->id)->first();`
- Line 88: Accessing loyalty points after earning
- Line 113: Checking points after multiple transactions
- Line 142, 174: Verifying redemption state

### Models

#### [app/Models/ClientLoyaltyTransaction.php](app/Models/ClientLoyaltyTransaction.php)

Line 36:
```php
public function loyaltyPoints(): BelongsTo
{
    return $this->belongsTo(\App\Models\ClientLoyaltyTransaction::class);
}
```

---

## 6. Related Models

### ClientLoyaltyTransaction
- Tracks every point movement (earned, redeemed, expired, adjusted, bonus)
- Stores before/after balances for audit trail
- Includes reason and metadata

### ClientLoyaltyRedemption
- Requests to redeem loyalty points for rewards
- Supports approval workflow
- Tracks redemption status (pending, approved, completed, rejected, cancelled)

### LoyaltyTier
- Defines tier levels (e.g., Bronze, Silver, Gold)
- Sets min/max points for each tier
- Includes multiplier for points earning

### LoyaltyReward
- Available rewards in the catalog
- Tracks quantity and redemptions
- Supports approval requirements

### LoyaltyRule
- Defines how points are earned
- Types: payment, service, referral, contract_length
- Configurable points_per_unit and conditions

---

## 7. Usage Pattern Summary

### How Clients Access Loyalty Points:
1. **Query with Eager Loading:** `Client::with('loyaltyPoints')`
2. **Direct Access:** `$client->loyaltyPoints()`
3. **Via Service:** `LoyaltyPointsService::getClientSummary($client)`

### Transaction Safety:
- Uses `lockForUpdate()` for concurrent update prevention
- DB transactions for all point operations
- Normalized decimal values (2 places) for precision

### Key Operations:
- Award points for payments, services, referrals
- Redeem points for rewards (with approval)
- Track tier progression
- Audit transaction history
- Expire old points with scheduled task
