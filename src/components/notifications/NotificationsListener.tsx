import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge, FileText } from "lucide-react";
import { atom, useAtom } from "jotai";

// Atoms pour stocker le nombre de notifications non lues
export const unreadDocumentsAtom = atom(0);
export const unreadLeavesAtom = atom(0);
export const unreadOvertimeAtom = atom(0);

export const NotificationsListener = () => {
  const [, setUnreadDocuments] = useAtom(unreadDocumentsAtom);
  const [, setUnreadLeaves] = useAtom(unreadLeavesAtom);
  const [, setUnreadOvertime] = useAtom(unreadOvertimeAtom);

  useEffect(() => {
    const setupNotifications = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const userId = sessionData.session.user.id;

      // Initialiser les compteurs
      const { data: unreadDocs } = await supabase
        .from('documents')
        .select('id')
        .eq('employee_id', userId)
        .eq('viewed', false)
        .count();
      
      const { data: pendingLeaves } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('employee_id', userId)
        .eq('status', 'approved')
        .is('viewed', false)
        .count();

      const { data: pendingOvertime } = await supabase
        .from('overtime_requests')
        .select('id')
        .eq('employee_id', userId)
        .eq('status', 'approved')
        .is('viewed', false)
        .count();

      setUnreadDocuments(unreadDocs?.count || 0);
      setUnreadLeaves(pendingLeaves?.count || 0);
      setUnreadOvertime(pendingOvertime?.count || 0);

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
            setUnreadDocuments(prev => prev + 1);
            
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
              setUnreadLeaves(prev => prev + 1);
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
              setUnreadOvertime(prev => prev + 1);
              toast.success('Heures supplémentaires approuvées', {
                icon: <Badge className="h-4 w-4" />,
                description: 'Votre demande d\'heures supplémentaires a été approuvée'
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(documentsChannel);
        supabase.removeChannel(leaveRequestsChannel);
        supabase.removeChannel(overtimeRequestsChannel);
      };
    };

    const cleanup = setupNotifications();
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.());
    };
  }, [setUnreadDocuments, setUnreadLeaves, setUnreadOvertime]);

  return null;
};