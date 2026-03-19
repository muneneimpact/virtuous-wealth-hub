-- Add missing columns to loans table
ALTER TABLE public.loans 
  ADD COLUMN IF NOT EXISTS repayment_months integer,
  ADD COLUMN IF NOT EXISTS total_interest numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_payment numeric DEFAULT 0;

-- Add missing notification_type enum values
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'contribution_approved';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'payment_rejected';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'contribution_submitted';

-- Create get_member_savings security definer function
CREATE OR REPLACE FUNCTION public.get_member_savings(_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM public.contributions
  WHERE member_id = _user_id
$$;

-- Create trigger for check_all_guarantors_accepted if not exists
DROP TRIGGER IF EXISTS on_guarantor_response ON public.loan_guarantors;
CREATE TRIGGER on_guarantor_response
  AFTER UPDATE ON public.loan_guarantors
  FOR EACH ROW
  EXECUTE FUNCTION public.check_all_guarantors_accepted();