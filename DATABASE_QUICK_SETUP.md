# Quick: Database Setup for Treasurer Approval

## TL;DR

**YES - You need to create 5 tables in Supabase**

The treasurer approval feature needs these database tables to work:
1. `payment_requests` - Pending payments for treasurer to approve
2. `contributions` - Approved payments recorded
3. `transactions` - Complete transaction history
4. `loan_requests` - Loan approval tracking
5. `profiles` columns - Add `savings` and `status` fields

## Setup in 3 Steps (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your **virtuous-wealth-hub** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy & Paste This SQL

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

CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_month VARCHAR(7),
  contribution_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'recorded',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50),
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  direction VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

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

-- Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS savings DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_member_id ON payment_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_requests_status ON loan_requests(status);
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
```

### Step 3: Click Run

Click the **Run** button (or press Ctrl+Enter)

You should see:
```
Query executed successfully
```

## Done! ✅

After running the SQL:

1. **Treasurer can now:**
   - View pending payments from members
   - Approve or reject payments
   - Update member savings balance
   - See all transactions

2. **Members can:**
   - Submit payments for treasurer to approve
   - View their transaction history
   - Export PDF of transactions

3. **System records:**
   - All payments submitted
   - All approvals/rejections
   - Complete transaction history
   - Member savings totals

## What If I Get an Error?

**Error: "table already exists"**
- Tables might already exist in your database
- Just run the query anyway (IF NOT EXISTS prevents errors)

**Error: "Column already exists"**
- The columns might be there already
- ADD COLUMN IF NOT EXISTS prevents this error

**Other error:**
- Check Supabase project is correct
- Make sure you're logged in
- Copy entire SQL block above exactly

## Verify It Worked

After running SQL, go to **Table Editor** and verify you see:
- ✅ payment_requests
- ✅ contributions
- ✅ transactions
- ✅ loan_requests
- ✅ profiles (with new columns)

## Next Steps

After database setup:

1. ✅ Treasurer can approve payments at http://localhost:8082/treasurer
2. ✅ Members can submit payments at http://localhost:8082/dashboard
3. ✅ Members can view transaction history
4. ✅ Enable Email provider in Supabase (for email auth)

---

**That's it!** Your treasurer approval system is now fully functional.
