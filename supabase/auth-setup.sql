-- Server-side validation for USC email addresses
-- This adds an extra layer of security beyond client-side validation

-- Create a function to validate USC emails
CREATE OR REPLACE FUNCTION public.validate_usc_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NOT NEW.email LIKE '%@usc.edu' THEN
    RAISE EXCEPTION 'Only @usc.edu email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger on auth.users requires elevated permissions
-- You may need to contact Supabase support or use their dashboard
-- to enable email domain restrictions at the auth level

-- For now, the client-side validation in AuthForm.tsx
-- will prevent non-USC emails from signing up
