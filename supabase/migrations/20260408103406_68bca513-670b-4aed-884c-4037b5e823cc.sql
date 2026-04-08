
-- Drop the problematic policy
DROP POLICY IF EXISTS "Guarantors can view loans they guarantee" ON public.loans;

-- Create a security definer function to check if user is a guarantor for a loan
CREATE OR REPLACE FUNCTION public.is_guarantor_of_loan(_user_id uuid, _loan_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.loan_guarantors
    WHERE guarantor_id = _user_id AND loan_id = _loan_id
  )
$$;

-- Re-create the policy using the safe function
CREATE POLICY "Guarantors can view loans they guarantee"
ON public.loans
FOR SELECT
USING (public.is_guarantor_of_loan(auth.uid(), id));
