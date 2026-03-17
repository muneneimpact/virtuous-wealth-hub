
-- Tighten notification and audit log INSERT policies

DROP POLICY "Authenticated can create notifications" ON public.notifications;
CREATE POLICY "Admins and treasurers can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'treasurer')
    OR auth.uid() = user_id
  );

DROP POLICY "Authenticated can create audit logs" ON public.audit_logs;
CREATE POLICY "Admins and treasurers can create audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'treasurer')
  );
