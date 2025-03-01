
-- Create a function to sync employee IDs when an auth user is created with a different ID
CREATE OR REPLACE FUNCTION public.sync_employee_ids(old_id UUID, new_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the profile record
  UPDATE public.profiles
  SET id = new_id
  WHERE id = old_id;
  
  -- Update the employee record
  UPDATE public.employees
  SET id = new_id
  WHERE id = old_id;
  
  -- Update any other tables that reference the employee ID
  UPDATE public.leave_requests
  SET employee_id = new_id
  WHERE employee_id = old_id;
  
  UPDATE public.delays
  SET employee_id = new_id
  WHERE employee_id = old_id;
  
  UPDATE public.time_records
  SET employee_id = new_id
  WHERE employee_id = old_id;
  
  UPDATE public.hr_events
  SET employee_id = new_id
  WHERE employee_id = old_id;
  
  UPDATE public.overtime_requests
  SET employee_id = new_id
  WHERE employee_id = old_id;
  
  UPDATE public.documents
  SET employee_id = new_id
  WHERE employee_id = old_id;
  
  UPDATE public.vacation_history
  SET employee_id = new_id
  WHERE employee_id = old_id;
  
  -- Return success
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error syncing employee IDs: %', SQLERRM;
END;
$$;
