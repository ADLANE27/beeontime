import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationsListener = () => {
  useEffect(() => {
    const setupNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const channel = supabase
        .channel('employee-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'documents',
            filter: `employee_id=eq.${session.user.id}`,
          },
          (payload) => {
            toast.info("Un nouveau document a été ajouté à votre compte", {
              description: payload.new.title,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leave_requests',
            filter: `employee_id=eq.${session.user.id}`,
          },
          (payload: any) => {
            if (payload.old.status === 'pending' && payload.new.status === 'approved') {
              toast.success("Votre demande de congés a été approuvée", {
                description: `Du ${new Date(payload.new.start_date).toLocaleDateString()} au ${new Date(payload.new.end_date).toLocaleDateString()}`,
              });
            } else if (payload.old.status === 'pending' && payload.new.status === 'rejected') {
              toast.error("Votre demande de congés a été refusée", {
                description: payload.new.rejection_reason ? `Motif: ${payload.new.rejection_reason}` : undefined,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'overtime_requests',
            filter: `employee_id=eq.${session.user.id}`,
          },
          (payload: any) => {
            if (payload.old.status === 'pending' && payload.new.status === 'approved') {
              toast.success("Votre demande d'heures supplémentaires a été approuvée", {
                description: `Pour le ${new Date(payload.new.date).toLocaleDateString()}`,
              });
            } else if (payload.old.status === 'pending' && payload.new.status === 'rejected') {
              toast.error("Votre demande d'heures supplémentaires a été refusée");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupNotifications();
  }, []);

  return null;
};