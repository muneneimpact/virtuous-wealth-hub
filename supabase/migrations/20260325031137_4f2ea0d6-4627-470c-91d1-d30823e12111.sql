CREATE OR REPLACE FUNCTION public.get_group_financials()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'total_contributions', COALESCE((SELECT SUM(amount) FROM public.contributions), 0),
    'total_loans_disbursed', COALESCE((SELECT SUM(amount) FROM public.loans WHERE status IN ('disbursed', 'repaid')), 0),
    'total_loans_outstanding', COALESCE((SELECT SUM(amount - repaid_amount) FROM public.loans WHERE status = 'disbursed'), 0),
    'total_repaid', COALESCE((SELECT SUM(repaid_amount) FROM public.loans WHERE status IN ('disbursed', 'repaid')), 0),
    'total_interest_earned', COALESCE((SELECT SUM(amount) FROM public.transactions WHERE type = 'interest_payment'), 0),
    'member_count', (SELECT COUNT(*) FROM public.profiles WHERE status = 'active')
  )
$function$