
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { NewEmployeeForm } from "./NewEmployeeForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Building, Calendar, Loader2, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ContractType, Position, WorkSchedule } from "@/types/hr";
import { toast } from "sonner";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string;
  contract_type: ContractType;
  start_date: string | null;
  current_year_vacation_days: number;
  current_year_used_days: number;
  previous_year_vacation_days: number;
  previous_year_used_days: number;
  work_schedule: WorkSchedule;
  birth_date: string | null;
  birth_place: string | null;
  birth_country: string | null;
  social_security_number: string | null;
  street_address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
}

const EmployeeCard = ({ employee, onDelete }: { employee: Employee; onDelete: (id: string) => void }) => {
  const currentYearBalance = Number(employee.current_year_vacation_days || 0) - Number(employee.current_year_used_days || 0);
  const previousYearBalance = Number(employee.previous_year_vacation_days || 0) - Number(employee.previous_year_used_days || 0);
  const totalBalance = currentYearBalance + previousYearBalance;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      onDelete(employee.id);
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Erreur lors de la suppression de l'employé");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-sm text-muted-foreground">{employee.position}</p>
        </div>
        <Badge variant={employee.contract_type === 'CDI' ? 'default' : 'secondary'}>
          {employee.contract_type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.start_date && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Depuis le {format(new Date(employee.start_date), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
          )}
          {employee.position && (
            <div className="flex items-center space-x-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{employee.position}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Solde congés</p>
          <div className="flex gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Année en cours</p>
              <p className="font-medium">{currentYearBalance.toFixed(1)} jours</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Année précédente</p>
              <p className="font-medium">{previousYearBalance.toFixed(1)} jours</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-medium">{totalBalance.toFixed(1)} jours</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                Modifier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier l'employé</DialogTitle>
              </DialogHeader>
              <NewEmployeeForm
                initialData={{
                  firstName: employee.first_name,
                  lastName: employee.last_name,
                  email: employee.email,
                  phone: employee.phone || '',
                  birthDate: employee.birth_date || '',
                  birthPlace: employee.birth_place || '',
                  birthCountry: employee.birth_country || '',
                  socialSecurityNumber: employee.social_security_number || '',
                  contractType: employee.contract_type as ContractType,
                  startDate: employee.start_date || '',
                  position: employee.position as Position,
                  workSchedule: employee.work_schedule as WorkSchedule,
                  currentYearVacationDays: employee.current_year_vacation_days || 0,
                  currentYearUsedDays: employee.current_year_used_days || 0,
                  previousYearVacationDays: employee.previous_year_vacation_days || 0,
                  previousYearUsedDays: employee.previous_year_used_days || 0,
                  initialPassword: '',
                  streetAddress: employee.street_address || '',
                  city: employee.city || '',
                  postalCode: employee.postal_code || '',
                  country: employee.country || ''
                }}
                onSuccess={() => setIsEditDialogOpen(false)}
                isEditing={true}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-auto" size="icon">
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer l'employé {employee.first_name} {employee.last_name} ? 
                  Cette action est irréversible et supprimera toutes les données associées.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export const EmployeesList = () => {
  const [isNewEmployeeDialogOpen, setIsNewEmployeeDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    console.log('Setting up real-time subscription for employees...');
    
    const channel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'employees'
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          // Invalidate and refetch the employees query
          await queryClient.invalidateQueries({ queryKey: ['employees'] });
          
          // Show toast notification for updates
          const action = payload.eventType === 'INSERT' ? 'ajouté' 
            : payload.eventType === 'DELETE' ? 'supprimé' 
            : 'mis à jour';
          toast.info(`Un employé a été ${action}`);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to employees changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to employees changes');
          toast.error("Erreur de connexion aux mises à jour en temps réel");
        }
      });

    // Cleanup subscription on component unmount
    return () => {
      console.log('Cleaning up employees subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Query with automatic background updates
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      console.log('Fetching employees data...');
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      return data.map(employee => ({
        ...employee,
        work_schedule: employee.work_schedule as WorkSchedule
      })) as Employee[];
    },
    // Enable background refetching
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30000, // Refetch every 30 seconds as a fallback
  });

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      // Start transaction to delete all related data
      console.log(`Deleting employee with ID: ${employeeId}`);
      
      // 1. Delete related documents
      console.log("Deleting leave request documents...");
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('employee_id', employeeId);
        
      if (leaveRequests && leaveRequests.length > 0) {
        const leaveRequestIds = leaveRequests.map(lr => lr.id);
        await supabase
          .from('leave_request_documents')
          .delete()
          .in('leave_request_id', leaveRequestIds);
      }
      
      console.log("Deleting HR event documents...");
      const { data: hrEvents } = await supabase
        .from('hr_events')
        .select('id')
        .eq('employee_id', employeeId);
        
      if (hrEvents && hrEvents.length > 0) {
        const hrEventIds = hrEvents.map(event => event.id);
        await supabase
          .from('hr_event_documents')
          .delete()
          .in('event_id', hrEventIds);
      }
      
      console.log("Deleting employee documents...");
      await supabase
        .from('documents')
        .delete()
        .eq('employee_id', employeeId);
      
      // 2. Delete time records
      console.log("Deleting time records...");
      await supabase
        .from('time_records')
        .delete()
        .eq('employee_id', employeeId);
      
      // 3. Delete leave requests
      console.log("Deleting leave requests...");
      await supabase
        .from('leave_requests')
        .delete()
        .eq('employee_id', employeeId);
      
      // 4. Delete delays
      console.log("Deleting delays...");
      await supabase
        .from('delays')
        .delete()
        .eq('employee_id', employeeId);
      
      // 5. Delete overtime requests
      console.log("Deleting overtime requests...");
      await supabase
        .from('overtime_requests')
        .delete()
        .eq('employee_id', employeeId);
      
      // 6. Delete HR events
      console.log("Deleting HR events...");
      await supabase
        .from('hr_events')
        .delete()
        .eq('employee_id', employeeId);
      
      // 7. Delete vacation history
      console.log("Deleting vacation history...");
      await supabase
        .from('vacation_history')
        .delete()
        .eq('employee_id', employeeId);
      
      // 8. Finally delete the employee record
      console.log("Deleting employee record...");
      const { error: employeeDeleteError } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);
      
      if (employeeDeleteError) {
        console.error("Error deleting employee record:", employeeDeleteError);
        toast.error("Erreur lors de la suppression de l'employé");
        return;
      }

      toast.success("Employé supprimé avec succès");
      
      // Data will be updated automatically via real-time subscription,
      // but we'll also invalidate the cache just to be sure
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error("Erreur lors de la suppression de l'employé");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Liste des employés</h2>
        <Dialog open={isNewEmployeeDialogOpen} onOpenChange={setIsNewEmployeeDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter un employé</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvel employé</DialogTitle>
            </DialogHeader>
            <NewEmployeeForm onSuccess={() => setIsNewEmployeeDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees?.map((employee) => (
          <EmployeeCard 
            key={employee.id} 
            employee={employee} 
            onDelete={handleDeleteEmployee}
          />
        ))}
      </div>
    </div>
  );
};
