# Chama Loan System - Quick Reference Guide

## Overview
The Chama Web Application now features an advanced loan borrowing and guarantorship system that ensures responsible lending and protects group finances.

## For Members

### Getting a Loan

#### Step 1: Check Your Eligibility
On your dashboard, you'll see:
- **My Savings** - Your total contributions
- **Maximum Loan Eligible** - 5 times your savings
- **Available to Borrow** - How much more you can request

#### Step 2: Request a Loan
Click "Request Loan" button:
1. Enter the loan amount
2. The system will automatically show:
   - Interest rate and estimated interest
   - **Self-Guarantee Status** - Whether you qualify for self-guarantee
   - **Amount Requiring Guarantors** - How much needs coverage

#### Step 3: Self-Guarantee or Find Guarantors
**If Self-Guarantee Available:**
- No guarantors needed
- Loan goes directly to Treasurer for approval
- You save time!

**If Guarantors Needed:**
1. Search for guarantors by their membership number
2. See their available capacity
3. Enter the amount you want them to guarantee
4. They'll receive a notification

#### Step 4: Wait for Approval
- Monitor your loan status in the dashboard
- You'll be notified when guarantors accept/decline
- Treasurer will review and approve/reject

### Your Guarantor Requests
Check the "Guarantor Requests" section to see:
- Who is asking you to guarantee
- How much they're requesting
- Accept or Decline buttons

**Important:** Only accept if you truly have the capacity to cover the amount.

## For Treasurers/Admins

### Managing Settings
Go to **Settings** to configure:
- **Interest Rate** - Applied to all new loans
- **Investment Target** - Group's collective goal
- **Minimum Bank Balance** - Protects group liquidity (default: 50,000 KES)

### Understanding the Rules
The system enforces several rules:

1. **Maximum Loan** = 5 × Member Savings
2. **Self-Guarantee Rule** = Loan ≤ (Savings - 5,000 - Interest)
3. **Guarantor Capacity** = Savings - Active Loans - Existing Guarantees
4. **Minimum Bank Balance** = Must remain above setting (default 50,000 KES)

### Approving Loans
1. View pending loans in the dashboard
2. Check if all guarantors have accepted (if applicable)
3. Verify bank balance won't drop below minimum
4. Approve or Reject with reason

## Key Concepts

### Self-Guarantee Explained
A member can self-guarantee (no external guarantors needed) if their savings are sufficient:

**Formula:** Loan Amount ≤ (Total Savings - 5,000 - Interest)

**Example:**
- Your Savings: KES 100,000
- Loan Request: KES 60,000
- Interest Rate: 10% → Interest = KES 6,000
- Self-Guarantee Limit: 100,000 - 5,000 - 6,000 = 89,000 KES
- ✓ You can self-guarantee! (60,000 < 89,000)

### Guarantor Capacity Explained
A guarantor can only guarantee up to their available capacity:

**Formula:** Available Capacity = Savings - Active Loans - Existing Guarantees

**Example:**
- Guarantor's Savings: KES 50,000
- Their Active Loans: KES 10,000
- Their Existing Guarantees: KES 15,000
- Available Capacity: 50,000 - 10,000 - 15,000 = KES 25,000
- ✓ They can guarantee up to KES 25,000

### Safety Buffer
The 5,000 KES buffer is mandatory to ensure members maintain a safety cushion for emergencies.

## Notifications
You'll receive notifications for:
- ✉️ Guarantee requests from borrowers
- ✅ When borrowers accept your guarantee
- ❌ When borrowers decline your guarantee
- 💰 When your loan is approved
- ⛔ When your loan is rejected
- 🎉 When your loan is disbursed

## Loan Status Flow

```
Draft
   ↓
Pending Guarantors (if needed) ← Guarantors Accept
   ↓
Pending Approval
   ↓
Approved ← Treasurer Approval
   ↓
Disbursed ← Funds Released
   ↓
Repaid ← Loan Completed
```

## Common Questions

**Q: Why do I need guarantors?**
A: They provide security for the group. Their guarantee ensures the group can recover the loan if needed.

**Q: Can I guarantee my own loan?**
A: No, the system prevents this for transparency.

**Q: What if I don't have enough guarantors?**
A: Your loan will remain pending. Ask other members or reduce the loan amount.

**Q: Can the bank balance go below the minimum?**
A: No. The system will reject loans that would cause this. This protects the group's liquidity.

**Q: What happens if I decline a guarantee request?**
A: The borrower is notified and can find another guarantor.

**Q: Can I change my guarantee response?**
A: Not automatically. Contact your treasurer if you need to change.

## Need Help?
Contact your treasurer for:
- Loan approval status
- Questions about eligibility
- Changing settings
- Special circumstances

---

**Last Updated:** March 18, 2026
**System Version:** 1.0
