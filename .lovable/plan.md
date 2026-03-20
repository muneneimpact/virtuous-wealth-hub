Plan: Hide Guarantor Savings from Loan Applicant

## What Changes

**Current behavior:** When a loan applicant looks up a guarantor by membership number, they see the guarantor's "Available Capacity" (savings minus existing commitments) and must enter an amount within that capacity.

**New behavior:** The loan applicant only sees the guarantor's **name and membership number** -- no financial details. The applicant enters how much they **want** from each guarantor (a requested amount). The guarantor then sees the request in their inbox and decides whether to accept or decline based on their own knowledge of their finances.

## Changes Required

### 1. LoanRequestModal.tsx

- **Remove** the savings lookup logic (lines 150-173 that query `get_member_savings`, `loan_guarantors`, and `loans` to calculate capacity)
- **Remove** `savings` from the `GuarantorEntry` interface (no longer needed)
- After lookup, just add guarantor with `name`, `userId`, `membershipNumber` -- no savings
- **Remove** the "Available Capacity" display block (lines 436-439) from each guarantor card
- **Remove** capacity-based validation (the `amt <= g.savings` checks) -- applicant can request any amount
- **Remove** the toast message showing "Available capacity: KES X"
- Simplify validation: just check that each guarantor has a requested amount > 0 and total requested amounts cover the `amountRequiringGuarantors`
- The label changes from "Guarantee Amount" to "Requested Amount"

### 2. GuarantorRequestsInbox.tsx

- No structural changes needed -- guarantors already see the requested amount and can accept/decline
- The guarantor sees how much the borrower is asking them to guarantee and decides based on their own knowledge

### 3. Validation Logic Update

- Remove `allGuarantorsValid` check that compares amount to savings
- `canSubmit` becomes: valid loan amount + (self-guarantee eligible OR total requested amounts >= amount requiring guarantors)

## Files to Modify

- `src/components/member/LoanRequestModal.tsx` -- remove savings display, simplify validation, remove capacity queries

No database changes needed.  
alongside the above  plan have it such that the finance balancing is done will, If someone makes a payment, they can indicate if its a loan payment or saving, even if its savings first the loan is deducted from the new amount. So that we dont say someone pays 20,000 it goes to their savings and then  the treasurer deducts it from the loan and the total savings were added to the totals. Make sure that all finances balances, If theres a loan and its paid we are able to see how it was deducted and once paid how it is.

  
