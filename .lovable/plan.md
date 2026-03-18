

# Implementation Plan: Connect All Dashboards to Real Data & Complete Remaining Features

## Current State Summary

All three dashboards (Member, Treasurer, Admin) use **hardcoded mock data**. Auth is wired to Supabase (Google OAuth), but dashboards don't query the database. The `admins` table is a leftover from earlier work and should be ignored. The loan request modal uses a member list instead of membership number lookup. There is no guarantor accept/decline flow, no notifications UI, no loan calculator, and no export functionality.

## What Will Be Built

### 1. Database Migration: Seed Default Settings & Enable Realtime
- Insert a default row in `settings` table (interest_rate: 5, investment_target: 5000000, minimum_balance: 50000, minimum_contribution: 2000)
- Enable realtime on `notifications` table for live updates
- Drop the legacy `admins` table (not used by the new system)

### 2. Shared Data Hooks (new file: `src/hooks/useAppData.ts`)
Create React Query hooks that all dashboards share:
- `useProfile()` -- current user's profile
- `useSettings()` -- system settings from DB
- `useGroupFinancials()` -- calls `get_group_financials()` RPC
- `useMyContributions()` -- member's contribution history
- `useMyLoans()` -- member's loans with guarantor details
- `useMembers()` -- all active members (treasurer/admin only)
- `useAllLoans()` -- all loans (treasurer/admin only)
- `useAllContributions()` -- all contributions (treasurer/admin only)
- `useNotifications()` -- user's notifications with realtime subscription
- `useGuarantorRequests()` -- pending guarantor requests for current user
- `usePendingApprovals()` -- pending member approvals (admin only)

### 3. Auth Flow Fixes
- **After signup redirect**: Login.tsx already redirects based on role. Update redirect to go to dashboard immediately after Google auth callback (currently works but `pending` users go to `/pending-approval` -- this is correct behavior since admin must approve).
- **Logo click on dashboard**: Update `DashboardLayout.tsx` -- the logo link currently goes to `/` (landing page). Change it to stay on the appropriate dashboard based on role (`/dashboard`, `/treasurer`, or `/admin`).

### 4. Member Dashboard -- Real Data
Replace all mock data in `MemberDashboard.tsx`:
- Fetch profile, contributions, loans, guarantorships from Supabase
- Show membership number in the header area
- Calculate savings from `contributions` table sum
- Calculate loan balance from `loans` table
- Show real transaction history from `transactions` table
- Show real guarantorship data from `loan_guarantors` table
- Show group financials from `get_group_financials()` RPC
- Show settings (target, interest rate) from `settings` table

### 5. Loan Request Modal -- Membership Number Lookup
Rewrite `LoanRequestModal.tsx`:
- Replace member list with membership number input field
- Call `lookup_member_by_number()` RPC to find guarantor by number
- Show guarantor name after lookup
- Allow adding multiple guarantors by membership number
- On submit: create a `loans` row (status: `pending_guarantors`), then create `loan_guarantors` rows for each guarantor (status: `pending`)
- Create `notifications` for each guarantor (type: `guarantor_request`)

### 6. Guarantor Accept/Decline Flow (new component: `src/components/member/GuarantorRequestsInbox.tsx`)
- Show incoming guarantor requests on the member dashboard
- Each request shows: borrower name, loan amount, guarantee amount requested
- Accept/Decline buttons that update `loan_guarantors.status`
- When all guarantors accept, auto-update loan status to `pending_approval`
- Send notification to borrower on accept/decline

### 7. Notification System (new component: `src/components/notifications/NotificationBell.tsx`)
- Bell icon in `DashboardLayout.tsx` header with unread count badge
- Dropdown showing recent notifications
- Mark as read on click
- Realtime subscription via Supabase channel on `notifications` table
- Notification types: guarantor_request, guarantor_accepted, guarantor_declined, loan_approved, loan_rejected, contribution_recorded

### 8. Treasurer Dashboard -- Real Data
Replace all mock data in `TreasurerDashboard.tsx`:
- Fetch members from `profiles` table (with contribution sums via a query)
- Fetch pending loans (status: `pending_approval`) with their guarantors
- `MemberUpdateModal` -- write contributions to DB, record transactions
- `LoanApprovalModal` -- update loan status in DB, record transactions, send notifications
- `SettingsPanel` -- read/write from `settings` table
- Monthly chart data from `contributions` and `loans` tables grouped by month
- Recent activity from `transactions` table

### 9. Admin Dashboard -- Real Data
Replace all mock data in `AdminDashboard.tsx`:
- **Pending Member Approvals section**: Fetch profiles with `status='pending'`, show approve/reject buttons
- On approve: update `profiles.status` to `active`, send `member_approved` notification
- On reject: update `profiles.status` to `rejected`, send `member_rejected` notification
- **User Management**: Fetch all profiles with their roles from `user_roles`
- **Role Assignment**: Allow admin to add/remove treasurer role (insert/delete from `user_roles`)
- **Toggle active/inactive**: Update `profiles.status`
- **Audit Logs**: Fetch from `audit_logs` table
- **Stats**: Real counts from DB queries

### 10. Loan Calculator (new component: `src/components/member/LoanCalculator.tsx`)
- Standalone card on member dashboard
- Input: loan amount, repayment period (months)
- Output: monthly payment breakdown at 5% interest per month
- Shows total interest paid and total repayment

### 11. Export Reports (new utility: `src/lib/exportReports.ts`)
- CSV export for: contributions history, loan statements, transaction logs
- Export button on Treasurer and Admin dashboards
- Uses browser-native CSV generation (no library needed)

## Files to Create
- `src/hooks/useAppData.ts` -- all shared data hooks
- `src/components/member/GuarantorRequestsInbox.tsx` -- accept/decline guarantor requests
- `src/components/notifications/NotificationBell.tsx` -- notification bell with dropdown
- `src/components/member/LoanCalculator.tsx` -- loan repayment calculator
- `src/lib/exportReports.ts` -- CSV export utility

## Files to Modify
- `src/components/layout/DashboardLayout.tsx` -- logo link fix, add NotificationBell
- `src/pages/MemberDashboard.tsx` -- replace mock data with hooks
- `src/pages/TreasurerDashboard.tsx` -- replace mock data with hooks
- `src/pages/AdminDashboard.tsx` -- replace mock data with hooks, add member approval
- `src/components/member/LoanRequestModal.tsx` -- membership number lookup flow
- `src/components/treasurer/LoanApprovalModal.tsx` -- write to DB
- `src/components/treasurer/MemberUpdateModal.tsx` -- write to DB
- `src/components/treasurer/SettingsPanel.tsx` -- read/write settings from DB
- `src/components/treasurer/PendingLoanRequests.tsx` -- accept real data types

## Database Migration Needed
- Seed default settings row
- Enable realtime on notifications
- Drop legacy `admins` table

## Implementation Order
1. DB migration (seed settings, enable realtime, drop admins)
2. Data hooks (`useAppData.ts`)
3. Logo link fix + NotificationBell in DashboardLayout
4. Admin Dashboard (member approvals + role management + real data)
5. Treasurer Dashboard (real data + DB writes)
6. Member Dashboard (real data + guarantor inbox)
7. Loan Request Modal (membership number lookup + DB writes)
8. Loan Calculator + Export Reports

