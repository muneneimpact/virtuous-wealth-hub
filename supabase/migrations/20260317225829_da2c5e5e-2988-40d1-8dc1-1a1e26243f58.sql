
-- ============================================
-- CHAMA APP: Complete Database Schema
-- ============================================

-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'treasurer', 'member');

-- 2. Create enum for loan status
CREATE TYPE public.loan_status AS ENUM ('draft', 'pending_guarantors', 'pending_approval', 'approved', 'rejected', 'disbursed', 'repaid');

-- 3. Create enum for guarantor status
CREATE TYPE public.guarantor_status AS ENUM ('pending', 'accepted', 'declined');

-- 4. Create enum for notification type
CREATE TYPE public.notification_type AS ENUM (
  'guarantor_request', 'guarantor_accepted', 'guarantor_declined',
  'loan_approved', 'loan_rejected', 'loan_disbursed',
  'contribution_recorded', 'member_approved', 'member_rejected'
);

-- 5. Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- TABLES
-- ============================================

-- 6. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  membership_number TEXT UNIQUE,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. Contributions table
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  month TEXT NOT NULL,
  recorded_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- 9. Loans table
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  interest_rate NUMERIC NOT NULL DEFAULT 5,
  processing_fee NUMERIC NOT NULL DEFAULT 0,
  deduct_fee_from_loan BOOLEAN NOT NULL DEFAULT false,
  status loan_status NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  disbursement_date TIMESTAMPTZ,
  repaid_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Loan guarantors table
CREATE TABLE public.loan_guarantors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  guarantor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status guarantor_status NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_guarantors ENABLE ROW LEVEL SECURITY;

-- 11. Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('contribution', 'loan_disbursement', 'loan_repayment', 'processing_fee', 'interest_payment', 'adjustment')),
  amount NUMERIC NOT NULL,
  member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 12. Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 13. Settings table
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_rate NUMERIC NOT NULL DEFAULT 5,
  investment_target NUMERIC NOT NULL DEFAULT 5000000,
  minimum_balance NUMERIC NOT NULL DEFAULT 50000,
  minimum_contribution NUMERIC NOT NULL DEFAULT 2000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_status(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.profiles WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.generate_membership_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  done BOOLEAN;
BEGIN
  done := FALSE;
  WHILE NOT done LOOP
    new_number := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
    done := NOT EXISTS (SELECT 1 FROM public.profiles WHERE membership_number = new_number);
  END LOOP;
  RETURN new_number;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, membership_number, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    public.generate_membership_number(),
    'pending'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and treasurers can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Contributions
CREATE POLICY "Members can view own contributions"
  ON public.contributions FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "Treasurers and admins can view all contributions"
  ON public.contributions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

CREATE POLICY "Treasurers can record contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

-- Loans
CREATE POLICY "Members can view own loans"
  ON public.loans FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "Treasurers and admins can view all loans"
  ON public.loans FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

CREATE POLICY "Members can create own loans"
  ON public.loans FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can update own draft loans"
  ON public.loans FOR UPDATE
  USING (auth.uid() = member_id AND status IN ('draft', 'pending_guarantors'));

CREATE POLICY "Treasurers can update loans"
  ON public.loans FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

-- Loan guarantors
CREATE POLICY "Guarantors can view their requests"
  ON public.loan_guarantors FOR SELECT
  USING (auth.uid() = guarantor_id);

CREATE POLICY "Loan owners can view their loan guarantors"
  ON public.loan_guarantors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loans WHERE loans.id = loan_guarantors.loan_id AND loans.member_id = auth.uid()
  ));

CREATE POLICY "Treasurers and admins can view all guarantors"
  ON public.loan_guarantors FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

CREATE POLICY "Loan owners can add guarantors"
  ON public.loan_guarantors FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.loans WHERE loans.id = loan_guarantors.loan_id AND loans.member_id = auth.uid()
  ));

CREATE POLICY "Guarantors can respond to requests"
  ON public.loan_guarantors FOR UPDATE
  USING (auth.uid() = guarantor_id);

-- Transactions
CREATE POLICY "Members can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "Treasurers and admins can manage transactions"
  ON public.transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Settings
CREATE POLICY "All authenticated can view settings"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and treasurers can update settings"
  ON public.settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'treasurer'));

CREATE POLICY "Admins can insert settings"
  ON public.settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_group_financials()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_contributions', COALESCE((SELECT SUM(amount) FROM public.contributions), 0),
    'total_loans_disbursed', COALESCE((SELECT SUM(amount) FROM public.loans WHERE status IN ('disbursed', 'repaid')), 0),
    'total_loans_outstanding', COALESCE((SELECT SUM(amount - repaid_amount) FROM public.loans WHERE status = 'disbursed'), 0),
    'total_repaid', COALESCE((SELECT SUM(repaid_amount) FROM public.loans WHERE status IN ('disbursed', 'repaid')), 0),
    'member_count', (SELECT COUNT(*) FROM public.profiles WHERE status = 'active')
  )
$$;

CREATE OR REPLACE FUNCTION public.lookup_member_by_number(_membership_number TEXT)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'user_id', user_id,
    'display_name', display_name,
    'membership_number', membership_number
  )
  FROM public.profiles
  WHERE membership_number = _membership_number
    AND status = 'active'
$$;

-- Insert default settings
INSERT INTO public.settings (interest_rate, investment_target, minimum_balance, minimum_contribution)
VALUES (5, 5000000, 50000, 2000);
