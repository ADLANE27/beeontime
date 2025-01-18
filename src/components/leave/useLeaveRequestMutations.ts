import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInBusinessDays, parseISO } from "date-fns";

interface UseLeaveRequestMutationsProps {
  onSuccess?: () => void;
}

export const useLeaveRequestMutations = ({ onSuccess }: UseLeaveRequestMutationsProps = {}) => {
  const queryClient = useQueryClient();

  const addLeaveRequestMutation = useMutation({
    mutationFn: async (newRequest: {
      employee_id: string;
      start_date: string;
      end_date: string;
      type: string;
      day_type: string;
      period?: string;
      reason?: string;
    }) => {
      // Calculate business days
      const days = differenceInBusinessDays(
        parseISO(newRequest.end_date),
        parseISO(newRequest.start_date)
      ) + 1;

      const daysToDeduct = newRequest.day_type === 'half' ? days * 0.5 : days;

      // Get employee's current vacation balance
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('current_year_vacation_days, current_year_used_days, previous_year_vacation_days, previous_year_used_days')
        .eq('id', newRequest.employee_id)
        .single();

      if (employeeError) throw employeeError;

      const previousYearRemaining = employee.previous_year_vacation_days - employee.previous_year_used_days;
      const currentYearRemaining = employee.current_year_vacation_days - employee.current_year_used_days;
      const totalAvailable = previousYearRemaining + currentYearRemaining;

      if (daysToDeduct > totalAvailable) {
        throw new Error('Solde de congés insuffisant');
      }

      const { error } = await supabase
        .from('leave_requests')
        .insert(newRequest);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Demande de congés soumise avec succès");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la soumission de la demande");
      console.error('Error submitting leave request:', error);
    }
  });

  const updateLeaveRequestMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { 
      id: string;
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => {
      if (status === 'approved') {
        // Get the leave request details
        const { data: request, error: requestError } = await supabase
          .from('leave_requests')
          .select('*, employees(*)')
          .eq('id', id)
          .single();

        if (requestError) throw requestError;

        // Calculate business days
        const days = differenceInBusinessDays(
          parseISO(request.end_date),
          parseISO(request.start_date)
        ) + 1;

        const daysToDeduct = request.day_type === 'half' ? days * 0.5 : days;

        // Get current balances
        const previousYearRemaining = request.employees.previous_year_vacation_days - request.employees.previous_year_used_days;
        
        // Deduct from previous year first, then current year
        if (previousYearRemaining >= daysToDeduct) {
          await supabase
            .from('employees')
            .update({
              previous_year_used_days: request.employees.previous_year_used_days + daysToDeduct
            })
            .eq('id', request.employee_id);
        } else {
          // Use all remaining previous year days and the rest from current year
          if (previousYearRemaining > 0) {
            const remainingToDeduct = daysToDeduct - previousYearRemaining;
            await supabase
              .from('employees')
              .update({
                previous_year_used_days: request.employees.previous_year_vacation_days,
                current_year_used_days: request.employees.current_year_used_days + remainingToDeduct
              })
              .eq('id', request.employee_id);
          } else {
            // Use only current year days
            await supabase
              .from('employees')
              .update({
                current_year_used_days: request.employees.current_year_used_days + daysToDeduct
              })
              .eq('id', request.employee_id);
          }
        }
      }

      // Update request status
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status,
          rejection_reason: rejectionReason
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Statut de la demande mis à jour avec succès");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du statut");
      console.error('Error updating leave request:', error);
    }
  });

  return {
    addLeaveRequestMutation,
    updateLeaveRequestMutation
  };
};