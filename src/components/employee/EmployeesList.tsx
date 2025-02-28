import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogContentFullScreen, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { NewEmployeeForm } from "./NewEmployeeForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Building, Calendar, Loader2, Trash, UserPlus, Search, Clock, ShieldCheck, MapPin, FilterX, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ContractType, Position, WorkSchedule } from "@/types/hr";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

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

const getContractColor = (contractType: ContractType) => {
  switch (contractType) {
    case 'CDI':
      return 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200';
    case 'CDD':
      return 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200';
    case 'Alternance':
      return 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200';
    case 'Stage':
      return 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200';
  }
};

const EmployeeCard = ({ employee, onDelete }: { employee: Employee; onDelete: (id: string) => void }) => {
  const currentYearBalance = Number(employee.current_year_vacation_days || 0) - Number(employee.current_year_used_days || 0);
  const previousYearBalance = Number(employee.previous_year_vacation_days || 0) - Number(employee.previous_year_used_days || 0);
  const totalBalance = currentYearBalance + previousYearBalance;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const employeeTenure = employee.start_date ? 
    Math.floor((new Date().getTime() - new Date(employee.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;

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

  const contractColor = getContractColor(employee.contract_type);

  return (
    <Card className="w-full group overflow-hidden transition-all duration-300 hover:shadow-md border">
      <CardHeader className={`flex flex-row items-center justify-between pb-3 ${contractColor}`}>
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight flex items-center">
            {employee.first_name} {employee.last_name}
            {employeeTenure > 24 && (
              <Badge variant="outline" className="ml-2 bg-white/30 text-xs border-0">
                <ShieldCheck className="h-3 w-3 mr-1" /> Senior
              </Badge>
            )}
          </h3>
          <p className="text-sm opacity-90 font-medium flex items-center">
            <Building className="h-3.5 w-3.5 mr-1.5 opacity-75" />
            {employee.position}
          </p>
        </div>
        <Badge variant="outline" className={`font-medium border text-xs px-2 py-0.5 ${contractColor}`}>
          {employee.contract_type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        <div className="space-y-1.5">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-3.5 w-3.5 mr-2 text-gray-500" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-3.5 w-3.5 mr-2 text-gray-500" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.start_date && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5 mr-2 text-gray-500" />
              <span>Depuis le {format(new Date(employee.start_date), 'dd MMM yyyy', { locale: fr })}</span>
              {employeeTenure > 0 && (
                <Badge variant="outline" className="ml-2 text-xs py-0 h-5 border-gray-200 text-gray-600">
                  {employeeTenure} mois
                </Badge>
              )}
            </div>
          )}
          {employee.city && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5 mr-2 text-gray-500" />
              <span>{employee.city}{employee.postal_code ? `, ${employee.postal_code}` : ''}</span>
            </div>
          )}
        </div>

        <div className="pt-1">
          <div className="flex items-center mb-1.5">
            <Clock className="h-4 w-4 mr-1.5 text-blue-500" /> 
            <p className="text-sm font-medium text-gray-800">Solde congés</p>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-blue-50 border border-blue-100 rounded-md px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-blue-600 opacity-80 font-semibold">Année en cours</p>
              <p className="text-sm font-semibold text-blue-800">{currentYearBalance.toFixed(1)} j</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-md px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-blue-600 opacity-80 font-semibold">Année préc.</p>
              <p className="text-sm font-semibold text-blue-800">{previousYearBalance.toFixed(1)} j</p>
            </div>
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-200 rounded-md px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-blue-600 opacity-80 font-semibold">Total</p>
              <p className="text-sm font-semibold text-blue-800">{totalBalance.toFixed(1)} j</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button 
            variant="outline" 
            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700" 
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            Modifier
          </Button>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="fixed inset-0 flex items-center justify-center z-50 p-0 m-0 max-w-none bg-transparent">
              <div className="bg-white rounded-lg shadow-lg w-[95%] sm:w-[90%] md:w-[85%] max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6 mx-auto my-auto transform scale-100 animate-scale-up">
                <div className="sticky top-0 z-10 bg-white pt-2 pb-4 border-b mb-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Modifier l'employé</h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full h-8 w-8 p-0" 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="pb-4">
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
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-9 h-9 p-0" size="sm">
                <Trash className="h-4 w-4 text-red-500" />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterContract, setFilterContract] = useState<string>("all");
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

  // Filter the employees based on search query and contract filter
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = !searchQuery || 
      `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesContract = filterContract === "all" || employee.contract_type === filterContract;
    
    return matchesSearch && matchesContract;
  });

  // Get contract types counts
  const contractCounts = employees?.reduce((acc, employee) => {
    acc[employee.contract_type] = (acc[employee.contract_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-1 flex items-center">
              Liste des employés
              <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                {employees?.length || 0} employés
              </Badge>
            </h2>
            <p className="text-sm text-blue-700 opacity-90">
              Gérez les dossiers du personnel et leurs informations contractuelles
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-9 w-full max-w-xs focus-visible:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-9 w-9" 
                  onClick={() => setSearchQuery("")}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button 
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              onClick={() => setIsNewEmployeeDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Button 
            size="sm" 
            variant={filterContract === "all" ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setFilterContract("all")}
          >
            <Filter className="h-3 w-3 mr-1" />
            Tous ({employees?.length || 0})
          </Button>
          {Object.entries(contractCounts).map(([contract, count]) => (
            <Button 
              key={contract}
              size="sm"
              variant={filterContract === contract ? "default" : "outline"}
              className={`h-7 text-xs ${filterContract === contract ? '' : 'opacity-70'}`}
              onClick={() => setFilterContract(contract)}
            >
              {contract} ({count})
            </Button>
          ))}
        </div>
      </div>

      {filteredEmployees?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Search className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-700">Aucun employé trouvé</h3>
          <p className="text-gray-500">Modifiez vos critères de recherche ou ajoutez un nouvel employé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees?.map((employee) => (
            <EmployeeCard 
              key={employee.id} 
              employee={employee} 
              onDelete={handleDeleteEmployee}
            />
          ))}
        </div>
      )}

      {/* Dialog for adding a new employee */}
      <Dialog open={isNewEmployeeDialogOpen} onOpenChange={setIsNewEmployeeDialogOpen}>
        <DialogContent className="w-full max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nouvel employé</DialogTitle>
          </DialogHeader>
          <NewEmployeeForm onSuccess={() => setIsNewEmployeeDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
