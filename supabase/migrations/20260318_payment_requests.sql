-- Payment Requests table for member payment submissions and treasurer approval
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_month TEXT NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'mpesa',
  mpesa_code TEXT,
  mpesa_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_requests
-- Members can view their own payment requests
CREATE POLICY "Members can view own payment requests" ON public.payment_requests
  FOR SELECT TO authenticated
  USING (member_id = auth.uid());

-- Members can create payment requests
CREATE POLICY "Members can create payment requests" ON public.payment_requests
  FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid());

-- Treasurers and admins can view all payment requests
CREATE POLICY "Treasurers and admins can view all payment requests" ON public.payment_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'treasurer')
    )
  );

-- Treasurers and admins can update payment requests
CREATE POLICY "Treasurers and admins can update payment requests" ON public.payment_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'treasurer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'treasurer')
    )
  );

-- Create index for faster queries
CREATE INDEX idx_payment_requests_member_id ON public.payment_requests(member_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_payment_requests_created_at ON public.payment_requests(submitted_at DESC);
