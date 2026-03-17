
-- Fix overly permissive INSERT policies on notifications and audit_logs
-- These should only be insertable by authenticated users (system operations happen via security definer functions)

DROP POLICY "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY "System can create audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can create audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
