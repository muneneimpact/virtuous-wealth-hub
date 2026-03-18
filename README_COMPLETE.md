# Virtuous Deca Investment - Complete Web Application

**A secure, mobile-first investment group management platform built with React, TypeScript, and Supabase.**

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Key Functionality](#key-functionality)
- [Development](#development)

---

## 🎯 Overview

Virtuous Deca is a comprehensive investment group management system that enables members to:
- Pool resources through monthly contributions
- Access flexible loans with guarantorship
- Track investments and repayments
- Manage approvals and financial oversight
- View real-time analytics and reports

**Target**: KES 5M+ collective investment  
**Members**: Supporting 10+ active members  
**Interest Rate**: 5% monthly (or 18% p.a. for loans 6+ months and 50k+)

---

## ✨ Features

### For Members
- ✅ **Dashboard**: Real-time financial overview
- ✅ **Savings Tracking**: Monthly contributions and progress
- ✅ **Loan Requests**: Flexible borrowing with guarantors
- ✅ **Guarantorship**: Support other members' loans
- ✅ **Payment Submission**: Report M-Pesa payments for verification
- ✅ **Transaction History**: Complete records with PDF export
- ✅ **Mobile-Friendly**: Fully responsive design

### For Treasurers
- ✅ **Loan Review**: 4-rule eligibility validation system
- ✅ **Payment Approval**: Verify and approve member contributions
- ✅ **Member Management**: Update records and track arrears
- ✅ **Analytics**: Real-time group financial metrics
- ✅ **Settings**: Configure investment targets and minimum balance

### Security
- ✅ **Role-Based Access**: Members, Treasurers, Admins
- ✅ **Row-Level Security**: Database-level protection
- ✅ **Audit Logs**: Complete activity tracking
- ✅ **Authentication**: Secure login via Supabase

---

## 🛠️ Tech Stack

### Frontend
- **React** 18.3.1 - UI framework
- **TypeScript** - Type safety
- **Vite** 5.4.21 - Build tool
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **React Router** 6.30.1 - Navigation
- **React Query** 5.83.0 - Data fetching

### Backend
- **Supabase** - PostgreSQL database & auth
- **PostgreSQL** - Relational database
- **Row-Level Security** - Data protection

### Additional Libraries
- **Recharts** - Data visualization
- **jsPDF** - PDF export
- **Sonner** - Toast notifications
- **Lucide React** - Icons

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- GitHub account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/muneneimpact/virtuous-wealth-hub.git
cd virtuous-wealth-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Start development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
virtuous-wealth-hub/
├── src/
│   ├── components/
│   │   ├── dashboard/         # Stats, progress cards
│   │   ├── layout/            # Navigation, sidebar
│   │   ├── member/            # Loans, payments, transactions
│   │   ├── treasurer/         # Approvals, analytics
│   │   ├── notifications/     # Notification bell
│   │   └── ui/                # Reusable UI components
│   ├── contexts/              # Auth context
│   ├── hooks/                 # Custom hooks (data fetching)
│   ├── integrations/          # Supabase client
│   ├── lib/                   # Utilities & calculations
│   ├── pages/                 # Main pages (dashboards, login)
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
├── supabase/
│   └── migrations/            # Database migrations
├── public/                    # Static assets
├── .cpanel.yml               # cPanel deployment config
├── CPANEL_DEPLOYMENT.md      # Deployment guide
├── GITHUB_CPANEL_GUIDE.md    # GitHub push & cPanel steps
├── deploy.sh                 # Build script
├── vite.config.ts            # Vite configuration
├── tailwind.config.ts        # Tailwind configuration
└── package.json              # Dependencies
```

---

## 🌐 Deployment

### To cPanel via GitHub

#### Step 1: Prepare Code
```bash
# All changes are already committed
git status  # Should show "nothing to commit"

# Push to GitHub
git push origin main
```

#### Step 2: Configure cPanel
1. Log into cPanel
2. Find "Git Version Control"
3. Click "Create" or "Manage"
4. Add repository URL: `https://github.com/muneneimpact/virtuous-wealth-hub`
5. Select branch: `main`
6. Set deployment path: `/public_html`

#### Step 3: Deploy
- Click "Deploy" button
- System automatically:
  - Clones latest code
  - Runs `npm install`
  - Runs `npm run build`
  - Deploys to public_html

#### Step 4: Configure Environment
SSH into server:
```bash
cd public_html
nano .env
# Add Supabase credentials
```

For detailed instructions, see [GITHUB_CPANEL_GUIDE.md](GITHUB_CPANEL_GUIDE.md)

---

## 🎲 Key Functionality

### Loan System
**4-Rule Eligibility Validation:**
1. **Max Loan Rule**: Amount ≤ 5× member's savings
2. **Guarantorship Rule**: Member provides guarantors OR qualifies for self-guarantee
3. **Guarantor Capacity Rule**: Each guarantor amount ≤ their available savings
4. **Bank Balance Rule**: Available balance stays above minimum (KES 50,000)

**Tiered Interest:**
- Default: 5% monthly
- Special: 18% p.a. (1.5% monthly) for loans 6+ months AND > KES 50,000

### Payment Workflow
1. **Member Submits**: Reports M-Pesa payment with code
2. **Treasurer Verifies**: Checks bank records and code
3. **Approval Updates**: Confirmed payment adds to member's savings in profiles table
4. **Notification**: Member receives confirmation

### Financial Calculations
- **Self-Guarantee Limit**: 80% of member's current savings
- **Guarantor Capacity**: Savings - Active Loans - Existing Guarantees
- **Interest Calculation**: Principal × Rate × Months ÷ 100
- **Monthly Payment**: Total Cost ÷ Repayment Months

---

## 👨‍💻 Development

### Available Scripts
```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Code Structure
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: React hooks + React Query
- **Type Safety**: Full TypeScript coverage
- **Mobile First**: All grids responsive (sm:, lg: breakpoints)

### Key Hooks
- `useAuth()` - Authentication context
- `useMyContributions()` - Member's contributions
- `useMyLoans()` - Member's loans
- `useMyTransactions()` - Member's transactions
- `usePendingLoans()` - Loans awaiting approval
- `useGroupFinancials()` - Collective group metrics

### Database Tables
- `profiles` - Member information
- `contributions` - Savings records
- `loans` - Loan records
- `loan_guarantors` - Guarantor relationships
- `payment_requests` - Payment submissions
- `transactions` - Transaction history
- `notifications` - User notifications
- `settings` - System configuration

---

## 📱 Mobile-First Design

### Responsive Breakpoints
- **Mobile**: < 640px (full width, single column)
- **Tablet**: 640px - 1024px (2 columns)
- **Desktop**: > 1024px (3+ columns)

### Grid Pattern (Mobile-First)
```tsx
// Bad (desktop-first)
className="grid md:grid-cols-2 lg:grid-cols-4"

// Good (mobile-first)
className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
```

### Dialog Widths
```tsx
// Mobile-responsive
className="w-full max-w-md sm:max-w-lg md:max-w-2xl"
```

---

## 📊 Monitoring & Analytics

### Member Dashboard Shows
- Personal savings and loan balance
- Monthly contributions
- Active guarantorships
- Recent transactions
- Loan eligibility status

### Treasurer Dashboard Shows
- Group financial overview
- Pending loan requests
- Payment approvals queue
- Member contributions chart
- Active members count
- Collective investment progress

---

## 🔒 Security Features

1. **Authentication**: Email/password via Supabase
2. **Authorization**: Role-based access control
3. **Database Security**: Row-Level Security policies
4. **Data Validation**: Frontend + backend validation
5. **Audit Trail**: All actions logged
6. **Environment Variables**: Sensitive data in .env

---

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v  # Should be 18+
```

### Deployment Issues
See [GITHUB_CPANEL_GUIDE.md](GITHUB_CPANEL_GUIDE.md#troubleshooting-commands)

### Performance
- Vite provides fast HMR
- React Query caches data efficiently
- Tailwind purges unused styles
- Built files are optimized

---

## 📝 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview (this file) |
| `CPANEL_DEPLOYMENT.md` | cPanel deployment guide |
| `GITHUB_CPANEL_GUIDE.md` | GitHub push & cPanel setup |
| `.cpanel.yml` | Automated deployment config |
| `.env.example` | Environment variables template |
| `deploy.sh` | Local build script |

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## 📄 License

This project is proprietary to Virtuous Deca Investment Group.

---

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the troubleshooting guides
3. Check recent git commits for changes
4. Contact the development team

---

## 🚀 Deployment Checklist

- [x] All code committed to GitHub
- [x] `.cpanel.yml` created and valid
- [x] Environment variables documented
- [x] Build process tested locally
- [x] Mobile responsiveness verified
- [x] Database migrations applied
- [x] Security policies configured
- [x] Documentation complete

---

**Version**: 1.0.0  
**Last Updated**: March 18, 2026  
**Status**: ✅ Production Ready

