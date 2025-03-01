
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { NewEmployeeForm } from "./NewEmployeeForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Building, Calendar, Loader2, Trash, UserPlus, Edit, Shield } from "lucide-react";
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

  // Get initials for the avatar
  const getInitials = () => {
    return `${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}`.toUpperCase();
  };

  // Get contract type style
  const getContractTypeStyle = () => {
    switch(employee.contract_type) {
      case 'CDI':
        return 'bg-green-100 text-green-800';
      case 'CDD':
        return 'bg-blue-100 text-blue-800';
      case 'Apprentissage':
        return 'bg-amber-100 text-amber-800';
      case 'Interim':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <div className="flex gap-3 items-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {getInitials()}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">{employee.position}</p>
          </div>
        </div>
        <Badge className={`${getContractTypeStyle()} font-medium`}>
          {employee.contract_type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-primary/60" />
            <span>{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-primary/60" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.start_date && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-primary/60" />
              <span>Depuis le {format(new Date(employee.start_date), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
          )}
          {employee.position && (
            <div className="flex items-center space-x-2 text-sm">
              <Building className="h-4 w-4 text-primary/60" />
              <span>{employee.position}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary/70" />
            Solde congés
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2 rounded shadow-sm">
              <p className="text-xs text-muted-foreground">Année en cours</p>
              <p className="font-medium">{currentYearBalance.toFixed(1)} jours</p>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <p className="text-xs text-muted-foreground">Année précédente</p>
              <p className="font-medium">{previousYearBalance.toFixed(1)} jours</p>
            </div>
            <div className="bg-white p-2 rounded shadow-sm">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-medium">{totalBalance.toFixed(1)} jours</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-1.5">
                <Edit className="h-4 w-4" />
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
      // Delete the employee from auth and all related data
      const { error } = await supabase.functions.invoke('delete-employee', {
        body: { employeeId }
      });

      if (error) {
        console.error('Error deleting employee:', error);
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
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary/70" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gradient">Liste des employés</h2>
        <Dialog open={isNewEmployeeDialogOpen} onOpenChange={setIsNewEmployeeDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm gap-1.5">
              <UserPlus className="h-4 w-4" />
              Ajouter un employé
            </Button>
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
        
        {employees?.length === 0 && (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">Aucun employé trouvé</p>
            <Button 
              variant="outline" 
              onClick={() => setIsNewEmployeeDialogOpen(true)}
              className="mt-4"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Ajouter votre premier employé
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
