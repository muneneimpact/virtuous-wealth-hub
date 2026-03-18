# Loan & Guarantee System Implementation TODO

Current Progress: 5/9 steps complete ✅

## Steps from Approved Plan:

### 1. DB Schema [✅]
- Created `supabase/migrations/20260318_loans_and_guarantors.sql`
- Tables: loans, loan_guarantors
- RLS policies applied

### 2. Member: LoanRequestModal.tsx [✅]
- Created loan request form
- Integrated MemberFinancialSummary
- Guarantor search/selection with capacity checks
- Sends guarantee requests

### 3. Member: GuarantorRequestsPanel.tsx [✅]
- View sent guarantee requests by loan
- Pending/accepted/mixed status grouping
- Coverage summary and acceptance rate

### 4. Member: GuarantorInbox.tsx [✅]
- Incoming guarantee requests list
- Accept/Decline with confirmation dialogs
- Notifications to borrowers
- Capacity warnings

### 5. Treasurer: LoanApprovalsPanel.tsx [✅]
- List pending loans with guarantee status
- Real-time eligibility validation using loanCalculations
- Approve (disburse + transaction) / Reject flows
- Error display for failed rules

### 6. Integrate into Dashboards [ ]
- Add to member/treasurer dashboards

### 7. Test DB Migration [ ]
- Run supabase migration

### 8. Test Full Flow [ ]
- Loan request → guarantee → approve → disburse

### 9. Update Docs [ ]
- Update README and guides

**Next Step: 6. Integrate into Dashboards**

