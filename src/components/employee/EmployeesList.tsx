import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Key, Plus, Trash2, Search, ArrowUpDown, Gift, Cake } from "lucide-react";
import { useState } from "react";
import { NewEmployee } from "@/types/hr";
import NewEmployeeForm from "./NewEmployeeForm";
import { toast } from "sonner";
import { format, differenceInMonths, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  birth_place: string | null;
  birth_country: string | null;
  social_security_number: string | null;
  contract_type: string | null;
  start_date: string | null;
  position: string | null;
  work_schedule: {
    startTime: string;
    endTime: string;
    breakStartTime: string;
    breakEndTime: string;
  } | null;
  previous_year_vacation_days: number | null;
  used_vacation_days: number | null;
  remaining_vacation_days: number | null;
  profiles: {
    active: boolean | null;
  } | null;
}

export const EmployeesList = () => {
  const [editingEmployee, setEditingEmployee] = useState<NewEmployee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*, profiles(active)');
      
      if (error) throw error;
      console.log('Fetched employees:', data);
      
      const transformedData = data.map((employee: any) => ({
        ...employee,
        work_schedule: employee.work_schedule as Employee['work_schedule']
      }));
      
      return transformedData as Employee[];
    }
  });

  const calculateSeniority = (startDate: string | null) => {
    if (!startDate) return null;
    const months = differenceInMonths(new Date(), new Date(startDate));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  };

  const isToday = (date: string | null) => {
    if (!date) return false;
    return isSameDay(new Date(date), new Date());
  };

  const positions = Array.from(new Set(employees?.map(emp => emp.position).filter(Boolean) || []));

  const getFilteredAndSortedEmployees = () => {
    if (!employees) return [];

    let filteredEmployees = [...employees];

    if (selectedPosition && selectedPosition !== "all") {
      filteredEmployees = filteredEmployees.filter(
        emp => emp.position === selectedPosition
      );
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredEmployees = filteredEmployees.filter(
        emp => 
          emp.first_name.toLowerCase().includes(searchLower) ||
          emp.last_name.toLowerCase().includes(searchLower)
      );
    }

    filteredEmployees.sort((a, b) => {
      if (!a.start_date || !b.start_date) return 0;
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return sortDirection === 'asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    return filteredEmployees;
  };

  const handleEdit = (employee: any) => {
    const mappedEmployee: NewEmployee = {
      id: employee.id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      birthDate: employee.birth_date || '',
      birthPlace: employee.birth_place || '',
      birthCountry: employee.birth_country || '',
      socialSecurityNumber: employee.social_security_number || '',
      contractType: employee.contract_type || 'CDI',
      startDate: employee.start_date || '',
      position: employee.position || 'Traducteur',
      workSchedule: employee.work_schedule || {
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      },
      currentYearVacationDays: employee.current_year_vacation_days || 0,
      currentYearUsedDays: employee.current_year_used_days || 0,
      previousYearVacationDays: employee.previous_year_vacation_days || 0,
      previousYearUsedDays: employee.previous_year_used_days || 0,
      initialPassword: employee.initial_password || '',
      streetAddress: employee.street_address || '',
      city: employee.city || '',
      postalCode: employee.postal_code || '',
      country: employee.country || 'France'
    };
    setEditingEmployee(mappedEmployee);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting employee:', error);
      toast.error("Erreur lors de la suppression de l'employé");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success("Employé supprimé avec succès");
  };

  const handleUpdate = async (updatedEmployee: NewEmployee) => {
    if (!updatedEmployee.id) {
      console.error('No employee ID provided for update');
      toast.error("Erreur lors de la mise à jour de l'employé: ID manquant");
      return;
    }

    console.log('Updated employee:', updatedEmployee);
    
    if (updatedEmployee.initialPassword && updatedEmployee.initialPassword !== '') {
      try {
        const { data, error } = await supabase.functions.invoke('update-user-password', {
          body: {
            userId: updatedEmployee.id,
            password: updatedEmployee.initialPassword
          }
        });

        if (error) {
          console.error('Error updating password:', error);
          toast.error("Erreur lors de la mise à jour du mot de passe");
          return;
        }

        console.log('Password update response:', data);
      } catch (err) {
        console.error('Error calling update-user-password function:', err);
        toast.error("Erreur lors de la mise à jour du mot de passe");
        return;
      }
    }

    const { error } = await supabase
      .from('employees')
      .update({
        first_name: updatedEmployee.firstName,
        last_name: updatedEmployee.lastName,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        birth_date: updatedEmployee.birthDate,
        birth_place: updatedEmployee.birthPlace,
        birth_country: updatedEmployee.birthCountry,
        social_security_number: updatedEmployee.socialSecurityNumber,
        contract_type: updatedEmployee.contractType,
        start_date: updatedEmployee.startDate,
        position: updatedEmployee.position,
        work_schedule: updatedEmployee.workSchedule,
        current_year_vacation_days: updatedEmployee.currentYearVacationDays,
        current_year_used_days: updatedEmployee.currentYearUsedDays,
        previous_year_vacation_days: updatedEmployee.previousYearVacationDays,
        previous_year_used_days: updatedEmployee.previousYearUsedDays,
        initial_password: updatedEmployee.initialPassword,
        street_address: updatedEmployee.streetAddress,
        city: updatedEmployee.city,
        postal_code: updatedEmployee.postalCode,
        country: updatedEmployee.country
      })
      .eq('id', updatedEmployee.id);

    if (error) {
      console.error('Error updating employee:', error);
      toast.error("Erreur lors de la mise à jour de l'employé");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['employees'] });
    toast.success("Employé mis à jour avec succès");
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error resetting password:', error);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
      return;
    }

    toast.success("Email de réinitialisation envoyé avec succès");
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Liste des employés</h2>
        <Button onClick={() => setIsNewEmployeeModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un employé
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select
          value={selectedPosition}
          onValueChange={setSelectedPosition}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par poste" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les postes</SelectItem>
            {positions.map((position) => (
              <SelectItem key={position} value={position || "undefined"}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortDirection === 'asc' ? 'Plus récent' : 'Plus ancien'}
        </Button>
      </div>

      <div className="grid gap-4">
        {getFilteredAndSortedEmployees().map((employee) => (
          <Card key={employee.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {employee.first_name} {employee.last_name}
                  {isToday(employee.birth_date) && (
                    <Badge variant="secondary" className="gap-1">
                      <Cake className="h-3 w-3" />
                      Anniversaire
                    </Badge>
                  )}
                  {isToday(employee.start_date) && (
                    <Badge variant="secondary" className="gap-1">
                      <Gift className="h-3 w-3" />
                      Anniversaire professionnel
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
                {employee.start_date && (
                  <p className="text-sm text-muted-foreground">
                    Depuis le {format(new Date(employee.start_date), 'dd MMMM yyyy', { locale: fr })}
                    {' '}
                    ({calculateSeniority(employee.start_date)})
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(employee)}
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetPassword(employee.email)}
                >
                  <Key className="h-4 w-4" />
                  Réinitialiser MDP
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(employee.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingEmployee && (
        <NewEmployeeForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEmployee(null);
          }}
          onSubmit={handleUpdate}
          employeeToEdit={editingEmployee}
          mode="edit"
        />
      )}

      <NewEmployeeForm
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
        onSubmit={handleUpdate}
        mode="create"
      />
    </div>
  );
};