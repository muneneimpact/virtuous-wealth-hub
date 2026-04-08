
CREATE POLICY "Guarantors can view loans they guarantee"
ON public.loans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.loan_guarantors
    WHERE loan_guarantors.loan_id = loans.id
    AND loan_guarantors.guarantor_id = auth.uid()
  )
);
