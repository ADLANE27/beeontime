-- Fix 1: Add search_path to all functions to prevent SQL injection
CREATE OR REPLACE FUNCTION public.sync_employee_ids(old_id uuid, new_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET id = new_id WHERE id = old_id;
  UPDATE public.employees SET id = new_id WHERE id = old_id;
  UPDATE public.leave_requests SET employee_id = new_id WHERE employee_id = old_id;
  UPDATE public.delays SET employee_id = new_id WHERE employee_id = old_id;
  UPDATE public.time_records SET employee_id = new_id WHERE employee_id = old_id;
  UPDATE public.hr_events SET employee_id = new_id WHERE employee_id = old_id;
  UPDATE public.overtime_requests SET employee_id = new_id WHERE employee_id = old_id;
  UPDATE public.documents SET employee_id = new_id WHERE employee_id = old_id;
  UPDATE public.vacation_history SET employee_id = new_id WHERE employee_id = old_id;
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error syncing employee IDs: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_working_days(start_date date, end_date date)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    days INTEGER := 0;
    curr_date DATE := start_date;
BEGIN
    WHILE curr_date <= end_date LOOP
        IF EXTRACT(DOW FROM curr_date) NOT IN (0, 6) THEN
            days := days + 1;
        END IF;
        curr_date := curr_date + 1;
    END LOOP;
    RETURN days;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'employee');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_monthly_vacation()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE employees
    SET current_year_vacation_days = current_year_vacation_days + 2.5,
        last_vacation_credit_date = CURRENT_DATE
    WHERE (last_vacation_credit_date IS NULL OR
           last_vacation_credit_date < date_trunc('month', CURRENT_DATE));
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_previous_year_vacation_expiration()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF CURRENT_DATE > '2025-05-31' THEN
        INSERT INTO vacation_history (
            employee_id, year, action_type, days_affected, details
        )
        SELECT 
            id, 2024, 'expired',
            (previous_year_vacation_days - previous_year_used_days),
            jsonb_build_object(
                'previous_year_vacation_days', previous_year_vacation_days,
                'previous_year_used_days', previous_year_used_days
            )
        FROM employees
        WHERE (previous_year_vacation_days - previous_year_used_days) > 0;

        UPDATE employees
        SET previous_year_vacation_days = 0, previous_year_used_days = 0
        WHERE (previous_year_vacation_days - previous_year_used_days) > 0;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_vacation_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    working_days INTEGER;
    current_year INTEGER;
    is_current_year BOOLEAN;
    remaining_previous_year NUMERIC;
    days_from_previous_year NUMERIC := 0;
    days_from_current_year NUMERIC := 0;
BEGIN
    IF NEW.day_type = 'half' THEN
        working_days := calculate_working_days(NEW.start_date, NEW.end_date) / 2.0;
    ELSE
        working_days := calculate_working_days(NEW.start_date, NEW.end_date);
    END IF;

    IF NEW.status = 'approved' THEN
        SELECT (previous_year_vacation_days - previous_year_used_days)
        INTO remaining_previous_year
        FROM employees
        WHERE id = NEW.employee_id;

        IF remaining_previous_year > 0 AND CURRENT_DATE <= '2025-05-31' THEN
            days_from_previous_year := LEAST(remaining_previous_year, working_days);
            days_from_current_year := working_days - days_from_previous_year;

            UPDATE employees 
            SET previous_year_used_days = previous_year_used_days + days_from_previous_year,
                current_year_used_days = current_year_used_days + days_from_current_year
            WHERE id = NEW.employee_id;
        ELSE
            UPDATE employees 
            SET current_year_used_days = current_year_used_days + working_days
            WHERE id = NEW.employee_id;
        END IF;

        INSERT INTO vacation_history (
            employee_id, year, action_type, days_affected, details
        ) VALUES (
            NEW.employee_id,
            EXTRACT(YEAR FROM NEW.start_date)::INTEGER,
            'leave_taken',
            working_days,
            jsonb_build_object(
                'leave_request_id', NEW.id,
                'start_date', NEW.start_date,
                'end_date', NEW.end_date,
                'type', NEW.type,
                'days_from_previous_year', days_from_previous_year,
                'days_from_current_year', days_from_current_year
            )
        );
    ELSIF OLD.status = 'approved' AND NEW.status = 'rejected' THEN
        WITH hist AS (
            SELECT details->>'days_from_previous_year' as prev_days,
                   details->>'days_from_current_year' as curr_days
            FROM vacation_history
            WHERE employee_id = NEW.employee_id
            AND details->>'leave_request_id' = NEW.id::text
            AND action_type = 'leave_taken'
            LIMIT 1
        )
        UPDATE employees 
        SET previous_year_used_days = previous_year_used_days - COALESCE((hist.prev_days)::numeric, 0),
            current_year_used_days = current_year_used_days - COALESCE((hist.curr_days)::numeric, 0)
        FROM hist
        WHERE id = NEW.employee_id;

        INSERT INTO vacation_history (
            employee_id, year, action_type, days_affected, details
        ) VALUES (
            NEW.employee_id,
            EXTRACT(YEAR FROM NEW.start_date)::INTEGER,
            'leave_cancelled',
            working_days,
            jsonb_build_object(
                'leave_request_id', NEW.id,
                'start_date', NEW.start_date,
                'end_date', NEW.end_date,
                'type', NEW.type,
                'rejection_reason', NEW.rejection_reason
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Fix 2: Remove default hardcoded password from employees table
ALTER TABLE public.employees ALTER COLUMN initial_password DROP DEFAULT;
ALTER TABLE public.employees ALTER COLUMN initial_password DROP NOT NULL;

-- Fix 3: Secure hr-documents storage bucket (make it private)
UPDATE storage.buckets SET public = false WHERE id = 'hr-documents';

-- Fix 4: Add column-level encryption for social security numbers
-- First, enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted column for social security numbers
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS social_security_number_encrypted bytea;

-- Migrate existing data to encrypted column (if any exists)
UPDATE public.employees 
SET social_security_number_encrypted = pgp_sym_encrypt(social_security_number, current_setting('app.encryption_key', true))
WHERE social_security_number IS NOT NULL AND social_security_number_encrypted IS NULL;

-- Create function to decrypt social security numbers for authorized users
CREATE OR REPLACE FUNCTION public.get_decrypted_ssn(employee_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    encrypted_ssn bytea;
    decryption_key text;
BEGIN
    -- Only HR can decrypt SSN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr') THEN
        RAISE EXCEPTION 'Unauthorized access to sensitive data';
    END IF;
    
    SELECT social_security_number_encrypted INTO encrypted_ssn
    FROM employees
    WHERE id = employee_id;
    
    IF encrypted_ssn IS NULL THEN
        RETURN NULL;
    END IF;
    
    decryption_key := current_setting('app.encryption_key', true);
    RETURN pgp_sym_decrypt(encrypted_ssn, decryption_key);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;