

# Implementation Plan: Secure Chama Application with Supabase Backend

## Gap Analysis -- What's Missing vs. What Exists

**Currently built (frontend-only, mock data):**
- Landing page, Login page (hardcoded demo credentials)
- Member Dashboard (stats, transactions, guarantorships, loan request modal)
- Treasurer Dashboard (member table, loan approval, settings, member update modal)
- Admin Dashboard (user management, audit logs)
- Financial Overview component, Progress Card
- All using localStorage for auth -- no real backend

**Missing (from the user's requirements):**

| # | Feature | Status |
|---|---------|--------|
| 1 | Google Authentication (Supabase Auth) | Not built |
| 2 | Admin approval of new members before activation | Not built |
| 3 | Auto-generated unique 5-digit Membership Number | Not built |
| 4 | Guarantor lookup by membership number | Not built -- currently uses member list |
| 5 | Guarantor accept/decline flow (notifications) | Not built -- currently borrower selects amounts directly |
| 6 | Real database persistence (all data is mock) | Not built |
| 7 | Role-based RLS (members see only their own data) | Not built |
| 8 | Notification system (guarantor requests, approvals) | Not built |
| 9 | Loan calculator | Not built |
| 10 | Transaction logs / audit trail in DB | Not built |
| 11 | Export financial reports | Not built |
| 12 | Membership number display in member dashboard | Not built |
| 13 | Monthly contribution history per member | Partially -- just recent transactions |
| 14 | Outstanding loans visibility for all members | Partially -- FinancialOverview exists |

## Implementation Plan

This is a large scope requiring a Supabase backend. The plan is organized into phases.

---

### Phase 1: Connect Supabase & Set Up Database Schema

**Database tables to create via migrations:**

- `profiles` -- user profiles with membership_number (unique 5-digit), display_name, status (pending/active/suspended)
- `user_roles` -- role assignments (admin, treasurer, member) using `app_role` enum
- `contributions` -- monthly contribution records (member_id, amount, month, recorded_by)
- `loans` -- loan applications (member_id, amount, status, interest_rate, processing_fee, approved_by, disbursement_date)
- `loan_guarantors` -- guarantor requests per loan (loan_id, guarantor_id, amount, status: pending/accepted/declined)
- `transactions` -- all financial movements (type, amount, member_id, reference)
- `notifications` -- in-app notifications (user_id, type, message, read, data)
- `settings` -- system settings (interest_rate, investment_target, minimum_balance)
- `audit_logs` -- all admin/treasurer actions

**RLS policies:**
- Members can only read their own profiles, contributions, loans, guarantor requests
- Members can see aggregate group data (total contributions, bank balance, target)
- Treasurers can read/write all member financial data
- Admins can manage roles and all data
- Use `has_role()` security definer function to avoid recursive RLS

**Trigger:** On new user signup, auto-generate unique 5-digit membership number and create profile with status='pending'.

---

### Phase 2: Authentication -- Google Sign-In + Approval Flow

- Replace hardcoded login with Supabase Auth (Google OAuth)
- New signup flow: user signs in with Google -> profile created with status='pending'
- Admin sees pending members and can approve/reject
- On approval, member gets activated and can access their dashboard
- Auth context provider wrapping the app
- Protected routes based on role and approval status
- "Pending Approval" page for unapproved users

---

### Phase 3: Guarantor Request Flow

- Member requests loan -> selects guarantors by entering their **membership number**
- System looks up member name from membership number
- Member enters amount for each guarantor
- On submission: guarantor requests created with status='pending'
- Guarantors see incoming requests in their dashboard notifications
- Guarantors can Accept or Decline each request
- Loan can only be submitted to Treasurer once all guarantors have accepted
- Treasurer sees fully-guaranteed requests and can approve/reject

---

### Phase 4: Real-time Notifications

- In-app notification bell in the dashboard header
- Notification types: guarantor_request, guarantor_response, loan_approved, loan_rejected, contribution_recorded
- Supabase Realtime subscriptions for live updates
- Unread count badge

---

### Phase 5: Enhanced Features

- **Loan Calculator:** standalone component showing repayment schedule at 5% monthly interest
- **Export Reports:** CSV/PDF export of transactions, contributions, loan statements
- **Transaction Logs:** complete audit trail visible to Admin
- **Monthly Contribution History:** detailed per-member history table
- **SMS/Email notifications:** via Supabase Edge Function + email provider (future)

---

### Phase 6: UI Updates to Existing Components

- Member Dashboard: show membership number, add notification bell, guarantor request inbox
- Loan Request Modal: change guarantor selection from list to membership number input
- Treasurer Dashboard: show pending member approvals, real data from DB
- Admin Dashboard: member approval section, role assignment, real audit logs
- All dashboards: connect to Supabase queries instead of mock data

---

## Technical Architecture

```text
Frontend (React + Vite)
  ├── Supabase Auth (Google OAuth)
  ├── Auth Context + Protected Routes
  ├── React Query for data fetching
  └── Supabase Realtime for notifications

Supabase Backend
  ├── Auth (Google provider)
  ├── Database (PostgreSQL)
  │   ├── profiles (with membership_number)
  │   ├── user_roles (admin, treasurer, member)
  │   ├── contributions
  │   ├── loans + loan_guarantors
  │   ├── transactions
  │   ├── notifications
  │   ├── settings
  │   └── audit_logs
  ├── RLS Policies (role-based)
  ├── DB Triggers (auto membership number, audit logging)
  └── Edge Functions (optional: email/SMS)
```

## Prerequisites

**Lovable Cloud must be connected first** to create the Supabase database, authentication, and RLS policies. This is the critical first step before any implementation can begin.

## Estimated Scope

This is a significant build (~15-20 implementation steps). I recommend starting with Phase 1 (database) and Phase 2 (auth), then iterating through the remaining phases.

