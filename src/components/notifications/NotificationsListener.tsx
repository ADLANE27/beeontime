import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge, FileText } from "lucide-react";

export const NotificationsListener = () => {
  useEffect(() => {
    const setupNotifications = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const userId = sessionData.session.user.id;

      // Documents channel
      const documentsChannel = supabase
        .channel('documents-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'documents',
            filter: `employee_id=eq.${userId}`
          },
          (payload) => {
            const document = payload.new as any;
            if (document.type === 'payslip') {
              toast.info('Nouvelle fiche de paie disponible', {
                icon: <Badge className="h-4 w-4" />,
                description: `Une nouvelle fiche de paie a été ajoutée : ${document.title}`
              });
            } else if (document.type === 'important_document') {
              toast.info('Nouveau document important', {
                icon: <FileText className="h-4 w-4" />,
                description: `Un nouveau document important a été ajouté : ${document.title}`
              });
            }
          }
        )
        .subscribe();

      // Leave requests channel
      const leaveRequestsChannel = supabase
        .channel('leave-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'leave_requests',
            filter: `employee_id=eq.${userId}`
          },
          (payload) => {
            const request = payload.new as any;
            if (request.status === 'approved') {
              toast.success('Demande de congés approuvée', {
                icon: <Badge className="h-4 w-4" />,
                description: 'Votre demande de congés a été approuvée'
              });
            }
          }
        )
        .subscribe();

      // Overtime requests channel
      const overtimeRequestsChannel = supabase
        .channel('overtime-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'overtime_requests',
            filter: `employee_id=eq.${userId}`
          },
          (payload) => {
            const request = payload.new as any;
            if (request.status === 'approved') {
              toast.success('Heures supplémentaires approuvées', {
                icon: <Badge className="h-4 w-4" />,
                description: 'Votre demande d\'heures supplémentaires a été approuvée'
              });
            }
          }
        )
        .subscribe();

      // Delays channel
      const delaysChannel = supabase
        .channel('delays-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'delays',
            filter: `employee_id=eq.${userId}`
          },
          (payload) => {
            const delay = payload.new as any;
            if (delay.status === 'approved') {
              toast.info('Retard validé', {
                icon: <Badge className="h-4 w-4" />,
                description: 'Votre retard a été validé par les RH'
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(documentsChannel);
        supabase.removeChannel(leaveRequestsChannel);
        supabase.removeChannel(overtimeRequestsChannel);
        supabase.removeChannel(delaysChannel);
      };
    };

    const cleanup = setupNotifications();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, []);

  return null;
};