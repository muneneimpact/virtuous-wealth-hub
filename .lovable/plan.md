

# Fix Build Errors + Implement Missing Features

## Root Cause Analysis

The build errors stem from mismatches between the code and the database schema:

1. **`payment_requests` table not in types.ts** -- The table exists in the DB but the auto-generated types don't include it, causing `'payment_requests' is not assignable to parameter of type 'never'`
2. **Missing notification types** -- Code uses `contribution_approved`, `payment_rejected`, `contribution_submitted` but the enum only has 9 values
3. **Missing loan columns** -- `LoanRequestModal` inserts `repayment_months`, `total_interest`, `total_cost`, `monthly_payment` but these don't exist on the `loans` table
4. **`contributions.recorded_by` required** -- PaymentApprovalsPanel inserts a contribution without `recorded_by`
5. **`profiles.savings` not in types** -- exists in DB but not in generated types
6. **Guarantor savings showing 0** -- The lookup queries contributions but RLS only allows members to see their own contributions; treasurer/admin can see all, but a regular member doing `lookup_member_by_number` can't query another member's contributions
7. **Email auth needs auto-confirm** -- Email signup requires email confirmation which blocks immediate access; the signup handler also manually inserts a profile, conflicting with the `handle_new_user` trigger
8. **`maxLength` type error** -- `maxLength="15"` should be `maxLength={15}`

## Implementation Plan

### 1. Database Migration
Add missing columns and enum values:
- Add `repayment_months`, `total_interest`, `total_cost`, `monthly_payment` columns to `loans` table
- Add `contribution_approved`, `payment_rejected`, `contribution_submitted` to `notification_type` enum
- Create a `get_member_savings` security definer function so any authenticated user can look up another member's available guarantee capacity (needed for guarantor lookup)

### 2. Fix PaymentSubmissionModal.tsx
- Cast the `from("payment_requests")` call with `as any` to bypass type checking since the table exists but isn't in types
- Fix `maxLength` from string to number
- Remove the manual notification insert for the member (it's their own submission) or cast the type

### 3. Fix PaymentApprovalsPanel.tsx
- Use `as any` cast for `payment_requests` table access
- Add `recorded_by` to contributions insert
- Cast notification types that aren't in the enum
- Add savings update logic (already present in the current code, just needs type fixes)

### 4. Fix LoanRequestModal.tsx
- The insert includes columns that don't exist yet (`repayment_months`, `total_interest`, `total_cost`, `monthly_payment`). After migration adds them, types will auto-update. Meanwhile, cast as needed.
- Fix guarantor savings lookup: use the new `get_member_savings` RPC instead of querying `contributions` directly (which fails due to RLS)

### 5. Fix LoanApprovalModal.tsx
- Self-guaranteed loans (no guarantors) should pass validation: update `rule2_valid` and `rule3_valid` to handle loans with 0 guarantors that are self-guaranteed
- Cast `loan_disbursed` notification type

### 6. Enable Email Auth
- Enable auto-confirm for email signups (so users can sign in immediately)
- Fix signup handler: remove the manual `profiles.insert` since the `handle_new_user` trigger already creates the profile. Pass `full_name` in user metadata so the trigger picks it up.

### 7. Create Edge Functions Directory
- Create a placeholder `supabase/functions/.gitkeep` to satisfy the build check for the functions directory

## Files to Modify
- `src/components/member/PaymentSubmissionModal.tsx` -- type fixes
- `src/components/treasurer/PaymentApprovalsPanel.tsx` -- type fixes, add recorded_by
- `src/components/member/LoanRequestModal.tsx` -- use RPC for savings lookup, type fixes
- `src/components/treasurer/LoanApprovalModal.tsx` -- handle self-guaranteed loans
- `src/pages/Login.tsx` -- fix email signup (remove duplicate profile insert)

## Files to Create
- `supabase/functions/.gitkeep`

## Database Changes
- Migration: add 4 columns to loans, add 3 notification_type enum values, create `get_member_savings` RPC

