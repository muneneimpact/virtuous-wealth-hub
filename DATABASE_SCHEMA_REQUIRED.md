# Database Schema for Treasurer Approval System

## Answer: YES - You Need These Database Tables

The treasurer approval feature requires the following database tables to be created in Supabase.

## Required Tables

### 1. **payment_requests** (CRITICAL - for treasurer to approve payments)

```sql
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_month VARCHAR(7),              -- e.g., "2026-03"
  payment_date DATE,
  mpesa_code VARCHAR(255),               -- M-Pesa reference code
  mpesa_message TEXT,                    -- M-Pesa message
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Columns Used By Treasurer:**
- `id` - Unique payment request ID
- `member_id` - Which member submitted the payment
- `amount` - Payment amount
- `payment_month` - What month payment is for
- `mpesa_code` / `mpesa_message` - M-Pesa proof
- `status` - pending/approved/rejected
- `reviewed_by` - Which treasurer approved it
- `reviewed_at` - When it was approved
- `submitted_at` - When member submitted it

### 2. **contributions** (for recording approved payments)

```sql
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_month VARCHAR(7),
  contribution_type VARCHAR(50),         -- contribution, loan_repayment, interest_accrual
  status VARCHAR(50) DEFAULT 'recorded',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:**
- Records each approved payment as a contribution
- Tracks payment month and type
- Treasurer creates this when approving a payment

### 3. **transactions** (for member transaction history)

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50),                      -- contribution, loan_disbursement, loan_repayment, interest_accrual
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  direction VARCHAR(10),                 -- credit, debit
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:**
- Complete transaction history for members
- Shows all financial activity
- Used by PDF export and transaction history feature

### 4. **profiles** (update existing table)

Add these columns to the existing `profiles` table:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 2) DEFAULT 0;
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
```

**Fields:**
- `savings` - Member's total savings balance (updated when treasurer approves payment)
- `status` - Account status (pending/active/inactive)

### 5. **loan_requests** (for loan approvals)

```sql
CREATE TABLE loan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, disbursed
  guarantor_ids UUID[] DEFAULT '{}',
  repayment_months INT,
  interest_rate DECIMAL(3, 2),           -- e.g., 5.00 for 5%
  total_interest DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  monthly_payment DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## What Each Approval Process Needs

### Payment Approval Flow (Treasurer)

1. **Member submits payment** → Inserted into `payment_requests` with status `pending`
2. **Treasurer reviews** → Sees `payment_requests` table filtered by `status = 'pending'`
3. **Treasurer approves** → Updates `payment_requests` to `status = 'approved'` + sets `reviewed_by` and `reviewed_at`
4. **System records it** → Creates entry in `contributions` table + updates `profiles.savings`
5. **Transaction logged** → Creates entry in `transactions` table

### Loan Approval Flow (Treasurer)

1. **Member requests loan** → Inserted into `loan_requests` with status `pending`
2. **Treasurer reviews** → Sees `loan_requests` filtered by `status = 'pending'`
3. **Treasurer approves** → Updates `loan_requests` to `status = 'approved'`
4. **Treasurer disburses** → Updates to `status = 'disbursed'` + records transaction

## Database Upgrade Steps

### Option 1: Use Supabase SQL Editor (Easiest)

1. Go to https://app.supabase.com
2. Select your **virtuous-wealth-hub** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL below
6. Click **Run**

### Option 2: Use Migration Files

1. Create file: `supabase/migrations/[timestamp]_treasurer_approvals.sql`
2. Add the SQL schema
3. Run: `supabase db push`

## Complete SQL to Execute

```sql
-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_month VARCHAR(7),
  payment_date DATE,
  mpesa_code VARCHAR(255),
  mpesa_message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_month VARCHAR(7),
  contribution_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'recorded',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50),
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  direction VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create loan_requests table
CREATE TABLE IF NOT EXISTS loan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  guarantor_ids UUID[] DEFAULT '{}',
  repayment_months INT,
  interest_rate DECIMAL(3, 2),
  total_interest DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  monthly_payment DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_member_id ON payment_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON loan_requests(status);
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
```

## Row-Level Security (RLS) Policies

For security, add these policies:

```sql
-- Payment requests: members can only see their own, treasurers can see all pending
CREATE POLICY "Users can view own payment requests"
  ON payment_requests FOR SELECT
  USING (
    auth.uid() = member_id OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'treasurer')
  );

-- Contributions: members can only see their own
CREATE POLICY "Users can view own contributions"
  ON contributions FOR SELECT
  USING (auth.uid() = member_id);

-- Transactions: members can only see their own
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = member_id);
```

## Testing

After creating tables:

1. **Test Payment Submission:**
   - Member signs in
   - Goes to payment submission
   - Submits payment
   - Check `payment_requests` table in Supabase

2. **Test Treasurer Approval:**
   - Treasurer signs in
   - Goes to payment approvals
   - Approves a payment
   - Check: `payment_requests` status updated
   - Check: `contributions` entry created
   - Check: `profiles.savings` increased

3. **Test Transaction History:**
   - Member views transaction history
   - Should see all transactions
   - PDF export should work

## Current Status

| Item | Status | Notes |
|------|--------|-------|
| Code | ✅ Complete | Treasurer approval components built |
| Database | ⏳ Needed | Create tables using SQL above |
| Testing | ⏳ Pending | After database creation |
| RLS Policies | ⏳ Optional | Recommended for security |

## How Long to Set Up?

- **Create tables:** 2-3 minutes
- **Add RLS policies:** 2 minutes (optional)
- **Test:** 5 minutes
- **Total:** ~10 minutes

---

**Summary:** YES, you need to run the SQL above to create these 4-5 tables in Supabase. The code is already written to use them - they just need to exist in your database.

