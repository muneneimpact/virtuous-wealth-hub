
-- Drop legacy admins table
DROP TABLE IF EXISTS public.admins;

-- Allow all authenticated users to create notifications
DROP POLICY IF EXISTS "Admins and treasurers can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to view active member profiles (for guarantor lookup)
CREATE POLICY "Authenticated users can view active profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Auto-update loan status when all guarantors accept
CREATE OR REPLACE FUNCTION public.check_all_guarantors_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.loan_guarantors
      WHERE loan_id = NEW.loan_id AND status != 'accepted'
    ) THEN
      UPDATE public.loans SET status = 'pending_approval'
      WHERE id = NEW.loan_id AND status = 'pending_guarantors';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_guarantor_response
  AFTER UPDATE OF status ON public.loan_guarantors
  FOR EACH ROW
  EXECUTE FUNCTION public.check_all_guarantors_accepted();

-- Enable realtime on notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
