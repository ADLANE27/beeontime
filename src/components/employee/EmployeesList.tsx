import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogContentFullScreen } from "@/components/ui/dialog";
import { NewEmployeeForm } from "./NewEmployeeForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Building, Calendar, Loader2, Trash, UserPlus, Search, Clock, ShieldCheck, MapPin, FilterX, Filter, X, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ContractType, Position, WorkSchedule } from "@/types/hr";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useEmployeesList } from "./hooks/useEmployeesList";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  contract_type: string | null;
  start_date: string | null;
  current_year_vacation_days: number | null;
  current_year_used_days: number | null;
  previous_year_vacation_days: number | null;
  previous_year_used_days: number | null;
  work_schedule: any;
  birth_date: string | null;
  birth_place: string | null;
  birth_country: string | null;
  social_security_number: string | null;
  street_address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at?: string;
  updated_at?: string;
  last_vacation_credit_date?: string | null;
  initial_password?: string;
}

const getContractColor = (contractType: string | null) => {
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

const EmployeeCard = ({ employee, onDelete, onEdit }: { employee: Employee; onDelete: (id: string) => void; onEdit: () => void }) => {
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

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onEdit();
    toast.success("Informations de l'employé mises à jour avec succès");
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
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700" 
                size="sm"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Modifier
              </Button>
            </DialogTrigger>
            <DialogContentFullScreen className="p-0">
              <div className="container max-w-4xl mx-auto p-6">
                <div className="mb-6">
                  <DialogTitle className="text-2xl font-bold mb-2">Modifier l'employé</DialogTitle>
                  <DialogDescription>
                    Modifiez les informations de {employee.first_name} {employee.last_name}
                  </DialogDescription>
                </div>
                
                <div className="bg-white rounded-lg border overflow-hidden">
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
                      contractType: (employee.contract_type as ContractType) || 'CDI',
                      startDate: employee.start_date || '',
                      position: (employee.position as Position) || 'Traducteur',
                      workSchedule: employee.work_schedule as WorkSchedule || {
                        startTime: '09:00',
                        endTime: '17:00',
                        breakStartTime: '12:30',
                        breakEndTime: '13:30'
                      },
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
                    onSuccess={handleEditSuccess}
                    isEditing={true}
                    employeeId={employee.id}
                  />
                </div>
              </div>
            </DialogContentFullScreen>
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const { data: employeesData, error } = await supabase
          .from('employees')
          .select('*')
          .order('last_name', { ascending: true });

        if (error) {
          console.error("Error fetching employees:", error);
          toast.error("Erreur lors du chargement des employés");
        } else {
          setEmployees(employeesData || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("Une erreur est survenue lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };

    const { data, isLoading: queryLoading, error, isAuthError } = useEmployeesList();
    
    if (data) {
      setEmployees(data);
      setIsLoading(false);
    } else if (error && !isAuthError) {
      console.error("Error loading employees:", error);
      toast.error("Erreur lors du chargement des employés");
    }
    
    if (!queryLoading && !error) {
      setIsLoading(false);
    }
  }, [refreshTrigger]);

  useEffect(() => {
    let results = employees;

    if (searchQuery) {
      results = results.filter(employee =>
        employee.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedContractTypes.length > 0) {
      results = results.filter(employee => 
        employee.contract_type && selectedContractTypes.includes(employee.contract_type)
      );
    }

    setFilteredEmployees(results);
  }, [employees, searchQuery, selectedContractTypes]);

  const handleCreateSuccess = () => {
    setIsNewEmployeeDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
    toast.success("Nouvel employé créé avec succès");
  };

  const handleEditSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting employee:", error);
        toast.error("Erreur lors de la suppression de l'employé");
      } else {
        toast.success("Employé supprimé avec succès");
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Unexpected error deleting employee:", error);
      toast.error("Erreur inattendue lors de la suppression de l'employé");
    }
  };

  const handleContractTypeChange = (contractType: string) => {
    setSelectedContractTypes(prev =>
      prev.includes(contractType)
        ? prev.filter(item => item !== contractType)
        : [...prev, contractType]
    );
  };

  const clearFilters = () => {
    setSelectedContractTypes([]);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Liste des employés</h1>
        <Button onClick={() => setIsNewEmployeeDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un employé
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Rechercher un employé..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Filtrer les employés</DialogTitle>
              <DialogDescription>
                Sélectionnez les critères de filtrage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Type de contrat</h3>
                <div className="flex flex-col gap-2">
                  <div>
                    <label htmlFor="cdi" className="flex items-center space-x-2">
                      <Input
                        type="checkbox"
                        id="cdi"
                        checked={selectedContractTypes.includes('CDI')}
                        onChange={() => handleContractTypeChange('CDI')}
                      />
                      <span>CDI</span>
                    </label>
                  </div>
                  <div>
                    <label htmlFor="cdd" className="flex items-center space-x-2">
                      <Input
                        type="checkbox"
                        id="cdd"
                        checked={selectedContractTypes.includes('CDD')}
                        onChange={() => handleContractTypeChange('CDD')}
                      />
                      <span>CDD</span>
                    </label>
                  </div>
                  <div>
                    <label htmlFor="alternance" className="flex items-center space-x-2">
                      <Input
                        type="checkbox"
                        id="alternance"
                        checked={selectedContractTypes.includes('Alternance')}
                        onChange={() => handleContractTypeChange('Alternance')}
                      />
                      <span>Alternance</span>
                    </label>
                  </div>
                  <div>
                    <label htmlFor="stage" className="flex items-center space-x-2">
                      <Input
                        type="checkbox"
                        id="stage"
                        checked={selectedContractTypes.includes('Stage')}
                        onChange={() => handleContractTypeChange('Stage')}
                      />
                      <span>Stage</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={clearFilters} className="mr-2">
                <FilterX className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button type="button" onClick={() => setIsFilterOpen(false)}>
                Appliquer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Chargement des employés...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onDelete={handleDeleteEmployee}
              onEdit={handleEditSuccess}
            />
          ))}
        </div>
      )}

      <Dialog open={isNewEmployeeDialogOpen} onOpenChange={setIsNewEmployeeDialogOpen}>
        <DialogTrigger asChild>
          {/* This trigger is hidden, the main button is above */}
        </DialogTrigger>
        <DialogContentFullScreen className="p-0">
          <div className="container max-w-4xl mx-auto p-6">
            <div className="mb-6">
              <DialogTitle className="text-2xl font-bold mb-2">Ajouter un nouvel employé</DialogTitle>
              <DialogDescription>
                Remplissez le formulaire ci-dessous pour créer un nouvel employé.
              </DialogDescription>
            </div>
            
            <div className="bg-white rounded-lg border overflow-hidden">
              <NewEmployeeForm onSuccess={handleCreateSuccess} />
            </div>
          </div>
        </DialogContentFullScreen>
      </Dialog>
    </div>
  );
};
